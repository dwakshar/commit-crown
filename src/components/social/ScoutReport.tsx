'use client'

import { useMemo, useState } from 'react'

import Image from 'next/image'
import { formatDistanceToNowStrict } from 'date-fns'

import { RaidConfirmModal } from '@/src/components/ui/RaidConfirmModal'
import type { KingdomData } from '@/src/types/game'

type ScoutReportProps = {
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
}

export function ScoutReport({
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
}: ScoutReportProps) {
  const [isFlagging, setIsFlagging] = useState(false)
  const [hasFlagged, setHasFlagged] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRaidOpen, setIsRaidOpen] = useState(false)

  const accountAge = useMemo(() => {
    if (!kingdomData.ownerCreatedAt) {
      return 'Unknown age'
    }

    return formatDistanceToNowStrict(new Date(kingdomData.ownerCreatedAt), { addSuffix: true })
  }, [kingdomData.ownerCreatedAt])

  const handleLeaveFlag = async () => {
    setIsFlagging(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/visit/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ defenderId: kingdomData.userId }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to leave a flag')
      }

      setHasFlagged(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to leave a flag')
    } finally {
      setIsFlagging(false)
    }
  }

  return (
    <>
      <aside className="pointer-events-auto w-full max-w-md rounded-[32px] border border-[#C9A84C]/25 bg-[linear-gradient(180deg,rgba(20,15,30,0.96),rgba(10,7,16,0.95))] p-5 text-[#f7f1e4] shadow-[0_24px_90px_rgba(0,0,0,0.5)] backdrop-blur-md md:p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/75">Scout Report</p>

        <div className="mt-4 flex items-center gap-4">
          {kingdomData.ownerAvatarUrl ? (
            <Image
              src={kingdomData.ownerAvatarUrl}
              alt={kingdomData.ownerName}
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-3xl border border-[#C9A84C]/40 object-cover shadow-[0_0_0_4px_rgba(201,168,76,0.12)]"
            />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl border border-[#C9A84C]/40 bg-[#241d11] text-2xl font-semibold text-[#C9A84C]">
              {kingdomData.ownerName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold">{kingdomData.ownerName}</h1>
            <p className="mt-1 text-sm text-white/65">@{kingdomData.ownerGithubUsername ?? kingdomData.ownerName}</p>
            <p className="mt-2 text-lg text-[#C9A84C]">{kingdomData.name}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Prestige Rank</p>
            <p className="mt-2 text-2xl font-semibold text-[#C9A84C]">#{prestigeRank}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Buildings</p>
            <p className="mt-2 text-2xl font-semibold text-[#C9A84C]">{totalBuildings}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Top Language</p>
            <p className="mt-2 text-lg font-semibold text-[#C9A84C]">{topLanguage}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Account Age</p>
            <p className="mt-2 text-sm font-semibold text-[#C9A84C]">{accountAge}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {canLeaveFlag ? (
            <button
              type="button"
              onClick={handleLeaveFlag}
              disabled={isFlagging || hasFlagged}
              className="rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#22190b] transition hover:bg-[#d7b864] disabled:cursor-not-allowed disabled:bg-[#6e5b25] disabled:text-[#d2c7a3]"
            >
              {isFlagging ? 'Leaving Flag...' : hasFlagged ? 'Flag Planted' : 'Leave a Flag'}
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
              Sign in with a different account to leave a flag on this kingdom.
            </div>
          )}

          {canRaid ? (
            <button
              type="button"
              onClick={() => setIsRaidOpen(true)}
              className="rounded-2xl border border-[#C9A84C]/35 bg-[#1a1524] px-5 py-3 text-sm font-semibold text-[#f3dc9b] transition hover:bg-[#231a31]"
            >
              Raid this Kingdom
            </button>
          ) : null}
        </div>

        {errorMessage ? <p className="mt-3 text-sm text-[#ff9696]">{errorMessage}</p> : null}

        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Recent Flags</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentVisitors.length > 0 ? (
              recentVisitors.map((visitor) => (
                <span
                  key={visitor}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/75"
                >
                  @{visitor}
                </span>
              ))
            ) : (
              <span className="text-sm text-white/55">No scouts have left a flag yet.</span>
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
