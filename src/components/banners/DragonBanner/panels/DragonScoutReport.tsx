'use client'

import { useMemo, useState } from 'react'

import { formatDistanceToNowStrict } from 'date-fns'
import Image from 'next/image'

import { dragonScoutReportBg } from '@/src/components/banners/DragonBanner/DragonBannerImages'
import { RaidConfirmModal } from '@/src/components/ui/RaidConfirmModal'
import type { KingdomData } from '@/src/types/game'

/**
 * Dragon Banner — Scout Report panel.
 * Full dragon-themed replacement for ScoutReport when the defender has the
 * Dragon Banner equipped. Accepts identical props so the swap is seamless.
 */
export function DragonScoutReport({
  kingdomData,
  prestigeRank,
  totalBuildings,
  topLanguage,
  recentVisitors,
  canLeaveFlag,
  canRaid,
  attackerName,
  attackerAttackRating,
  attackerGold,
}: {
  kingdomData: KingdomData
  prestigeRank: number
  totalBuildings: number
  topLanguage: string
  recentVisitors: string[]
  canLeaveFlag: boolean
  canRaid: boolean
  attackerName?: string
  attackerAttackRating?: number
  attackerGold?: number
}) {
  const [isFlagging, setIsFlagging] = useState(false)
  const [hasFlagged, setHasFlagged] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRaidOpen, setIsRaidOpen] = useState(false)

  const accountAge = useMemo(() => {
    if (!kingdomData.ownerCreatedAt) return 'Unknown age'
    return formatDistanceToNowStrict(new Date(kingdomData.ownerCreatedAt), { addSuffix: true })
  }, [kingdomData.ownerCreatedAt])

  const handleLeaveFlag = async () => {
    setIsFlagging(true)
    setErrorMessage(null)
    try {
      const response = await fetch('/api/visit/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defenderId: kingdomData.userId }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Unable to leave a flag')
      setHasFlagged(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to leave a flag')
    } finally {
      setIsFlagging(false)
    }
  }

  const commandHandle = kingdomData.ownerGithubUsername ?? kingdomData.ownerName
  const defenseLabel = kingdomData.defense_rating.toLocaleString()
  const treasuryLabel = kingdomData.gold.toLocaleString()

  return (
    <>
      <aside
        className="pointer-events-auto max-h-full w-full max-w-[420px] overflow-y-auto overflow-x-hidden text-[var(--silver-1)] shadow-[0_24px_90px_rgba(0,0,0,0.55)]"
        style={{
          border: '1px solid rgba(180,30,10,.5)',
          boxShadow: '0 0 0 1px rgba(212,140,30,.15),0 24px 90px rgba(0,0,0,.6),0 0 60px rgba(140,10,5,.2)',
          ...dragonScoutReportBg(),
        }}
      >
        <style>{`
          @keyframes sr-glow{0%,100%{opacity:.5}50%{opacity:.9}}
          @keyframes sr-fire{0%,100%{clip-path:polygon(0% 100%,8% 55%,18% 78%,28% 20%,38% 62%,48% 4%,58% 46%,68% 18%,78% 56%,88% 28%,100% 100%)}50%{clip-path:polygon(0% 100%,10% 48%,20% 70%,30% 16%,40% 56%,50% 0%,60% 42%,70% 14%,80% 52%,90% 22%,100% 100%)}}
          @keyframes sr-ember{0%{transform:translateY(0) translateX(0);opacity:.9}100%{transform:translateY(-32px) translateX(var(--drift));opacity:0}}
          @keyframes sr-scalescroll{from{background-position:0 0}to{background-position:0 22px}}
        `}</style>

        {/* Dragon scale texture overlay */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[.04]"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: 'sr-scalescroll 10s linear infinite', position: 'absolute', zIndex: 0 }}
        >
          <defs>
            <pattern id="sr-scales" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M8 0 L16 8 L8 16 L0 8 Z" fill="none" stroke="#d4a830" strokeWidth=".6" />
              <circle cx="8" cy="8" r=".8" fill="#d4a830" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sr-scales)" />
        </svg>

        {/* Header */}
        <div
          className="relative border-b px-5 py-6"
          style={{
            borderColor: 'rgba(180,30,10,.4)',
            background: 'linear-gradient(180deg,rgba(30,5,5,.7),rgba(14,3,3,.5))',
          }}
        >
          {/* Top gold line */}
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background: 'linear-gradient(90deg,transparent,rgba(212,168,48,.7),rgba(255,220,80,.5),rgba(212,168,48,.7),transparent)',
              animation: 'sr-glow 2.5s ease-in-out infinite',
            }}
          />
          {/* Fire strip at bottom */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: 18,
              background: 'linear-gradient(0deg,rgba(180,30,5,.5),rgba(255,80,10,.2),transparent)',
              animation: 'sr-fire .9s ease-in-out infinite',
            }}
          />
          {/* Embers */}
          {([
            { l: '12%', d: '-8px' },
            { l: '40%', d: '7px' },
            { l: '68%', d: '-5px' },
            { l: '88%', d: '6px' },
          ] as { l: string; d: string }[]).map((e, i) => (
            <div
              key={i}
              className="pointer-events-none absolute bottom-1"
              style={{
                left: e.l,
                width: 3,
                height: 3,
                background: i % 2 === 0 ? '#ff5020' : '#ff9030',
                boxShadow: '0 0 5px #ff3000',
                ['--drift' as string]: e.d,
                animation: `sr-ember ${2.2 + i * 0.45}s ${i * 0.6}s ease-out infinite`,
              }}
            />
          ))}

          <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(212,148,30,.8)' }}>
            🐉 Dragon Scout Report
          </div>
          <div
            className="mt-2 font-[var(--font-head)] text-[1.9rem] leading-none"
            style={{ color: 'var(--silver-0)', textShadow: '0 0 24px rgba(180,30,10,.4)' }}
          >
            {kingdomData.name}
          </div>
          <div className="mt-2 text-sm italic text-[var(--silver-2)]">
            Commanded by @{commandHandle.toLowerCase()} / Open for battle
          </div>
        </div>

        {/* Commander */}
        <div
          className="border-b px-5 py-5"
          style={{ borderColor: 'rgba(160,20,8,.35)', background: 'rgba(14,3,3,.4)' }}
        >
          <div className="flex items-center gap-4">
            {kingdomData.ownerAvatarUrl ? (
              <Image
                src={kingdomData.ownerAvatarUrl}
                alt={kingdomData.ownerName}
                width={72}
                height={72}
                className="h-[72px] w-[72px] object-cover"
                style={{ border: '2px solid rgba(200,60,10,.6)' }}
              />
            ) : (
              <div
                className="flex h-[72px] w-[72px] items-center justify-center text-2xl font-[var(--font-head)]"
                style={{
                  border: '2px solid rgba(200,60,10,.6)',
                  background: 'linear-gradient(135deg,rgba(40,4,4,.9),rgba(20,2,2,.85))',
                  color: 'var(--silver-0)',
                }}
              >
                {kingdomData.ownerName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(212,148,30,.7)' }}>
                Commander
              </div>
              <h1 className="mt-2 font-[var(--font-head)] text-[1.5rem] leading-none text-[var(--silver-0)]">
                {kingdomData.ownerName}
              </h1>
              <p className="mt-2 text-sm text-[var(--silver-2)]">@{commandHandle}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--silver-3)]">
                Defense {defenseLabel} / Treasury {treasuryLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div
          className="grid grid-cols-2 gap-px border-b"
          style={{ borderColor: 'rgba(160,20,8,.35)', background: 'rgba(100,10,5,.25)' }}
        >
          {[
            { label: 'Prestige Rank', value: `#${prestigeRank}` },
            { label: 'Structures', value: String(totalBuildings) },
            { label: 'Top Language', value: topLanguage },
            { label: 'Account Age', value: accountAge, small: true },
          ].map(({ label, value, small }) => (
            <div key={label} className="px-5 py-4" style={{ background: 'rgba(12,3,3,.82)' }}>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(212,148,30,.65)' }}>
                {label}
              </div>
              <div
                className={`mt-2 font-[var(--font-head)] ${small ? 'text-sm font-semibold' : 'text-2xl'} text-[var(--silver-0)]`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Operations */}
        <div className="border-b px-5 py-5" style={{ borderColor: 'rgba(160,20,8,.35)' }}>
          <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(212,148,30,.75)' }}>
            Operation Window
          </div>
          <div className="mt-2 text-sm text-[var(--silver-2)]">
            Leave your banner, survey this kingdom, or launch a raid.
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {canLeaveFlag ? (
              <button
                type="button"
                onClick={handleLeaveFlag}
                disabled={isFlagging || hasFlagged}
                className="realm-button border px-5 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  borderColor: 'rgba(180,30,10,.4)',
                  background: 'rgba(20,4,4,.5)',
                  color: 'var(--silver-2)',
                }}
              >
                {isFlagging ? 'Leaving Flag...' : hasFlagged ? 'Flag Planted' : 'Leave A Flag'}
              </button>
            ) : (
              <div
                className="border px-4 py-3 text-sm text-[var(--silver-2)]"
                style={{ borderColor: 'rgba(160,20,8,.3)', background: 'rgba(255,255,255,0.02)' }}
              >
                Sign in with a different account to leave a flag on this kingdom.
              </div>
            )}
            {canRaid ? (
              <button
                type="button"
                onClick={() => setIsRaidOpen(true)}
                className="realm-button border px-5 py-3 text-sm transition"
                style={{
                  borderColor: 'rgba(200,88,26,0.58)',
                  background: 'linear-gradient(180deg,rgba(50,10,4,.9),rgba(30,6,3,.95))',
                  color: 'var(--ember-hi)',
                }}
              >
                🔥 Raid This Kingdom
              </button>
            ) : (
              <div
                className="border px-4 py-3 text-sm text-[var(--silver-3)]"
                style={{ borderColor: 'rgba(160,20,8,.25)', background: 'rgba(255,255,255,0.01)' }}
              >
                Sign in to raid this kingdom.
              </div>
            )}
          </div>
          {errorMessage ? <p className="mt-3 text-sm text-[#ff9696]">{errorMessage}</p> : null}
        </div>

        {/* Advisory */}
        <div className="border-b px-5 py-5" style={{ borderColor: 'rgba(160,20,8,.35)' }}>
          <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(212,148,30,.75)' }}>
            Advisory
          </div>
          <div
            className="mt-3 border px-4 py-4 text-sm leading-6 text-[var(--silver-2)]"
            style={{ borderColor: 'rgba(160,20,8,.3)', background: 'rgba(14,3,3,.6)' }}
          >
            Strong treasuries support prolonged raids, while high defense makes this keep harder to crack. Use the
            board view to inspect district density before committing troops.
          </div>
        </div>

        {/* Recent Flags */}
        <div className="px-5 py-5">
          <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(212,148,30,.75)' }}>
            Recent Flags
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentVisitors.length > 0 ? (
              [...new Set(recentVisitors)].map((visitor, index) => (
                <span
                  key={`${visitor}-${index}`}
                  className="border px-3 py-1 text-sm text-[var(--silver-2)]"
                  style={{ borderColor: 'rgba(180,30,10,.4)', background: 'rgba(14,3,3,.5)' }}
                >
                  @{visitor}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--silver-3)]">No scouts have left a flag yet.</span>
            )}
          </div>
        </div>
      </aside>

      <RaidConfirmModal
        open={isRaidOpen}
        attackerName={attackerName ?? 'Unknown Raider'}
        attackerAttackRating={attackerAttackRating ?? 0}
        attackerGold={attackerGold ?? 0}
        defenderId={kingdomData.userId}
        defenderName={kingdomData.ownerName}
        defenderDefenseRating={kingdomData.defense_rating}
        defenderGold={kingdomData.gold}
        onClose={() => setIsRaidOpen(false)}
      />
    </>
  )
}
