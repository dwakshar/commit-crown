import { NextResponse } from 'next/server'

import { calculateKingdomPower } from '@/src/lib/gameEngine'
import {
  createFallbackKingdomData,
  fetchPersistedKingdomForUser,
  type PersistedKingdomRow,
  tryEnsureKingdomForUser,
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

  const [{ data: profile, error: profileError }, kingdomResult, { data: githubStats }] =
    await Promise.all([
      supabase.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle(),
      fetchPersistedKingdomForUser(supabase, user.id)
        .then((data) => ({ data, error: null }))
        .catch((error) => ({
          data: null,
          error: error instanceof Error ? error : new Error('Unable to load kingdom'),
        })),
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

  let kingdom: PersistedKingdomRow | null = null

  if (kingdomResult.error) {
    return NextResponse.json({ error: kingdomResult.error.message }, { status: 500 })
  }

  kingdom = (kingdomResult.data as PersistedKingdomRow | null) ?? null

  if (!kingdom) {
    kingdom = await tryEnsureKingdomForUser(user.id)
  }

  const typedProfile = profile as ProfileRow
  const kingdomRow = kingdom

  if (!kingdomRow) {
    const typedGithubStats = (githubStats as GitHubStatsData | null) ?? null
    const fallbackKingdomData = withStarterKingdomState(
      createFallbackKingdomData({
        userId: user.id,
        username: typedProfile.username ?? null,
        avatarUrl: typedProfile.avatar_url,
        githubStats: typedGithubStats,
      }),
    )

    return NextResponse.json({
      success: true,
      kingdom: fallbackKingdomData,
      power: calculateKingdomPower(fallbackKingdomData, fallbackKingdomData.buildings),
    })
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
