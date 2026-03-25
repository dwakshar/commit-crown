'use client'

import { create } from 'zustand'

import type { NotificationData } from '@/src/types/game'

interface NotificationStore {
  notifications: NotificationData[]
  unreadCount: number
  activeToast: NotificationData | null
  setNotifications: (notifications: NotificationData[]) => void
  addNotification: (notification: NotificationData) => void
  markAllReadLocal: () => void
  dismissToast: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  activeToast: null,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read_at).length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 10),
      unreadCount: state.unreadCount + (notification.read_at ? 0 : 1),
      activeToast: notification,
    })),
  markAllReadLocal: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })),
  dismissToast: () => set({ activeToast: null }),
}))
