alter table public.github_stats
add column if not exists night_commits integer default 0,
add column if not exists monthly_peak integer default 0,
add column if not exists starred_repo_count integer default 0;

create table if not exists public.achievements (
  key text primary key,
  name text not null,
  description text not null,
  category text not null,
  created_at timestamptz default now()
);

alter table public.achievements enable row level security;

drop policy if exists "Achievements viewable by everyone" on public.achievements;
create policy "Achievements viewable by everyone"
  on public.achievements for select using (true);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_key text references public.achievements(key) on delete cascade not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_key)
);

alter table public.user_achievements enable row level security;

drop policy if exists "Users can view own user achievements" on public.user_achievements;
create policy "Users can view own user achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own user achievements" on public.user_achievements;
create policy "Users can insert own user achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

create table if not exists public.kingdom_weekly_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_start date not null,
  prestige integer not null,
  prestige_rank integer not null,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

alter table public.kingdom_weekly_snapshots enable row level security;

drop policy if exists "Weekly snapshots viewable by everyone" on public.kingdom_weekly_snapshots;
create policy "Weekly snapshots viewable by everyone"
  on public.kingdom_weekly_snapshots for select using (true);

insert into public.achievements (key, name, description, category)
values
  ('night_owl', 'Night Owl', 'Make at least 10 night commits.', 'coding'),
  ('polyglot', 'Polyglot', 'Work across at least five languages.', 'coding'),
  ('centurion', 'Centurion', 'Hit a monthly peak of 100 commits.', 'coding'),
  ('streak_master', 'Streak Master', 'Reach a 30 day longest streak.', 'coding'),
  ('open_source_hero', 'Open Source Hero', 'Own at least 10 repos with stars.', 'coding'),
  ('conqueror', 'Conqueror', 'Win 10 raids.', 'raid'),
  ('architect', 'Architect', 'Upgrade any building to level 5.', 'kingdom'),
  ('diplomat', 'Diplomat', 'Visit 20 distinct kingdoms.', 'social'),
  ('ghost_coder', 'Ghost Coder', 'Make 5 night commits and exceed 50 total commits.', 'coding'),
  ('the_silent', 'The Silent', 'Reach the top 50 in prestige while visiting fewer than 5 kingdoms.', 'social'),
  ('legend', 'Legend', 'Finish in the weekly top 10 at least 4 times.', 'legendary')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category;
