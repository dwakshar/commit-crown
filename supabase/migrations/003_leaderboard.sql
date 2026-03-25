create or replace view public.leaderboard_global as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  p.github_username,
  k.name as kingdom_name,
  k.prestige,
  k.gold,
  k.attack_rating,
  k.defense_rating,
  gs.languages,
  coalesce((
    select count(*)
    from public.raids r
    where r.attacker_id = p.id and r.result = 'attacker_win'
  ), 0) as raid_wins
from public.kingdoms k
join public.profiles p on k.user_id = p.id
join public.github_stats gs on gs.user_id = p.id
order by k.prestige desc;

create or replace view public.leaderboard_by_language as
with ranked as (
  select
    p.id as user_id,
    p.username,
    p.avatar_url,
    p.github_username,
    k.name as kingdom_name,
    k.prestige,
    k.gold,
    k.attack_rating,
    k.defense_rating,
    gs.languages,
    coalesce((
      select count(*)
      from public.raids r
      where r.attacker_id = p.id and r.result = 'attacker_win'
    ), 0) as raid_wins,
    (
      select key
      from jsonb_each_text(gs.languages)
      order by value::int desc, key asc
      limit 1
    ) as top_language,
    row_number() over (
      partition by (
        select key
        from jsonb_each_text(gs.languages)
        order by value::int desc, key asc
        limit 1
      )
      order by k.prestige desc
    ) as language_rank
  from public.kingdoms k
  join public.profiles p on k.user_id = p.id
  join public.github_stats gs on gs.user_id = p.id
)
select *
from ranked
where language_rank = 1 and top_language is not null;

create or replace view public.leaderboard_weekly as
with weekly_gains as (
  select
    attacker_id as user_id,
    sum(gold_stolen) as weekly_gold_gained
  from public.raids
  where created_at >= date_trunc('week', now())
  group by attacker_id
)
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  p.github_username,
  k.name as kingdom_name,
  k.prestige,
  k.gold,
  k.attack_rating,
  k.defense_rating,
  gs.languages,
  coalesce(wg.weekly_gold_gained, 0) as weekly_gold_gained,
  coalesce((
    select count(*)
    from public.raids r
    where r.attacker_id = p.id and r.result = 'attacker_win'
  ), 0) as raid_wins
from public.kingdoms k
join public.profiles p on k.user_id = p.id
join public.github_stats gs on gs.user_id = p.id
left join weekly_gains wg on wg.user_id = p.id
order by weekly_gold_gained desc, k.prestige desc;
