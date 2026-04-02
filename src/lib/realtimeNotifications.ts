'use client'

import { useEffect } from 'react'

import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/src/store/notificationStore'
import type { NotificationData } from '@/src/types/game'

export function useRealtimeNotifications(userId: string) {
  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const setNotifications = useNotificationStore((state) => state.setNotifications)
  const addNotification = useNotificationStore((state) => state.addNotification)
  const markAllReadLocal = useNotificationStore((state) => state.markAllReadLocal)

  useEffect(() => {
    if (!userId) {
      return
    }

    const supabase = createClient()
    let active = true
    let cleanupChannel: (() => void) | null = null
    let authenticatedUserId: string | null = null

    const fetchNotifications = async () => {
      if (!active || !authenticatedUserId) {
        return
      }

      const response = await fetch('/api/notifications', { cache: 'no-store' })
      if (!response.ok || !active) {
        return
      }

      const payload = (await response.json()) as { notifications: NotificationData[] }
      setNotifications(payload.notifications ?? [])
    }

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active || !user || user.id !== userId) {
        return
      }

      authenticatedUserId = user.id
      await fetchNotifications()
      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            addNotification(payload.new as NotificationData)
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            void fetchNotifications()
          }
        })

      cleanupChannel = () => {
        void supabase.removeChannel(channel)
      }
    }

    void bootstrap()

    return () => {
      active = false
      void cleanupChannel?.()
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
