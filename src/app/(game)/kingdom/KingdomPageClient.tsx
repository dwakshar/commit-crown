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

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#0b0912]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_40%),linear-gradient(180deg,#120f1d_0%,#09070e_100%)]" />
      <div className="absolute inset-0">
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
