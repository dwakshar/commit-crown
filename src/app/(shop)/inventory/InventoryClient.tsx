'use client'

import { ShopItemCard } from '@/src/components/ui/ShopItemCard'

import type { MarketplaceItem } from '@/src/lib/shop'

export function InventoryClient({ items }: { items: MarketplaceItem[] }) {
  const ownedItems = items.filter((item) => item.owned)

  if (ownedItems.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center text-white/60">
        Your inventory is empty for now.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {ownedItems.map((item) => (
        <ShopItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
