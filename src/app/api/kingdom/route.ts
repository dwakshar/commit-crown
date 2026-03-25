import { NextResponse } from 'next/server'

import { calculateKingdomPower } from '@/src/lib/gameEngine'
import { createClient } from '@/utils/supabase/server'

import type { BuildingData, GitHubStatsData, KingdomData } from '@/src/types/game'

type ProfileKingdomResult = {
  username: string | null
  avatar_url: string | null
  kingdoms:
    | {
        id: string
        user_id: string
        name: string
        gold: number
        prestige: number
        population: number
        defense_rating: number
        attack_rating: number
        building_slots: number
        last_synced_at: string | null
        buildings:
          | {
              id: string
              type: BuildingData['type']
              position_x: number
              position_y: number
              level: number
            }[]
          | null
      }[]
    | null
  github_stats:
    | {
        total_commits: number
        total_repos: number
        total_stars: number
        total_prs: number
        followers: number
        current_streak: number
        longest_streak: number
        languages: Record<string, number> | null
        synced_at: string | null
      }[]
    | null
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'username, avatar_url, kingdoms(id, user_id, name, gold, prestige, population, defense_rating, attack_rating, building_slots, last_synced_at, buildings(id, type, position_x, position_y, level)), github_stats(total_commits, total_repos, total_stars, total_prs, followers, current_streak, longest_streak, languages, synced_at)',
    )
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Kingdom not found' }, { status: 404 })
  }

  const result = profile as ProfileKingdomResult
  const kingdom = result.kingdoms?.[0]

  if (!kingdom) {
    return NextResponse.json({ error: 'Kingdom not found' }, { status: 404 })
  }

  const buildings: BuildingData[] = (kingdom.buildings ?? []).map((building) => ({
    id: building.id,
    type: building.type,
    x: building.position_x,
    y: building.position_y,
    level: Math.min(5, Math.max(1, building.level)) as 1 | 2 | 3 | 4 | 5,
  }))

  const githubStats: GitHubStatsData | null = result.github_stats?.[0]
    ? {
        total_commits: result.github_stats[0].total_commits,
        total_repos: result.github_stats[0].total_repos,
        total_stars: result.github_stats[0].total_stars,
        total_prs: result.github_stats[0].total_prs,
        followers: result.github_stats[0].followers,
        current_streak: result.github_stats[0].current_streak,
        longest_streak: result.github_stats[0].longest_streak,
        languages: result.github_stats[0].languages ?? {},
        synced_at: result.github_stats[0].synced_at,
      }
    : null

  const kingdomData: KingdomData = {
    id: kingdom.id,
    userId: kingdom.user_id,
    name: kingdom.name,
    gold: kingdom.gold,
    prestige: kingdom.prestige,
    population: kingdom.population,
    defense_rating: kingdom.defense_rating,
    attack_rating: kingdom.attack_rating,
    building_slots: kingdom.building_slots,
    last_synced_at: kingdom.last_synced_at,
    ownerName: result.username ?? 'Code Monarch',
    ownerAvatarUrl: result.avatar_url,
    buildings,
    githubStats,
  }

  const power = calculateKingdomPower(kingdomData, buildings)

  return NextResponse.json({
    success: true,
    kingdom: kingdomData,
    power,
  })
}
