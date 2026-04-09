-- Fix ambiguous column reference in record_kingdom_visit function
-- Renamed return column visited_at to visit_timestamp to avoid ambiguity

-- Must drop and recreate since we can't change return type
drop function if exists public.record_kingdom_visit(uuid, uuid);

create function public.record_kingdom_visit(
  p_visitor_id uuid,
  p_host_id uuid
)
returns table (
  recorded boolean,
  visit_timestamp timestamptz
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

  select v.visited_at
  into existing_recent_visit
  from public.visits v
  where v.visitor_id = p_visitor_id
    and v.host_id = p_host_id
    and v.visited_at >= now() - interval '5 minutes'
  order by v.visited_at desc
  limit 1;

  if existing_recent_visit is not null then
    return query select false, existing_recent_visit;
    return;
  end if;

  select p.username
  into visitor_name
  from public.profiles p
  where p.id = p_visitor_id;

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

notify pgrst, 'reload schema';
