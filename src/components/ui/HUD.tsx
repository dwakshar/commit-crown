'use client'

import { useEffect, useMemo, useState } from 'react'

import { formatDistanceToNowStrict } from 'date-fns'
import Image from 'next/image'

import { getSyncCooldownRemaining } from '@/src/lib/kingdom'
import { useKingdomStore } from '@/src/store/kingdomStore'

function CountUpValue({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let frameId = 0
    const start = performance.now()
    const duration = 850

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1)
      setDisplayValue(Math.round(value * (1 - (1 - progress) ** 3)))

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameId)
  }, [value])

  return <span>{displayValue.toLocaleString()}</span>
}

function ResourceCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: number
}) {
  return (
    <div className="flex min-w-[84px] flex-col items-center rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-center md:min-w-[132px] md:flex-row md:justify-start md:gap-3 md:px-4">
      <span className="text-lg text-[#C9A84C]">{icon}</span>
      <div>
        <p className="hidden text-[11px] uppercase tracking-[0.24em] text-white/45 md:block">{label}</p>
        <p className="mt-1 text-sm font-semibold text-[#C9A84C] md:text-base">
          <CountUpValue value={value} />
        </p>
      </div>
    </div>
  )
}

export function HUD() {
  const { kingdom, isSyncing, syncKingdom } = useKingdomStore((state) => ({
    kingdom: state.kingdom,
    isSyncing: state.isSyncing,
    syncKingdom: state.syncKingdom,
  }))
  const [syncError, setSyncError] = useState<string | null>(null)
  const cooldownRemaining = useMemo(
    () => getSyncCooldownRemaining(kingdom?.last_synced_at ?? null),
    [kingdom?.last_synced_at],
  )

  if (!kingdom) {
    return null
  }

  const lastSyncedLabel = kingdom.last_synced_at
    ? formatDistanceToNowStrict(new Date(kingdom.last_synced_at), { addSuffix: true })
    : 'Never synced'

  const handleSync = async () => {
    setSyncError(null)

    try {
      await syncKingdom()
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Unable to sync')
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 text-[#f7f1e4] md:p-6">
      <div className="pointer-events-auto rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(9,7,16,0.92),rgba(26,18,35,0.88))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {kingdom.ownerAvatarUrl ? (
              <Image
                src={kingdom.ownerAvatarUrl}
                alt={kingdom.ownerName}
                className="h-14 w-14 rounded-2xl border border-[#C9A84C]/50 object-cover shadow-[0_0_0_4px_rgba(201,168,76,0.14)]"
                width={56}
                height={56}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9A84C]/50 bg-[#241d11] text-lg font-semibold text-[#C9A84C]">
                {kingdom.ownerName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">CodeKingdom</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{kingdom.name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 md:flex md:flex-wrap md:justify-end">
            <ResourceCard icon="◉" label="Gold" value={kingdom.gold} />
            <ResourceCard icon="✦" label="Prestige" value={kingdom.prestige} />
            <ResourceCard icon="◌" label="Population" value={kingdom.population} />
            <ResourceCard icon="⛨" label="Defense" value={kingdom.defense_rating} />
          </div>
        </div>
      </div>

      <div className="pointer-events-none flex items-end justify-between gap-4">
        <div className="pointer-events-auto max-w-sm">
          {syncError ? (
            <div className="rounded-2xl border border-[#a84d4d] bg-[#2a1111]/90 px-4 py-3 text-sm text-[#ffc5c5] backdrop-blur-md">
              {syncError}
            </div>
          ) : null}
        </div>

        <div className="pointer-events-auto rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(9,7,16,0.92),rgba(26,18,35,0.88))] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || cooldownRemaining > 0}
              className="flex min-w-[220px] items-center justify-center gap-3 rounded-2xl bg-[#C9A84C] px-4 py-3 text-sm font-semibold text-[#22190b] transition hover:bg-[#d7b864] disabled:cursor-not-allowed disabled:bg-[#6e5b25] disabled:text-[#d2c7a3]"
            >
              <span
                className={`inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent ${
                  isSyncing ? 'animate-spin' : 'hidden'
                }`}
              />
              <span>{isSyncing ? 'Syncing Kingdom...' : 'Sync With GitHub'}</span>
            </button>

            <div className="hidden text-right text-xs text-white/60 md:block">
              <p>Last synced {lastSyncedLabel}</p>
              <p>{cooldownRemaining > 0 ? `Ready in ${cooldownRemaining}m` : 'Sync available now'}</p>
            </div>

            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
              aria-label="Kingdom settings"
            >
              ⚙
            </button>
          </div>

          <div className="mt-2 text-center text-xs text-white/60 md:hidden">
            <p>Last synced {lastSyncedLabel}</p>
            <p>{cooldownRemaining > 0 ? `Ready in ${cooldownRemaining}m` : 'Sync available now'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
