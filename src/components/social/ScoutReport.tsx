"use client";

import { useMemo, useState } from "react";

import { formatDistanceToNowStrict } from "date-fns";
import Image from "next/image";

import { RaidConfirmModal } from "@/src/components/ui/RaidConfirmModal";
import type { KingdomData } from "@/src/types/game";

type ScoutReportProps = {
  kingdomData: KingdomData;
  prestigeRank: number;
  totalBuildings: number;
  topLanguage: string;
  recentVisitors: string[];
  canLeaveFlag: boolean;
  canRaid: boolean;
  attackerName?: string;
  attackerAttackRating?: number;
  attackerGold?: number;
};

export function ScoutReport({
  kingdomData,
  prestigeRank,
  totalBuildings,
  topLanguage,
  recentVisitors,
  canLeaveFlag,
  canRaid,
  attackerName,
  attackerAttackRating,
  attackerGold,
}: ScoutReportProps) {
  const [isFlagging, setIsFlagging] = useState(false);
  const [hasFlagged, setHasFlagged] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRaidOpen, setIsRaidOpen] = useState(false);

  const accountAge = useMemo(() => {
    if (!kingdomData.ownerCreatedAt) {
      return "Unknown age";
    }

    return formatDistanceToNowStrict(new Date(kingdomData.ownerCreatedAt), {
      addSuffix: true,
    });
  }, [kingdomData.ownerCreatedAt]);

  const handleLeaveFlag = async () => {
    setIsFlagging(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/visit/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ defenderId: kingdomData.userId }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to leave a flag");
      }

      setHasFlagged(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to leave a flag"
      );
    } finally {
      setIsFlagging(false);
    }
  };

  const commandHandle =
    kingdomData.ownerGithubUsername ?? kingdomData.ownerName;
  const kingdomStatus = kingdomData.raids_enabled
    ? "Raid window open"
    : "Protected keep";
  const defenseLabel = kingdomData.defense_rating.toLocaleString();
  const treasuryLabel = kingdomData.gold.toLocaleString();

  return (
    <>
      <aside className="pointer-events-auto w-full max-w-[420px] overflow-hidden border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(5,8,13,0.97),rgba(6,10,16,0.9))] text-[var(--silver-1)] shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
        <div className="border-b border-[var(--b1)] px-5 py-6">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
            Scout Report
          </div>
          <div className="mt-2 font-[var(--font-head)] text-[1.9rem] leading-none text-[var(--silver-0)]">
            {kingdomData.name}
          </div>
          <div className="mt-2 text-sm italic text-[var(--silver-2)]">
            Commanded by @{commandHandle.toLowerCase()} / {kingdomStatus}
          </div>
        </div>

        <div className="border-b border-[var(--b0)] px-5 py-5">
          <div className="flex items-center gap-4">
            {kingdomData.ownerAvatarUrl ? (
              <Image
                src={kingdomData.ownerAvatarUrl}
                alt={kingdomData.ownerName}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-[22px] border border-[var(--b1)] object-cover"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-[var(--b1)] bg-[var(--steel-3)] text-2xl font-[var(--font-head)] text-[var(--silver-0)]">
                {kingdomData.ownerName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                Commander
              </div>
              <h1 className="mt-2 font-[var(--font-head)] text-[1.5rem] leading-none text-[var(--silver-0)]">
                {kingdomData.ownerName}
              </h1>
              <p className="mt-2 text-sm text-[var(--silver-2)]">
                @{commandHandle}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--silver-3)]">
                Defense {defenseLabel} / Treasury {treasuryLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-b border-[var(--b0)] bg-[var(--b0)]">
          <div className="bg-[rgba(7,10,16,0.96)] px-5 py-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
              Prestige Rank
            </div>
            <div className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
              #{prestigeRank}
            </div>
          </div>
          <div className="bg-[rgba(7,10,16,0.96)] px-5 py-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
              Structures
            </div>
            <div className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
              {totalBuildings}
            </div>
          </div>
          <div className="bg-[rgba(7,10,16,0.96)] px-5 py-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
              Top Language
            </div>
            <div className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
              {topLanguage}
            </div>
          </div>
          <div className="bg-[rgba(7,10,16,0.96)] px-5 py-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
              Account Age
            </div>
            <div className="mt-2 text-sm font-semibold text-[var(--silver-1)]">
              {accountAge}
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--b0)] px-5 py-5">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
            Operation Window
          </div>
          <div className="mt-2 text-sm text-[var(--silver-2)]">
            Leave your banner, survey this kingdom, or launch a raid if the
            realm is open for battle.
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {canLeaveFlag ? (
              <button
                type="button"
                onClick={handleLeaveFlag}
                disabled={isFlagging || hasFlagged}
                className="realm-button border border-[var(--b1)] bg-[rgba(255,255,255,0.02)] px-5 py-3 text-sm text-[var(--silver-2)] transition hover:text-[var(--silver-0)] disabled:cursor-not-allowed disabled:opacity-45">
                {isFlagging
                  ? "Leaving Flag..."
                  : hasFlagged
                  ? "Flag Planted"
                  : "Leave A Flag"}
              </button>
            ) : (
              <div className="rounded-[20px] border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[var(--silver-2)]">
                Sign in with a different account to leave a flag on this
                kingdom.
              </div>
            )}

            {canRaid ? (
              <button
                type="button"
                onClick={() => setIsRaidOpen(true)}
                className="realm-button border border-[rgba(200,88,26,0.58)] bg-[linear-gradient(180deg,rgba(36,16,10,0.86),rgba(24,10,6,0.92))] px-5 py-3 text-sm text-[var(--ember-hi)] transition hover:border-[var(--ember)] hover:text-[#ffd2ad]">
                Raid This Kingdom
              </button>
            ) : (
              <div className="rounded-[20px] border border-[rgba(120,140,160,0.12)] bg-[rgba(255,255,255,0.01)] px-4 py-3 text-sm text-[var(--silver-3)]">
                This kingdom has sealed its borders. Raids are unavailable while the realm is protected.
              </div>
            )}
          </div>

          {errorMessage ? (
            <p className="mt-3 text-sm text-[#ff9696]">{errorMessage}</p>
          ) : null}
        </div>

        <div className="border-b border-[var(--b0)] px-5 py-5">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
            Advisory
          </div>
          <div className="mt-3 rounded-[20px] border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-sm leading-6 text-[var(--silver-2)]">
            Strong treasuries support prolonged raids, while high defense makes
            this keep harder to crack. Use the board view to inspect district
            density before committing troops.
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
            Recent Flags
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentVisitors.length > 0 ? (
              [...new Set(recentVisitors)].map(
                (
                  visitor,
                  index // removes duplicates
                ) => (
                  <span
                    key={`${visitor}-${index}`}
                    className="border border-[var(--b1)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-sm text-[var(--silver-2)]">
                    @{visitor}
                  </span>
                )
              )
            ) : (
              <span className="text-sm text-[var(--silver-3)]">
                No scouts have left a flag yet.
              </span>
            )}
          </div>
        </div>
      </aside>

      <RaidConfirmModal
        open={isRaidOpen}
        attackerName={attackerName ?? "Unknown Raider"}
        attackerAttackRating={attackerAttackRating ?? 0}
        attackerGold={attackerGold ?? 0}
        defenderId={kingdomData.userId}
        defenderName={kingdomData.ownerName}
        defenderDefenseRating={kingdomData.defense_rating}
        defenderGold={kingdomData.gold}
        onClose={() => setIsRaidOpen(false)}
      />
    </>
  );
}
