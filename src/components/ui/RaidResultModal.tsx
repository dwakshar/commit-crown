"use client";

import Link from "next/link";

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

type RaidResultModalProps = {
  open: boolean;
  raid: RaidResult | null;
  onClose: () => void;
};

export function RaidResultModal({ open, raid, onClose }: RaidResultModalProps) {
  if (!open || !raid) {
    return null;
  }

  const didWin = raid.result === "attacker_win";

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className="relative w-full max-w-[480px] overflow-hidden border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(5,8,13,0.97),rgba(6,10,16,0.9))] text-[var(--silver-1)] shadow-[0_28px_80px_rgba(0,0,0,0.56),0_0_0_1px_rgba(200,88,26,0.08)]">
        {/* Top shimmer line */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(176,196,214,0.28),transparent)]" />
        {/* Ambient glow — red on loss, ember on win */}
        <div
          className={`pointer-events-none absolute inset-0 ${
            didWin
              ? "bg-[radial-gradient(circle_at_top_right,rgba(200,88,26,0.1),transparent_40%)]"
              : "bg-[radial-gradient(circle_at_top_right,rgba(180,40,40,0.08),transparent_40%)]"
          }`}
        />

        {/* Header */}
        <div className="relative border-b border-[var(--b0)] px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--plate-hi)]">
                Raid Outcome
              </p>
              <h3
                className={`mt-2 font-[var(--font-head)] text-[1.75rem] leading-none ${
                  didWin ? "text-[var(--silver-0)]" : "text-[#ff9696]"
                }`}>
                {didWin ? "Victory in the Shadows" : "Defenses Held"}
              </h3>
              <p className="mt-2 text-sm italic text-[var(--silver-2)]">
                {didWin
                  ? `${raid.defenderName}'s treasury has been breached.`
                  : `${raid.defenderName}'s walls turned back the assault.`}
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

        {/* Power readout */}
        <div className="relative grid grid-cols-2 gap-px border-b border-[var(--b0)] bg-[var(--b0)]">
          <div className="bg-[rgba(7,10,16,0.96)] px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
              Attack Power
            </p>
            <p
              className={`mt-2 font-[var(--font-head)] text-[2rem] leading-none ${
                didWin ? "text-[var(--ember-hi)]" : "text-[var(--silver-2)]"
              }`}>
              {raid.attackPower}
            </p>
          </div>
          <div className="bg-[rgba(7,10,16,0.96)] px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
              Defense Power
            </p>
            <p
              className={`mt-2 font-[var(--font-head)] text-[2rem] leading-none ${
                didWin ? "text-[var(--silver-2)]" : "text-[#b9d9ff]"
              }`}>
              {raid.defensePower}
            </p>
          </div>
        </div>

        {/* Treasury result */}
        <div className="relative border-b border-[var(--b0)] px-5 py-5">
          {didWin ? (
            <div className="flex items-center gap-3">
              <span className="font-[var(--font-head)] text-[2.5rem] leading-none text-[#7fdb91]">
                +{raid.goldStolen.toLocaleString()}
              </span>
              <span className="text-sm text-[var(--silver-2)]">
                gold seized
              </span>
            </div>
          ) : (
            <p className="text-sm text-[var(--silver-2)]">
              No gold was taken — the raid was repelled.
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-px bg-[var(--b0)]">
            <div className="bg-[rgba(7,10,16,0.96)] px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                Your Treasury
              </p>
              <p className="mt-1 font-[var(--font-head)] text-lg text-[var(--silver-1)]">
                {raid.attackerGold.toLocaleString()}
              </p>
            </div>
            <div className="bg-[rgba(7,10,16,0.96)] px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                Defender Treasury
              </p>
              <p className="mt-1 font-[var(--font-head)] text-lg text-[var(--silver-1)]">
                {raid.defenderGold.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative flex items-center justify-between gap-3 px-5 py-4">
          <Link
            href="/raids/history"
            className="realm-button realm-button-secondary px-5 py-2.5 text-sm">
            Raid Log
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="realm-button border border-[rgba(200,88,26,0.58)] bg-[linear-gradient(180deg,rgba(36,16,10,0.86),rgba(24,10,6,0.92))] px-6 py-2.5 text-sm text-[var(--ember-hi)] transition hover:border-[var(--ember)] hover:text-[#ffd2ad]">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
