import type { BuildingData, BuildingType } from '@/src/types/game'

export const SYNC_COOLDOWN_MINUTES = 30
export const WATER_SLOT_BASE = 100
export const WATER_SLOT_COUNT = 12
export const WATER_BUILDING_TYPES = [
  'royal_flagship',
  'sentinel_skiff',
  'bulwark_barge',
  'supply_tender',
] as const satisfies readonly BuildingType[]

export function isWaterBuildingType(type: BuildingType): boolean {
  return (WATER_BUILDING_TYPES as readonly string[]).includes(type)
}

export function getPlacementZoneForBuilding(type: BuildingType): 'board' | 'water' {
  return isWaterBuildingType(type) ? 'water' : 'board'
}

export function encodeWaterSlotPosition(slotIndex: number) {
  return {
    x: WATER_SLOT_BASE + slotIndex,
    y: 0,
  }
}

export function decodeWaterSlotPosition(x: number, y: number): number | null {
  if (y !== 0) return null
  const slotIndex = x - WATER_SLOT_BASE
  return slotIndex >= 0 && slotIndex < WATER_SLOT_COUNT ? slotIndex : null
}

export function isValidPlacementCoordinate(
  type: BuildingType,
  x: number,
  y: number
): boolean {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return false
  }

  if (isWaterBuildingType(type)) {
    return decodeWaterSlotPosition(x, y) !== null
  }

  return x >= 0 && x <= 19 && y >= 0 && y <= 19
}

// Build duration in seconds per building type (CoC-style construction time).
export const BUILD_TIMES: Record<BuildingType, number> = {
  town_hall:    300,  // 5 min
  wall:         120,  // 2 min
  market:       180,  // 3 min
  library:      240,  // 4 min
  barracks:     300,  // 5 min
  iron_forge:   360,  // 6 min
  observatory:  420,  // 7 min
  arcane_tower: 480,  // 8 min
  monument:     600,  // 10 min
  royal_flagship: 540,
  sentinel_skiff: 210,
  bulwark_barge: 330,
  supply_tender: 240,
}

export const BUILDING_METADATA: Record<
  BuildingType,
  {
    label: string
    icon: string
    effect: string
    baseCost: number
  }
> = {
  town_hall: {
    label: 'Town Hall',
    icon: 'Crown',
    effect: 'Boosts tax collection and expands your administrative reach.',
    baseCost: 120,
  },
  arcane_tower: {
    label: 'Arcane Tower',
    icon: 'Spark',
    effect: 'Channels magical research into prestige and strategic insight.',
    baseCost: 150,
  },
  library: {
    label: 'Library',
    icon: 'Book',
    effect: 'Archives guild knowledge to improve growth and planning.',
    baseCost: 110,
  },
  iron_forge: {
    label: 'Iron Forge',
    icon: 'Hammer',
    effect: 'Hardens weapons and armor, increasing military readiness.',
    baseCost: 140,
  },
  barracks: {
    label: 'Barracks',
    icon: 'Banner',
    effect: 'Trains fresh units and lifts defense across the realm.',
    baseCost: 130,
  },
  observatory: {
    label: 'Observatory',
    icon: 'Eye',
    effect: 'Scans the horizon for opportunities, increasing strategic awareness.',
    baseCost: 160,
  },
  market: {
    label: 'Market',
    icon: 'Coin',
    effect: 'Turns activity into gold with stronger trade routes and merchants.',
    baseCost: 125,
  },
  wall: {
    label: 'Wall',
    icon: 'Shield',
    effect: 'Strengthens the kingdom perimeter and reduces incoming pressure.',
    baseCost: 100,
  },
  monument: {
    label: 'Monument',
    icon: 'Star',
    effect: 'Immortalizes your achievements and raises prestige over time.',
    baseCost: 175,
  },
  royal_flagship: {
    label: 'Royal Flagship',
    icon: 'Crown',
    effect: 'Anchors naval command with a regal warship built for the kingdom banner.',
    baseCost: 240,
  },
  sentinel_skiff: {
    label: 'Sentinel Skiff',
    icon: 'Eye',
    effect: 'Keeps fast watch over the coast with a light scout hull for rapid response.',
    baseCost: 135,
  },
  bulwark_barge: {
    label: 'Bulwark Barge',
    icon: 'Shield',
    effect: 'Patrols the waterline with a broad armored deck focused on defense.',
    baseCost: 165,
  },
  supply_tender: {
    label: 'Supply Tender',
    icon: 'Coin',
    effect: 'Supports nearby districts with a compact logistics craft and floating stores.',
    baseCost: 145,
  },
}

export function getBuildingMetadata(type: BuildingType) {
  return BUILDING_METADATA[type]
}

export function getBuildingName(building: BuildingData): string {
  return building.name ?? getBuildingMetadata(building.type).label
}

/**
 * Exponential upgrade cost so early levels are affordable for new developers
 * but reaching max level (5) is a significant investment.
 *
 * Level 1 → 2:  300 gold
 * Level 2 → 3:  900 gold
 * Level 3 → 4: 1 800 gold
 * Level 4 → 5: 3 000 gold
 * Total to max: 6 000 gold
 *
 * Formula: level * (level + 1) * 150
 * Must stay in sync with upgrade_building_transaction SQL function.
 */
export function getUpgradeCost(building: Pick<BuildingData, 'level' | 'type'>): number {
  void building.type
  return building.level * (building.level + 1) * 150
}

export function getSyncCooldownRemaining(lastSyncedAt: string | null): number {
  if (!lastSyncedAt) {
    return 0
  }

  const elapsedMinutes = (Date.now() - new Date(lastSyncedAt).getTime()) / 60000
  return Math.max(0, Math.ceil(SYNC_COOLDOWN_MINUTES - elapsedMinutes))
}
