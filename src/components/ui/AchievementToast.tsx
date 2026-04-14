'use client'

import { useEffect } from 'react'

import { useNotificationStore } from '@/src/store/notificationStore'

const TOAST_CONFIG = {
  achievement_unlocked: {
    label: 'Achievement Unlocked',
    accent: 'text-[var(--ember-hi)]',
    border: 'border-[rgba(200,88,26,0.35)]',
    glow: 'shadow-[0_0_0_1px_rgba(200,88,26,0.08),0_12px_40px_rgba(0,0,0,0.55)]',
  },
  raid_received: {
    label: 'Raid Incoming',
    accent: 'text-[#ff9696]',
    border: 'border-[rgba(180,60,60,0.35)]',
    glow: 'shadow-[0_0_0_1px_rgba(180,60,60,0.08),0_12px_40px_rgba(0,0,0,0.55)]',
  },
  kingdom_visited: {
    label: 'Kingdom Visited',
    accent: 'text-[#b9d9ff]',
    border: 'border-[rgba(75,121,181,0.35)]',
    glow: 'shadow-[0_0_0_1px_rgba(75,121,181,0.08),0_12px_40px_rgba(0,0,0,0.55)]',
  },
  building_complete: {
    label: 'Construction Complete',
    accent: 'text-[#7fdb91]',
    border: 'border-[rgba(75,155,103,0.35)]',
    glow: 'shadow-[0_0_0_1px_rgba(75,155,103,0.08),0_12px_40px_rgba(0,0,0,0.55)]',
  },
  purchase_complete: {
    label: 'Purchase Complete',
    accent: 'text-[#b9d9ff]',
    border: 'border-[rgba(93,143,219,0.35)]',
    glow: 'shadow-[0_0_0_1px_rgba(93,143,219,0.08),0_12px_40px_rgba(0,0,0,0.55)]',
  },
} as const

export function AchievementToast() {
  const activeToast = useNotificationStore((state) => state.activeToast)
  const dismissToast = useNotificationStore((state) => state.dismissToast)

  useEffect(() => {
    if (!activeToast) {
      return
    }

    const timeoutId = window.setTimeout(() => dismissToast(), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [activeToast, dismissToast])

  if (!activeToast) {
    return null
  }

  const config = TOAST_CONFIG[activeToast.type]

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90]">
      <div
        className={`relative min-w-[300px] overflow-hidden border bg-[linear-gradient(180deg,rgba(5,8,13,0.97),rgba(6,10,16,0.92))] px-4 py-4 backdrop-blur-[2px] animate-[toast-in_0.35s_ease-out] ${config.border} ${config.glow}`}
      >
        {/* Top shimmer line */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(176,196,214,0.2),transparent)]" />

        <p className={`text-[10px] uppercase tracking-[0.28em] ${config.accent}`}>
          {config.label}
        </p>
        <p className="mt-2 text-sm text-[var(--silver-1)]">{activeToast.message}</p>
      </div>
    </div>
  )
}
