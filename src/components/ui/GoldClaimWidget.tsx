"use client";

import { useEffect, useRef, useState } from "react";

import { useKingdomStore } from "@/src/store/kingdomStore";

const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
const STORAGE_KEY = "commit_crown_last_gold_claim";
const CLAIM_AMOUNT = 50;

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ready";
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function GoldClaimWidget() {
  const updateGold = useKingdomStore((s) => s.updateGold);

  const [lastClaimAt, setLastClaimAt] = useState<string | null>(null);
  const [msLeft, setMsLeft] = useState(0);
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setLastClaimAt(stored);
  }, []);

  // Live countdown
  useEffect(() => {
    function tick() {
      if (!lastClaimAt) {
        setMsLeft(0);
        return;
      }
      const elapsed = Date.now() - new Date(lastClaimAt).getTime();
      const remaining = Math.max(0, COOLDOWN_MS - elapsed);
      setMsLeft(remaining);
    }

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lastClaimAt]);

  const isReady = msLeft === 0;

  // Auto-open the popup when ready — either on page load (return after 2h) or
  // when the live countdown hits zero.
  const prevIsReadyRef = useRef(isReady);
  useEffect(() => {
    const wasReady = prevIsReadyRef.current;
    prevIsReadyRef.current = isReady;
    if (isReady && !wasReady) {
      // Countdown just hit zero while the page was open
      setOpen(true);
    }
  }, [isReady]);

  // On mount: if a previous claim exists AND 2h have passed, pop open automatically.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return; // first-ever load — don't auto-open
    const elapsed = Date.now() - new Date(stored).getTime();
    if (elapsed >= COOLDOWN_MS) setOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClaim() {
    if (!isReady || claiming) return;
    setClaiming(true);
    setClaimMsg(null);

    try {
      const res = await fetch("/api/kingdom/claim-gold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastClaimAt }),
      });

      const data = await res.json();

      if (!res.ok) {
        setClaimMsg(data.error ?? "Failed to claim");
        return;
      }

      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, now);
      setLastClaimAt(now);
      updateGold(data.gold);
      setClaimMsg(`+${CLAIM_AMOUNT} gold claimed!`);

      // Auto-close after 2s
      setTimeout(() => {
        setOpen(false);
        setClaimMsg(null);
      }, 2000);
    } catch {
      setClaimMsg("Network error");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Popup panel */}
      {open && (
        <div className="mb-1 w-56 rounded-xl border border-[var(--b0)] bg-[#0d1520]/95 shadow-2xl backdrop-blur-sm">
          <div className="border-b border-[var(--b0)] px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
              Treasury
            </div>
            <div className="mt-1 font-[var(--font-head)] text-base text-[var(--silver-0)]">
              Free Gold
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="mb-3 text-center">
              <span className="text-3xl">🏺</span>
              <div className="mt-1 font-[var(--font-head)] text-2xl text-[#f4c94e]">
                +{CLAIM_AMOUNT}
              </div>
              <div className="text-[11px] text-[var(--silver-3)]">gold per claim</div>
            </div>

            {claimMsg ? (
              <div
                className={`rounded-lg px-3 py-2 text-center text-sm font-semibold ${
                  claimMsg.startsWith("+")
                    ? "bg-[rgba(244,201,78,0.15)] text-[#f4c94e]"
                    : "bg-[rgba(255,80,80,0.12)] text-red-400"
                }`}
              >
                {claimMsg}
              </div>
            ) : isReady ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full rounded-lg bg-[#f4c94e] px-3 py-2 text-sm font-bold text-[#0d0e14] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {claiming ? "Claiming…" : "Claim Gold"}
              </button>
            ) : (
              <div className="rounded-lg bg-[rgba(255,255,255,0.04)] px-3 py-2 text-center">
                <div className="text-[10px] uppercase tracking-widest text-[var(--silver-3)]">
                  Next claim in
                </div>
                <div className="mt-0.5 font-[var(--font-head)] text-lg text-[var(--silver-1)]">
                  {formatCountdown(msLeft)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating chest button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={isReady ? "Claim free gold!" : `Gold ready in ${formatCountdown(msLeft)}`}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all ${
          isReady
            ? "animate-pulse border-[#f4c94e]/60 bg-[#1a1408] text-2xl shadow-[0_0_16px_rgba(244,201,78,0.4)] hover:scale-110"
            : "border-[var(--b0)] bg-[#0d1520]/90 text-xl hover:scale-105"
        }`}
      >
        🏺
        {isReady && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f4c94e] text-[9px] font-bold text-[#0d0e14]">
            !
          </span>
        )}
      </button>
    </div>
  );
}
