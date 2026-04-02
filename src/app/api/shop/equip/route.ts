import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getBuildingMetadata } from '@/src/lib/kingdom'
import { withStarterKingdomState } from '@/src/lib/onboarding'
import { isShopItemType } from '@/src/lib/shop'
import { createClient } from '@/utils/supabase/server'

import type { BuildingData, GitHubStatsData, KingdomData } from '@/src/types/game'

const equipSchema = z.object({
  itemId: z.uuid(),
  targetId: z.uuid(),
  targetType: z.enum(['building', 'kingdom']),
})

type OwnedItemRow = {
  id: string
}

type ShopItemRow = {
  id: string
  type: string
}

type BuildingRow = {
  id: string
  type: BuildingData['type']
  level: number
  position_x: number
  position_y: number
  skin_id: string | null
}

type KingdomRow = {
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
  buildings: BuildingRow[] | null
}

function toKingdomData(
  kingdom: KingdomRow,
  profile: { username: string | null; avatar_url: string | null } | null,
  githubStats: GitHubStatsData | null,
): KingdomData {
  return {
    id: kingdom.id,
    userId: kingdom.user_id,
    name: kingdom.name,
    gold: kingdom.gold,
    prestige: kingdom.prestige,
    population: kingdom.population,
    defense_rating: kingdom.defense_rating,
    attack_rating: kingdom.attack_rating,
    building_slots: kingdom.building_slots,
    last_synced_at: kingdom.last_synced_at,
    themeId: kingdom.theme_id,
    ownerName: profile?.username ?? 'Code Monarch',
    ownerAvatarUrl: profile?.avatar_url ?? null,
    buildings: (kingdom.buildings ?? []).map((building) => ({
      id: building.id,
      type: building.type,
      x: building.position_x,
      y: building.position_y,
      level: Math.min(5, Math.max(1, building.level)) as 1 | 2 | 3 | 4 | 5,
      skinId: building.skin_id,
      name: getBuildingMetadata(building.type).label,
    })),
    githubStats,
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawBody = await request.json().catch(() => null)
  const parsed = equipSchema.safeParse(rawBody)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { itemId, targetId, targetType } = parsed.data

  const [{ data: ownership, error: ownershipError }, { data: item, error: itemError }] = await Promise.all([
    supabase.from('owned_items').select('id').eq('user_id', user.id).eq('item_id', itemId).maybeSingle(),
    supabase.from('shop_items').select('id, type').eq('id', itemId).maybeSingle(),
  ])

  if (ownershipError) {
    return NextResponse.json({ error: ownershipError.message }, { status: 500 })
  }

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 })
  }

  if (!(ownership as OwnedItemRow | null)) {
    return NextResponse.json({ error: 'Item not owned' }, { status: 403 })
  }

  const shopItem = item as ShopItemRow | null

  if (!shopItem || !isShopItemType(shopItem.type)) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  if (shopItem.type === 'building-skin' && targetType !== 'building') {
    return NextResponse.json({ error: 'Building skins must target a building' }, { status: 400 })
  }

  if (shopItem.type === 'kingdom-theme' && targetType !== 'kingdom') {
    return NextResponse.json({ error: 'Kingdom themes must target a kingdom' }, { status: 400 })
  }

  if (shopItem.type === 'banner' || shopItem.type === 'profile-frame') {
    return NextResponse.json({ error: 'This item type is not equippable yet' }, { status: 400 })
  }

  if (targetType === 'building') {
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select('id, kingdom_id, kingdoms!inner(user_id)')
      .eq('id', targetId)
      .eq('kingdoms.user_id', user.id)
      .maybeSingle()

    if (buildingError) {
      return NextResponse.json({ error: buildingError.message }, { status: 500 })
    }

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    const { error: updateError } = await supabase.from('buildings').update({ skin_id: itemId }).eq('id', targetId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  } else {
    const { data: kingdom, error: kingdomError } = await supabase
      .from('kingdoms')
      .select('id')
      .eq('id', targetId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (kingdomError) {
      return NextResponse.json({ error: kingdomError.message }, { status: 500 })
    }

    if (!kingdom) {
      return NextResponse.json({ error: 'Kingdom not found' }, { status: 404 })
    }

    const { error: updateError } = await supabase.from('kingdoms').update({ theme_id: itemId }).eq('id', targetId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  const [{ data: kingdom, error: refreshedKingdomError }, { data: profile, error: profileError }, { data: githubStats, error: githubStatsError }] =
    await Promise.all([
      supabase
        .from('kingdoms')
        .select(
          'id, user_id, name, gold, prestige, population, defense_rating, attack_rating, building_slots, last_synced_at, theme_id, buildings(id, type, level, position_x, position_y, skin_id)',
        )
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle(),
      supabase
        .from('github_stats')
        .select(
          'total_commits, total_repos, total_stars, total_prs, followers, current_streak, longest_streak, languages, synced_at',
        )
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

  if (refreshedKingdomError || profileError || githubStatsError) {
    return NextResponse.json(
      {
        error:
          refreshedKingdomError?.message ??
          profileError?.message ??
          githubStatsError?.message ??
          'Unable to refresh kingdom state',
      },
      { status: 500 },
    )
  }

  const kingdomData = kingdom
    ? withStarterKingdomState(
        toKingdomData(kingdom as KingdomRow, profile, (githubStats as GitHubStatsData | null) ?? null),
      )
    : null

  return NextResponse.json({
    success: true,
    event: kingdomData ? 'kingdom-updated' : null,
    kingdomData,
  })
}
