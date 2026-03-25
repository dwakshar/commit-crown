import type { BuildingData, BuildingType } from '@/src/types/game'

export const SYNC_COOLDOWN_MINUTES = 30

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
}

export function getBuildingMetadata(type: BuildingType) {
  return BUILDING_METADATA[type]
}

export function getBuildingName(building: BuildingData): string {
  return building.name ?? getBuildingMetadata(building.type).label
}

export function getUpgradeCost(building: Pick<BuildingData, 'level' | 'type'>): number {
  void building.type
  return building.level * 500
}

export function getSyncCooldownRemaining(lastSyncedAt: string | null): number {
  if (!lastSyncedAt) {
    return 0
  }

  const elapsedMinutes = (Date.now() - new Date(lastSyncedAt).getTime()) / 60000
  return Math.max(0, Math.ceil(SYNC_COOLDOWN_MINUTES - elapsedMinutes))
}
