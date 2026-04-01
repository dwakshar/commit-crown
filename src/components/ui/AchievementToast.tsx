'use client'

import { useEffect } from 'react'

import { useNotificationStore } from '@/src/store/notificationStore'

const TOAST_STYLES = {
  achievement_unlocked:
    'border-[#C9A84C]/40 bg-[#2a2110] text-[#f7e3a6] shadow-[0_0_30px_rgba(201,168,76,0.35)]',
  raid_received:
    'border-[#b54b4b]/40 bg-[#2a1212] text-[#ffb3b3] shadow-[0_0_30px_rgba(181,75,75,0.3)]',
  kingdom_visited:
    'border-[#4b79b5]/40 bg-[#121d2a] text-[#b7d5ff] shadow-[0_0_30px_rgba(75,121,181,0.3)]',
  building_complete:
    'border-[#4b9b67]/40 bg-[#122318] text-[#b8efc8] shadow-[0_0_30px_rgba(75,155,103,0.3)]',
  purchase_complete:
    'border-[#5d8fdb]/40 bg-[#101c2f] text-[#c9ddff] shadow-[0_0_30px_rgba(93,143,219,0.3)]',
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

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90]">
      <div
        className={`min-w-[280px] rounded-2xl border px-4 py-3 backdrop-blur-md animate-[toast-in_0.35s_ease-out] ${TOAST_STYLES[activeToast.type]}`}
      >
        <p className="text-xs uppercase tracking-[0.24em] opacity-75">{activeToast.type.replaceAll('_', ' ')}</p>
        <p className="mt-2 text-sm font-medium">{activeToast.message}</p>
      </div>
    </div>
  )
}
