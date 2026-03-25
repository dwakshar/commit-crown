'use client'

import { create } from 'zustand'

import type { BuildingData, KingdomData } from '@/src/types/game'

type SyncResponse = {
  success: boolean
  stats: Partial<KingdomData>
}

interface KingdomStore {
  kingdom: KingdomData | null
  buildings: BuildingData[]
  selectedBuilding: BuildingData | null
  isSyncing: boolean
  setKingdom: (kingdom: KingdomData) => void
  setBuildings: (buildings: BuildingData[]) => void
  selectBuilding: (building: BuildingData | null) => void
  updateGold: (gold: number) => void
  syncKingdom: () => Promise<void>
}

export const useKingdomStore = create<KingdomStore>((set, get) => ({
  kingdom: null,
  buildings: [],
  selectedBuilding: null,
  isSyncing: false,
  setKingdom: (kingdom) =>
    set({
      kingdom,
      buildings: kingdom.buildings,
    }),
  setBuildings: (buildings) =>
    set((state) => ({
      buildings,
      kingdom: state.kingdom ? { ...state.kingdom, buildings } : null,
    })),
  selectBuilding: (selectedBuilding) => set({ selectedBuilding }),
  updateGold: (gold) =>
    set((state) => ({
      kingdom: state.kingdom ? { ...state.kingdom, gold } : null,
    })),
  syncKingdom: async () => {
    if (get().isSyncing) {
      return
    }

    set({ isSyncing: true })

    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
      })

      const payload = (await response.json()) as SyncResponse & { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to sync kingdom')
      }

      set((state) => ({
        kingdom: state.kingdom
          ? {
              ...state.kingdom,
              ...payload.stats,
              last_synced_at: new Date().toISOString(),
            }
          : state.kingdom,
      }))
    } finally {
      set({ isSyncing: false })
    }
  },
}))
