"use client";

import { useState } from "react";

import { RaidConfirmModal } from "@/src/components/ui/RaidConfirmModal";

type RivalData = {
  userId: string;
  username: string;
  kingdomName: string;
  prestige: number;
  gold: number;
  defenseRating: number;
};

type Phase = "idle" | "searching" | "found" | "error";

type Props = {
  attackerName: string;
  attackerAttackRating: number;
  attackerGold: number;
};

export function FindRivalPanel({
  attackerName,
  attackerAttackRating,
  attackerGold,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rival, setRival] = useState<RivalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaidModal, setShowRaidModal] = useState(false);

  const findRival = async () => {
    setPhase("searching");
    setError(null);

    try {
      const res = await fetch("/api/raid/find-rival");
      const text = await res.text();

      let payload: { error?: string; rival?: RivalData };
      try {
        payload = JSON.parse(text) as typeof payload;
      } catch {
        throw new Error(`Server error (${res.status})`);
      }

      if (!res.ok || !payload.rival) {
        throw new Error(payload.error ?? "No rivals found");
      }

      setRival(payload.rival);
      setPhase("found");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setPhase("error");
    }
  };

  return (
    <>
      <div className="realm-panel overflow-hidden">
        {/* Header */}
        <div className="border-b border-[var(--b0)] px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--plate-hi)]">
            War Council
          </p>
          <h2 className="mt-2 font-[var(--font-head)] text-[1.8rem] leading-none text-[var(--silver-0)]">
            Find Rival Kingdom
          </h2>
          <p className="mt-2 text-sm italic text-[var(--silver-2)]">
            Scout the realm and identify a worthy target for your next campaign.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* ── Idle ─────────────────────────────────────────────────────── */}
          {phase === "idle" && (
            <button
              type="button"
              onClick={findRival}
              className="realm-button border border-[rgba(200,88,26,0.58)] bg-[linear-gradient(180deg,rgba(36,16,10,0.86),rgba(24,10,6,0.92))] px-7 py-3 text-sm text-[var(--ember-hi)] transition hover:border-[var(--ember)] hover:text-[#ffd2ad]">
              Find Rival Kingdom
            </button>
          )}

          {/* ── Searching ────────────────────────────────────────────────── */}
          {phase === "searching" && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[rgba(200,88,26,0.18)] border-t-[var(--ember)]" />
                <div
                  className="absolute inset-[6px] animate-spin rounded-full border-2 border-[rgba(200,88,26,0.1)] border-b-[rgba(200,88,26,0.45)]"
                  style={{
                    animationDuration: "1.4s",
                    animationDirection: "reverse",
                  }}
                />
                <div className="absolute inset-[14px] flex items-center justify-center">
                  <span className="text-xs text-[var(--ember)]">⚔</span>
                </div>
              </div>
              <div className="space-y-1 text-center">
                <p className="animate-pulse text-[11px] uppercase tracking-[0.3em] text-[var(--silver-3)]">
                  Scouting the realm
                </p>
                <p className="text-[11px] text-[var(--silver-3)] opacity-60">
                  Identifying rival commanders...
                </p>
              </div>
            </div>
          )}

          {/* ── Found ────────────────────────────────────────────────────── */}
          {phase === "found" && rival && (
            <div className="space-y-5">
              <div className="border border-[rgba(200,88,26,0.22)] bg-[rgba(44,21,13,0.2)]">
                <div className="border-b border-[rgba(200,88,26,0.14)] px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--plate-hi)]">
                    Target Identified
                  </p>
                  <h3 className="mt-2 font-[var(--font-head)] text-[1.55rem] leading-none text-[var(--silver-0)]">
                    {rival.kingdomName}
                  </h3>
                  <p className="mt-1 text-sm italic text-[var(--silver-3)]">
                    Commanded by @{rival.username}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-px bg-[var(--b0)]">
                  <div className="bg-[rgba(7,10,16,0.96)] px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                      Prestige
                    </p>
                    <p className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
                      {rival.prestige.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[rgba(7,10,16,0.96)] px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                      Defense
                    </p>
                    <p className="mt-2 font-[var(--font-head)] text-2xl text-[#b9d9ff]">
                      {rival.defenseRating.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[rgba(7,10,16,0.96)] px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                      Treasury
                    </p>
                    <p className="mt-2 font-[var(--font-head)] text-2xl text-[#f3d58d]">
                      {rival.gold.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Win odds preview */}
              {(() => {
                const total = attackerAttackRating + rival.defenseRating;
                const pct =
                  total <= 0
                    ? 50
                    : Math.round((attackerAttackRating / total) * 100);
                const color =
                  pct >= 70
                    ? "text-[#7fdb91]"
                    : pct >= 40
                    ? "text-[var(--ember-hi)]"
                    : "text-[#ff9696]";
                return (
                  <div className="flex items-center gap-3 border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                      Estimated win odds
                    </span>
                    <span
                      className={`font-[var(--font-head)] text-2xl ${color}`}>
                      {pct}%
                    </span>
                  </div>
                );
              })()}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={findRival}
                  className="realm-button realm-button-secondary px-5 py-2.5 text-sm">
                  Scout Another
                </button>
                <button
                  type="button"
                  onClick={() => setShowRaidModal(true)}
                  className="realm-button border border-[rgba(200,88,26,0.58)] bg-[linear-gradient(180deg,rgba(36,16,10,0.86),rgba(24,10,6,0.92))] px-7 py-2.5 text-sm text-[var(--ember-hi)] transition hover:border-[var(--ember)] hover:text-[#ffd2ad]">
                  Launch Raid
                </button>
              </div>
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {phase === "error" && (
            <div className="space-y-4">
              <p className="text-sm text-[#ff9696]">
                {error ?? "Search failed"}
              </p>
              <button
                type="button"
                onClick={findRival}
                className="realm-button realm-button-secondary px-5 py-2.5 text-sm">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {rival && (
        <RaidConfirmModal
          open={showRaidModal}
          attackerName={attackerName}
          attackerAttackRating={attackerAttackRating}
          attackerGold={attackerGold}
          defenderId={rival.userId}
          defenderName={rival.username}
          defenderDefenseRating={rival.defenseRating}
          defenderGold={rival.gold}
          onClose={() => {
            setShowRaidModal(false);
            setPhase("idle");
            setRival(null);
          }}
        />
      )}
    </>
  );
}
