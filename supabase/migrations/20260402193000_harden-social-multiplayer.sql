drop policy if exists "Authenticated users can insert notifications for owned user" on public.notifications;
create policy "Users can insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create index if not exists raids_attacker_result_idx
  on public.raids (attacker_id, result);

create index if not exists raids_created_at_idx
  on public.raids (created_at desc);

create index if not exists kingdoms_prestige_idx
  on public.kingdoms (prestige desc);

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

  resolved_gold_stolen := case
    when resolved_result = 'attacker_win' then floor(defender_gold_before * 0.1)
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
      then 'Your kingdom was raided and lost gold.'
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

revoke execute on function public.execute_raid_transaction(uuid, uuid, integer, integer, text, integer) from authenticated;
grant execute on function public.execute_raid_transaction(uuid, uuid, integer, integer) to service_role;

create or replace function public.record_kingdom_visit(
  p_visitor_id uuid,
  p_host_id uuid
)
returns table (
  recorded boolean,
  visited_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_recent_visit timestamptz;
  visitor_name text;
  new_visited_at timestamptz := now();
begin
  if p_visitor_id = p_host_id then
    raise exception 'Cannot leave a flag on your own kingdom';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_visitor_id::text || ':' || p_host_id::text));

  perform 1
  from public.profiles
  where id = p_host_id;

  if not found then
    raise exception 'Kingdom host not found';
  end if;

  select visited_at
  into existing_recent_visit
  from public.visits
  where visitor_id = p_visitor_id
    and host_id = p_host_id
    and visited_at >= now() - interval '5 minutes'
  order by visited_at desc
  limit 1;

  if existing_recent_visit is not null then
    return query select false, existing_recent_visit;
    return;
  end if;

  select username
  into visitor_name
  from public.profiles
  where id = p_visitor_id;

  insert into public.visits (visitor_id, host_id, visited_at)
  values (p_visitor_id, p_host_id, new_visited_at);

  insert into public.notifications (user_id, type, message, data)
  values (
    p_host_id,
    'kingdom_visited',
    format('%s left a flag at your kingdom.', coalesce(visitor_name, 'A scout')),
    jsonb_build_object(
      'visitor_id', p_visitor_id,
      'visited_at', new_visited_at
    )
  );

  return query select true, new_visited_at;
end;
$$;

grant execute on function public.record_kingdom_visit(uuid, uuid) to service_role;
