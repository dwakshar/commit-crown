create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references public.profiles(id) on delete cascade not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  visited_at timestamptz default now(),
  constraint visits_no_self_visit check (visitor_id <> host_id)
);

alter table public.visits enable row level security;

drop policy if exists "Visits visible by host and visitor" on public.visits;
create policy "Visits visible by host and visitor"
  on public.visits for select
  using (auth.uid() = visitor_id or auth.uid() = host_id);

drop policy if exists "Authenticated users can insert visits" on public.visits;
create policy "Authenticated users can insert visits"
  on public.visits for insert
  with check (auth.uid() = visitor_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Authenticated users can insert notifications for owned user" on public.notifications;
create policy "Authenticated users can insert notifications for owned user"
  on public.notifications for insert
  with check (auth.uid() is not null);
