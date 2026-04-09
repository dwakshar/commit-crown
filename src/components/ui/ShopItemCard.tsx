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
        <span className="border border-[#C9A84C]/40 bg-[#2d2412] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2d37d]">
          Owned
        </span>
      )
    }

    return (
      <span className="border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
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
            'realm-button border px-4 py-3 text-[11px] transition',
            item.equipped
              ? 'border-[#C9A84C]/40 bg-[#3a2e15] text-[#f4d98d]'
              : 'border-[var(--ember)] bg-[rgba(44,21,13,0.72)] text-[var(--ember)] hover:bg-[rgba(60,28,16,0.85)]',
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
          className="realm-button border border-[rgba(79,162,103,0.45)] bg-[rgba(15,44,20,0.86)] px-4 py-3 text-[11px] text-[#9be2ac] transition hover:bg-[rgba(20,59,28,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
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
          className="realm-button border border-[var(--ember)] bg-[rgba(44,21,13,0.72)] px-4 py-3 text-[11px] text-[var(--ember)] transition hover:bg-[rgba(60,28,16,0.85)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPurchasing ? 'Preparing checkout...' : 'Acquire'}
        </button>
      )
  }

  return (
    <article className="group relative overflow-hidden border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(9,13,20,0.94),rgba(7,10,16,0.98))] transition hover:border-[rgba(200,88,26,0.45)]">
      {item.owned ? (
        <div className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center border border-[rgba(200,88,26,0.45)] bg-[rgba(24,10,6,0.95)] text-[var(--ember-hi)] shadow-[0_0_24px_rgba(200,88,26,0.2)]">
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
            <path d="M7.7 13.6 4.5 10.4l-1.4 1.4 4.6 4.6L17 7.1l-1.4-1.4z" />
          </svg>
        </div>
      ) : null}

      <div className="relative min-h-[216px] overflow-hidden border-b border-[var(--b1)] bg-[radial-gradient(circle_at_top,rgba(120,145,170,0.08),transparent_42%),linear-gradient(180deg,rgba(17,23,34,0.9),rgba(10,14,21,0.96))]">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(176,196,214,0.24),transparent)]" />
        {isPreviewImage(item.assetKey) ? (
          <Image
            src={item.assetKey ?? ''}
            alt={item.name}
            width={640}
            height={416}
            unoptimized
            className="h-[216px] w-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-[216px] items-center justify-center px-6 text-center">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[var(--b1)] bg-[rgba(255,255,255,0.02)] font-[var(--font-head)] text-xs uppercase tracking-[0.18em] text-[var(--plate-hi)]">
                {getShopItemLabel(item.type)
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </div>
              <p className="realm-page-title mt-4 text-2xl">{item.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-[rgba(80,105,130,0.08)] bg-[rgba(16,22,34,0.46)] px-4 py-4">
        <p className="realm-label text-[10px] text-[var(--plate-hi)]">{getShopItemLabel(item.type)}</p>
        <h2 className="mt-2 font-[var(--font-head)] text-xl text-[var(--silver-0)]">{item.name}</h2>
        <p className="realm-lore mt-2 text-sm">{item.description ?? 'A handcrafted reward for your kingdom.'}</p>
      </div>

      <div className="flex items-start justify-between gap-4 px-4 py-4">
        <div>
          <p
            className={`font-[var(--font-head)] text-xl ${
              item.isFree || item.priceCents <= 0 ? 'text-[#6fd38c]' : 'text-[var(--silver-0)]'
            }`}
          >
            {formatPrice(item.priceCents, item.isFree)}
          </p>
          <p className="mt-1 text-[11px] text-[var(--silver-3)]">
            {item.isFree || item.priceCents <= 0 ? 'Claim once' : 'One-time purchase'}
          </p>
        </div>
        <span className="shrink-0 border border-[var(--b1)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--silver-2)]">
          {getShopItemLabel(item.type)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[rgba(80,105,130,0.08)] px-4 py-4">
        {renderStatus()}
        {renderAction()}
      </div>
    </article>
  )
}
