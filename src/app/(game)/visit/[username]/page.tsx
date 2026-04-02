import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ScoutReport } from '@/src/components/social/ScoutReport'
import { PhaserGame } from '@/src/components/game/PhaserGame'
import { getBuildingMetadata } from '@/src/lib/kingdom'
import { createClient } from '@/utils/supabase/server'

import type { BuildingData, GitHubStatsData, KingdomData } from '@/src/types/game'

type VisitProfileResult = {
  id: string
  username: string
  github_username: string | null
  avatar_url: string | null
  created_at: string | null
  raids_enabled: boolean | null
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
        theme_id: string | null
        buildings:
          | {
              id: string
              type: BuildingData['type']
              level: number
              position_x: number
              position_y: number
              skin_id: string | null
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

type RecentVisitRow = {
  visitor: {
    username: string
  } | null
}

async function getVisitData(username: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: rankRows }, { data: viewerProfile }, { data: viewerKingdom }] =
    await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, username, github_username, avatar_url, created_at, raids_enabled, kingdoms(id, user_id, name, gold, prestige, population, defense_rating, attack_rating, building_slots, last_synced_at, theme_id, buildings(id, type, level, position_x, position_y, skin_id)), github_stats(total_commits, total_repos, total_stars, total_prs, followers, current_streak, longest_streak, languages, synced_at)',
      )
      .eq('username', username)
      .maybeSingle(),
    supabase.from('kingdoms').select('user_id, prestige').order('prestige', { ascending: false }),
    user
      ? supabase.from('profiles').select('username, raids_enabled').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('kingdoms')
          .select('attack_rating, gold')
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!profile) {
    return null
  }

  const result = profile as VisitProfileResult
  const kingdom = result.kingdoms?.[0]

  if (!kingdom) {
    return null
  }

  const { data: recentVisits } = await supabase
    .from('visits')
    .select('visitor:profiles!visits_visitor_id_fkey(username)')
    .eq('host_id', result.id)
    .order('visited_at', { ascending: false })
    .limit(5)

  const buildings: BuildingData[] = (kingdom.buildings ?? []).map((building) => ({
    id: building.id,
    type: building.type,
    x: building.position_x,
    y: building.position_y,
    level: Math.min(5, Math.max(1, building.level)) as 1 | 2 | 3 | 4 | 5,
    skinId: building.skin_id,
    name: getBuildingMetadata(building.type).label,
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

  const topLanguage =
    Object.entries(githubStats?.languages ?? {}).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'Unknown'
  const prestigeRank =
    (rankRows?.findIndex((row) => row.user_id === kingdom.user_id) ?? -1) >= 0
      ? (rankRows?.findIndex((row) => row.user_id === kingdom.user_id) ?? 0) + 1
      : 1

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
    raids_enabled: Boolean(result.raids_enabled),
    last_synced_at: kingdom.last_synced_at,
    themeId: kingdom.theme_id,
    ownerName: result.username,
    ownerAvatarUrl: result.avatar_url,
    ownerGithubUsername: result.github_username,
    ownerCreatedAt: result.created_at,
    buildings,
    githubStats,
  }

  return {
    kingdomData,
    topLanguage,
    prestigeRank,
    recentVisitors: ((recentVisits as RecentVisitRow[] | null) ?? [])
      .map((visit) => visit.visitor?.username)
      .filter((value): value is string => Boolean(value)),
    viewerId: user?.id ?? null,
    viewerName: viewerProfile?.username ?? null,
    viewerRaidsEnabled: Boolean(viewerProfile?.raids_enabled),
    viewerAttackRating: viewerKingdom?.attack_rating ?? 0,
    viewerGold: viewerKingdom?.gold ?? 0,
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> },
): Promise<Metadata> {
  const { username } = await params
  const visitData = await getVisitData(username)

  if (!visitData) {
    return {
      title: 'Kingdom Not Found',
    }
  }

  const { kingdomData, topLanguage } = visitData
  const title = `${kingdomData.ownerName}'s Kingdom`
  const description = `Prestige: ${kingdomData.prestige} | ${kingdomData.buildings.length} buildings | Top language: ${topLanguage}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og/${username}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/${username}`],
    },
  }
}

export default async function VisitPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const visitData = await getVisitData(username)

  if (!visitData) {
    notFound()
  }

  const {
    kingdomData,
    prestigeRank,
    topLanguage,
    recentVisitors,
    viewerId,
    viewerName,
    viewerRaidsEnabled,
    viewerAttackRating,
    viewerGold,
  } = visitData
  const canLeaveFlag = Boolean(viewerId && viewerId !== kingdomData.userId)
  const canRaid = Boolean(
    viewerId &&
      viewerId !== kingdomData.userId &&
      viewerRaidsEnabled &&
      kingdomData.raids_enabled,
  )

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#0b0912]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.18),transparent_30%),linear-gradient(180deg,#120f1d_0%,#09070e_100%)]" />
      <div className="absolute inset-0">
        <PhaserGame kingdomData={kingdomData} userId={viewerId ?? 'visitor'} isOwner={false} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex w-full justify-end p-3 md:w-auto md:p-6">
        <ScoutReport
          kingdomData={kingdomData}
          prestigeRank={prestigeRank}
          totalBuildings={kingdomData.buildings.length}
          topLanguage={topLanguage}
          recentVisitors={recentVisitors}
          canLeaveFlag={canLeaveFlag}
          canRaid={canRaid}
          attackerName={viewerName ?? undefined}
          attackerAttackRating={viewerAttackRating}
          attackerGold={viewerGold}
        />
      </div>
    </main>
  )
}
