'use client'

import { useState } from 'react'

import { formatDistanceToNowStrict } from 'date-fns'

import { useRealtimeNotifications } from '@/src/lib/realtimeNotifications'

const NOTIFICATION_STYLES = {
  raid_received: 'border-l-[#b54b4b] bg-[#251315]',
  kingdom_visited: 'border-l-[#4b79b5] bg-[#131c25]',
  achievement_unlocked: 'border-l-[#C9A84C] bg-[#251f10]',
  building_complete: 'border-l-[#4b9b67] bg-[#132017]',
} as const

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const { notifications, unreadCount, markAllRead } = useRealtimeNotifications(userId)

  const handleMarkAllRead = async () => {
    setActionError(null)

    try {
      await markAllRead()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to mark notifications as read')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/85 transition hover:bg-white/10"
        aria-label="Open notifications"
      >
        <span className="text-lg">Bell</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C9A84C] px-1 text-[11px] font-bold text-[#1b1508]">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[360px] rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,15,30,0.98),rgba(10,7,16,0.97))] p-4 text-[#f7f1e4] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#C9A84C]/75">Notifications</p>
              <p className="mt-1 text-sm text-white/60">Last 10 kingdom events</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75 transition hover:bg-white/10"
            >
              Mark all as read
            </button>
          </div>

          {actionError ? <p className="mt-3 text-sm text-[#ff9696]">{actionError}</p> : null}

          <div className="mt-4 space-y-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-2xl border border-white/10 border-l-4 p-3 ${NOTIFICATION_STYLES[notification.type]}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                      {notification.type.replaceAll('_', ' ')}
                    </p>
                    <span className="text-[11px] text-white/45">
                      {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/85">{notification.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                No messages from the realm yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
