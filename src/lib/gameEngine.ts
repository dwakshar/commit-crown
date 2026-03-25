import type { BuildingData, BuildingType, KingdomData } from '@/src/types/game'

export type GitHubStats = {
  total_commits: number
  total_repos: number
  total_stars: number
  total_prs: number
  followers: number
  current_streak: number
  languages: Record<string, number>
}

export type KingdomStats = {
  gold: number
  prestige: number
  population: number
  attack_rating: number
  defense_rating: number
  building_slots: number
}

export type BuildingUnlockCheck = (stats: GitHubStats) => boolean

export const BUILDING_UNLOCK_REQUIREMENTS: Record<BuildingType, BuildingUnlockCheck> = {
  town_hall: () => true,
  market: (stats) => stats.total_repos >= 1,
  library: (stats) => stats.total_commits >= 25,
  iron_forge: (stats) => stats.total_stars >= 10 || (stats.languages.Rust ?? 0) >= 1,
  barracks: (stats) => stats.total_prs >= 5,
  observatory: (stats) => stats.followers >= 5,
  arcane_tower: (stats) =>
    stats.total_repos >= 3 ||
    (stats.languages.TypeScript ?? 0) >= 2 ||
    (stats.languages.JavaScript ?? 0) >= 2,
  wall: (stats) => stats.current_streak >= 7,
  monument: (stats) => stats.total_stars >= 50 || stats.followers >= 20,
}

export const BUILDING_EFFECTS: Record<BuildingType, Record<1 | 2 | 3 | 4 | 5, string>> = {
  town_hall: {
    1: 'Establishes the kingdom core and basic taxation.',
    2: 'Improves tax collection and civic coordination.',
    3: 'Accelerates treasury growth and governance reach.',
    4: 'Greatly boosts realm administration and prosperity.',
    5: 'Turns the capital into a legendary economic stronghold.',
  },
  market: {
    1: 'Generates light trade income from nearby villages.',
    2: 'Attracts merchants and improves daily revenue.',
    3: 'Creates bustling trade routes across the region.',
    4: 'Boosts commerce with premium goods and caravans.',
    5: 'Transforms trade into a major engine of kingdom wealth.',
  },
  library: {
    1: 'Preserves basic knowledge for the realm.',
    2: 'Improves scholarly output and population growth.',
    3: 'Accelerates research and long-term stability.',
    4: 'Elevates wisdom into a kingdom-wide advantage.',
    5: 'Makes the realm a beacon of learning and culture.',
  },
  iron_forge: {
    1: 'Produces standard weapons and armor.',
    2: 'Improves military equipment quality.',
    3: 'Raises output for elite unit provisioning.',
    4: 'Greatly strengthens the kingdom war machine.',
    5: 'Forges masterwork arms fit for legends.',
  },
  barracks: {
    1: 'Trains a modest standing guard.',
    2: 'Improves recruitment and troop discipline.',
    3: 'Expands unit readiness across the frontier.',
    4: 'Raises a hardened professional fighting force.',
    5: 'Creates a feared army of veteran defenders.',
  },
  observatory: {
    1: 'Tracks weather and nearby movement.',
    2: 'Improves scouting and strategic awareness.',
    3: 'Extends vision across key territories.',
    4: 'Predicts opportunities and looming threats.',
    5: 'Makes the kingdom nearly impossible to surprise.',
  },
  arcane_tower: {
    1: 'Channels minor magical energy into prestige.',
    2: 'Improves magical output and strategic utility.',
    3: 'Strengthens enchanted defenses and influence.',
    4: 'Elevates arcane mastery across the realm.',
    5: 'Turns the kingdom into a center of magical dominance.',
  },
  wall: {
    1: 'Creates a basic defensive perimeter.',
    2: 'Strengthens fortifications against raids.',
    3: 'Improves resilience across border defenses.',
    4: 'Makes invasions expensive and difficult.',
    5: 'Forms an imposing bulwark around the kingdom.',
  },
  monument: {
    1: 'Honors the first great achievements of the realm.',
    2: 'Inspires citizens and visiting dignitaries.',
    3: 'Raises prestige through visible legacy.',
    4: 'Turns achievements into kingdom-wide pride.',
    5: 'Stands as a timeless symbol of unmatched greatness.',
  },
}

const ATTACK_BUILDING_WEIGHTS: Partial<Record<BuildingType, number>> = {
  barracks: 18,
  iron_forge: 10,
  arcane_tower: 8,
  observatory: 4,
  market: 2,
}

const DEFENSE_BUILDING_WEIGHTS: Partial<Record<BuildingType, number>> = {
  wall: 22,
  town_hall: 8,
  barracks: 9,
  observatory: 7,
  arcane_tower: 6,
  iron_forge: 4,
}

export function mapGitHubToKingdom(stats: GitHubStats): KingdomStats {
  return {
    gold: Math.floor(stats.total_commits * 10),
    prestige: Math.floor(stats.total_stars * 50),
    population: Math.floor(stats.followers * 5),
    attack_rating: Math.floor(stats.total_prs * 8),
    defense_rating: Math.floor(stats.current_streak * 15),
    building_slots: Math.min(Math.max(stats.total_repos, 3), 20),
  }
}

export function calculateKingdomPower(
  kingdom: Pick<KingdomData, 'attack_rating' | 'defense_rating'>,
  buildings: BuildingData[],
): { attack: number; defense: number } {
  const attackBonus = buildings.reduce(
    (total, building) => total + (ATTACK_BUILDING_WEIGHTS[building.type] ?? 0) * building.level,
    0,
  )
  const defenseBonus = buildings.reduce(
    (total, building) => total + (DEFENSE_BUILDING_WEIGHTS[building.type] ?? 0) * building.level,
    0,
  )

  return {
    attack: kingdom.attack_rating + attackBonus,
    defense: kingdom.defense_rating + defenseBonus,
  }
}

export function computeRaidOutcome(
  attackerPower: number,
  defenderPower: number,
  defenderGold: number,
): { result: 'attacker_wins' | 'defender_wins'; goldStolen: number } {
  const attackerWins = attackerPower > defenderPower
  const goldStolen = attackerWins ? Math.floor(defenderGold * 0.1) : 0

  return {
    result: attackerWins ? 'attacker_wins' : 'defender_wins',
    goldStolen,
  }
}
