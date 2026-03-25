'use client'

import { useEffect } from 'react'

import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/src/store/notificationStore'
import type { NotificationData } from '@/src/types/game'

export function useRealtimeNotifications(userId: string) {
  const { notifications, unreadCount, setNotifications, addNotification, markAllReadLocal } =
    useNotificationStore((state) => ({
      notifications: state.notifications,
      unreadCount: state.unreadCount,
      setNotifications: state.setNotifications,
      addNotification: state.addNotification,
      markAllReadLocal: state.markAllReadLocal,
    }))

  useEffect(() => {
    if (!userId) {
      return
    }

    const supabase = createClient()
    let active = true

    const bootstrap = async () => {
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      if (!response.ok || !active) {
        return
      }

      const payload = (await response.json()) as { notifications: NotificationData[] }
      setNotifications(payload.notifications ?? [])
    }

    void bootstrap()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          addNotification(payload.new as NotificationData)
        },
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [addNotification, setNotifications, userId])

  const markAllRead = async () => {
    const response = await fetch('/api/notifications/read-all', { method: 'POST' })

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: 'Unable to mark all as read' }))) as {
        error?: string
      }
      throw new Error(payload.error ?? 'Unable to mark all as read')
    }

    markAllReadLocal()
  }

  return { notifications, unreadCount, markAllRead }
}
