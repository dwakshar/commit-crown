export type BuildingType =
  | "town_hall"
  | "arcane_tower"
  | "library"
  | "iron_forge"
  | "barracks"
  | "observatory"
  | "market"
  | "wall"
  | "monument"
  | "royal_flagship"
  | "sentinel_skiff"
  | "bulwark_barge"
  | "supply_tender";

export interface BuildingData {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  placementZone?: "board" | "water";
  level: 1 | 2 | 3 | 4 | 5;
  skinId?: string | null;
  name?: string;
  builtAt?: string | null;
  isPlaceholder?: boolean;
  placeholderLabel?: string;
}

export interface GitHubStatsData {
  total_commits: number;
  total_repos: number;
  total_stars: number;
  total_prs: number;
  followers: number;
  current_streak: number;
  longest_streak: number;
  night_commits?: number;
  monthly_peak?: number;
  starred_repo_count?: number;
  languages: Record<string, number>;
  synced_at: string | null;
}

export interface KingdomData {
  id: string;
  userId: string;
  name: string;
  gold: number;
  prestige: number;
  population: number;
  defense_rating: number;
  attack_rating: number;
  building_slots: number;
  raid_opt_in?: boolean;
  raids_enabled?: boolean;
  last_synced_at: string | null;
  themeId?: string | null;
  equippedBannerName?: string | null;
  ownerName: string;
  ownerAvatarUrl: string | null;
  ownerGithubUsername?: string | null;
  ownerCreatedAt?: string | null;
  buildings: BuildingData[];
  githubStats: GitHubStatsData | null;
}

export type NotificationType =
  | "achievement_unlocked"
  | "raid_received"
  | "kingdom_visited"
  | "building_complete"
  | "purchase_complete";

export interface NotificationData {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}
