"use client";

import { useEffect, useRef, useState } from "react";

import { formatDistanceToNowStrict } from "date-fns";

import { useRealtimeNotifications } from "@/src/lib/realtimeNotifications";
import type { NotificationType } from "@/src/types/game";

const NOTIFICATION_STYLES = {
  raid_received: {
    accent: "border-[#b54b4b]/50",
    glow: "shadow-[0_0_0_1px_rgba(181,75,75,0.12)]",
    badge: "text-[#ffb1b1]",
  },
  kingdom_visited: {
    accent: "border-[#4b79b5]/50",
    glow: "shadow-[0_0_0_1px_rgba(75,121,181,0.12)]",
    badge: "text-[#b9d9ff]",
  },
  achievement_unlocked: {
    accent: "border-[#C9A84C]/50",
    glow: "shadow-[0_0_0_1px_rgba(201,168,76,0.12)]",
    badge: "text-[#f2d58b]",
  },
  building_complete: {
    accent: "border-[#4b9b67]/50",
    glow: "shadow-[0_0_0_1px_rgba(75,155,103,0.12)]",
    badge: "text-[#9ee0b4]",
  },
  purchase_complete: {
    accent: "border-[#5d8fdb]/50",
    glow: "shadow-[0_0_0_1px_rgba(93,143,219,0.12)]",
    badge: "text-[#b5d4ff]",
  },
} as const;

const NOTIFICATION_COPY: Record<
  NotificationType,
  {
    short: string;
    icon: string;
  }
> = {
  raid_received: { short: "Raid", icon: "⚔" },
  kingdom_visited: { short: "Visitor", icon: "✦" },
  achievement_unlocked: { short: "Glory", icon: "✧" },
  building_complete: { short: "Forge", icon: "▣" },
  purchase_complete: { short: "Bazaar", icon: "◈" },
};

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { notifications, unreadCount, markAllRead } =
    useRealtimeNotifications(userId);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    setActionError(null);

    try {
      await markAllRead();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to mark notifications as read"
      );
    }
  };

  const unreadLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? unreadCount.toString() : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative flex h-11 min-w-11 items-center justify-center overflow-hidden border px-3 transition ${
          open
            ? "border-[rgba(200,88,26,0.56)] bg-[linear-gradient(180deg,rgba(40,18,11,0.94),rgba(23,10,7,0.94))] text-[var(--silver-0)] shadow-[0_10px_28px_rgba(200,88,26,0.2)]"
            : "border-[var(--b1)] bg-[linear-gradient(180deg,rgba(18,24,34,0.96),rgba(9,13,20,0.94))] text-[var(--silver-1)] hover:border-[var(--b2)] hover:text-[var(--silver-0)]"
        }`}
        aria-label={open ? "Close notifications" : "Open notifications"}
        aria-expanded={open}>
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(176,196,214,0.36),transparent)]" />
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-[18px] w-[18px]">
          <path
            d="M10 3.2a3.4 3.4 0 0 0-3.4 3.4v1.2c0 .9-.2 1.8-.7 2.6l-.9 1.4c-.2.3 0 .8.4.8h8.8c.4 0 .6-.5.4-.8l-.9-1.4c-.5-.8-.7-1.7-.7-2.6V6.6A3.4 3.4 0 0 0 10 3.2Zm0 12.8a2.2 2.2 0 0 1-2-1.3h4A2.2 2.2 0 0 1 10 16Z"
            fill="currentColor"
          />
        </svg>
        {unreadLabel ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center border border-[rgba(255,212,173,0.28)] bg-[linear-gradient(180deg,var(--ember-hi),var(--ember))] px-1 text-[10px] font-bold text-[var(--silver-0)] shadow-[0_0_18px_rgba(200,88,26,0.35)]">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-[70] w-[min(380px,calc(100vw-1.5rem))] overflow-hidden border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(11,15,23,0.98),rgba(5,8,13,0.98))] text-[var(--silver-1)] shadow-[0_28px_80px_rgba(0,0,0,0.56),0_0_0_1px_rgba(200,88,26,0.08)] max-md:fixed max-md:left-3 max-md:right-3 max-md:top-[92px] max-md:w-auto">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,88,26,0.16),transparent_28%),linear-gradient(135deg,rgba(176,196,214,0.05),transparent_24%)]" />
          <div className="relative border-b border-[var(--b0)] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="realm-label text-[var(--plate-hi)]">War Desk</p>
                <p className="mt-1 font-[var(--font-head)] text-[1.15rem] uppercase tracking-[0.08em] text-[var(--silver-0)]">
                  Realm Signals
                </p>
                <p className="mt-1 text-sm text-[var(--silver-2)]">
                  Recent alerts from across your kingdom.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] text-[var(--silver-2)] transition hover:border-[var(--b2)] hover:text-[var(--silver-0)]"
                aria-label="Close notifications">
                ×
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="border border-[rgba(200,88,26,0.18)] bg-[rgba(44,21,13,0.42)] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                  Unread
                </p>
                <p className="mt-1 font-[var(--font-head)] text-xl text-[var(--silver-0)]">
                  {unreadCount}
                </p>
              </div>
              <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                  Archive
                </p>
                <p className="mt-1 font-[var(--font-head)] text-xl text-[var(--silver-0)]">
                  {notifications.length}
                </p>
              </div>
            </div>
          </div>

          <div className="relative px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                Last 10 kingdom events
              </p>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={notifications.length === 0 || unreadCount === 0}
                className="realm-button realm-button-secondary px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                Mark all as read
              </button>
            </div>

            {actionError ? (
              <p className="mt-3 text-sm text-[#ff9696]">{actionError}</p>
            ) : null}
          </div>

          <div className="relative max-h-[min(60vh,460px)] space-y-3 overflow-y-auto px-4 pb-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`border bg-[linear-gradient(180deg,rgba(18,23,32,0.96),rgba(8,12,18,0.98))] p-3.5 ${
                    NOTIFICATION_STYLES[notification.type].accent
                  } ${NOTIFICATION_STYLES[notification.type].glow}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--b0)] bg-[linear-gradient(180deg,rgba(200,88,26,0.12),rgba(255,255,255,0.02))] font-[var(--font-head)] text-sm text-[var(--silver-0)]">
                      {NOTIFICATION_COPY[notification.type].icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className={`text-[11px] uppercase tracking-[0.22em] ${
                            NOTIFICATION_STYLES[notification.type].badge
                          }`}>
                          {NOTIFICATION_COPY[notification.type].short}
                        </p>
                        <span className="text-[11px] text-[var(--silver-3)]">
                          {formatDistanceToNowStrict(
                            new Date(notification.created_at),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--silver-1)]">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="border border-[var(--b0)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] text-lg text-[var(--silver-2)]">
                  ✦
                </div>
                <p className="mt-4 font-[var(--font-head)] text-[1rem] uppercase tracking-[0.08em] text-[var(--silver-0)]">
                  Quiet battlements
                </p>
                <p className="mt-2 text-sm leading-5 text-[var(--silver-2)]">
                  No messages from the realm yet. Raids, achievements, and
                  visits will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
