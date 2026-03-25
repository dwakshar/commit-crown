-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ========================================
-- PROFILES (base table)
-- ========================================
create table if not exists public.profiles (
                                               id uuid references auth.users on delete cascade primary key,
                                               username text unique not null,
                                               github_username text unique,
                                               avatar_url text,
                                               github_id bigint unique,
                                               created_at timestamptz default now()
    );

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ========================================
-- GITHUB_STATS
-- ========================================
create table if not exists public.github_stats (
                                                   id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade unique,
    total_commits integer default 0,
    total_repos integer default 0,
    total_stars integer default 0,
    total_prs integer default 0,
    followers integer default 0,
    current_streak integer default 0,
    longest_streak integer default 0,
    languages jsonb default '{}',
    synced_at timestamptz default now()
    );

alter table public.github_stats enable row level security;

drop policy if exists "Stats viewable by everyone" on public.github_stats;
create policy "Stats viewable by everyone"
  on public.github_stats for select using (true);

drop policy if exists "Service role can upsert stats" on public.github_stats;
create policy "Service role can upsert stats"
  on public.github_stats for all using (auth.role() = 'service_role');

-- ========================================
-- KINGDOMS
-- ========================================
create table if not exists public.kingdoms (
                                               id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade unique,
    name text not null default 'My Kingdom',
    gold integer default 0,
    prestige integer default 0,
    population integer default 0,
    defense_rating integer default 0,
    attack_rating integer default 0,
    building_slots integer default 5,
    raid_opt_in boolean default false,
    last_synced_at timestamptz,
    created_at timestamptz default now()
    );

alter table public.kingdoms enable row level security;

drop policy if exists "Kingdoms viewable by everyone" on public.kingdoms;
create policy "Kingdoms viewable by everyone"
  on public.kingdoms for select using (true);

drop policy if exists "Users can update own kingdom" on public.kingdoms;
create policy "Users can update own kingdom"
  on public.kingdoms for update using (auth.uid() = user_id);

drop policy if exists "Service role full access kingdoms" on public.kingdoms;
create policy "Service role full access kingdoms"
  on public.kingdoms for all using (auth.role() = 'service_role');

-- ========================================
-- BUILDINGS (depends on kingdoms)
-- ========================================
create table if not exists public.buildings (
                                                id uuid primary key default gen_random_uuid(),
    kingdom_id uuid references public.kingdoms(id) on delete cascade,
    type text not null,
    level integer default 1 check (level between 1 and 5),
    position_x integer not null,
    position_y integer not null,
    skin_id uuid,
    built_at timestamptz default now()
    );

alter table public.buildings enable row level security;

drop policy if exists "Buildings viewable by everyone" on public.buildings;
create policy "Buildings viewable by everyone"
  on public.buildings for select using (true);

drop policy if exists "Users can manage own buildings" on public.buildings;
create policy "Users can manage own buildings"
  on public.buildings for all
  using (
    kingdom_id in (
      select id from public.kingdoms where user_id = auth.uid()
    )
  );

-- ========================================
-- SHOP_ITEMS, OWNED_ITEMS, ACHIEVEMENTS, etc.
-- (Continue the same pattern for the remaining tables)
-- ========================================

-- SHOP_ITEMS
create table if not exists public.shop_items (
                                                 id uuid primary key default gen_random_uuid(),
    name text not null,
    type text not null,
    description text,
    price_cents integer not null,
    stripe_price_id text,
    asset_key text,
    is_free boolean default false,
    created_at timestamptz default now()
    );

alter table public.shop_items enable row level security;

drop policy if exists "Shop items viewable by everyone" on public.shop_items;
create policy "Shop items viewable by everyone"
  on public.shop_items for select using (true);

-- OWNED_ITEMS
create table if not exists public.owned_items (
                                                  id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    item_id uuid references public.shop_items(id),
    purchased_at timestamptz default now(),
    unique(user_id, item_id)
    );

alter table public.owned_items enable row level security;

drop policy if exists "Users can view own items" on public.owned_items;
create policy "Users can view own items"
  on public.owned_items for select using (auth.uid() = user_id);

drop policy if exists "Service role can insert owned items" on public.owned_items;
create policy "Service role can insert owned items"
  on public.owned_items for insert
  with check (auth.role() = 'service_role');

-- (Add the same `drop policy if exists` + create pattern for achievements, user_achievements, raids, notifications)
