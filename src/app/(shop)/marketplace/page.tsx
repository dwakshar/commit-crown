import { redirect } from 'next/navigation'

import { MarketplaceClient } from '@/src/app/(shop)/marketplace/MarketplaceClient'
import { createClient } from '@/utils/supabase/server'

import {
  isShopItemType,
  type ShopItemType,
  type EquipTargetType,
  type MarketplaceItem,
} from '@/src/lib/shop'

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
  buildings: BuildingRow[] | null
}

export default async function MarketplacePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const [{ data: items, error: itemsError }, { data: ownedItems, error: ownedItemsError }, { data: kingdom, error: kingdomError }] =
    await Promise.all([
      supabase
        .from('shop_items')
        .select('id, name, type, description, price_cents, stripe_price_id, asset_key, is_free, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('owned_items').select('item_id').eq('user_id', user.id),
      supabase.from('kingdoms').select('id, theme_id, buildings(id, skin_id)').eq('user_id', user.id).maybeSingle(),
    ])

  if (itemsError) {
    throw new Error(itemsError.message)
  }

  if (ownedItemsError) {
    throw new Error(ownedItemsError.message)
  }

  if (kingdomError) {
    throw new Error(kingdomError.message)
  }

  const ownedItemIds = new Set(((ownedItems as OwnedItemRow[] | null) ?? []).map((item) => item.item_id))
  const kingdomRow = kingdom as KingdomRow | null
  const firstBuildingId = kingdomRow?.buildings?.[0]?.id ?? null

  const marketplaceItems: MarketplaceItem[] = ((items as ShopItemRow[] | null) ?? [])
    .filter((item): item is ShopItemRow & { type: ShopItemType } => isShopItemType(item.type))
    .map((item) => {
      const itemType = item.type
      let targetId: string | null = null
      let targetType: EquipTargetType | null = null
      let equipped = false

      if (itemType === 'building-skin') {
        targetId = firstBuildingId
        targetType = 'building'
        equipped = Boolean(kingdomRow?.buildings?.some((building) => building.skin_id === item.id))
      } else if (itemType === 'kingdom-theme') {
        targetId = kingdomRow?.id ?? null
        targetType = 'kingdom'
        equipped = kingdomRow?.theme_id === item.id
      }

      return {
        id: item.id,
        name: item.name,
        type: itemType,
        description: item.description,
        assetKey: item.asset_key,
        priceCents: item.price_cents,
        stripePriceId: item.stripe_price_id,
        isFree: Boolean(item.is_free),
        owned: ownedItemIds.has(item.id),
        equipped,
        targetId,
        targetType,
      }
    })

  return <MarketplaceClient initialItems={marketplaceItems} />
}
