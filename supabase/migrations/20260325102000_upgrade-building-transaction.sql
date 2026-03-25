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

  upgrade_cost := current_level * 500;

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
