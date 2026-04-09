'use client'

import { useEffect } from 'react'

import dynamic from 'next/dynamic'

import { BuildingInfoPanel } from '@/src/components/ui/BuildingInfoPanel'
import { HUD } from '@/src/components/ui/HUD'
import { useKingdomStore } from '@/src/store/kingdomStore'
import type { BuildingData, KingdomData } from '@/src/types/game'

const PhaserGame = dynamic(
  () => import('@/src/components/game/PhaserGame').then((module) => module.PhaserGame),
  {
    ssr: false,
  },
)

export function KingdomPageClient({
  kingdomData,
}: {
  kingdomData: KingdomData
}) {
  const setKingdom = useKingdomStore((state) => state.setKingdom)
  const selectBuilding = useKingdomStore((state) => state.selectBuilding)
  const kingdom = useKingdomStore((state) => state.kingdom)

  useEffect(() => {
    setKingdom(kingdomData)
  }, [kingdomData, setKingdom])

  useEffect(() => {
    const handleBuildingSelected = (event: Event) => {
      const customEvent = event as CustomEvent<BuildingData>
      selectBuilding(customEvent.detail)
    }

    window.addEventListener('codekingdom:building-selected', handleBuildingSelected as EventListener)

    return () => {
      window.removeEventListener(
        'codekingdom:building-selected',
        handleBuildingSelected as EventListener,
      )
    }
  }, [selectBuilding])

  useEffect(() => {
    const handleKingdomUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<KingdomData>
      setKingdom(customEvent.detail)
    }

    window.addEventListener('codekingdom:kingdom-updated', handleKingdomUpdated as EventListener)

    return () => {
      window.removeEventListener('codekingdom:kingdom-updated', handleKingdomUpdated as EventListener)
    }
  }, [setKingdom])

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[var(--steel-0)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,0.16),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(200,88,26,0.08),transparent_30%),linear-gradient(180deg,#06080d_0%,#0a0f18_42%,#07090f_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-x-[8%] top-[12%] h-56 rounded-full bg-[radial-gradient(circle,rgba(200,88,26,0.08),transparent_68%)] blur-3xl" />
        <div className="absolute left-[10%] top-[18%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(120,150,180,0.09),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_bottom,rgba(11,16,24,0.78),transparent_70%)]" />
      </div>
      <div className="absolute inset-x-0 top-0 z-10 h-28 bg-[linear-gradient(180deg,rgba(3,4,6,0.9),rgba(3,4,6,0))]" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-[linear-gradient(0deg,rgba(3,4,6,0.94),rgba(3,4,6,0))]" />
      <div className="absolute inset-x-4 top-[112px] z-10 hidden xl:flex justify-between">
        <div className="realm-panel w-[220px] rounded-[24px] p-4 text-[var(--silver-1)]">
          <p className="realm-label">Realm Status</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--silver-0)]">Campaign Active</h2>
          <p className="realm-lore mt-2 text-sm">
            Build, sync, and conquer. Your world now sits inside a living command board.
          </p>
        </div>
        <div className="realm-panel w-[220px] rounded-[24px] p-4 text-right text-[var(--silver-1)]">
          <p className="realm-label">Capital Theme</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--silver-0)]">
            {kingdomData.themeId ? 'Equipped Realm' : 'Founding Steel'}
          </h2>
          <p className="realm-lore mt-2 text-sm">
            The battlefield now carries the steel-and-ember visual direction from the final concept.
          </p>
        </div>
      </div>
      <div className="absolute inset-0 pt-[116px] pb-[132px]">
        <PhaserGame
          kingdomData={kingdom ?? kingdomData}
          userId={kingdomData.userId}
          isOwner
        />
      </div>
      <HUD />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-end p-3 md:p-6">
        <BuildingInfoPanel />
      </div>
    </main>
  )
}
