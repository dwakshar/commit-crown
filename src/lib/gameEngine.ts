import type { BuildingData, BuildingType, KingdomData } from '@/src/types/game'

export type GitHubStats = {
  total_commits: number
  total_repos: number
  total_stars: number
  total_prs: number
  followers: number
  current_streak: number
  longest_streak: number
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

// All buildings are available to place — gated by gold cost only, not GitHub stats.
export const BUILDING_UNLOCK_REQUIREMENTS: Record<BuildingType, BuildingUnlockCheck> = {
  town_hall:    () => true,
  market:       () => true,
  library:      () => true,
  iron_forge:   () => true,
  barracks:     () => true,
  observatory:  () => true,
  arcane_tower: () => true,
  wall:         () => true,
  monument:     () => true,
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

// Attack contribution per building level.
// Barracks = core military, Iron Forge = weapons output, Arcane Tower = magic offense.
const ATTACK_BUILDING_WEIGHTS: Partial<Record<BuildingType, number>> = {
  barracks: 20,
  iron_forge: 12,
  arcane_tower: 9,
  observatory: 5,
  market: 3,
}

// Defense contribution per building level.
// Wall is the primary bulwark; observatory provides early warning (both attack + defense intel).
const DEFENSE_BUILDING_WEIGHTS: Partial<Record<BuildingType, number>> = {
  wall: 25,
  barracks: 10,
  town_hall: 8,
  observatory: 7,
  arcane_tower: 7,
  iron_forge: 5,
  library: 2,
}

/**
 * Maps raw GitHub stats to kingdom stats.
 *
 * Design goals:
 * - Log/sqrt scaling so veteran devs aren't 100x stronger than beginners.
 * - Multiple dimensions (commits, stars, repos, PRs, followers, streaks) all contribute.
 * - Gold only applies on first kingdom creation — syncs afterwards preserve spent gold.
 * - Prestige drives leaderboard separation and should reward both activity AND influence.
 */
export function mapGitHubToKingdom(stats: GitHubStats): KingdomStats {
  // Gold: log-scaled so commits beyond ~5 000 have diminishing returns.
  // Starting values by developer tier:
  //   Junior  (~50 commits, 0 stars, 1 repo)  → ~280 gold
  //   Mid     (~2 000 commits, 50 stars, 15 repos) → ~2 100 gold
  //   Senior  (~10 000 commits, 300 stars, 50 repos) → ~5 200 gold
  //   Veteran (~50 000 commits, 2 000 stars, 150 repos) → ~12 000 gold
  const gold = Math.floor(
    50 +
    Math.sqrt(stats.total_commits) * 30 +
    Math.log1p(stats.total_stars) * 80 +
    stats.total_repos * 18 +
    stats.total_prs * 2,
  )

  // Prestige: multi-factor to produce clean leaderboard separation.
  // Stars + followers dominate at the high end (social influence = prestige).
  const prestige = Math.floor(
    stats.total_stars * 15 +
    stats.total_commits / 5 +
    stats.followers * 8 +
    stats.total_prs * 3 +
    stats.current_streak * 10,
  )

  // Population: followers are the main driver; commits + repos add base citizens.
  const population = Math.floor(
    stats.followers * 4 +
    Math.sqrt(stats.total_commits) * 2 +
    stats.total_repos * 3,
  )

  // Attack: PR-based (contribution aggression) + broad commit depth.
  const attack_rating = Math.floor(
    stats.total_prs * 12 +
    Math.sqrt(stats.total_commits) * 3,
  )

  // Defense: active streak is primary; longest streak rewards historical resilience;
  // overall commit volume provides base fortification.
  const defense_rating = Math.floor(
    stats.current_streak * 8 +
    (stats.longest_streak ?? 0) * 4 +
    Math.sqrt(stats.total_commits) * 2,
  )

  // Building slots: log-scaled on repos so casual devs still get 4–6 slots
  // and only power users reach the cap of 20.
  const building_slots = Math.min(
    Math.max(3, Math.floor(3 + Math.log1p(stats.total_repos) * 2.5)),
    20,
  )

  return { gold, prestige, population, attack_rating, defense_rating, building_slots }
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

/**
 * Computes the outcome of a raid given pre-rolled attacker and defender power values.
 * Gold stolen is 12% of defender gold with a 50-gold floor (so even small raids matter),
 * capped at the defender's actual balance to prevent negative gold.
 */
export function computeRaidOutcome(
  attackerPower: number,
  defenderPower: number,
  defenderGold: number,
): { result: 'attacker_wins' | 'defender_wins'; goldStolen: number } {
  const attackerWins = attackerPower > defenderPower

  let goldStolen = 0
  if (attackerWins) {
    const pctAmount = Math.floor(defenderGold * 0.12)
    const minAmount = Math.min(50, defenderGold)
    goldStolen = Math.min(defenderGold, Math.max(pctAmount, minAmount))
  }

  return {
    result: attackerWins ? 'attacker_wins' : 'defender_wins',
    goldStolen,
  }
}
