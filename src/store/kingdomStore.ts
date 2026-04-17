"use client";

import { create } from "zustand";

import { isValidPlacementCoordinate } from "@/src/lib/kingdom";
import type {
  BuildingData,
  BuildingType,
  GitHubStatsData,
  KingdomData,
} from "@/src/types/game";

type SyncResponse = {
  success: boolean;
  stats: Partial<KingdomData>;
  githubStats?: GitHubStatsData;
};

async function parseJsonResponse<T extends { error?: string }>(
  response: Response
): Promise<T> {
  const raw = await response.text();

  if (!raw.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return {
      error: raw,
    } as T;
  }
}

interface KingdomStore {
  kingdom: KingdomData | null;
  buildings: BuildingData[];
  selectedBuilding: BuildingData | null;
  buildModeType: BuildingType | null;
  isPlacingBuilding: boolean;
  placementError: string | null;
  isSyncing: boolean;
  syncError: string | null;
  setKingdom: (kingdom: KingdomData) => void;
  setBuildings: (buildings: BuildingData[]) => void;
  selectBuilding: (building: BuildingData | null) => void;
  setBuildModeType: (buildingType: BuildingType | null) => void;
  updateGold: (gold: number) => void;
  clearSyncError: () => void;
  clearPlacementError: () => void;
  refreshKingdom: () => Promise<KingdomData | null>;
  placeBuilding: (
    buildingType: BuildingType,
    x: number,
    y: number
  ) => Promise<KingdomData | null>;
  syncKingdom: () => Promise<void>;
}

export const useKingdomStore = create<KingdomStore>((set, get) => ({
  kingdom: null,
  buildings: [],
  selectedBuilding: null,
  buildModeType: null,
  isPlacingBuilding: false,
  placementError: null,
  isSyncing: false,
  syncError: null,
  setKingdom: (kingdom) =>
    set({
      kingdom,
      buildings: kingdom.buildings,
      selectedBuilding:
        kingdom.buildings.find(
          (building) => building.id === get().selectedBuilding?.id
        ) ??
        kingdom.buildings.find((building) => !building.isPlaceholder) ??
        kingdom.buildings[0] ??
        null,
    }),
  setBuildings: (buildings) =>
    set((state) => ({
      buildings,
      kingdom: state.kingdom ? { ...state.kingdom, buildings } : null,
      selectedBuilding:
        buildings.find(
          (building) => building.id === state.selectedBuilding?.id
        ) ??
        buildings.find((building) => !building.isPlaceholder) ??
        buildings[0] ??
        null,
    })),
  selectBuilding: (selectedBuilding) => set({ selectedBuilding }),
  setBuildModeType: (buildModeType) =>
    set({ buildModeType, placementError: null }),
  updateGold: (gold) =>
    set((state) => ({
      kingdom: state.kingdom ? { ...state.kingdom, gold } : null,
    })),
  clearSyncError: () => set({ syncError: null }),
  clearPlacementError: () => set({ placementError: null }),
  refreshKingdom: async () => {
    const response = await fetch("/api/kingdom", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await parseJsonResponse<{
      error?: string;
      kingdom?: KingdomData;
    }>(response);

    if (!response.ok || !payload.kingdom) {
      throw new Error(payload.error ?? "Unable to refresh kingdom");
    }

    set((state) => ({
      kingdom: payload.kingdom ?? state.kingdom,
      buildings: payload.kingdom?.buildings ?? state.buildings,
      selectedBuilding:
        payload.kingdom?.buildings.find(
          (building) => building.id === state.selectedBuilding?.id
        ) ??
        payload.kingdom?.buildings.find(
          (building) => !building.isPlaceholder
        ) ??
        payload.kingdom?.buildings[0] ??
        null,
    }));

    return payload.kingdom;
  },
  placeBuilding: async (buildingType, x, y) => {
    if (!buildingType) {
      const message = "Choose a structure before placing it";
      set({ placementError: message });
      return null;
    }

    if (!isValidPlacementCoordinate(buildingType, x, y)) {
      const message = "Invalid build tile selected";
      set({ placementError: message });
      return null;
    }

    set({ isPlacingBuilding: true, placementError: null });

    try {
      const response = await fetch("/api/kingdom/place-building", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: buildingType,
          position_x: x,
          position_y: y,
        }),
      });

      const payload = await parseJsonResponse<{
        error?: string;
      }>(response);

      if (!response.ok) {
        set({ placementError: payload.error ?? "Unable to place building" });
        return null;
      }

      const kingdom = await get().refreshKingdom();
      set({
        buildModeType: null,
      });
      return kingdom;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to place building";
      set({ placementError: message });
      return null;
    } finally {
      set({ isPlacingBuilding: false });
    }
  },
  syncKingdom: async () => {
    if (get().isSyncing) {
      return;
    }

    set({ isSyncing: true, syncError: null });

    try {
      const response = await fetch("/api/github/sync", {
        method: "POST",
      });

      const payload = await parseJsonResponse<
        SyncResponse & {
          error?: string;
        }
      >(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to sync kingdom");
      }

      set((state) => ({
        kingdom: state.kingdom
          ? {
              ...state.kingdom,
              ...payload.stats,
              githubStats: payload.githubStats ?? state.kingdom.githubStats,
              last_synced_at:
                typeof payload.stats.last_synced_at === "string"
                  ? payload.stats.last_synced_at
                  : new Date().toISOString(),
            }
          : state.kingdom,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sync kingdom";
      set({ syncError: message });
      throw error;
    } finally {
      set({ isSyncing: false });
    }
  },
}));
