"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";

import { AchievementToast } from "@/src/components/ui/AchievementToast";
import { NotificationBell } from "@/src/components/ui/NotificationBell";
import { RealmTopNav } from "@/src/components/ui/RealmTopNav";
import {
  getBuildingMetadata,
  getBuildingName,
  getUpgradeCost,
  getSyncCooldownRemaining,
} from "@/src/lib/kingdom";
import { hasStarterKingdomState } from "@/src/lib/onboarding";
import { useKingdomStore } from "@/src/store/kingdomStore";
import type { BuildingData } from "@/src/types/game";

function CountUpValue({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const start = performance.now();
    const duration = 850;

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayValue(Math.round(value * (1 - (1 - progress) ** 3)));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

function ResourceCard({
  icon,
  label,
  value,
  rate,
}: {
  icon: string;
  label: string;
  value: number;
  rate: string;
}) {
  return (
    <div className="flex min-w-[132px] items-center gap-3 border-l border-[var(--b0)] px-4 py-2 first:border-l-0">
      <span className="font-[var(--font-head)] text-sm uppercase tracking-[0.16em] text-[var(--ember-hi)]">
        {icon}
      </span>
      <div>
        <p className="font-[var(--font-head)] text-[1.65rem] leading-none text-[var(--silver-0)]">
          <CountUpValue value={value} />
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[var(--silver-3)]">
          {label}
        </p>
        <p className="mt-1 text-[11px] text-[#4fa267]">{rate}</p>
      </div>
    </div>
  );
}

function BuildingPips({ level }: { level: number }) {
  return (
    <div className="mt-2 flex gap-1.5">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`h-[3px] w-5 rounded-full ${
            index < level
              ? "bg-[var(--ember)] shadow-[0_0_8px_rgba(200,88,26,0.45)]"
              : "bg-[var(--steel-4)]"
          }`}
        />
      ))}
    </div>
  );
}

function getBuildingLore(building: BuildingData) {
  if (building.type === "town_hall") {
    return "The seat of dominion. All allegiances are sworn here, and all matters of the realm decided by iron will.";
  }

  if (building.isPlaceholder) {
    return (
      building.placeholderLabel ??
      "This district still waits for more code before it can awaken."
    );
  }

  return getBuildingMetadata(building.type).effect;
}

function getBuildingSubtitle(building: BuildingData) {
  if (building.type === "town_hall") {
    return "Seat of power";
  }

  if (building.type === "wall") {
    return "Defence +35";
  }

  if (building.type === "iron_forge") {
    return "Iron +5/hr";
  }

  return getBuildingMetadata(building.type).effect;
}

function getBuildingMonogram(building: BuildingData) {
  if (building.type === "town_hall") {
    return "GH";
  }

  if (building.type === "wall") {
    return "OW";
  }

  if (building.type === "iron_forge") {
    return "IF";
  }

  return "ST";
}

function getMinimapTone(building: BuildingData) {
  if (building.type === "town_hall") {
    return "bg-[linear-gradient(180deg,#f0d79a,#c8882f)]";
  }

  if (building.type === "wall") {
    return "bg-[linear-gradient(180deg,#7d8ea1,#4d5d70)]";
  }

  if (building.type === "iron_forge") {
    return "bg-[linear-gradient(180deg,#d67436,#8f3d16)]";
  }

  if (building.type === "observatory" || building.type === "arcane_tower") {
    return "bg-[linear-gradient(180deg,#8cb0d4,#496585)]";
  }

  return "bg-[linear-gradient(180deg,#92a96e,#5d7148)]";
}

function MinimapPanel({
  buildings,
  activeBuildingId,
  onSelectBuilding,
}: {
  buildings: BuildingData[];
  activeBuildingId: string | null;
  onSelectBuilding: (building: BuildingData) => void;
}) {
  const gridSize = 20;
  const occupancy = new Map<string, BuildingData>();

  buildings.forEach((building) => {
    occupancy.set(`${building.x}:${building.y}`, building);
  });

  const center = activeBuildingId
    ? buildings.find((building) => building.id === activeBuildingId) ?? null
    : null;

  return (
    <div className="pointer-events-auto absolute bottom-5 left-[76px] z-30 hidden w-[212px] overflow-hidden rounded-[24px] border border-[var(--b1)] bg-[linear-gradient(180deg,rgba(8,11,18,0.97),rgba(5,8,13,0.95))] shadow-[0_20px_48px_rgba(0,0,0,0.46)] xl:block">
      <div className="relative p-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(176,196,214,0.06),transparent)]" />
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--b0)] bg-[radial-gradient(circle_at_50%_0%,rgba(176,196,214,0.08),transparent_38%),linear-gradient(180deg,#0b1018,#06090f)] p-3">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_26%),radial-gradient(circle_at_bottom,rgba(122,150,94,0.08),transparent_48%)]" />
          <div className="relative grid grid-cols-20 gap-[3px]">
            {Array.from({ length: gridSize * gridSize }, (_, index) => {
              const x = index % gridSize;
              const y = Math.floor(index / gridSize);
              const building = occupancy.get(`${x}:${y}`) ?? null;
              const isActive = building?.id === activeBuildingId;

              return building ? (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  onClick={() => onSelectBuilding(building)}
                  aria-label={`Focus ${getBuildingName(building)}`}
                  className={`h-[6px] w-[6px] rounded-[2px] border transition ${getMinimapTone(building)} ${
                    isActive
                      ? "border-[#fff0d2] scale-[1.55] shadow-[0_0_12px_rgba(200,88,26,0.78)]"
                      : "border-black/20 opacity-95 hover:scale-[1.25]"
                  }`}
                />
              ) : (
                <span
                  key={`${x}-${y}`}
                  className="h-[6px] w-[6px] rounded-[2px] bg-[rgba(122,150,94,0.14)]"
                />
              );
            })}
          </div>

          {center ? (
            <div
              className="pointer-events-none absolute rounded-full border border-[rgba(255,208,160,0.4)] bg-[rgba(200,88,26,0.08)]"
              style={{
                width: "20px",
                height: "20px",
                left: `${12 + center.x * 9 - 7}px`,
                top: `${12 + center.y * 9 - 7}px`,
                boxShadow: "0 0 18px rgba(200,88,26,0.24)",
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function HUD() {
  const kingdom = useKingdomStore((state) => state.kingdom);
  const selectedBuilding = useKingdomStore((state) => state.selectedBuilding);
  const selectBuilding = useKingdomStore((state) => state.selectBuilding);
  const setBuildings = useKingdomStore((state) => state.setBuildings);
  const updateGold = useKingdomStore((state) => state.updateGold);
  const isSyncing = useKingdomStore((state) => state.isSyncing);
  const syncError = useKingdomStore((state) => state.syncError);
  const clearSyncError = useKingdomStore((state) => state.clearSyncError);
  const syncKingdom = useKingdomStore((state) => state.syncKingdom);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const cooldownRemaining = useMemo(
    () => getSyncCooldownRemaining(kingdom?.last_synced_at ?? null),
    [kingdom?.last_synced_at]
  );

  if (!kingdom) {
    return null;
  }

  const lastSyncedLabel = kingdom.last_synced_at
    ? formatDistanceToNowStrict(new Date(kingdom.last_synced_at), {
        addSuffix: true,
      })
    : "Never synced";
  const showStarterMessage = hasStarterKingdomState(kingdom);
  const structures = kingdom.buildings;
  const activeBuilding = selectedBuilding ?? structures[0] ?? null;
  const upgradeCost = activeBuilding ? getUpgradeCost(activeBuilding) : null;
  const canUpgrade =
    Boolean(activeBuilding) &&
    activeBuilding.level < 5 &&
    kingdom.gold >= (upgradeCost ?? 0) &&
    !isUpgrading;

  const handleSync = async () => {
    clearSyncError();

    try {
      await syncKingdom();
    } catch {}
  };

  const handleSelectBuilding = (building: BuildingData) => {
    setUpgradeError(null);
    selectBuilding(building);
    window.dispatchEvent(
      new CustomEvent<BuildingData>("codekingdom:focus-building", {
        detail: building,
      })
    );
  };

  const handleUpgrade = async () => {
    if (!activeBuilding || !canUpgrade) {
      return;
    }

    setIsUpgrading(true);
    setUpgradeError(null);

    try {
      const response = await fetch("/api/kingdom/upgrade-building", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buildingId: activeBuilding.id }),
      });

      const payload = (await response.json()) as {
        error?: string;
        building?: { id: string; level: number };
        gold?: number;
      };

      if (!response.ok || !payload.building || typeof payload.gold !== "number") {
        throw new Error(payload.error ?? "Upgrade failed");
      }

      const nextBuildings = kingdom.buildings.map((building) =>
        building.id === payload.building?.id
          ? {
              ...building,
              level: payload.building.level as 1 | 2 | 3 | 4 | 5,
            }
          : building
      );
      const nextSelectedBuilding = nextBuildings.find(
        (building) => building.id === payload.building?.id
      );

      setBuildings(nextBuildings);
      updateGold(payload.gold);

      if (nextSelectedBuilding) {
        handleSelectBuilding(nextSelectedBuilding);
      }
    } catch (error) {
      setUpgradeError(error instanceof Error ? error.message : "Upgrade failed");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col text-[var(--silver-1)]">
      <div className="pointer-events-auto">
        <RealmTopNav active="kingdom" />
      </div>

      <div className="pointer-events-auto border-b border-[var(--b1)] bg-[rgba(8,11,16,0.9)]">
        <div className="grid min-h-[64px] grid-cols-[minmax(260px,320px)_1fr_auto] items-stretch">
          <div className="flex items-center gap-4 border-r border-[var(--b0)] px-4 py-3">
            <div className="flex h-14 w-14 items-center justify-center border border-[var(--b1)] bg-[linear-gradient(180deg,var(--steel-3),var(--steel-2))] shadow-[inset_0_1px_0_rgba(176,196,214,0.1)]">
              <div className="h-6 w-6 rotate-45 border border-[var(--b2)] bg-[var(--steel-4)]" />
            </div>
            <div className="min-w-0">
              <p className="font-[var(--font-head)] text-[1.3rem] leading-none text-[var(--silver-0)]">
                {kingdom.name}
              </p>
              <p className="mt-1 text-[13px] italic text-[var(--silver-2)]">
                Realm of @{kingdom.ownerName.toLowerCase().replace(/\s+/g, "")}{" "}
                / {showStarterMessage ? "Iron Age I" : "Iron Age III"}
              </p>
            </div>
          </div>

          <div className="flex overflow-x-auto">
            <ResourceCard
              icon="ST"
              label="Stone"
              value={kingdom.gold}
              rate="+12/hr"
            />
            <ResourceCard
              icon="GR"
              label="Grain"
              value={kingdom.population}
              rate="+8/hr"
            />
            <ResourceCard
              icon="IR"
              label="Iron"
              value={kingdom.attack_rating}
              rate="+5/hr"
            />
            <ResourceCard
              icon="PR"
              label="Prestige"
              value={kingdom.prestige}
              rate="+250"
            />
          </div>

          <div className="flex items-center gap-2 px-4">
            <Link
              href="/leaderboard"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center border border-[var(--b1)] bg-[rgba(12,16,24,0.86)] text-[11px] uppercase tracking-[0.18em] text-[var(--silver-1)]">
              Map
            </Link>
            <Link
              href="/raids/history"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center border border-[var(--b1)] bg-[rgba(12,16,24,0.86)] text-[11px] uppercase tracking-[0.18em] text-[var(--silver-1)]">
              Log
            </Link>
            <NotificationBell userId={kingdom.userId} />
            <Link
              href="/marketplace"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center border border-[var(--b1)] bg-[rgba(12,16,24,0.86)] text-[11px] uppercase tracking-[0.18em] text-[var(--silver-1)]">
              Set
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none relative flex min-h-0 flex-1">
        <div className="pointer-events-auto absolute left-0 top-0 z-30 hidden h-full w-[58px] border-r border-[var(--b1)] bg-[rgba(4,6,10,0.84)] md:flex md:flex-col md:items-center md:gap-4 md:px-2 md:py-5">
          {[
            ["BLD", true],
            ["FOR", false],
            ["WAR", false],
            ["ALLY", false],
            ["LOG", false],
            ["MAP", false],
          ].map(([icon, active], railIndex) => (
            <div
              key={`${icon}-${railIndex}`}
              className="flex flex-col items-center">
              {railIndex === 2 || railIndex === 4 ? (
                <div className="mb-3 h-px w-8 bg-[var(--b0)]" />
              ) : null}
              <button
                type="button"
                className={`flex h-10 w-10 items-center justify-center border text-[10px] uppercase tracking-[0.16em] transition ${
                  active
                    ? "border-[var(--ember)] bg-[rgba(44,21,13,0.75)] text-[var(--silver-0)]"
                    : "border-[var(--b1)] bg-[rgba(12,16,24,0.86)] text-[var(--silver-2)] hover:text-[var(--silver-0)]"
                }`}>
                {icon}
              </button>
            </div>
          ))}
        </div>

        <MinimapPanel
          buildings={structures}
          activeBuildingId={activeBuilding?.id ?? null}
          onSelectBuilding={handleSelectBuilding}
        />

        <div className="pointer-events-auto absolute right-0 top-0 z-30 hidden h-full w-[300px] overflow-y-auto border-l border-[var(--b1)] bg-[linear-gradient(180deg,rgba(4,6,10,0.96),rgba(4,6,10,0.88))] xl:block">
          <div className="border-b border-[var(--b1)] px-5 py-6">
            <div className="font-[var(--font-head)] text-[1.9rem] uppercase leading-none tracking-[0.04em] text-[var(--silver-0)]">
              Structures
            </div>
            <div className="mt-2 text-[13px] italic text-[var(--silver-2)]">
              Select a building to inspect
            </div>
          </div>

          <div className="border-b border-[var(--b0)] px-5 py-6">
            <div className="font-[var(--font-head)] text-[2rem] leading-none text-[var(--silver-0)]">
              {activeBuilding ? getBuildingName(activeBuilding) : "Great Hall"}
            </div>
            <div className="mt-5 text-[14px] italic leading-8 text-[var(--silver-1)]">
              &quot;
              {activeBuilding
                ? getBuildingLore(activeBuilding)
                : "The seat of dominion. All allegiances are sworn here, and all matters of the realm decided by iron will."}
              &quot;
            </div>

            <div className="mt-7 space-y-4">
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-[12px] uppercase tracking-[0.26em] text-[var(--silver-3)]">
                  Level
                </span>
                <span className="font-[var(--font-head)] text-[1.35rem] leading-none text-[var(--silver-0)]">
                  {activeBuilding ? `${activeBuilding.level} of V` : "IV of V"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-[12px] uppercase tracking-[0.26em] text-[var(--silver-3)]">
                  Prestige Bonus
                </span>
                <span className="text-right font-[var(--font-head)] text-[1.15rem] leading-6 text-[var(--silver-0)]">
                  +18% per commit
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-[12px] uppercase tracking-[0.26em] text-[var(--silver-3)]">
                  Upgrade Cost
                </span>
                <span className="text-right font-[var(--font-head)] text-[1.15rem] leading-6 text-[var(--silver-0)]">
                  {upgradeCost
                    ? `${upgradeCost.toLocaleString()} Gold`
                    : "Unavailable"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-[12px] uppercase tracking-[0.26em] text-[var(--silver-3)]">
                  Built
                </span>
                <span className="text-right font-[var(--font-head)] text-[1.15rem] leading-6 text-[var(--silver-0)]">
                  Day 14 of your reign
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={!canUpgrade}
              className="pointer-events-auto mt-8 w-full border border-[rgba(200,88,26,0.58)] bg-[linear-gradient(180deg,rgba(36,16,10,0.86),rgba(24,10,6,0.92))] px-5 py-4 text-center font-[var(--font-head)] text-[1rem] uppercase tracking-[0.18em] text-[var(--ember-hi)] transition hover:border-[var(--ember)] hover:text-[#ffd2ad] disabled:cursor-not-allowed disabled:opacity-55">
              {isUpgrading
                ? "Upgrading..."
                : activeBuilding?.level >= 5
                  ? "Max Level"
                  : `Upgrade to Level ${activeBuilding ? Math.min(5, activeBuilding.level + 1) : "V"}`}
            </button>
            {upgradeError ? (
              <p className="mt-3 text-sm text-[#ff8e8e]">{upgradeError}</p>
            ) : null}
          </div>

          <div className="space-y-4 px-5 py-5">
            {structures.slice(0, 3).map((building) => (
              <button
                key={building.id}
                type="button"
                onClick={() => handleSelectBuilding(building)}
                className={`pointer-events-auto flex w-full items-center gap-4 border px-4 py-4 text-left transition ${
                  activeBuilding?.id === building.id
                    ? "border-[var(--ember)] bg-[rgba(44,21,13,0.52)] shadow-[inset_0_0_0_1px_rgba(200,88,26,0.15)]"
                    : "border-[var(--b0)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--b2)]"
                }`}>
                <div className="flex h-10 w-10 items-center justify-center border border-[var(--b1)] bg-[var(--steel-3)] font-[var(--font-head)] text-base text-[var(--silver-0)]">
                  {getBuildingMonogram(building)}
                </div>
                <div className="min-w-0">
                  <p className="font-[var(--font-head)] text-[1.45rem] leading-none text-[var(--silver-0)]">
                    {getBuildingName(building)}
                  </p>
                  <BuildingPips level={building.level} />
                  <p className="mt-2 text-[13px] italic text-[var(--silver-2)]">
                    {getBuildingSubtitle(building)}
                  </p>
                </div>
              </button>
            ))}

            <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.015)] px-4 py-4 opacity-50">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center border border-[var(--b1)] bg-[var(--steel-3)] font-[var(--font-head)] text-base text-[var(--silver-2)]">
                  OB
                </div>
                <div>
                  <div className="font-[var(--font-head)] text-[1.45rem] leading-none text-[var(--silver-3)]">
                    Observatory
                  </div>
                  <div className="mt-2 text-[13px] italic text-[var(--silver-2)]">
                    Requires 30-day streak
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 border-t border-[var(--b1)] bg-[rgba(4,6,10,0.9)] px-3 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Link
              href="/marketplace"
              className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-3">
              Build
            </Link>
            <Link
              href="/raids/history"
              className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-3">
              Raid
            </Link>
            <Link
              href="/leaderboard"
              className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-3">
              Visit
            </Link>
            <Link
              href="/leaderboard"
              className="pointer-events-auto realm-button realm-button-secondary min-w-[170px] px-4 py-3 text-[var(--ember-hi)]">
              Declare War
            </Link>
            <div className="min-w-2 grow" />
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || cooldownRemaining > 0}
              className="pointer-events-auto realm-button min-w-[240px] border border-[rgba(79,162,103,0.35)] bg-[rgba(16,50,22,0.78)] px-5 py-3 text-[#7fdb91] disabled:opacity-55">
              {isSyncing
                ? "Syncing GitHub..."
                : `Sync GitHub / ${lastSyncedLabel}`}
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-[68px] left-[58px] right-[300px] top-0" />
      </div>

      {syncError ? (
        <div className="pointer-events-auto absolute bottom-[78px] left-[72px] z-40 rounded-[14px] border border-[#a84d4d] bg-[#2a1111]/95 px-4 py-3 text-sm text-[#ffc5c5]">
          {syncError}
        </div>
      ) : null}

      {showStarterMessage ? (
        <div className="pointer-events-auto absolute bottom-[78px] left-[72px] z-40 rounded-[14px] border border-[rgba(200,88,26,0.38)] bg-[rgba(44,21,13,0.95)] px-4 py-3 text-sm text-[#f3c3a5] xl:left-[214px]">
          Founding age active. Sync and keep coding to awaken the rest of the
          realm.
        </div>
      ) : null}

      <div className="pointer-events-auto absolute right-[314px] top-[126px] z-30 hidden items-center gap-3 lg:flex">
        <button className="realm-button realm-button-secondary rounded-[14px] px-4 py-2">
          Realm
        </button>
        <button className="realm-button realm-button-secondary rounded-[14px] px-4 py-2">
          Chronicle
        </button>
      </div>

      <div className="pointer-events-auto absolute left-3 top-[126px] z-30 md:hidden">
        <button className="realm-button realm-button-secondary rounded-[14px] px-4 py-2">
          Menu
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 z-40">
        <AchievementToast />
      </div>
    </div>
  );
}
