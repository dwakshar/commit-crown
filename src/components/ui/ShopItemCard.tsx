'use client'

import { useState } from 'react'

import Image from 'next/image'

import { useNotificationStore } from '@/src/store/notificationStore'

import {
  formatPrice,
  getShopItemLabel,
  isPreviewImage,
  type MarketplaceItem,
} from '@/src/lib/shop'
import type { KingdomData } from '@/src/types/game'

type CheckoutResponse = {
  sessionUrl?: string
  error?: string
}

type EquipResponse = {
  success?: boolean
  kingdomData?: KingdomData
  error?: string
}

type ClaimResponse = {
  success?: boolean
  error?: string
}

export function ShopItemCard({
  item,
  onRefreshRequested,
}: {
  item: MarketplaceItem
  onRefreshRequested?: () => Promise<void>
}) {
  const [isClaiming, setIsClaiming] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isEquipping, setIsEquipping] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const showToast = (message: string) => {
    addNotification({
      id: `${item.id}-${Date.now()}`,
      user_id: 'local',
      type: 'purchase_complete',
      message,
      data: { itemId: item.id },
      read_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
  }

  const handleClaim = async () => {
    setIsClaiming(true)

    try {
      const response = await fetch('/api/shop/free-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: item.id }),
      })

      const payload = (await response.json()) as ClaimResponse

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to claim free item')
      }

      showToast(`${item.name} is now in your collection.`)
      await onRefreshRequested?.()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to claim free item')
    } finally {
      setIsClaiming(false)
    }
  }

  const handlePurchase = async () => {
    setIsPurchasing(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: item.id }),
      })

      const payload = (await response.json()) as CheckoutResponse

      if (!response.ok || !payload.sessionUrl) {
        throw new Error(payload.error ?? 'Unable to start checkout')
      }

      window.location.assign(payload.sessionUrl)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to start checkout')
      setIsPurchasing(false)
    }
  }

  const handleEquip = async () => {
    if (!item.targetId || !item.targetType) {
      showToast('This item cannot be equipped yet.')
      return
    }

    setIsEquipping(true)

    try {
      const response = await fetch('/api/shop/equip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          targetId: item.targetId,
          targetType: item.targetType,
        }),
      })

      const payload = (await response.json()) as EquipResponse

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to equip item')
      }

      if (payload.kingdomData) {
        window.dispatchEvent(
          new CustomEvent<KingdomData>('codekingdom:kingdom-updated', {
            detail: payload.kingdomData,
          }),
        )
      }

      showToast(item.equipped ? `${item.name} remains equipped.` : `${item.name} equipped.`)
      await onRefreshRequested?.()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to equip item')
    } finally {
      setIsEquipping(false)
    }
  }

  const renderStatus = () => {
    if (item.owned) {
      return (
        <span className="rounded-full border border-[#C9A84C]/40 bg-[#2d2412] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f2d37d]">
          Owned
        </span>
      )
    }

    return (
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
        {formatPrice(item.priceCents, item.isFree)}
      </span>
    )
  }

  const renderAction = () => {
    if (item.owned) {
      return (
        <button
          type="button"
          onClick={handleEquip}
          disabled={isEquipping || !item.targetId || !item.targetType}
          className={[
            'rounded-2xl px-4 py-3 text-sm font-semibold transition',
            item.equipped
              ? 'border border-[#C9A84C]/40 bg-[#3a2e15] text-[#f4d98d]'
              : 'bg-[#C9A84C] text-[#24180a] hover:bg-[#e4c265]',
            (isEquipping || !item.targetId || !item.targetType) ? 'cursor-not-allowed opacity-60' : '',
          ].join(' ')}
        >
          {isEquipping ? 'Equipping...' : item.equipped ? 'Equipped' : 'Equip'}
        </button>
      )
    }

    if (item.isFree || item.priceCents <= 0) {
      return (
        <button
          type="button"
          onClick={handleClaim}
          disabled={isClaiming}
          className="rounded-2xl bg-[#4f7a3f] px-4 py-3 text-sm font-semibold text-[#f4f2e8] transition hover:bg-[#5c9049] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClaiming ? 'Claiming...' : 'Claim Free'}
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isPurchasing}
        className="rounded-2xl bg-[#C9A84C] px-4 py-3 text-sm font-semibold text-[#24180a] transition hover:bg-[#e0bf63] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPurchasing ? 'Preparing checkout...' : `Buy - ${formatPrice(item.priceCents, item.isFree)}`}
      </button>
    )
  }

  return (
    <article className="realm-panel group relative overflow-hidden rounded-[28px] p-4 transition hover:-translate-y-1 hover:border-[var(--b3)]">
      {item.owned ? (
        <div className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(200,88,26,0.45)] bg-[var(--ember)] text-[var(--silver-0)] shadow-[0_0_24px_rgba(200,88,26,0.35)]">
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
            <path d="M7.7 13.6 4.5 10.4l-1.4 1.4 4.6 4.6L17 7.1l-1.4-1.4z" />
          </svg>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-[22px] border border-[var(--b1)] bg-[radial-gradient(circle_at_top,rgba(200,88,26,0.14),transparent_34%),linear-gradient(135deg,var(--steel-3)_0%,var(--steel-1)_48%,#0b1017_100%)]">
        {isPreviewImage(item.assetKey) ? (
          <Image
            src={item.assetKey ?? ''}
            alt={item.name}
            width={640}
            height={416}
            unoptimized
            className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-52 items-center justify-center px-6 text-center">
            <div>
              <p className="realm-label text-[var(--plate-hi)]">{getShopItemLabel(item.type)}</p>
              <p className="realm-page-title mt-3 text-2xl">{item.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--silver-0)]">{item.name}</h2>
          <p className="realm-lore mt-2 text-sm">{item.description ?? 'A handcrafted reward for your kingdom.'}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--b1)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--silver-2)]">
          {getShopItemLabel(item.type)}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        {renderStatus()}
        {renderAction()}
      </div>
    </article>
  )
}
