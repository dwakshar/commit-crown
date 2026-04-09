'use client'

import { useEffect, useMemo, useState } from 'react'

import { formatDistanceToNowStrict } from 'date-fns'
import Link from 'next/link'

import { AchievementToast } from '@/src/components/ui/AchievementToast'
import { NotificationBell } from '@/src/components/ui/NotificationBell'
import { getBuildingMetadata, getBuildingName, getSyncCooldownRemaining } from '@/src/lib/kingdom'
import { hasStarterKingdomState } from '@/src/lib/onboarding'
import { useKingdomStore } from '@/src/store/kingdomStore'
import type { BuildingData } from '@/src/types/game'

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
  rate,
}: {
  icon: string
  label: string
  value: number
  rate: string
}) {
  return (
    <div className="flex min-w-[132px] items-center gap-3 border-l border-[var(--b0)] px-4 py-2 first:border-l-0">
      <span className="text-base text-[var(--ember-hi)]">{icon}</span>
      <div>
        <p className="font-[var(--font-head)] text-[1.65rem] leading-none text-[var(--silver-0)]">
          <CountUpValue value={value} />
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[var(--silver-3)]">{label}</p>
        <p className="mt-1 text-[11px] text-[#4fa267]">{rate}</p>
      </div>
    </div>
  )
}

function BuildingPips({ level }: { level: number }) {
  return (
    <div className="mt-2 flex gap-1.5">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`h-[3px] w-5 rounded-full ${
            index < level ? 'bg-[var(--ember)] shadow-[0_0_8px_rgba(200,88,26,0.45)]' : 'bg-[var(--steel-4)]'
          }`}
        />
      ))}
    </div>
  )
}

function getBuildingLore(building: BuildingData) {
  if (building.type === 'town_hall') {
    return 'The seat of dominion. All allegiances are sworn here, and all matters of the realm decided by iron will.'
  }

  if (building.isPlaceholder) {
    return building.placeholderLabel ?? 'This district still waits for more code before it can awaken.'
  }

  return getBuildingMetadata(building.type).effect
}

function getBuildingSubtitle(building: BuildingData) {
  if (building.type === 'town_hall') {
    return 'Seat of power'
  }

  if (building.type === 'wall') {
    return 'Defence +35'
  }

  if (building.type === 'iron_forge') {
    return 'Iron +5/hr'
  }

  return getBuildingMetadata(building.type).effect
}

function getPseudoUpgradeCost(building: BuildingData) {
  const base = 180 + building.level * 60

  return {
    stone: base,
    iron: Math.round(base * 0.42),
  }
}

export function HUD() {
  const kingdom = useKingdomStore((state) => state.kingdom)
  const selectedBuilding = useKingdomStore((state) => state.selectedBuilding)
  const selectBuilding = useKingdomStore((state) => state.selectBuilding)
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
  const structures = kingdom.buildings
  const activeBuilding = selectedBuilding ?? structures[0] ?? null
  const upgradeCost = activeBuilding ? getPseudoUpgradeCost(activeBuilding) : null

  const handleSync = async () => {
    clearSyncError()

    try {
      await syncKingdom()
    } catch {}
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col text-[var(--silver-1)]">
      <div className="pointer-events-auto border-b border-[var(--b1)] bg-[linear-gradient(180deg,rgba(3,4,6,0.98),rgba(8,11,16,0.94))]">
        <div className="flex h-[52px] items-center justify-between px-4 text-[11px] uppercase tracking-[0.28em] text-[var(--silver-3)]">
          <div className="flex items-center gap-2">
            <span className="realm-orb h-2.5 w-2.5 rounded-full" />
            <span className="realm-orb h-2.5 w-2.5 rounded-full opacity-70" />
            <span className="realm-orb h-2.5 w-2.5 rounded-full opacity-45" />
          </div>
          <div className="hidden items-center gap-12 md:flex">
            <Link href="/" className="transition hover:text-[var(--silver-0)]">Landing</Link>
            <span className="text-[var(--silver-0)]">Game HUD</span>
            <Link href="/marketplace" className="transition hover:text-[var(--silver-0)]">Marketplace</Link>
            <Link href="/leaderboard" className="transition hover:text-[var(--silver-0)]">Leaderboard</Link>
            <span className="transition hover:text-[var(--silver-0)]">Design Tokens</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="realm-orb h-2.5 w-2.5 rounded-full opacity-45" />
            <span className="realm-orb h-2.5 w-2.5 rounded-full opacity-70" />
            <span className="realm-orb h-2.5 w-2.5 rounded-full" />
          </div>
        </div>
      </div>

      <div className="pointer-events-auto border-b border-[var(--b1)] bg-[rgba(8,11,16,0.9)]">
        <div className="grid min-h-[64px] grid-cols-[minmax(260px,320px)_1fr_auto] items-stretch">
          <div className="flex items-center gap-4 border-r border-[var(--b0)] px-4 py-3">
            <div className="flex h-14 w-14 items-center justify-center border border-[var(--b1)] bg-[linear-gradient(180deg,var(--steel-3),var(--steel-2))] shadow-[inset_0_1px_0_rgba(176,196,214,0.1)]">
              <div className="h-6 w-6 rotate-45 border border-[var(--b2)] bg-[var(--steel-4)]" />
            </div>
            <div className="min-w-0">
              <p className="font-[var(--font-head)] text-[1.8rem] leading-none text-[var(--silver-0)]">{kingdom.name}</p>
              <p className="mt-1 text-[13px] italic text-[var(--silver-2)]">
                Realm of @{kingdom.ownerName.toLowerCase().replace(/\s+/g, '')} · {showStarterMessage ? 'Iron Age I' : 'Iron Age III'}
              </p>
            </div>
          </div>

          <div className="flex overflow-x-auto">
            <ResourceCard icon="🪨" label="Stone" value={kingdom.gold} rate="+12/hr" />
            <ResourceCard icon="🌾" label="Grain" value={kingdom.population} rate="+8/hr" />
            <ResourceCard icon="⚙" label="Iron" value={kingdom.attack_rating} rate="+5/hr" />
            <ResourceCard icon="⚡" label="Prestige" value={kingdom.prestige} rate="+250" />
          </div>

          <div className="flex items-center gap-2 px-4">
            <button className="pointer-events-auto flex h-11 w-11 items-center justify-center border border-[var(--b1)] bg-[rgba(12,16,24,0.86)] text-sm text-[var(--silver-1)]">🗺</button>
            <button className="pointer-events-auto flex h-11 w-11 items-center justify-center border border-[var(--b1)] bg-[rgba(12,16,24,0.86)] text-sm text-[var(--silver-1)]">📜</button>
            <NotificationBell userId={kingdom.userId} />
            <button className="pointer-events-auto flex h-11 w-11 items-center justify-center border border-[var(--b1)] bg-[rgba(12,16,24,0.86)] text-sm text-[var(--silver-1)]">⚙</button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none relative flex min-h-0 flex-1">
        <div className="pointer-events-auto absolute left-0 top-0 z-30 hidden h-full w-[58px] border-r border-[var(--b1)] bg-[rgba(4,6,10,0.84)] md:flex md:flex-col md:items-center md:gap-4 md:px-2 md:py-5">
          {[
            ['🏰', true],
            ['⚒', false],
            ['⚔', false],
            ['🤝', false],
            ['📜', false],
            ['🌍', false],
          ].map(([icon, active], railIndex) => (
            <div key={`${icon}-${railIndex}`} className="flex flex-col items-center">
              {railIndex === 2 || railIndex === 4 ? <div className="mb-3 h-px w-8 bg-[var(--b0)]" /> : null}
              <button
                type="button"
                className={`flex h-10 w-10 items-center justify-center border text-sm transition ${
                  active
                    ? 'border-[var(--ember)] bg-[rgba(44,21,13,0.75)] text-[var(--silver-0)]'
                    : 'border-[var(--b1)] bg-[rgba(12,16,24,0.86)] text-[var(--silver-2)] hover:text-[var(--silver-0)]'
                }`}
              >
                {icon}
              </button>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-6 left-[76px] z-30 hidden w-[136px] border border-[var(--b1)] bg-[rgba(5,8,14,0.88)] p-3 xl:block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">Realm</p>
          <div className="relative h-[84px] border border-[var(--b0)] bg-[linear-gradient(180deg,#0c1018,#06080e)]">
            <div className="absolute inset-x-1/2 top-0 h-full w-px -translate-x-1/2 bg-[var(--steel-4)]" />
            <div className="absolute inset-y-1/2 left-0 w-full h-px -translate-y-1/2 bg-[var(--steel-4)]" />
            <div className="absolute left-[44px] top-[18px] h-9 w-12 bg-[var(--steel-3)] opacity-80" />
            <div className="absolute left-[18px] top-[34px] h-5 w-6 bg-[var(--steel-2)]" />
            <div className="absolute right-[18px] top-[30px] h-5 w-6 bg-[var(--steel-2)]" />
            <div className="absolute bottom-[10px] left-[42px] h-4 w-12 bg-[var(--steel-2)]" />
            <div className="absolute left-1/2 top-[40px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--ember)] shadow-[0_0_10px_rgba(200,88,26,0.7)]" />
          </div>
        </div>

        <div className="pointer-events-none absolute right-0 top-0 z-30 hidden h-full w-[280px] border-l border-[var(--b1)] bg-[rgba(4,6,10,0.88)] xl:block">
          <div className="border-b border-[var(--b1)] px-5 py-6">
            <p className="font-[var(--font-head)] text-[2rem] leading-none text-[var(--silver-0)]">Structures</p>
            <p className="mt-2 text-[13px] italic text-[var(--silver-2)]">Select a building to inspect</p>
          </div>

          <div className="border-b border-[var(--b0)] px-5 py-6">
            <p className="font-[var(--font-head)] text-[1.9rem] leading-none text-[var(--silver-0)]">
              {activeBuilding ? getBuildingName(activeBuilding) : 'No Structure'}
            </p>
            <p className="mt-4 text-[15px] italic leading-8 text-[var(--silver-1)]">
              {activeBuilding ? `“${getBuildingLore(activeBuilding)}”` : 'Choose a structure to inspect it.'}
            </p>

            {activeBuilding ? (
              <>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[12px] uppercase tracking-[0.24em] text-[var(--silver-3)]">Level</span>
                    <span className="font-[var(--font-head)] text-[var(--silver-0)]">{activeBuilding.level} of V</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[12px] uppercase tracking-[0.24em] text-[var(--silver-3)]">Prestige Bonus</span>
                    <span className="font-[var(--font-head)] text-[var(--silver-0)]">+18% per commit</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[12px] uppercase tracking-[0.24em] text-[var(--silver-3)]">Upgrade Cost</span>
                    <span className="font-[var(--font-head)] text-[var(--silver-0)]">
                      {upgradeCost ? `${upgradeCost.stone} Stone · ${upgradeCost.iron} Iron` : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[12px] uppercase tracking-[0.24em] text-[var(--silver-3)]">Built</span>
                    <span className="font-[var(--font-head)] text-[var(--silver-0)]">Day 14 of your reign</span>
                  </div>
                </div>

                <button className="pointer-events-auto realm-button mt-8 w-full border border-[rgba(200,88,26,0.45)] bg-[rgba(44,21,13,0.78)] px-5 py-4 text-[var(--ember-hi)]">
                  ⚒ Upgrade to Level {Math.min(5, activeBuilding.level + 1)}
                </button>
              </>
            ) : null}
          </div>

          <div className="space-y-5 px-5 py-5">
            {structures.map((building) => (
              <button
                key={building.id}
                type="button"
                onClick={() => selectBuilding(building)}
                className={`pointer-events-auto flex w-full items-center gap-4 border px-4 py-4 text-left transition ${
                  activeBuilding?.id === building.id
                    ? 'border-[var(--ember)] bg-[rgba(44,21,13,0.52)]'
                    : 'border-[var(--b0)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--b2)]'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center border border-[var(--b1)] bg-[var(--steel-3)] text-base">
                  {building.type === 'town_hall' ? '🏛' : building.type === 'wall' ? '🏰' : building.type === 'iron_forge' ? '⚒' : '🔭'}
                </div>
                <div className="min-w-0">
                  <p className="font-[var(--font-head)] text-[1.45rem] leading-none text-[var(--silver-0)]">{getBuildingName(building)}</p>
                  <BuildingPips level={building.level} />
                  <p className="mt-2 text-[13px] italic text-[var(--silver-2)]">{getBuildingSubtitle(building)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 border-t border-[var(--b1)] bg-[rgba(4,6,10,0.9)] px-3 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-3">🏰 Build</button>
            <button className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-3">⚔ Raid</button>
            <button className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-3">🗺 Visit</button>
            <button className="pointer-events-auto realm-button realm-button-secondary min-w-[160px] px-4 py-3">🏆 Leaderboard</button>
            <button className="pointer-events-auto realm-button realm-button-secondary min-w-[170px] px-4 py-3 text-[var(--ember-hi)]">☠ Declare War</button>
            <div className="min-w-2 grow" />
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || cooldownRemaining > 0}
              className="pointer-events-auto realm-button min-w-[240px] border border-[rgba(79,162,103,0.35)] bg-[rgba(16,50,22,0.78)] px-5 py-3 text-[#7fdb91] disabled:opacity-55"
            >
              ● {isSyncing ? 'Syncing GitHub...' : `Sync GitHub · ${lastSyncedLabel}`}
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-[68px] left-[58px] right-[280px] top-0" />
      </div>

      {syncError ? (
        <div className="pointer-events-auto absolute bottom-[78px] left-[72px] z-40 rounded-[14px] border border-[#a84d4d] bg-[#2a1111]/95 px-4 py-3 text-sm text-[#ffc5c5]">
          {syncError}
        </div>
      ) : null}

      {showStarterMessage ? (
        <div className="pointer-events-auto absolute bottom-[78px] left-[72px] z-40 rounded-[14px] border border-[rgba(200,88,26,0.38)] bg-[rgba(44,21,13,0.95)] px-4 py-3 text-sm text-[#f3c3a5] xl:left-[214px]">
          Founding age active. Sync and keep coding to awaken the rest of the realm.
        </div>
      ) : null}

      <div className="pointer-events-auto absolute right-[294px] top-[126px] z-30 hidden lg:flex items-center gap-3">
        <button className="realm-button realm-button-secondary rounded-[14px] px-4 py-2">Realm</button>
        <button className="realm-button realm-button-secondary rounded-[14px] px-4 py-2">Chronicle</button>
      </div>

      <div className="pointer-events-auto absolute left-3 top-[126px] z-30 md:hidden">
        <button className="realm-button realm-button-secondary rounded-[14px] px-4 py-2">Menu</button>
      </div>

      <div className="pointer-events-none absolute inset-0 z-40">
        <AchievementToast />
      </div>
    </div>
  )
}
