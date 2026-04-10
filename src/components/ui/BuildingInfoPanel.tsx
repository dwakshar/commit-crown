"use client";

import { useState } from "react";

import {
  getBuildingMetadata,
  getBuildingName,
  getUpgradeCost,
} from "@/src/lib/kingdom";
import { useKingdomStore } from "@/src/store/kingdomStore";

function LevelPips({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 rounded-full border ${
            index < level
              ? "border-[#C9A84C] bg-[#C9A84C]"
              : "border-white/20 bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

export function BuildingInfoPanel() {
  const kingdom = useKingdomStore((state) => state.kingdom);
  const selectedBuilding = useKingdomStore((state) => state.selectedBuilding);
  const selectBuilding = useKingdomStore((state) => state.selectBuilding);
  const setBuildings = useKingdomStore((state) => state.setBuildings);
  const updateGold = useKingdomStore((state) => state.updateGold);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!selectedBuilding || !kingdom) {
    return null;
  }

  const metadata = getBuildingMetadata(selectedBuilding.type);
  const upgradeCost = getUpgradeCost(selectedBuilding);
  const canUpgrade =
    kingdom.gold >= upgradeCost && selectedBuilding.level < 5 && !isUpgrading;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/kingdom/upgrade-building", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buildingId: selectedBuilding.id }),
      });

      const payload = (await response.json()) as {
        error?: string;
        building?: { id: string; level: number };
        gold?: number;
      };

      if (
        !response.ok ||
        !payload.building ||
        typeof payload.gold !== "number"
      ) {
        throw new Error(payload.error ?? "Upgrade failed");
      }

      setBuildings(
        kingdom.buildings.map((building) =>
          building.id === payload.building?.id
            ? {
                ...building,
                level: payload.building.level as 1 | 2 | 3 | 4 | 5,
              }
            : building
        )
      );
      updateGold(payload.gold);
      selectBuilding({
        ...selectedBuilding,
        level: payload.building.level as 1 | 2 | 3 | 4 | 5,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Upgrade failed"
      );
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <aside className="pointer-events-auto realm-panel w-full max-w-sm rounded-[28px] p-5 text-[var(--silver-1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="realm-label text-[var(--plate-hi)]">
            Selected Building
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--silver-0)]">
            {getBuildingName(selectedBuilding)}
          </h2>
          <div className="mt-2 flex items-center gap-3 text-sm text-[var(--silver-2)]">
            <span className="rounded-full border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] px-3 py-1">
              {metadata.icon}
            </span>
            <span>{selectedBuilding.type.replaceAll("_", " ")}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => selectBuilding(null)}
          className="realm-button realm-button-secondary rounded-full px-3 py-1 text-[11px]">
          Close
        </button>
      </div>

      <div className="mt-5 rounded-[22px] border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--silver-2)]">Current Level</span>
          <LevelPips level={selectedBuilding.level} />
        </div>
        <p className="realm-lore mt-4 text-sm">{metadata.effect}</p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 rounded-[22px] border border-[rgba(200,88,26,0.22)] bg-[rgba(44,21,13,0.6)] p-4">
        <div>
          <p className="realm-label">Upgrade Cost</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--silver-0)]">
            {upgradeCost} Gold
          </p>
        </div>
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={!canUpgrade}
          className="realm-button realm-button-primary rounded-[18px] px-5 py-3 disabled:cursor-not-allowed disabled:opacity-55">
          {isUpgrading
            ? "Upgrading..."
            : selectedBuilding.level >= 5
            ? "Max Level"
            : "Upgrade"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-[#ff8e8e]">{errorMessage}</p>
      ) : null}
    </aside>
  );
}
