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
    <main className="min-h-screen px-4 py-10 text-[var(--silver-1)]">
      <div className="mx-auto max-w-6xl">
        <div className="realm-panel rounded-[32px] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="realm-label text-[var(--plate-hi)]">Glory and Conquest</p>
              <h1 className="realm-page-title mt-3 text-4xl">Hall of Legend</h1>
              <p className="realm-lore mt-3 max-w-2xl">
                The mightiest rulers in the realm, ranked by prestige, language mastery, and conquest.
              </p>
            </div>
            <Link href="/kingdom" className="realm-button realm-button-secondary rounded-[18px] px-4 py-3 text-center">
              Return to Kingdom
            </Link>
          </div>

          <div className="realm-divider my-6" />

          <div className="flex flex-wrap gap-3">
            {tabs.map((tabItem) => (
              <Link
                key={tabItem.key}
                href={`/leaderboard?tab=${tabItem.key}&page=1`}
                className={`realm-button rounded-[16px] border px-4 py-3 text-sm transition ${
                  selectedTab === tabItem.key
                    ? 'realm-button-primary'
                    : 'realm-button-secondary'
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
      </div>
    </main>
  )
}
