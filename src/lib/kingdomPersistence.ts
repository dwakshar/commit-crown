import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

import type { BuildingData } from '@/src/types/game'

export const KINGDOM_WITH_BUILDINGS_SELECT =
  'id, user_id, name, gold, prestige, population, defense_rating, attack_rating, building_slots, last_synced_at, theme_id, buildings(id, type, level, position_x, position_y, skin_id)'

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
  buildings:
    | {
        id: string
        type: BuildingData['type']
        level: number
        position_x: number
        position_y: number
        skin_id: string | null
      }[]
    | null
}

export async function ensureKingdomForUser(userId: string) {
  const { error: createError } = await supabaseAdmin.from('kingdoms').upsert(
    {
      user_id: userId,
      name: 'My Kingdom',
      gold: 0,
      prestige: 0,
      population: 0,
      defense_rating: 0,
      attack_rating: 0,
      building_slots: 5,
    },
    { onConflict: 'user_id' },
  )

  if (createError) {
    throw new Error(createError.message)
  }

  const { data: kingdom, error: fetchError } = await supabaseAdmin
    .from('kingdoms')
    .select(KINGDOM_WITH_BUILDINGS_SELECT)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  return (kingdom as PersistedKingdomRow | null) ?? null
}
