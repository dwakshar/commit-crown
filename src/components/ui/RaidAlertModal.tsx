"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase";
import { useNotificationStore } from "@/src/store/notificationStore";
import type { NotificationData } from "@/src/types/game";

const STORAGE_KEY = "seen_raid_popups";

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markSeen(id: string): void {
  try {
    const ids = getSeenIds();
    ids.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(-100)));
  } catch {}
}

export function RaidAlertModal() {
  const [raid, setRaid] = useState<NotificationData | null>(null);
  const [attackerName, setAttackerName] = useState<string | null>(null);
  // IDs shown in this browser session (before they're persisted on dismiss)
  const sessionSeen = useRef<Set<string>>(new Set());

  const notifications = useNotificationStore((s) => s.notifications);
  const activeToast = useNotificationStore((s) => s.activeToast);
  const dismissToast = useNotificationStore((s) => s.dismissToast);

  // ── Offline case ──────────────────────────────────────────────────────────
  // When the notification list loads (or updates), show the most recent unread
  // raid that hasn't been acknowledged yet.
  useEffect(() => {
    if (raid) return; // already showing one

    const seenIds = getSeenIds();
    const pending = notifications
      .filter(
        (n) =>
          n.type === "raid_received" &&
          !seenIds.has(n.id) &&
          !sessionSeen.current.has(n.id)
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    if (pending.length > 0) {
      startTransition(() => setRaid(pending[0]));
    }
  }, [notifications]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Online / real-time case ───────────────────────────────────────────────
  // When a new raid notification arrives while the user is on the page,
  // intercept it and show the big modal instead of the small toast.
  useEffect(() => {
    if (!activeToast || activeToast.type !== "raid_received") return;
    if (
      getSeenIds().has(activeToast.id) ||
      sessionSeen.current.has(activeToast.id)
    )
      return;

    dismissToast(); // suppress the tiny AchievementToast
    startTransition(() => setRaid(activeToast));
  }, [activeToast, dismissToast]);

  // ── Fetch attacker username ───────────────────────────────────────────────
  // setAttackerName(null) is intentionally omitted here — dismiss() handles
  // the reset as an event handler, and when raid is null the modal is not
  // rendered so the stale name is never visible.
  useEffect(() => {
    if (!raid) return;
    const attackerId = raid.data?.attacker_id as string | undefined;
    if (!attackerId) return;

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("username")
      .eq("id", attackerId)
      .maybeSingle()
      .then(({ data }) => setAttackerName(data?.username ?? null));
  }, [raid]);

  function dismiss() {
    if (raid) {
      markSeen(raid.id);
      sessionSeen.current.add(raid.id);
    }
    setRaid(null);
    setAttackerName(null);
  }

  if (!raid) return null;

  const isLoss = (raid.data?.result as string) === "attacker_win";
  const goldStolen = (raid.data?.gold_stolen as number) ?? 0;
  const handle = attackerName ? `@${attackerName}` : "an enemy";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={dismiss}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-sm overflow-hidden border animate-[raid-modal-in_0.4s_cubic-bezier(0.16,1,0.3,1)] ${
          isLoss
            ? "border-[rgba(220,50,50,0.35)] shadow-[0_0_100px_rgba(180,20,20,0.35),0_0_0_1px_rgba(220,50,50,0.12)]"
            : "border-[rgba(50,180,80,0.35)] shadow-[0_0_100px_rgba(20,140,50,0.3),0_0_0_1px_rgba(50,180,80,0.1)]"
        } bg-[linear-gradient(180deg,rgba(10,4,4,0.99),rgba(5,2,2,0.99))]`}
        onClick={(e) => e.stopPropagation()}>
        {/* Top accent line */}
        <div
          className={`absolute inset-x-0 top-0 h-px ${
            isLoss
              ? "bg-[linear-gradient(90deg,transparent,rgba(220,60,60,0.7),transparent)]"
              : "bg-[linear-gradient(90deg,transparent,rgba(60,220,90,0.6),transparent)]"
          }`}
        />

        {/* Radial background glow */}
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLoss
              ? "bg-[radial-gradient(ellipse_at_top,rgba(140,15,15,0.3),transparent_65%)]"
              : "bg-[radial-gradient(ellipse_at_top,rgba(15,100,30,0.25),transparent_65%)]"
          }`}
        />

        <div className="relative px-8 py-10 text-center">
          {/* Icon */}
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center border text-4xl ${
              isLoss
                ? "border-[rgba(200,50,50,0.3)] bg-[rgba(100,8,8,0.4)]"
                : "border-[rgba(50,180,80,0.3)] bg-[rgba(8,80,20,0.4)]"
            }`}>
            {isLoss ? "⚔️" : "🛡️"}
          </div>

          {isLoss ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.44em] text-[rgba(255,110,110,0.7)]">
                Your kingdom was raided
              </p>
              <h2 className="mt-3 font-[var(--font-head)] text-[2rem] uppercase leading-tight tracking-[0.05em] text-[#ff5a5a]">
                Oh Shit.
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--silver-1)]">
                You&apos;ve been{" "}
                <span className="font-semibold text-[var(--silver-0)]">
                  plundered
                </span>{" "}
                by <span className="font-bold text-[#ff8080]">{handle}</span>
              </p>

              {goldStolen > 0 && (
                <div className="mt-5 border border-[rgba(200,50,50,0.2)] bg-[rgba(80,8,8,0.35)] px-4 py-3">
                  <p className="text-[9px] uppercase tracking-[0.35em] text-[rgba(255,100,100,0.55)]">
                    Gold Pillaged
                  </p>
                  <p className="mt-1 font-[var(--font-head)] text-2xl text-[#ff6060]">
                    −{goldStolen}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-[0.44em] text-[rgba(80,220,110,0.7)]">
                Attack repelled
              </p>
              <h2 className="mt-3 font-[var(--font-head)] text-[2rem] uppercase leading-tight tracking-[0.05em] text-[#5fdc7a]">
                You Held.
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--silver-1)]">
                <span className="font-bold text-[#80e090]">{handle}</span> tried
                to raid your kingdom —{" "}
                <span className="font-semibold text-[var(--silver-0)]">
                  and failed.
                </span>
              </p>
            </>
          )}

          <p className="mt-4 text-[11px] text-[var(--silver-3)]">
            {new Date(raid.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          <button
            onClick={dismiss}
            className="mt-7 w-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-[var(--silver-2)] transition hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[var(--silver-0)]">
            Return to Kingdom
          </button>
        </div>
      </div>
    </div>
  );
}
