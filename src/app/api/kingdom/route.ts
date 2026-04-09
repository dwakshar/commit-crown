import { NextResponse } from 'next/server'

import { calculateKingdomPower } from '@/src/lib/gameEngine'
import {
  ensureKingdomForUser,
  KINGDOM_WITH_BUILDINGS_SELECT,
  type PersistedKingdomRow,
} from '@/src/lib/kingdomPersistence'
import { getBuildingMetadata } from '@/src/lib/kingdom'
import { withStarterKingdomState } from '@/src/lib/onboarding'
import { createClient } from '@/utils/supabase/server'

import type { BuildingData, GitHubStatsData } from '@/src/types/game'

type ProfileRow = {
  username: string | null
  avatar_url: string | null
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [{ data: profile, error: profileError }, { data: initialKingdom, error: kingdomError }, { data: githubStats }] =
    await Promise.all([
      supabase.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle(),
      supabase
        .from('kingdoms')
        .select(KINGDOM_WITH_BUILDINGS_SELECT)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('github_stats')
        .select(
          'total_commits, total_repos, total_stars, total_prs, followers, current_streak, longest_streak, languages, synced_at',
        )
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? 'Profile not found' }, { status: 404 })
  }

  let kingdom = initialKingdom

  if (kingdomError) {
    return NextResponse.json({ error: kingdomError.message }, { status: 500 })
  }

  if (!kingdom) {
    try {
      kingdom = await ensureKingdomForUser(user.id)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unable to create kingdom' },
        { status: 500 },
      )
    }
  }

  const typedProfile = profile as ProfileRow
  const kingdomRow = kingdom as PersistedKingdomRow

  if (!kingdomRow) {
    return NextResponse.json({ error: 'Kingdom not found' }, { status: 404 })
  }

  const buildings: BuildingData[] = (kingdomRow.buildings ?? []).map((building) => ({
    id: building.id,
    type: building.type,
    x: building.position_x,
    y: building.position_y,
    level: Math.min(5, Math.max(1, building.level)) as 1 | 2 | 3 | 4 | 5,
    skinId: building.skin_id,
    name: getBuildingMetadata(building.type).label,
  }))

  const typedGithubStats = (githubStats as GitHubStatsData | null) ?? null
  const kingdomData = withStarterKingdomState({
    id: kingdomRow.id,
    userId: kingdomRow.user_id,
    name: kingdomRow.name,
    gold: kingdomRow.gold,
    prestige: kingdomRow.prestige,
    population: kingdomRow.population,
    defense_rating: kingdomRow.defense_rating,
    attack_rating: kingdomRow.attack_rating,
    building_slots: kingdomRow.building_slots,
    last_synced_at: kingdomRow.last_synced_at,
    themeId: kingdomRow.theme_id,
    ownerName: typedProfile.username ?? 'Code Monarch',
    ownerAvatarUrl: typedProfile.avatar_url,
    buildings,
    githubStats: typedGithubStats,
  })

  const power = calculateKingdomPower(kingdomData, buildings)

  return NextResponse.json({
    success: true,
    kingdom: kingdomData,
    power,
  })
}
