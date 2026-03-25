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
    <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,15,30,0.96),rgba(10,7,16,0.95))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-[#f7f1e4]">
          <thead>
            <tr className="text-xs uppercase tracking-[0.22em] text-white/45">
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
                  className={`cursor-pointer transition hover:bg-white/5 ${isCurrentUser ? 'bg-[#2a2312]' : 'bg-black/20'}`}
                >
                  <td className="rounded-l-2xl px-3 py-3 font-semibold text-[#C9A84C]">{rank}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {row.avatar_url ? (
                        <Image
                          src={row.avatar_url}
                          alt={row.username}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-xl border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#241d11] text-[#C9A84C]">
                          {row.username.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{row.username}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">{row.kingdom_name}</td>
                  <td className="px-3 py-3 text-[#C9A84C]">{row.prestige.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-[#C9A84C]/25 bg-[#1a1524] px-3 py-1 text-sm text-[#f2d68a]">
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

      <div className="mt-4 flex items-center justify-between text-sm text-white/65">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <a
            href={`?tab=${tab}&page=${Math.max(1, page - 1)}`}
            className={`rounded-xl border border-white/10 px-3 py-2 ${page <= 1 ? 'pointer-events-none opacity-40' : 'bg-white/5 hover:bg-white/10'}`}
          >
            Previous
          </a>
          <a
            href={`?tab=${tab}&page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-xl border border-white/10 px-3 py-2 ${page >= totalPages ? 'pointer-events-none opacity-40' : 'bg-white/5 hover:bg-white/10'}`}
          >
            Next
          </a>
        </div>
      </div>
    </div>
  )
}
