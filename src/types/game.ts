export type BuildingType =
  | 'town_hall'
  | 'arcane_tower'
  | 'library'
  | 'iron_forge'
  | 'barracks'
  | 'observatory'
  | 'market'
  | 'wall'
  | 'monument'

export interface BuildingData {
  id: string
  type: BuildingType
  x: number
  y: number
  level: 1 | 2 | 3 | 4 | 5
  name?: string
}

export interface GitHubStatsData {
  total_commits: number
  total_repos: number
  total_stars: number
  total_prs: number
  followers: number
  current_streak: number
  longest_streak: number
  languages: Record<string, number>
  synced_at: string | null
}

export interface KingdomData {
  id: string
  userId: string
  name: string
  gold: number
  prestige: number
  population: number
  defense_rating: number
  attack_rating: number
  building_slots: number
  last_synced_at: string | null
  ownerName: string
  ownerAvatarUrl: string | null
  buildings: BuildingData[]
  githubStats: GitHubStatsData | null
}
