'use client'

import { useEffect, useMemo, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ShopItemCard } from '@/src/components/ui/ShopItemCard'
import { useNotificationStore } from '@/src/store/notificationStore'

import type { MarketplaceItem, ShopItemType } from '@/src/lib/shop'

type MarketplaceItemsResponse = {
  items: MarketplaceItem[]
  error?: string
}

const FILTERS: Array<{ value: 'all' | ShopItemType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'building-skin', label: 'Building Skins' },
  { value: 'kingdom-theme', label: 'Kingdom Themes' },
  { value: 'banner', label: 'Banners' },
  { value: 'profile-frame', label: 'Profile Frames' },
]

export function MarketplaceClient({ initialItems }: { initialItems: MarketplaceItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [activeFilter, setActiveFilter] = useState<'all' | ShopItemType>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const refreshItems = async () => {
    setIsRefreshing(true)

    try {
      const response = await fetch('/api/shop/items', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      })

      const payload = (await response.json()) as MarketplaceItemsResponse

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to refresh marketplace items')
      }

      setItems(payload.items)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('success') !== 'true') {
      return
    }

    addNotification({
      id: `purchase-complete-${Date.now()}`,
      user_id: 'local',
      type: 'purchase_complete',
      message: 'Purchase complete!',
      data: null,
      read_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    void refreshItems()
    router.replace(pathname, { scroll: false })
  }, [addNotification, pathname, router, searchParams])

  const filteredItems = useMemo(() => {
    return items.filter((item) => activeFilter === 'all' || item.type === activeFilter)
  }, [activeFilter, items])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.16),transparent_28%),linear-gradient(180deg,#15101c_0%,#09070d_100%)] px-4 py-10 text-[#f5efe1] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] border border-[#C9A84C]/20 bg-[linear-gradient(180deg,rgba(24,17,32,0.96),rgba(10,8,15,0.96))] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#C9A84C]/80">CodeKingdom Marketplace</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Outfit the realm with rare cosmetics
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">
                Claim free rewards, purchase premium drops, and equip skins or themes for your kingdom.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <span className="text-[#C9A84C]">{filteredItems.length}</span> items
              {isRefreshing ? ' - refreshing' : ''}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {FILTERS.map((filter) => {
              const isActive = filter.value === activeFilter

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={[
                    'rounded-full border px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'border-[#C9A84C] bg-[#C9A84C] text-[#24180a] shadow-[0_10px_30px_rgba(201,168,76,0.3)]'
                      : 'border-white/10 bg-white/5 text-white/75 hover:border-[#C9A84C]/45 hover:text-white',
                  ].join(' ')}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <ShopItemCard key={item.id} item={item} onRefreshRequested={refreshItems} />
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="mt-8 rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center text-white/60">
              No items match this filter yet.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
