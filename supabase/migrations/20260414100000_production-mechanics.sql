-- ============================================================
-- Production mechanics overhaul
-- ============================================================
-- Changes in this migration:
--   1. upgrade_building_transaction: exponential cost formula
--      old: current_level * 500   (linear: 500 / 1000 / 1500 / 2000)
--      new: current_level * (current_level + 1) * 150  (300 / 900 / 1800 / 3000)
--
--   2. place_building_transaction: new atomic function that deducts
--      the placement gold cost when a building is placed, preventing
--      races between concurrent placement requests.
--
--   3. execute_raid_transaction: gold-stolen formula improved
--      old: floor(defender_gold * 0.10)        — 10%, no floor
--      new: greatest(floor(defender_gold * 0.12), least(50, defender_gold))
--           — 12% with a 50-gold minimum so every successful raid matters
-- ============================================================


-- 1. Upgrade building — exponential cost
-- level * (level + 1) * 150
--   L1→L2:   300 gold
--   L2→L3:   900 gold
--   L3→L4: 1 800 gold
--   L4→L5: 3 000 gold
--   Total max: 6 000 gold per building
create or replace function public.upgrade_building_transaction(
  p_building_id uuid,
  p_user_id uuid
)
returns table (
  building_id uuid,
  level integer,
  gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_level integer;
  kingdom_gold integer;
  target_kingdom_id uuid;
  upgrade_cost integer;
begin
  select b.level, k.gold, k.id
  into current_level, kingdom_gold, target_kingdom_id
  from public.buildings b
  join public.kingdoms k on k.id = b.kingdom_id
  where b.id = p_building_id
    and k.user_id = p_user_id
  for update of b, k;

  if target_kingdom_id is null then
    raise exception 'Building not found';
  end if;

  if current_level >= 5 then
    raise exception 'Building is already max level';
  end if;

  -- Exponential cost: level * (level + 1) * 150
  upgrade_cost := current_level * (current_level + 1) * 150;

  if kingdom_gold < upgrade_cost then
    raise exception 'Insufficient gold';
  end if;

  update public.buildings
  set level = current_level + 1
  where id = p_building_id;

  update public.kingdoms
  set gold = kingdom_gold - upgrade_cost
  where id = target_kingdom_id;

  return query
  select b.id, b.level, k.gold
  from public.buildings b
  join public.kingdoms k on k.id = b.kingdom_id
  where b.id = p_building_id;
end;
$$;

grant execute on function public.upgrade_building_transaction(uuid, uuid) to authenticated;


-- 2. Place building — atomic gold deduction + insert
-- Validates: position not occupied, slots available, gold sufficient, one Town Hall rule.
create or replace function public.place_building_transaction(
  p_user_id uuid,
  p_type text,
  p_position_x integer,
  p_position_y integer,
  p_cost integer
)
returns table (
  building_id uuid,
  kingdom_id uuid,
  type text,
  level integer,
  position_x integer,
  position_y integer,
  built_at timestamptz,
  gold integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_kingdom_id uuid;
  kingdom_gold integer;
  kingdom_slots integer;
  current_building_count integer;
  new_building_id uuid;
  existing_town_hall_count integer;
begin
  select k.id, k.gold, k.building_slots
  into target_kingdom_id, kingdom_gold, kingdom_slots
  from public.kingdoms k
  where k.user_id = p_user_id
  for update;

  if target_kingdom_id is null then
    raise exception 'Kingdom not found';
  end if;

  -- Enforce one Town Hall per kingdom
  if p_type = 'town_hall' then
    select count(*) into existing_town_hall_count
    from public.buildings
    where kingdom_id = target_kingdom_id
      and type = 'town_hall';

    if existing_town_hall_count > 0 then
      raise exception 'Town Hall already exists';
    end if;
  end if;

  -- Check position is free
  perform 1
  from public.buildings
  where kingdom_id = target_kingdom_id
    and position_x = p_position_x
    and position_y = p_position_y;

  if found then
    raise exception 'Position is already occupied';
  end if;

  -- Check slot capacity
  select count(*) into current_building_count
  from public.buildings
  where kingdom_id = target_kingdom_id;

  if current_building_count >= kingdom_slots then
    raise exception 'No building slots available';
  end if;

  -- Check gold
  if kingdom_gold < p_cost then
    raise exception 'Insufficient gold. Required: %, available: %', p_cost, kingdom_gold;
  end if;

  -- Deduct gold
  update public.kingdoms
  set gold = kingdom_gold - p_cost
  where id = target_kingdom_id;

  -- Place building
  insert into public.buildings (kingdom_id, type, level, position_x, position_y)
  values (target_kingdom_id, p_type, 1, p_position_x, p_position_y)
  returning id into new_building_id;

  return query
  select
    b.id,
    b.kingdom_id,
    b.type,
    b.level,
    b.position_x,
    b.position_y,
    b.built_at,
    k.gold
  from public.buildings b
  join public.kingdoms k on k.id = b.kingdom_id
  where b.id = new_building_id;
end;
$$;

grant execute on function public.place_building_transaction(uuid, text, integer, integer, integer) to service_role;


-- 3. Execute raid — improved gold-stolen formula
-- 12% of defender gold with a 50-gold minimum so small raids still sting.
-- The minimum is capped at the defender's actual balance to prevent going negative.
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
  defender_raids_enabled boolean;
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

  select k.id, k.gold, p.raids_enabled
  into defender_kingdom_id, defender_gold_before, defender_raids_enabled
  from public.kingdoms k
  join public.profiles p on p.id = k.user_id
  where k.user_id = p_defender_id
  for update of k, p;

  if attacker_kingdom_id is null or defender_kingdom_id is null then
    raise exception 'Kingdom not found';
  end if;

  if coalesce(defender_raids_enabled, false) is false then
    raise exception 'raids_disabled';
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
