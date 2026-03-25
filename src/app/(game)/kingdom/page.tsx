import { redirect } from 'next/navigation'

import { KingdomPageClient } from '@/src/app/(game)/kingdom/KingdomPageClient'
import { getBuildingMetadata } from '@/src/lib/kingdom'
import { createClient } from '@/utils/supabase/server'

import type { BuildingData, GitHubStatsData, KingdomData } from '@/src/types/game'

type KingdomRow = {
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
        level: number
        position_x: number
        position_y: number
      }[]
    | null
}

export default async function KingdomPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const [{ data: profile }, { data: kingdom }, { data: githubStats }] = await Promise.all([
    supabase.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle(),
    supabase
      .from('kingdoms')
      .select(
        'id, user_id, name, gold, prestige, population, defense_rating, attack_rating, building_slots, last_synced_at, buildings(id, type, level, position_x, position_y)',
      )
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

  if (!kingdom) {
    redirect('/api/github/sync')
  }

  const kingdomRow = kingdom as KingdomRow
  const buildings: BuildingData[] = (kingdomRow.buildings ?? []).map((building) => ({
    id: building.id,
    type: building.type,
    x: building.position_x,
    y: building.position_y,
    level: Math.min(5, Math.max(1, building.level)) as 1 | 2 | 3 | 4 | 5,
    name: getBuildingMetadata(building.type).label,
  }))

  const kingdomData: KingdomData = {
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
    ownerName: profile?.username ?? 'Code Monarch',
    ownerAvatarUrl: profile?.avatar_url ?? null,
    buildings,
    githubStats: (githubStats as GitHubStatsData | null) ?? null,
  }

  return <KingdomPageClient kingdomData={kingdomData} />
}
