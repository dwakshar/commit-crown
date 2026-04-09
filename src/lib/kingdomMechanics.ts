import {
  BUILDING_UNLOCK_REQUIREMENTS,
  calculateKingdomPower,
  type GitHubStats,
} from "@/src/lib/gameEngine";
import { BUILDING_METADATA } from "@/src/lib/kingdom";

import type {
  BuildingData,
  BuildingType,
  GitHubStatsData,
  KingdomData,
} from "@/src/types/game";

export type BuildingCatalogEntry = {
  type: BuildingType;
  metadata: (typeof BUILDING_METADATA)[BuildingType];
  unlocked: boolean;
  placedCount: number;
  nextTierLabel: string;
};

export type KingdomEconomy = {
  goldPerHour: number;
  prestigePerHour: number;
  knowledgePerHour: number;
  supplyPerHour: number;
  stability: number;
  pressure: number;
  attackPower: number;
  defensePower: number;
};

const GOLD_WEIGHTS: Record<BuildingType, number> = {
  town_hall: 12,
  arcane_tower: 6,
  library: 4,
  iron_forge: 7,
  barracks: 3,
  observatory: 3,
  market: 10,
  wall: 1,
  monument: 5,
};

const PRESTIGE_WEIGHTS: Record<BuildingType, number> = {
  town_hall: 4,
  arcane_tower: 8,
  library: 5,
  iron_forge: 3,
  barracks: 2,
  observatory: 6,
  market: 3,
  wall: 1,
  monument: 10,
};

const KNOWLEDGE_WEIGHTS: Record<BuildingType, number> = {
  town_hall: 2,
  arcane_tower: 8,
  library: 10,
  iron_forge: 2,
  barracks: 1,
  observatory: 6,
  market: 1,
  wall: 0,
  monument: 2,
};

const SUPPLY_WEIGHTS: Record<BuildingType, number> = {
  town_hall: 5,
  arcane_tower: 1,
  library: 2,
  iron_forge: 3,
  barracks: 4,
  observatory: 2,
  market: 6,
  wall: 0,
  monument: 1,
};

function toGitHubStats(stats: GitHubStatsData | null | undefined): GitHubStats {
  return {
    total_commits: stats?.total_commits ?? 0,
    total_repos: stats?.total_repos ?? 0,
    total_stars: stats?.total_stars ?? 0,
    total_prs: stats?.total_prs ?? 0,
    followers: stats?.followers ?? 0,
    current_streak: stats?.current_streak ?? 0,
    languages: stats?.languages ?? {},
  };
}

function sumWeightedValue(
  buildings: BuildingData[],
  weights: Record<BuildingType, number>,
  includePlaceholders = false
) {
  return buildings.reduce((total, building) => {
    if (!includePlaceholders && building.isPlaceholder) {
      return total;
    }

    return total + weights[building.type] * building.level;
  }, 0);
}

export function getUnlockedBuildingTypes(
  stats: GitHubStatsData | null | undefined
): BuildingType[] {
  const githubStats = toGitHubStats(stats);

  return (Object.keys(BUILDING_METADATA) as BuildingType[]).filter((type) =>
    BUILDING_UNLOCK_REQUIREMENTS[type](githubStats)
  );
}

export function getBuildingCatalog(
  kingdom: KingdomData
): BuildingCatalogEntry[] {
  const unlockedTypes = new Set(getUnlockedBuildingTypes(kingdom.githubStats));

  return (Object.keys(BUILDING_METADATA) as BuildingType[]).map((type) => {
    const placedCount = kingdom.buildings.filter(
      (building) => !building.isPlaceholder && building.type === type
    ).length;

    return {
      type,
      metadata: BUILDING_METADATA[type],
      unlocked: unlockedTypes.has(type),
      placedCount,
      nextTierLabel: unlockedTypes.has(type)
        ? placedCount > 0
          ? "Ready to expand"
          : "Ready to found"
        : "Locked by GitHub progress",
    };
  });
}

export function getKingdomEconomy(kingdom: KingdomData): KingdomEconomy {
  const structures = kingdom.buildings.filter(
    (building) => !building.isPlaceholder
  );
  const power = calculateKingdomPower(kingdom, structures);
  const goldPerHour =
    sumWeightedValue(structures, GOLD_WEIGHTS) +
    Math.max(12, kingdom.population / 4);
  const prestigePerHour =
    sumWeightedValue(structures, PRESTIGE_WEIGHTS) +
    Math.max(4, (kingdom.githubStats?.total_stars ?? 0) / 3);
  const knowledgePerHour =
    sumWeightedValue(structures, KNOWLEDGE_WEIGHTS) +
    Math.max(2, (kingdom.githubStats?.total_repos ?? 0) * 2);
  const supplyPerHour =
    sumWeightedValue(structures, SUPPLY_WEIGHTS) +
    Math.max(4, (kingdom.githubStats?.current_streak ?? 0) * 1.5);
  const pressure = Math.max(
    0,
    20 +
      structures.length * 7 -
      Math.floor(power.defense / 18) -
      Math.floor((kingdom.githubStats?.current_streak ?? 0) / 2)
  );
  const stability = Math.max(
    0,
    Math.min(
      100,
      62 +
        Math.floor(power.defense / 10) +
        Math.floor(knowledgePerHour / 8) -
        Math.floor(pressure / 3)
    )
  );

  return {
    goldPerHour: Math.floor(goldPerHour),
    prestigePerHour: Math.floor(prestigePerHour),
    knowledgePerHour: Math.floor(knowledgePerHour),
    supplyPerHour: Math.floor(supplyPerHour),
    stability,
    pressure,
    attackPower: power.attack,
    defensePower: power.defense,
  };
}

export function getBoardSummary(kingdom: KingdomData) {
  const buildings = kingdom.buildings.filter(
    (building) => !building.isPlaceholder
  );
  const ruins = kingdom.buildings.filter(
    (building) => building.isPlaceholder
  ).length;
  const usedSlots = buildings.length;
  const openSlots = Math.max(0, kingdom.building_slots - usedSlots);

  return {
    usedSlots,
    openSlots,
    ruins,
    control:
      usedSlots === 0
        ? "Outpost"
        : usedSlots < 4
        ? "Frontier Hold"
        : usedSlots < 7
        ? "Regional Seat"
        : "Royal Capital",
  };
}

export function getTileLabel(kingdom: KingdomData, x: number, y: number) {
  const building = kingdom.buildings.find(
    (entry) => entry.x === x && entry.y === y
  );

  if (building?.isPlaceholder) {
    return "Ruined district";
  }

  if (building) {
    return BUILDING_METADATA[building.type].label;
  }

  const nearTownHall = kingdom.buildings.some(
    (entry) =>
      entry.type === "town_hall" &&
      Math.abs(entry.x - x) + Math.abs(entry.y - y) <= 2
  );

  return nearTownHall ? "Inner ward" : "Open ground";
}
