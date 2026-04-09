import { redirect } from 'next/navigation'

import { KingdomPageClient } from '@/src/app/(game)/kingdom/KingdomPageClient'
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

export default async function KingdomPage({
  searchParams,
}: {
  searchParams: Promise<{ sync?: string; error?: string }>
}) {
  await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const [{ data: profile }, kingdomResult, { data: githubStats }] = await Promise.all([
    supabase.from('profiles').select('username, avatar_url, onboarding_done').eq('id', user.id).maybeSingle(),
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

  if (!profile?.onboarding_done) {
    redirect('/onboarding')
  }

  if (kingdomResult.error) {
    throw kingdomResult.error
  }

  let kingdom = (kingdomResult.data as PersistedKingdomRow | null) ?? null

  if (!kingdom) {
    kingdom = await tryEnsureKingdomForUser(user.id)
  }

  if (!kingdom) {
    const fallbackKingdomData = withStarterKingdomState(
      createFallbackKingdomData({
        userId: user.id,
        username: profile?.username ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        githubStats: (githubStats as GitHubStatsData | null) ?? null,
      }),
    )

    return <KingdomPageClient kingdomData={fallbackKingdomData} />
  }

  const kingdomRow = kingdom
  const buildings: BuildingData[] = (kingdomRow.buildings ?? []).map((building) => ({
    id: building.id,
    type: building.type,
    x: building.position_x,
    y: building.position_y,
    level: Math.min(5, Math.max(1, building.level)) as 1 | 2 | 3 | 4 | 5,
    skinId: building.skin_id,
    name: getBuildingMetadata(building.type).label,
  }))

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
    ownerName: profile?.username ?? 'Code Monarch',
    ownerAvatarUrl: profile?.avatar_url ?? null,
    buildings,
    githubStats: (githubStats as GitHubStatsData | null) ?? null,
  })

  return <KingdomPageClient kingdomData={kingdomData} />
}
