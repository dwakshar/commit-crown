drop function if exists public.apply_github_sync_snapshot(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  jsonb,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  timestamptz
);

create or replace function public.apply_github_sync_snapshot(
  p_user_id uuid,
  p_followers integer,
  p_total_commits integer,
  p_total_repos integer,
  p_total_stars integer,
  p_total_prs integer,
  p_current_streak integer,
  p_longest_streak integer,
  p_night_commits integer,
  p_monthly_peak integer,
  p_starred_repo_count integer,
  p_languages jsonb,
  p_prestige integer,
  p_population integer,
  p_attack_rating integer,
  p_defense_rating integer,
  p_building_slots integer,
  p_synced_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.github_stats (
    user_id,
    followers,
    total_commits,
    total_repos,
    total_stars,
    total_prs,
    current_streak,
    longest_streak,
    night_commits,
    monthly_peak,
    starred_repo_count,
    languages,
    synced_at
  )
  values (
    p_user_id,
    p_followers,
    p_total_commits,
    p_total_repos,
    p_total_stars,
    p_total_prs,
    p_current_streak,
    p_longest_streak,
    p_night_commits,
    p_monthly_peak,
    p_starred_repo_count,
    coalesce(p_languages, '{}'::jsonb),
    p_synced_at
  )
  on conflict (user_id) do update
  set
    followers = excluded.followers,
    total_commits = excluded.total_commits,
    total_repos = excluded.total_repos,
    total_stars = excluded.total_stars,
    total_prs = excluded.total_prs,
    current_streak = excluded.current_streak,
    longest_streak = excluded.longest_streak,
    night_commits = excluded.night_commits,
    monthly_peak = excluded.monthly_peak,
    starred_repo_count = excluded.starred_repo_count,
    languages = excluded.languages,
    synced_at = excluded.synced_at;

  insert into public.kingdoms (
    user_id,
    prestige,
    population,
    attack_rating,
    defense_rating,
    building_slots,
    last_synced_at
  )
  values (
    p_user_id,
    p_prestige,
    p_population,
    p_attack_rating,
    p_defense_rating,
    p_building_slots,
    p_synced_at
  )
  on conflict (user_id) do update
  set
    prestige = excluded.prestige,
    population = excluded.population,
    attack_rating = excluded.attack_rating,
    defense_rating = excluded.defense_rating,
    building_slots = excluded.building_slots,
    last_synced_at = excluded.last_synced_at;

  update public.profiles
  set onboarding_done = true
  where id = p_user_id;
end;
$$;

drop function if exists public.execute_raid_transaction(uuid, uuid, integer, integer, text, integer);
