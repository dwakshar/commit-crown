'use client'

import { useState } from 'react'

import { getBuildingMetadata, getBuildingName, getUpgradeCost } from '@/src/lib/kingdom'
import { useKingdomStore } from '@/src/store/kingdomStore'

function LevelPips({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 rounded-full border ${
            index < level
              ? 'border-[#C9A84C] bg-[#C9A84C]'
              : 'border-white/20 bg-transparent'
          }`}
        />
      ))}
    </div>
  )
}

export function BuildingInfoPanel() {
  const kingdom = useKingdomStore((state) => state.kingdom)
  const selectedBuilding = useKingdomStore((state) => state.selectedBuilding)
  const selectBuilding = useKingdomStore((state) => state.selectBuilding)
  const setBuildings = useKingdomStore((state) => state.setBuildings)
  const updateGold = useKingdomStore((state) => state.updateGold)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!selectedBuilding || !kingdom) {
    return null
  }

  const metadata = getBuildingMetadata(selectedBuilding.type)
  const upgradeCost = getUpgradeCost(selectedBuilding)
  const canUpgrade = kingdom.gold >= upgradeCost && selectedBuilding.level < 5 && !isUpgrading

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/kingdom/upgrade-building', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buildingId: selectedBuilding.id }),
      })

      const payload = (await response.json()) as {
        error?: string
        building?: { id: string; level: number }
        gold?: number
      }

      if (!response.ok || !payload.building || typeof payload.gold !== 'number') {
        throw new Error(payload.error ?? 'Upgrade failed')
      }

      setBuildings(
        kingdom.buildings.map((building) =>
          building.id === payload.building?.id
            ? { ...building, level: payload.building.level as 1 | 2 | 3 | 4 | 5 }
            : building,
        ),
      )
      updateGold(payload.gold)
      selectBuilding({
        ...selectedBuilding,
        level: payload.building.level as 1 | 2 | 3 | 4 | 5,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upgrade failed')
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <aside className="pointer-events-auto w-full max-w-sm rounded-3xl border border-[#C9A84C]/30 bg-[#120f1d]/95 p-5 text-[#f5efe2] shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/80">Selected Building</p>
          <h2 className="mt-2 text-2xl font-semibold">{getBuildingName(selectedBuilding)}</h2>
          <div className="mt-2 flex items-center gap-3 text-sm text-white/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {metadata.icon}
            </span>
            <span>{selectedBuilding.type.replaceAll('_', ' ')}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => selectBuilding(null)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 transition hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Current Level</span>
          <LevelPips level={selectedBuilding.level} />
        </div>
        <p className="mt-4 text-sm leading-6 text-white/80">{metadata.effect}</p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 rounded-2xl border border-[#C9A84C]/20 bg-[#1b1728] p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/50">Upgrade Cost</p>
          <p className="mt-2 text-2xl font-semibold text-[#C9A84C]">{upgradeCost} Gold</p>
        </div>
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={!canUpgrade}
          className="rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#22190b] transition hover:bg-[#d7b864] disabled:cursor-not-allowed disabled:bg-[#6e5b25] disabled:text-[#d2c7a3]"
        >
          {isUpgrading ? 'Upgrading...' : selectedBuilding.level >= 5 ? 'Max Level' : 'Upgrade'}
        </button>
      </div>

      {errorMessage ? <p className="mt-3 text-sm text-[#ff8e8e]">{errorMessage}</p> : null}
    </aside>
  )
}
