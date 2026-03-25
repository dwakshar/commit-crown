alter table public.profiles
add column if not exists raids_enabled boolean default false;

create table if not exists public.raid_cooldowns (
  attacker_id uuid references public.profiles(id) on delete cascade,
  defender_id uuid references public.profiles(id) on delete cascade,
  last_raid_at timestamptz not null default now(),
  primary key (attacker_id, defender_id)
);

alter table public.raid_cooldowns enable row level security;

drop policy if exists "Raid cooldowns visible to participants" on public.raid_cooldowns;
create policy "Raid cooldowns visible to participants"
  on public.raid_cooldowns for select
  using (auth.uid() = attacker_id or auth.uid() = defender_id);

drop policy if exists "Authenticated users can manage own cooldowns" on public.raid_cooldowns;
create policy "Authenticated users can manage own cooldowns"
  on public.raid_cooldowns for all
  using (auth.uid() = attacker_id)
  with check (auth.uid() = attacker_id);

create table if not exists public.raids (
  id uuid primary key default gen_random_uuid(),
  attacker_id uuid references public.profiles(id) on delete cascade not null,
  defender_id uuid references public.profiles(id) on delete cascade not null,
  attacker_power integer not null,
  defender_power integer not null,
  result text not null check (result in ('attacker_win', 'defender_win')),
  gold_stolen integer not null default 0,
  attacker_gold_after integer not null,
  defender_gold_after integer not null,
  created_at timestamptz not null default now()
);

alter table public.raids enable row level security;

drop policy if exists "Raids visible to participants" on public.raids;
create policy "Raids visible to participants"
  on public.raids for select
  using (auth.uid() = attacker_id or auth.uid() = defender_id);

drop policy if exists "Authenticated users can insert raids as attacker" on public.raids;
create policy "Authenticated users can insert raids as attacker"
  on public.raids for insert
  with check (auth.uid() = attacker_id);

create or replace function public.execute_raid_transaction(
  p_attacker_id uuid,
  p_defender_id uuid,
  p_attacker_power integer,
  p_defender_power integer,
  p_result text,
  p_gold_stolen integer
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
  raid_row_id uuid;
  final_attacker_gold integer;
  final_defender_gold integer;
begin
  select id, gold
  into attacker_kingdom_id, attacker_gold_before
  from public.kingdoms
  where user_id = p_attacker_id
  for update;

  select id, gold
  into defender_kingdom_id, defender_gold_before
  from public.kingdoms
  where user_id = p_defender_id
  for update;

  if attacker_kingdom_id is null or defender_kingdom_id is null then
    raise exception 'Kingdom not found';
  end if;

  final_attacker_gold := attacker_gold_before + case when p_result = 'attacker_win' then p_gold_stolen else 0 end;
  final_defender_gold := defender_gold_before - case when p_result = 'attacker_win' then p_gold_stolen else 0 end;

  if final_defender_gold < 0 then
    raise exception 'Invalid raid transfer';
  end if;

  if p_result = 'attacker_win' and p_gold_stolen > 0 then
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
    p_result,
    p_gold_stolen,
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
    case when p_result = 'attacker_win'
      then 'Your kingdom was raided and lost gold.'
      else 'Your defenses held against an incoming raid.'
    end,
    jsonb_build_object(
      'attacker_id', p_attacker_id,
      'defender_id', p_defender_id,
      'attacker_power', p_attacker_power,
      'defender_power', p_defender_power,
      'result', p_result,
      'gold_stolen', p_gold_stolen,
      'raid_id', raid_row_id
    )
  );

  return query
  select raid_row_id, final_attacker_gold, final_defender_gold, p_gold_stolen, p_result;
end;
$$;

grant execute on function public.execute_raid_transaction(uuid, uuid, integer, integer, text, integer) to authenticated;
