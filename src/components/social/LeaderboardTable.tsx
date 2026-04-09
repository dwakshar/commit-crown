'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

type LeaderboardRow = {
  user_id: string
  username: string
  avatar_url: string | null
  kingdom_name: string
  prestige: number
  top_language: string
  raid_wins: number
}

export function LeaderboardTable({
  rows,
  currentUserId,
  page,
  totalPages,
  tab,
}: {
  rows: LeaderboardRow[]
  currentUserId: string | null
  page: number
  totalPages: number
  tab: string
}) {
  const router = useRouter()

  return (
    <div className="realm-panel rounded-[30px] p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-[var(--silver-1)]">
          <thead>
            <tr className="text-xs uppercase tracking-[0.22em] text-[var(--silver-3)]">
              <th className="px-3 py-2">Rank</th>
              <th className="px-3 py-2">Ruler</th>
              <th className="px-3 py-2">Kingdom</th>
              <th className="px-3 py-2">Prestige</th>
              <th className="px-3 py-2">Language</th>
              <th className="px-3 py-2">Raid Wins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rank = (page - 1) * 25 + index + 1
              const isCurrentUser = row.user_id === currentUserId

              return (
                <tr
                  key={`${row.user_id}-${row.top_language}-${rank}`}
                  onClick={() => router.push(`/visit/${row.username}`)}
                  className={`cursor-pointer transition hover:bg-[rgba(255,255,255,0.04)] ${isCurrentUser ? 'bg-[rgba(200,88,26,0.12)]' : 'bg-[rgba(255,255,255,0.02)]'}`}
                >
                  <td className="rounded-l-2xl px-3 py-3 font-semibold text-[var(--ember-hi)]">{rank}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {row.avatar_url ? (
                        <Image
                          src={row.avatar_url}
                          alt={row.username}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-xl border border-[var(--b1)] object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--b1)] bg-[var(--steel-2)] text-[var(--ember-hi)]">
                          {row.username.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{row.username}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">{row.kingdom_name}</td>
                  <td className="px-3 py-3 text-[var(--ember-hi)]">{row.prestige.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-[var(--b1)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-sm text-[var(--silver-1)]">
                      {row.top_language}
                    </span>
                  </td>
                  <td className="rounded-r-2xl px-3 py-3">{row.raid_wins}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-[var(--silver-2)]">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <a
            href={`?tab=${tab}&page=${Math.max(1, page - 1)}`}
            className={`realm-button realm-button-secondary rounded-xl px-3 py-2 ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
          >
            Previous
          </a>
          <a
            href={`?tab=${tab}&page=${Math.min(totalPages, page + 1)}`}
            className={`realm-button realm-button-secondary rounded-xl px-3 py-2 ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
          >
            Next
          </a>
        </div>
      </div>
    </div>
  )
}
