import { getOnboardingInitialName } from '@/src/lib/onboarding'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

import type { BuildingData, GitHubStatsData, KingdomData } from '@/src/types/game'

export const KINGDOM_WITH_BUILDINGS_SELECT =
  'id, user_id, name, gold, prestige, population, defense_rating, attack_rating, building_slots, last_synced_at, theme_id, equipped_banner_id, buildings(id, type, level, position_x, position_y, skin_id, built_at)'
export const KINGDOM_WITH_BUILDINGS_SELECT_FALLBACK =
  'id, user_id, name, gold, prestige, population, defense_rating, attack_rating, building_slots, last_synced_at, buildings(id, type, level, position_x, position_y, skin_id, built_at)'

export type PersistedKingdomRow = {
  id: string
  user_id: string
  name: string
  gold: number
  prestige: number
  population: number
  defense_rating: number
  attack_rating: number
  building_slots: number
  last_synced_at: string | null
  theme_id: string | null
  equipped_banner_id: string | null
  buildings:
    | {
        id: string
        type: BuildingData['type']
        level: number
        position_x: number
        position_y: number
        skin_id: string | null
        built_at: string | null
      }[]
    | null
}

type QueryableClient = {
  from: typeof supabaseAdmin.from
}

export async function fetchPersistedKingdomForUser(client: QueryableClient, userId: string) {
  const primaryQuery = await client
    .from('kingdoms')
    .select(KINGDOM_WITH_BUILDINGS_SELECT)
    .eq('user_id', userId)
    .maybeSingle()

  if (!primaryQuery.error) {
    return primaryQuery.data as PersistedKingdomRow | null
  }

  if (!primaryQuery.error.message.includes('theme_id')) {
    throw new Error(primaryQuery.error.message)
  }

  const fallbackQuery = await client
    .from('kingdoms')
    .select(KINGDOM_WITH_BUILDINGS_SELECT_FALLBACK)
    .eq('user_id', userId)
    .maybeSingle()

  if (fallbackQuery.error) {
    throw new Error(fallbackQuery.error.message)
  }

  return fallbackQuery.data
    ? ({ ...(fallbackQuery.data as Omit<PersistedKingdomRow, 'theme_id'>), theme_id: null } as PersistedKingdomRow)
    : null
}

export async function ensureKingdomForUser(userId: string) {
  const existingKingdom = await fetchPersistedKingdomForUser(supabaseAdmin, userId)

  if (existingKingdom) {
    return existingKingdom
  }

  const { error: insertError } = await supabaseAdmin.from('kingdoms').insert({
    user_id: userId,
    name: 'My Kingdom',
    gold: 500,
    prestige: 0,
    population: 0,
    defense_rating: 0,
    attack_rating: 0,
    building_slots: 5,
  })

  if (insertError && insertError.code !== '23505') {
    throw new Error(insertError.message)
  }

  return await fetchPersistedKingdomForUser(supabaseAdmin, userId)
}

export async function tryEnsureKingdomForUser(userId: string) {
  try {
    return await ensureKingdomForUser(userId)
  } catch {
    return null
  }
}

export function createFallbackKingdomData(options: {
  userId: string
  username: string | null
  avatarUrl: string | null
  kingdomName?: string | null
  githubStats?: GitHubStatsData | null
}): KingdomData {
  const { userId, username, avatarUrl, kingdomName, githubStats = null } = options

  return {
    id: `bootstrap-${userId}`,
    userId,
    name: getOnboardingInitialName(username, kingdomName ?? null),
    gold: 500,
    prestige: 0,
    population: 0,
    defense_rating: 0,
    attack_rating: 0,
    building_slots: 5,
    last_synced_at: null,
    themeId: null,
    ownerName: username ?? 'Code Monarch',
    ownerAvatarUrl: avatarUrl,
    buildings: [],
    githubStats,
  }
}
