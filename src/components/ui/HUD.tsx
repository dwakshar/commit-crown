'use client'

import { useEffect, useMemo, useState } from 'react'

import { formatDistanceToNowStrict } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

import { AchievementToast } from '@/src/components/ui/AchievementToast'
import { NotificationBell } from '@/src/components/ui/NotificationBell'
import { getSyncCooldownRemaining } from '@/src/lib/kingdom'
import { hasStarterKingdomState } from '@/src/lib/onboarding'
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
    <div className="realm-panel flex min-w-[108px] flex-col items-center rounded-[20px] px-3 py-3 text-center md:min-w-[148px] md:flex-row md:justify-start md:gap-3 md:px-4">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ember-hi)]">{icon}</span>
      <div>
        <p className="hidden text-[11px] uppercase tracking-[0.24em] text-[var(--silver-3)] md:block">{label}</p>
        <p className="mt-1 text-sm font-semibold text-[var(--silver-0)] md:text-base">
          <CountUpValue value={value} />
        </p>
      </div>
    </div>
  )
}

export function HUD() {
  const kingdom = useKingdomStore((state) => state.kingdom)
  const isSyncing = useKingdomStore((state) => state.isSyncing)
  const syncError = useKingdomStore((state) => state.syncError)
  const clearSyncError = useKingdomStore((state) => state.clearSyncError)
  const syncKingdom = useKingdomStore((state) => state.syncKingdom)
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
  const showStarterMessage = hasStarterKingdomState(kingdom)
  const totalStructures = kingdom.buildings.length
  const developedStructures = kingdom.buildings.filter((building) => !building.isPlaceholder).length

  const handleSync = async () => {
    clearSyncError()

    try {
      await syncKingdom()
    } catch {}
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 text-[var(--silver-1)] md:p-5">
      <div className="pointer-events-auto realm-panel rounded-[30px] p-4 md:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            {kingdom.ownerAvatarUrl ? (
              <Image
                src={kingdom.ownerAvatarUrl}
                alt={kingdom.ownerName}
                className="h-16 w-16 rounded-[20px] border border-[var(--b2)] object-cover shadow-[0_0_0_4px_rgba(143,164,184,0.08)]"
                width={56}
                height={56}
              />
            ) : (
              <div className="realm-panel flex h-16 w-16 items-center justify-center rounded-[20px] text-lg font-semibold text-[var(--silver-0)]">
                {kingdom.ownerName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="realm-label">The Iron Dominion</p>
              <h1 className="realm-page-title mt-1 text-[clamp(1.7rem,3vw,2.9rem)]">{kingdom.name}</h1>
              <p className="realm-lore mt-1 text-sm md:text-base">
                {showStarterMessage
                  ? 'The first keep stands. Ship code to awaken the rest of the realm.'
                  : 'Your realm now breathes with forged structures, prestige, and momentum.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:flex xl:flex-wrap xl:justify-end">
            <ResourceCard icon="Gold" label="Gold" value={kingdom.gold} />
            <ResourceCard icon="Star" label="Prestige" value={kingdom.prestige} />
            <ResourceCard icon="Pop" label="Population" value={kingdom.population} />
            <ResourceCard icon="Def" label="Defense" value={kingdom.defense_rating} />
          </div>
        </div>

        <div className="realm-divider my-4" />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link href="/leaderboard" className="realm-button realm-button-secondary rounded-[16px] px-4 py-3">
              Hall of Legend
            </Link>
            <Link href="/marketplace" className="realm-button realm-button-secondary rounded-[16px] px-4 py-3">
              Royal Market
            </Link>
            <Link href={`/visit/${kingdom.ownerName.toLowerCase().replace(/\s+/g, '-')}`} className="realm-button realm-button-secondary rounded-[16px] px-4 py-3 opacity-60 pointer-events-none">
              Realm Banner
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm md:flex md:flex-wrap">
            <div className="realm-panel rounded-[18px] px-4 py-3">
              <p className="realm-label">Structures</p>
              <p className="mt-1 font-semibold text-[var(--silver-0)]">{developedStructures}/{Math.max(totalStructures, kingdom.building_slots)}</p>
            </div>
            <div className="realm-panel rounded-[18px] px-4 py-3">
              <p className="realm-label">Last Sync</p>
              <p className="mt-1 font-semibold text-[var(--silver-0)]">{lastSyncedLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none grid gap-4 xl:grid-cols-[320px,1fr,420px] xl:items-end">
        <div className="pointer-events-auto hidden xl:block">
          <div className="realm-panel rounded-[28px] p-5">
            <p className="realm-label">Realm Objectives</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--silver-0)]">Forge the capital</h2>
            <p className="realm-lore mt-2 text-sm">
              Every commit raises your standing. Sync often, unlock stronger structures, and push the frontier beyond the first wall.
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-[18px] border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                <p className="realm-label">Primary Quest</p>
                <p className="mt-1 text-sm text-[var(--silver-1)]">Reach your next sync and expand the keep with fresh GitHub activity.</p>
              </div>
              <div className="rounded-[18px] border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                <p className="realm-label">Current Mood</p>
                <p className="mt-1 text-sm text-[var(--silver-1)]">{showStarterMessage ? 'Founding age' : 'Expansion age'}</p>
              </div>
            </div>
          </div>
        </div>

        <div />

        <div className="pointer-events-auto">
          {showStarterMessage ? (
            <div className="mb-3 rounded-[22px] border border-[rgba(200,88,26,0.35)] bg-[rgba(44,21,13,0.9)] px-4 py-3 text-sm text-[#f3c3a5]">
              The realm is in its founding age. Your first commit surge will awaken new districts.
            </div>
          ) : null}
          {syncError ? (
            <div className="rounded-[22px] border border-[#a84d4d] bg-[#2a1111]/90 px-4 py-3 text-sm text-[#ffc5c5]">
              {syncError}
            </div>
          ) : null}

          <div className="realm-panel rounded-[28px] p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing || cooldownRemaining > 0}
                className="realm-button realm-button-primary flex min-w-[220px] items-center justify-center gap-3 rounded-[18px] px-5 py-4 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent ${
                    isSyncing ? 'animate-spin' : 'hidden'
                  }`}
                />
                <span>{isSyncing ? 'Forging Sync...' : 'Sync With GitHub'}</span>
              </button>

              <div className="grow text-xs text-[var(--silver-2)]">
                <p>Last synced {lastSyncedLabel}</p>
                <p>{cooldownRemaining > 0 ? `Ready again in ${cooldownRemaining} minutes` : 'Forge pulse available now'}</p>
              </div>

              <div className="flex items-center gap-3">
                <NotificationBell userId={kingdom.userId} />

                <button
                  type="button"
                  className="realm-button realm-button-secondary flex h-12 items-center justify-center rounded-[16px] px-4"
                  aria-label="Kingdom settings"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AchievementToast />
    </div>
  )
}
