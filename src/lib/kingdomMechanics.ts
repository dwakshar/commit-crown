import {
  calculateKingdomPower,
  type GitHubStats,
} from "@/src/lib/gameEngine";
import { BUILDING_METADATA, isWaterBuildingType } from "@/src/lib/kingdom";

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

// Gold generated per building per level per hour.
// Market and Town Hall are the dominant gold producers.
const GOLD_WEIGHTS: Record<BuildingType, number> = {
  town_hall: 12,
  market: 11,
  iron_forge: 7,
  arcane_tower: 6,
  monument: 5,
  library: 4,
  barracks: 3,
  observatory: 3,
  wall: 1,
  royal_flagship: 5,
  sentinel_skiff: 1,
  bulwark_barge: 2,
  supply_tender: 6,
};

// Prestige generated per building per level per hour.
// Monument is the flagship prestige building; arcane and observatory follow.
const PRESTIGE_WEIGHTS: Record<BuildingType, number> = {
  monument: 10,
  arcane_tower: 8,
  observatory: 6,
  library: 5,
  town_hall: 4,
  iron_forge: 3,
  market: 3,
  barracks: 2,
  wall: 1,
  royal_flagship: 6,
  sentinel_skiff: 2,
  bulwark_barge: 3,
  supply_tender: 2,
};

// Knowledge generated per building per level per hour.
// Library + Arcane Tower are the knowledge core.
const KNOWLEDGE_WEIGHTS: Record<BuildingType, number> = {
  library: 10,
  arcane_tower: 8,
  observatory: 6,
  iron_forge: 2,
  town_hall: 2,
  monument: 2,
  barracks: 1,
  market: 1,
  wall: 0,
  royal_flagship: 2,
  sentinel_skiff: 3,
  bulwark_barge: 1,
  supply_tender: 2,
};

// Supply generated per building per level per hour.
// Market + Barracks + Town Hall drive supply chain.
const SUPPLY_WEIGHTS: Record<BuildingType, number> = {
  market: 7,
  town_hall: 5,
  barracks: 4,
  iron_forge: 3,
  library: 2,
  observatory: 2,
  arcane_tower: 1,
  monument: 1,
  wall: 0,
  royal_flagship: 4,
  sentinel_skiff: 2,
  bulwark_barge: 1,
  supply_tender: 8,
};

function toGitHubStats(stats: GitHubStatsData | null | undefined): GitHubStats {
  return {
    total_commits: stats?.total_commits ?? 0,
    total_repos: stats?.total_repos ?? 0,
    total_stars: stats?.total_stars ?? 0,
    total_prs: stats?.total_prs ?? 0,
    followers: stats?.followers ?? 0,
    current_streak: stats?.current_streak ?? 0,
    longest_streak: stats?.longest_streak ?? 0,
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

export function getBuildingCatalog(
  kingdom: KingdomData
): BuildingCatalogEntry[] {
  return (Object.keys(BUILDING_METADATA) as BuildingType[])
    .filter((type) => type !== 'town_hall')
    .map((type) => {
    const placedCount = kingdom.buildings.filter(
      (building) => !building.isPlaceholder && building.type === type
    ).length;

    return {
      type,
      metadata: BUILDING_METADATA[type],
      unlocked: true,
      placedCount,
      nextTierLabel: placedCount > 0 ? "Expand district" : "Ready to found",
    };
  });
}

export function getKingdomEconomy(kingdom: KingdomData): KingdomEconomy {
  const structures = kingdom.buildings.filter(
    (building) => !building.isPlaceholder
  );
  const power = calculateKingdomPower(kingdom, structures);

  const ghStats = kingdom.githubStats;

  // Building production base
  const goldBase = sumWeightedValue(structures, GOLD_WEIGHTS);
  const prestigeBase = sumWeightedValue(structures, PRESTIGE_WEIGHTS);
  const knowledgeBase = sumWeightedValue(structures, KNOWLEDGE_WEIGHTS);
  const supplyBase = sumWeightedValue(structures, SUPPLY_WEIGHTS);

  // GitHub-stat bonuses: each dimension boosts a different economy pillar.
  // A kingdom with many followers earns more gold (large workforce);
  // an active coder with a long streak generates more supply;
  // a widely-starred developer generates prestige passively.
  const goldBonus = Math.max(
    15,
    Math.floor((ghStats?.followers ?? 0) / 5) +
      Math.floor((ghStats?.current_streak ?? 0) * 0.5)
  );

  const prestigeBonus = Math.max(
    4,
    Math.floor((ghStats?.total_stars ?? 0) / 4) +
      Math.floor((ghStats?.followers ?? 0) / 8)
  );

  const knowledgeBonus = Math.max(
    2,
    (ghStats?.total_repos ?? 0) * 2 +
      Math.floor((ghStats?.longest_streak ?? 0) / 5)
  );

  const supplyBonus = Math.max(
    4,
    Math.floor((ghStats?.current_streak ?? 0) * 1.5) +
      Math.floor((ghStats?.total_prs ?? 0) / 10)
  );

  const goldPerHour = Math.floor(goldBase + goldBonus);
  const prestigePerHour = Math.floor(prestigeBase + prestigeBonus);
  const knowledgePerHour = Math.floor(knowledgeBase + knowledgeBonus);
  const supplyPerHour = Math.floor(supplyBase + supplyBonus);

  // Pressure: internal tension that grows with building count (complexity)
  // and shrinks with strong defenses, high supply, and an active coding streak.
  const pressure = Math.max(
    0,
    Math.min(
      100,
      12 +
        structures.length * 4 -
        Math.floor(power.defense / 25) -
        Math.floor(supplyPerHour / 12) -
        Math.floor((ghStats?.current_streak ?? 0) / 5)
    )
  );

  // Stability (0–100): reflects how well the kingdom is holding together.
  // High defense and high knowledge absorb pressure; pressure degrades stability.
  const stability = Math.max(
    0,
    Math.min(
      100,
      58 +
        Math.floor(power.defense / 12) +
        Math.floor(knowledgePerHour / 10) -
        Math.floor(pressure / 2)
    )
  );

  return {
    goldPerHour,
    prestigePerHour,
    knowledgePerHour,
    supplyPerHour,
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
    (entry) => !isWaterBuildingType(entry.type) && entry.x === x && entry.y === y
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
