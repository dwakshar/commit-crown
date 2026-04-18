'use client'

import Image from 'next/image'
import Link from 'next/link'

import { dragonRowBg } from '@/src/components/banners/DragonBanner/DragonBannerImages'

/**
 * Dragon Banner — Leaderboard table row.
 * Drop-in replacement for a default <tr> in LeaderboardTable when the row's
 * owner has the Dragon Banner equipped.
 */
export function DragonLeaderboardRow({
  rank,
  username,
  avatarUrl,
  kingdomName,
  prestige,
  topLanguage,
  raidWins,
  isCurrentUser,
  languageClass,
  onRowClick,
}: {
  rank: number
  username: string
  avatarUrl: string | null
  kingdomName: string
  prestige: number
  topLanguage: string
  raidWins: number
  isCurrentUser: boolean
  languageClass: string
  onRowClick: () => void
}) {
  return (
    <tr
      onClick={onRowClick}
      className="cursor-pointer transition"
      style={{
        ...dragonRowBg(),
        boxShadow: 'inset 4px 0 0 rgba(210,50,10,.75)',
      }}
    >
      {/* Rank */}
      <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4 font-[var(--font-head)] text-base text-[var(--silver-0)]">
        {rank}
      </td>

      {/* Commander */}
      <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              width={38}
              height={38}
              className="h-[38px] w-[38px] rounded-full border border-[var(--b1)] object-cover"
            />
          ) : (
            <div
              className={`flex h-[38px] w-[38px] items-center justify-center rounded-full border ${
                isCurrentUser
                  ? 'border-[var(--ember-lo)] text-[var(--ember)]'
                  : 'border-[var(--b1)] text-[var(--silver-2)]'
              } bg-[var(--steel-3)] font-[var(--font-head)] text-[13px]`}
            >
              {username.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p
              className={`font-[var(--font-head)] text-sm ${
                isCurrentUser ? 'text-[var(--ember)]' : 'text-[var(--silver-0)]'
              }`}
            >
              @{username}
            </p>
            <p className="text-[13px] italic text-[var(--silver-3)]">{kingdomName}</p>
          </div>
        </div>
      </td>

      {/* Kingdom */}
      <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4 text-[15px] italic text-[var(--silver-2)]">
        {kingdomName}
      </td>

      {/* Language */}
      <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4">
        <span
          className={`inline-block border px-3 py-1 font-[var(--font-head)] text-[10px] uppercase tracking-[0.14em] ${languageClass}`}
        >
          {topLanguage.slice(0, 2).toUpperCase()}
        </span>
      </td>

      {/* Prestige — gold + glow */}
      <td
        className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4 font-[var(--font-head)] text-xl"
        style={{ color: '#d4a830', textShadow: '0 0 16px rgba(200,120,10,.5)' }}
      >
        {prestige.toLocaleString()}
      </td>

      {/* Raids */}
      <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4 font-[var(--font-head)] text-sm text-[var(--silver-3)]">
        {raidWins}
      </td>

      {/* Action */}
      <td className="border-b border-[rgba(80,105,130,0.06)] px-4 py-4">
        <Link
          href={isCurrentUser ? '/kingdom' : `/visit/${username}`}
          className="realm-button inline-flex rounded-[2px] border px-6 py-2 text-[11px]"
          style={isCurrentUser ? {
            borderColor: 'rgba(212,140,30,.65)',
            background: 'linear-gradient(135deg,rgba(50,10,2,.85),rgba(80,18,4,.75))',
            color: '#d4a830',
            boxShadow: '0 0 14px rgba(200,100,10,.3)',
          } : {
            borderColor: 'var(--b1)',
            background: 'transparent',
            color: 'var(--silver-3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isCurrentUser ? '🐉 Your Keep' : 'Visit'}
        </Link>
      </td>
    </tr>
  )
}
