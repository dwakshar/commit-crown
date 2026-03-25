import Link from 'next/link'
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

export default async function KingdomPage({
  searchParams,
}: {
  searchParams: Promise<{ sync?: string; error?: string }>
}) {
  const params = await searchParams
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
    if (params.sync !== '1') {
      redirect('/api/github/sync')
    }

    const errorMessage =
      params.error === 'sync_failed'
        ? 'GitHub sync completed with an error, so the kingdom record was not created.'
        : params.error === 'no_github_token'
          ? 'Your GitHub session token is missing. Sign in again with GitHub to create your kingdom.'
          : params.error === 'no_github_username'
            ? 'Your GitHub username is missing from your profile.'
            : 'Your kingdom has not been created yet.'

    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#120f1d_0%,#09070e_100%)] px-4 py-10 text-[#f7f1e4]">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-[#C9A84C]/25 bg-[linear-gradient(180deg,rgba(20,15,30,0.96),rgba(10,7,16,0.95))] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/75">CodeKingdom</p>
          <h1 className="mt-3 text-3xl font-semibold">Kingdom Setup Needed</h1>
          <p className="mt-4 text-base leading-7 text-white/75">{errorMessage}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/github/sync"
              className="rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#22190b]"
            >
              Retry GitHub Sync
            </a>
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80"
            >
              Back Home
            </Link>
          </div>
        </div>
      </main>
    )
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
