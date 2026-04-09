import { BUILDING_UNLOCK_REQUIREMENTS } from '@/src/lib/gameEngine'
import { getBuildingMetadata } from '@/src/lib/kingdom'

import type { BuildingData, BuildingType, GitHubStatsData, KingdomData } from '@/src/types/game'

const STARTER_BUILDINGS: BuildingData[] = [
  {
    id: 'starter-town-hall',
    type: 'town_hall',
    x: 10,
    y: 6,
    level: 1,
    name: 'Town Hall',
  },
  {
    id: 'starter-ruins-west',
    type: 'wall',
    x: 8,
    y: 7,
    level: 1,
    name: 'Ruins',
    isPlaceholder: true,
    placeholderLabel: 'Code more to unlock',
  },
  {
    id: 'starter-ruins-east',
    type: 'wall',
    x: 12,
    y: 7,
    level: 1,
    name: 'Ruins',
    isPlaceholder: true,
    placeholderLabel: 'Code more to unlock',
  },
]

export function withStarterKingdomState(kingdom: KingdomData): KingdomData {
  if (kingdom.buildings.length > 0) {
    return kingdom
  }

  return {
    ...kingdom,
    buildings: STARTER_BUILDINGS,
  }
}

export function countGeneratedBuildings(buildings: BuildingData[]): number {
  return buildings.filter((building) => !building.isPlaceholder).length
}

export function hasStarterKingdomState(kingdom: KingdomData): boolean {
  return (kingdom.githubStats?.total_commits ?? 0) === 0 && kingdom.buildings.some((building) => building.isPlaceholder)
}

function getTopLanguage(stats: GitHubStatsData | null): string | null {
  return (
    Object.entries(stats?.languages ?? {}).sort(([, left], [, right]) => right - left)[0]?.[0] ?? null
  )
}

function getPreferredBuildingType(stats: GitHubStatsData | null, topLanguage: string | null): BuildingType {
  if (!stats) {
    return 'town_hall'
  }

  if ((topLanguage === 'TypeScript' || topLanguage === 'JavaScript') && BUILDING_UNLOCK_REQUIREMENTS.arcane_tower(stats)) {
    return 'arcane_tower'
  }

  if (topLanguage === 'Rust' && BUILDING_UNLOCK_REQUIREMENTS.iron_forge(stats)) {
    return 'iron_forge'
  }

  if (BUILDING_UNLOCK_REQUIREMENTS.library(stats)) {
    return 'library'
  }

  if (BUILDING_UNLOCK_REQUIREMENTS.market(stats)) {
    return 'market'
  }

  return 'town_hall'
}

export function getTopLanguageBuildingUnlocked(stats: GitHubStatsData | null): string {
  const topLanguage = getTopLanguage(stats)
  const buildingType = getPreferredBuildingType(stats, topLanguage)

  return getBuildingMetadata(buildingType).label
}

export function getOnboardingInitialName(username: string | null, currentName: string | null): string {
  if (currentName && currentName !== 'My Kingdom') {
    return currentName
  }

  if (username) {
    return `${username}'s Kingdom`.slice(0, 30)
  }

  return 'My Kingdom'
}
