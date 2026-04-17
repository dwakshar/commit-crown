create or replace function public.place_building_transaction(
  p_user_id     uuid,
  p_type        text,
  p_position_x  integer,
  p_position_y  integer,
  p_cost        integer
)
returns table (
  building_id  uuid,
  kingdom_id   uuid,
  type         text,
  level        integer,
  position_x   integer,
  position_y   integer,
  built_at     timestamptz,
  gold         integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_kingdom_id        uuid;
  kingdom_gold             integer;
  kingdom_slots            integer;
  current_building_count   integer;
  new_building_id          uuid;
  singleton_type_count     integer;
begin
  select k.id, k.gold, k.building_slots
  into target_kingdom_id, kingdom_gold, kingdom_slots
  from public.kingdoms k
  where k.user_id = p_user_id
  for update;

  if target_kingdom_id is null then
    raise exception 'Kingdom not found';
  end if;

  if p_type in (
    'town_hall',
    'royal_flagship',
    'sentinel_skiff',
    'bulwark_barge',
    'supply_tender'
  ) then
    select count(*) into singleton_type_count
    from public.buildings b
    where b.kingdom_id = target_kingdom_id
      and b.type = p_type;

    if singleton_type_count > 0 then
      if p_type = 'town_hall' then
        raise exception 'Town Hall already exists';
      end if;

      raise exception '% already exists', initcap(replace(p_type, '_', ' '));
    end if;
  end if;

  perform 1
  from public.buildings b
  where b.kingdom_id = target_kingdom_id
    and b.position_x = p_position_x
    and b.position_y = p_position_y;

  if found then
    raise exception 'Position is already occupied';
  end if;

  select count(*) into current_building_count
  from public.buildings b
  where b.kingdom_id = target_kingdom_id;

  if current_building_count >= kingdom_slots then
    raise exception 'No building slots available';
  end if;

  if kingdom_gold < p_cost then
    raise exception 'Insufficient gold. Required: %, available: %', p_cost, kingdom_gold;
  end if;

  update public.kingdoms
  set gold = kingdom_gold - p_cost
  where id = target_kingdom_id;

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
