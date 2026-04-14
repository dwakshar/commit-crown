-- Enable raids for all existing users and change the default to true.
-- Previously raids_enabled defaulted to false with no UI/API to toggle it,
-- making PvP permanently inaccessible. The toggle feature has been removed;
-- raids are now always open. The column is kept for schema compatibility.

alter table public.profiles
  alter column raids_enabled set default true;

-- Backfill every existing profile.
update public.profiles
set raids_enabled = true
where raids_enabled is null or raids_enabled = false;

-- Give all existing kingdoms 500 gold (testing starter treasury).
-- New kingdoms are created with 500 gold via application code.
update public.kingdoms
set gold = greatest(gold, 500);

-- Ensure audit columns exist on the raids table.
-- These were defined in 002_raids.sql but may be absent if the table was
-- created via an earlier partial schema before that migration ran.
alter table public.raids
  add column if not exists attacker_gold_after integer not null default 0;
alter table public.raids
  add column if not exists defender_gold_after integer not null default 0;

-- Remove the raids_disabled gate from execute_raid_transaction.
-- The toggle UI no longer exists, so there is no way for a player to
-- set raids_enabled = false; the check served no purpose.
create or replace function public.execute_raid_transaction(
  p_attacker_id uuid,
  p_defender_id uuid,
  p_attacker_power integer,
  p_defender_power integer
)
returns table (
  raid_id uuid,
  attacker_gold integer,
  defender_gold integer,
  gold_stolen integer,
  result text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  attacker_kingdom_id uuid;
  defender_kingdom_id uuid;
  attacker_gold_before integer;
  defender_gold_before integer;
  last_raid_at timestamptz;
  raid_row_id uuid;
  final_attacker_gold integer;
  final_defender_gold integer;
  resolved_result text;
  resolved_gold_stolen integer;
begin
  if p_attacker_id = p_defender_id then
    raise exception 'Cannot raid yourself';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_attacker_id::text || ':' || p_defender_id::text));

  select rc.last_raid_at
  into last_raid_at
  from public.raid_cooldowns rc
  where rc.attacker_id = p_attacker_id
    and rc.defender_id = p_defender_id
  for update;

  if last_raid_at is not null and last_raid_at + interval '24 hours' > now() then
    raise exception 'Raid cooldown active until %', to_char(last_raid_at + interval '24 hours', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  end if;

  select id, gold
  into attacker_kingdom_id, attacker_gold_before
  from public.kingdoms
  where user_id = p_attacker_id
  for update;

  select k.id, k.gold
  into defender_kingdom_id, defender_gold_before
  from public.kingdoms k
  where k.user_id = p_defender_id
  for update;

  if attacker_kingdom_id is null or defender_kingdom_id is null then
    raise exception 'Kingdom not found';
  end if;

  resolved_result := case
    when p_attacker_power > p_defender_power then 'attacker_win'
    else 'defender_win'
  end;

  -- 12% with 50-gold minimum, never exceeding the defender's balance.
  resolved_gold_stolen := case
    when resolved_result = 'attacker_win' then
      least(
        defender_gold_before,
        greatest(
          floor(defender_gold_before * 0.12),
          least(50, defender_gold_before)
        )
      )
    else 0
  end;

  final_attacker_gold := attacker_gold_before + resolved_gold_stolen;
  final_defender_gold := defender_gold_before - resolved_gold_stolen;

  if final_defender_gold < 0 then
    raise exception 'Invalid raid transfer';
  end if;

  if resolved_gold_stolen > 0 then
    update public.kingdoms set gold = final_attacker_gold where id = attacker_kingdom_id;
    update public.kingdoms set gold = final_defender_gold where id = defender_kingdom_id;
  end if;

  insert into public.raids (
    attacker_id,
    defender_id,
    attacker_power,
    defender_power,
    result,
    gold_stolen,
    attacker_gold_after,
    defender_gold_after
  )
  values (
    p_attacker_id,
    p_defender_id,
    p_attacker_power,
    p_defender_power,
    resolved_result,
    resolved_gold_stolen,
    final_attacker_gold,
    final_defender_gold
  )
  returning id into raid_row_id;

  insert into public.raid_cooldowns (attacker_id, defender_id, last_raid_at)
  values (p_attacker_id, p_defender_id, now())
  on conflict (attacker_id, defender_id)
  do update set last_raid_at = excluded.last_raid_at;

  insert into public.notifications (user_id, type, message, data)
  values (
    p_defender_id,
    'raid_received',
    case when resolved_result = 'attacker_win'
      then format('Your kingdom was raided and lost %s gold.', resolved_gold_stolen)
      else 'Your defenses held against an incoming raid.'
    end,
    jsonb_build_object(
      'attacker_id', p_attacker_id,
      'defender_id', p_defender_id,
      'attacker_power', p_attacker_power,
      'defender_power', p_defender_power,
      'result', resolved_result,
      'gold_stolen', resolved_gold_stolen,
      'raid_id', raid_row_id
    )
  );

  return query
  select raid_row_id, final_attacker_gold, final_defender_gold, resolved_gold_stolen, resolved_result;
end;
$$;

revoke execute on function public.execute_raid_transaction(uuid, uuid, integer, integer) from authenticated;
grant execute on function public.execute_raid_transaction(uuid, uuid, integer, integer) to service_role;
