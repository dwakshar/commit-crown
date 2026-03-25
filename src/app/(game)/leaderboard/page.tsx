import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LeaderboardTable } from '@/src/components/social/LeaderboardTable'
import { createClient } from '@/utils/supabase/server'

type SearchParams = Promise<{ tab?: string; page?: string }>

type LeaderboardRow = {
  user_id: string
  username: string
  avatar_url: string | null
  kingdom_name: string
  prestige: number
  raid_wins: number
  languages?: Record<string, number> | null
  top_language?: string | null
}

function extractTopLanguage(row: LeaderboardRow) {
  if (row.top_language) {
    return row.top_language
  }

  return Object.entries(row.languages ?? {}).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'Unknown'
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { tab = 'global', page = '1' } = await searchParams
  const currentPage = Math.max(1, Number(page || '1'))
  const from = (currentPage - 1) * 25
  const to = from + 24

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const tabs = [
    { key: 'global', label: 'Global' },
    { key: 'language', label: 'By Language' },
    { key: 'weekly', label: 'Weekly' },
  ] as const

  const queryMap = {
    global: () =>
      supabase
        .from('leaderboard_global')
        .select('*', { count: 'exact' })
        .order('prestige', { ascending: false })
        .range(from, to),
    language: () =>
      supabase
        .from('leaderboard_by_language')
        .select('*', { count: 'exact' })
        .order('prestige', { ascending: false })
        .range(from, to),
    weekly: () =>
      supabase
        .from('leaderboard_weekly')
        .select('*', { count: 'exact' })
        .order('weekly_gold_gained', { ascending: false })
        .range(from, to),
  }

  const selectedTab = tab in queryMap ? (tab as keyof typeof queryMap) : 'global'
  const { data, count } = await queryMap[selectedTab]()

  const rows = ((data as LeaderboardRow[] | null) ?? []).map((row) => ({
    ...row,
    top_language: extractTopLanguage(row),
  }))

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#120f1d_0%,#09070e_100%)] px-4 py-10 text-[#f7f1e4]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/75">Royal Ledger</p>
            <h1 className="mt-3 text-4xl font-semibold">Kingdom Leaderboard</h1>
          </div>
          <Link href="/kingdom" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
            Return to Kingdom
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {tabs.map((tabItem) => (
            <Link
              key={tabItem.key}
              href={`/leaderboard?tab=${tabItem.key}&page=1`}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selectedTab === tabItem.key
                  ? 'border-[#C9A84C]/40 bg-[#2a2312] text-[#f4d98e]'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {tabItem.label}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <LeaderboardTable
            rows={rows}
            currentUserId={user.id}
            page={currentPage}
            totalPages={Math.max(1, Math.ceil((count ?? 0) / 25))}
            tab={selectedTab}
          />
        </div>
      </div>
    </main>
  )
}
