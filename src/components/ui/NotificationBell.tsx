'use client'

import { useState } from 'react'

import { formatDistanceToNowStrict } from 'date-fns'

import { useRealtimeNotifications } from '@/src/lib/realtimeNotifications'

const NOTIFICATION_STYLES = {
  raid_received: 'border-l-[#b54b4b] bg-[#251315]',
  kingdom_visited: 'border-l-[#4b79b5] bg-[#131c25]',
  achievement_unlocked: 'border-l-[#C9A84C] bg-[#251f10]',
  building_complete: 'border-l-[#4b9b67] bg-[#132017]',
  purchase_complete: 'border-l-[#5d8fdb] bg-[#111c2c]',
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
        className="realm-button realm-button-secondary relative flex h-12 min-w-12 items-center justify-center rounded-[16px] px-4 text-[var(--silver-1)]"
        aria-label="Open notifications"
      >
        <span className="text-xs uppercase tracking-[0.22em]">Bell</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ember)] px-1 text-[11px] font-bold text-[var(--silver-0)]">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="realm-panel absolute right-0 top-14 z-50 w-[360px] rounded-[26px] p-4 text-[var(--silver-1)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="realm-label text-[var(--plate-hi)]">Notifications</p>
              <p className="mt-1 text-sm text-[var(--silver-2)]">Last 10 kingdom events</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="realm-button realm-button-secondary rounded-[14px] px-3 py-2 text-[11px]"
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
                  className={`rounded-2xl border border-[var(--b0)] border-l-4 p-3 ${NOTIFICATION_STYLES[notification.type]}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--silver-3)]">
                      {notification.type.replaceAll('_', ' ')}
                    </p>
                    <span className="text-[11px] text-[var(--silver-3)]">
                      {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--silver-1)]">{notification.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-[var(--silver-2)]">
                No messages from the realm yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
