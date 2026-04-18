import { NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { isShopItemType, type EquipTargetType, type ShopItemType } from '@/src/lib/shop'

type ShopItemRow = {
  id: string
  name: string
  type: string
  description: string | null
  price_cents: number
  stripe_price_id: string | null
  asset_key: string | null
  is_free: boolean | null
  created_at: string
}

type OwnedItemRow = {
  item_id: string
}

type BuildingRow = {
  id: string
  skin_id: string | null
}

type KingdomRow = {
  id: string
  theme_id: string | null
  equipped_banner_id: string | null
  buildings: BuildingRow[] | null
}

async function loadMarketplaceKingdom(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const primaryQuery = await supabase
    .from('kingdoms')
    .select('id, theme_id, equipped_banner_id, buildings(id, skin_id)')
    .eq('user_id', userId)
    .maybeSingle()

  if (!primaryQuery.error) {
    return {
      kingdom: primaryQuery.data as KingdomRow | null,
      themeColumnAvailable: true,
    }
  }

  if (!primaryQuery.error.message.includes('theme_id')) {
    return {
      kingdom: null,
      themeColumnAvailable: true,
      error: primaryQuery.error,
    }
  }

  const fallbackQuery = await supabase
    .from('kingdoms')
    .select('id, buildings(id, skin_id)')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    kingdom: fallbackQuery.data
      ? ({ ...(fallbackQuery.data as Omit<KingdomRow, 'theme_id' | 'equipped_banner_id'>), theme_id: null, equipped_banner_id: null } as KingdomRow)
      : null,
    themeColumnAvailable: false,
    error: fallbackQuery.error,
  }
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [
    { data: items, error: itemsError },
    { data: ownedItems, error: ownedItemsError },
    { kingdom, error: kingdomError, themeColumnAvailable },
  ] =
    await Promise.all([
      supabase
        .from('shop_items')
        .select('id, name, type, description, price_cents, stripe_price_id, asset_key, is_free, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('owned_items').select('item_id').eq('user_id', user.id),
      loadMarketplaceKingdom(user.id, supabase),
    ])

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  if (ownedItemsError) {
    return NextResponse.json({ error: ownedItemsError.message }, { status: 500 })
  }

  if (kingdomError) {
    return NextResponse.json({ error: kingdomError.message }, { status: 500 })
  }

  const ownedItemIds = new Set(((ownedItems as OwnedItemRow[] | null) ?? []).map((item) => item.item_id))
  const kingdomRow = kingdom as KingdomRow | null
  const firstBuildingId = kingdomRow?.buildings?.[0]?.id ?? null
  const payload = ((items as ShopItemRow[] | null) ?? [])
    .filter((item): item is ShopItemRow & { type: ShopItemType } => isShopItemType(item.type))
    .map((item) => {
      let targetId: string | null = null
      let targetType: EquipTargetType | null = null
      let equipped = false

      if (item.type === 'building-skin') {
        targetId = firstBuildingId
        targetType = 'building'
        equipped = Boolean(kingdomRow?.buildings?.some((building) => building.skin_id === item.id))
      } else if (item.type === 'kingdom-theme' && themeColumnAvailable) {
        targetId = kingdomRow?.id ?? null
        targetType = 'kingdom'
        equipped = kingdomRow?.theme_id === item.id
      } else if (item.type === 'banner') {
        equipped = kingdomRow?.equipped_banner_id === item.id
      }

      return {
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
        priceCents: item.price_cents,
        stripePriceId: item.stripe_price_id,
        assetKey: item.asset_key,
        isFree: Boolean(item.is_free),
        owned: ownedItemIds.has(item.id),
        equipped,
        targetId,
        targetType,
      }
    })

  return NextResponse.json({ items: payload })
}
