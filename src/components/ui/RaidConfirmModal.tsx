"use client";

import { useMemo, useState } from "react";

import { RaidResultModal } from "@/src/components/ui/RaidResultModal";

type RaidResult = {
  id: string;
  result: "attacker_win" | "defender_win";
  attackPower: number;
  defensePower: number;
  goldStolen: number;
  attackerGold: number;
  defenderGold: number;
  defenderName: string;
};

type RaidConfirmModalProps = {
  open: boolean;
  attackerName: string;
  attackerAttackRating: number;
  attackerGold: number;
  defenderId: string;
  defenderName: string;
  defenderDefenseRating: number;
  defenderGold: number;
  onClose: () => void;
};

export function RaidConfirmModal({
  open,
  attackerName,
  attackerAttackRating,
  attackerGold,
  defenderId,
  defenderName,
  defenderDefenseRating,
  defenderGold,
  onClose,
}: RaidConfirmModalProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [raidResult, setRaidResult] = useState<RaidResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const estimatedWinProbability = useMemo(() => {
    const total = attackerAttackRating + defenderDefenseRating;
    if (total <= 0) return 50;
    return Math.round((attackerAttackRating / total) * 100);
  }, [attackerAttackRating, defenderDefenseRating]);

  const winColor =
    estimatedWinProbability >= 70
      ? "text-[#7fdb91]"
      : estimatedWinProbability >= 40
      ? "text-[var(--ember-hi)]"
      : "text-[#ff9696]";

  if (!open) return null;

  const handleLaunchRaid = async () => {
    setIsLaunching(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/raid/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defenderId }),
      });

      const payload = (await response.json()) as {
        error?: string;
        availableAt?: string;
        raid?: RaidResult;
      };

      if (!response.ok || !payload.raid) {
        if (response.status === 429 && payload.availableAt) {
          throw new Error(
            `Cooldown active until ${new Date(
              payload.availableAt
            ).toLocaleString()}`
          );
        }
        throw new Error(payload.error ?? "Raid failed");
      }

      setRaidResult(payload.raid);
      setShowResult(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Raid failed");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}>
        {/* Panel */}
        <div className="relative w-full max-w-[560px] overflow-hidden border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(5,8,13,0.97),rgba(6,10,16,0.9))] text-[var(--silver-1)] shadow-[0_28px_80px_rgba(0,0,0,0.56),0_0_0_1px_rgba(200,88,26,0.08)]">
          {/* Top shimmer line */}
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(176,196,214,0.28),transparent)]" />
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,88,26,0.1),transparent_40%)]" />

          {/* Header */}
          <div className="relative border-b border-[var(--b0)] px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--plate-hi)]">
                  Raid Orders
                </p>
                <h3 className="mt-2 font-[var(--font-head)] text-[1.75rem] leading-none text-[var(--silver-0)]">
                  War Tribunal
                </h3>
                <p className="mt-2 text-sm italic text-[var(--silver-2)]">
                  Commit troops and resolve the engagement.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] text-lg text-[var(--silver-2)] transition hover:border-[var(--b2)] hover:text-[var(--silver-0)]"
                aria-label="Close">
                ×
              </button>
            </div>
          </div>

          {/* Commander cards */}
          <div className="relative grid grid-cols-[1fr_auto_1fr] items-stretch border-b border-[var(--b0)]">
            {/* Attacker */}
            <div className="px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                Attacker
              </p>
              <p className="mt-2 font-[var(--font-head)] text-[1.25rem] leading-none text-[var(--silver-0)]">
                {attackerName}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-px bg-[var(--b0)]">
                <div className="bg-[rgba(7,10,16,0.96)] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                    Attack
                  </p>
                  <p className="mt-1 font-[var(--font-head)] text-xl text-[var(--ember-hi)]">
                    {attackerAttackRating}
                  </p>
                </div>
                <div className="bg-[rgba(7,10,16,0.96)] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                    Treasury
                  </p>
                  <p className="mt-1 font-[var(--font-head)] text-xl text-[var(--silver-1)]">
                    {attackerGold.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center justify-center gap-2 border-x border-[var(--b0)] px-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                Win Odds
              </p>
              <p
                className={`font-[var(--font-head)] text-[2rem] leading-none ${winColor}`}>
                {estimatedWinProbability}%
              </p>
            </div>

            {/* Defender */}
            <div className="px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                Defender
              </p>
              <p className="mt-2 font-[var(--font-head)] text-[1.25rem] leading-none text-[var(--silver-0)]">
                {defenderName}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-px bg-[var(--b0)]">
                <div className="bg-[rgba(7,10,16,0.96)] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                    Defense
                  </p>
                  <p className="mt-1 font-[var(--font-head)] text-xl text-[#b9d9ff]">
                    {defenderDefenseRating}
                  </p>
                </div>
                <div className="bg-[rgba(7,10,16,0.96)] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                    Treasury
                  </p>
                  <p className="mt-1 font-[var(--font-head)] text-xl text-[var(--silver-1)]">
                    {defenderGold.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Advisory */}
          <div className="relative border-b border-[var(--b0)] px-5 py-4">
            {isLaunching ? (
              <div className="flex items-center gap-3 text-sm text-[var(--silver-2)]">
                <span className="animate-pulse text-[var(--ember-hi)]">⚔</span>
                Troops are marching — awaiting the server&apos;s verdict...
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--silver-2)]">
                Outcome is resolved server-side. A victory steals up to 12% of
                the defender&apos;s treasury (50 gold minimum). The same target
                cannot be raided again for 24 hours.
              </p>
            )}
            {errorMessage ? (
              <p className="mt-3 text-sm text-[#ff9696]">{errorMessage}</p>
            ) : null}
          </div>

          {/* Actions */}
          <div className="relative flex items-center justify-end gap-2 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="realm-button realm-button-secondary px-5 py-2.5 text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLaunchRaid}
              disabled={isLaunching}
              className="realm-button border border-[rgba(200,88,26,0.58)] bg-[linear-gradient(180deg,rgba(36,16,10,0.86),rgba(24,10,6,0.92))] px-6 py-2.5 text-sm text-[var(--ember-hi)] transition hover:border-[var(--ember)] hover:text-[#ffd2ad] disabled:cursor-not-allowed disabled:opacity-55">
              {isLaunching ? "Launching..." : "Launch Raid"}
            </button>
          </div>
        </div>
      </div>

      <RaidResultModal
        open={showResult}
        raid={raidResult}
        onClose={() => {
          setShowResult(false);
          onClose();
        }}
      />
    </>
  );
}
