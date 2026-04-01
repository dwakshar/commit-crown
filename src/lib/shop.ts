export type ShopItemType = 'building-skin' | 'kingdom-theme' | 'banner' | 'profile-frame'

export type EquipTargetType = 'building' | 'kingdom'

export interface MarketplaceItem {
  id: string
  name: string
  type: ShopItemType
  description: string | null
  assetKey: string | null
  priceCents: number
  stripePriceId: string | null
  isFree: boolean
  owned: boolean
  equipped: boolean
  targetId: string | null
  targetType: EquipTargetType | null
}

export function isShopItemType(value: string): value is ShopItemType {
  return (
    value === 'building-skin' ||
    value === 'kingdom-theme' ||
    value === 'banner' ||
    value === 'profile-frame'
  )
}

export function getShopItemLabel(type: ShopItemType): string {
  switch (type) {
    case 'building-skin':
      return 'Building Skin'
    case 'kingdom-theme':
      return 'Kingdom Theme'
    case 'banner':
      return 'Banner'
    case 'profile-frame':
      return 'Profile Frame'
  }
}

export function isPreviewImage(assetKey: string | null): boolean {
  if (!assetKey) {
    return false
  }

  return /^(https?:)?\/\//.test(assetKey) || assetKey.startsWith('/')
}

export function formatPrice(priceCents: number, isFree: boolean): string {
  if (isFree || priceCents <= 0) {
    return 'Free'
  }

  return `$${(priceCents / 100).toFixed(2)}`
}
