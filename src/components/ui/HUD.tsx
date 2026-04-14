"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";

import { AchievementToast } from "@/src/components/ui/AchievementToast";
import { NotificationBell } from "@/src/components/ui/NotificationBell";
import { ProfileButton } from "@/src/components/ui/ProfileButton";
import { RealmTopNav } from "@/src/components/ui/RealmTopNav";
import { getSyncCooldownRemaining, getUpgradeCost } from "@/src/lib/kingdom";
import {
  getBoardSummary,
  getBuildingCatalog,
  getKingdomEconomy,
  getTileLabel,
} from "@/src/lib/kingdomMechanics";
import { useKingdomStore } from "@/src/store/kingdomStore";
import type { BuildingData } from "@/src/types/game";

function StatCell({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-r border-[var(--b0)] px-4 py-3 last:border-r-0">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
        {label}
      </div>
      <div className="mt-2 font-[var(--font-head)] text-[1.4rem] leading-none text-[var(--silver-0)]">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-[var(--silver-3)]">{detail}</div>
    </div>
  );
}

function BuildingDots({ level }: { level: number }) {
  return (
    <div className="mt-3 flex gap-1.5">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`h-[4px] w-7 rounded-full ${
            index < level ? "bg-[var(--ember)]" : "bg-[rgba(120,140,160,0.2)]"
          }`}
        />
      ))}
    </div>
  );
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

  return (
    <div>
      <div className="border-b border-[var(--b0)] px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
          War Map
        </div>
        <div className="mt-1 font-[var(--font-head)] text-lg text-[var(--silver-0)]">
          District Grid
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-20 gap-[3px] bg-[linear-gradient(180deg,#0f1722,#090d14)] p-3">
          {Array.from({ length: gridSize * gridSize }, (_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const building = occupancy.get(`${x}:${y}`) ?? null;
            const isActive = building?.id === activeBuildingId;

            if (!building) {
              return (
                <span
                  key={`${x}-${y}`}
                  className="h-[7px] w-[7px] rounded-[2px] bg-[rgba(122,150,94,0.14)]"
                />
              );
            }

            return (
              <button
                key={`${x}-${y}`}
                type="button"
                onClick={() => onSelectBuilding(building)}
                aria-label={`Focus ${building.name ?? building.type}`}
                className={`h-[7px] w-[7px] rounded-[2px] border transition ${
                  building.isPlaceholder
                    ? "border-[rgba(160,172,184,0.35)] bg-[rgba(160,172,184,0.45)]"
                    : "border-black/20 bg-[linear-gradient(180deg,#f0d79a,#c8882f)]"
                } ${
                  isActive
                    ? "scale-[1.6] shadow-[0_0_10px_rgba(200,88,26,0.75)]"
                    : "hover:scale-[1.2]"
                }`}
              />
            );
          })}
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
  const buildModeType = useKingdomStore((state) => state.buildModeType);
  const setBuildModeType = useKingdomStore((state) => state.setBuildModeType);
  const placeBuilding = useKingdomStore((state) => state.placeBuilding);
  const isPlacingBuilding = useKingdomStore((state) => state.isPlacingBuilding);
  const placementError = useKingdomStore((state) => state.placementError);
  const clearPlacementError = useKingdomStore(
    (state) => state.clearPlacementError
  );
  const isTogglingRaids = useKingdomStore((state) => state.isTogglingRaids);
  const toggleRaids = useKingdomStore((state) => state.toggleRaids);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const buildModeTypeRef = useRef(buildModeType);
  const placeBuildingRef = useRef(placeBuilding);
  const clearPlacementErrorRef = useRef(clearPlacementError);

  useEffect(() => {
    buildModeTypeRef.current = buildModeType;
    placeBuildingRef.current = placeBuilding;
    clearPlacementErrorRef.current = clearPlacementError;
  }, [buildModeType, placeBuilding, clearPlacementError]);

  useEffect(() => {
    const handleTileSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{ x: number; y: number }>;
      const activeBuildMode = buildModeTypeRef.current;

      if (!activeBuildMode) {
        return;
      }

      clearPlacementErrorRef.current();
      void placeBuildingRef.current(
        activeBuildMode,
        customEvent.detail.x,
        customEvent.detail.y
      );
    };

    window.addEventListener(
      "codekingdom:tile-selected",
      handleTileSelected as EventListener
    );

    return () => {
      window.removeEventListener(
        "codekingdom:tile-selected",
        handleTileSelected as EventListener
      );
    };
  }, []);

  const economy = useMemo(
    () => (kingdom ? getKingdomEconomy(kingdom) : null),
    [kingdom]
  );
  const boardSummary = useMemo(
    () => (kingdom ? getBoardSummary(kingdom) : null),
    [kingdom]
  );
  const catalog = useMemo(
    () => (kingdom ? getBuildingCatalog(kingdom) : []),
    [kingdom]
  );
  const cooldownRemaining = useMemo(
    () => getSyncCooldownRemaining(kingdom?.last_synced_at ?? null),
    [kingdom?.last_synced_at]
  );

  if (!kingdom || !economy || !boardSummary) {
    return null;
  }

  const structures = kingdom.buildings;
  const activeBuilding =
    selectedBuilding ??
    structures.find((building) => !building.isPlaceholder) ??
    structures[0] ??
    null;
  const upgradeCost =
    activeBuilding && !activeBuilding.isPlaceholder
      ? getUpgradeCost(activeBuilding)
      : null;
  const canUpgrade =
    Boolean(activeBuilding) &&
    !activeBuilding?.isPlaceholder &&
    activeBuilding.level < 5 &&
    kingdom.gold >= (upgradeCost ?? 0) &&
    !isUpgrading;
  const lastSyncedLabel = kingdom.last_synced_at
    ? formatDistanceToNowStrict(new Date(kingdom.last_synced_at), {
        addSuffix: true,
      })
    : "Never synced";

  const handleSelectBuilding = (building: BuildingData) => {
    setUpgradeError(null);
    clearPlacementError();
    startTransition(() => {
      selectBuilding(building);
    });
    window.dispatchEvent(
      new CustomEvent<BuildingData>("codekingdom:focus-building", {
        detail: building,
      })
    );
  };

  const handleBuildMode = (type: BuildingData["type"] | null) => {
    const nextType = buildModeType === type ? null : type;
    clearPlacementError();
    setBuildModeType(nextType);
    window.dispatchEvent(
      new CustomEvent<BuildingData["type"] | null>(
        "codekingdom:build-mode-changed",
        {
          detail: nextType,
        }
      )
    );
  };

  const handleSync = async () => {
    clearSyncError();

    try {
      await syncKingdom();
    } catch {}
  };

  const handleUpgrade = async () => {
    if (!activeBuilding || activeBuilding.isPlaceholder || !canUpgrade) {
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

      if (
        !response.ok ||
        !payload.building ||
        typeof payload.gold !== "number"
      ) {
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
      setUpgradeError(
        error instanceof Error ? error.message : "Upgrade failed"
      );
    } finally {
      setIsUpgrading(false);
    }
  };

  const highlightedTileLabel =
    buildModeType && activeBuilding
      ? getTileLabel(kingdom, activeBuilding.x, activeBuilding.y)
      : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col text-[var(--silver-1)]">
      <div className="pointer-events-auto">
        <RealmTopNav active="kingdom" />
      </div>

      <div className="pointer-events-auto border-b border-[var(--b1)] bg-[rgba(6,9,14,0.92)]">
        <div className="grid min-h-[84px] grid-cols-1 xl:grid-cols-[minmax(300px,340px)_1fr_auto]">
          <div className="border-b border-[var(--b0)] px-5 py-4 xl:border-b-0 xl:border-r">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
              Crown Realm
            </div>
            <div className="mt-2 font-[var(--font-head)] text-[2rem] leading-none text-[var(--silver-0)]">
              {kingdom.name}
            </div>
            <div className="mt-2 text-sm italic text-[var(--silver-2)]">
              Commanded by @
              {kingdom.ownerName.toLowerCase().replace(/\s+/g, "")} /{" "}
              {boardSummary.control}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4">
            <StatCell
              label="Treasury"
              value={kingdom.gold.toLocaleString()}
              detail={`+${economy.goldPerHour}/hr`}
            />
            <StatCell
              label="Prestige"
              value={kingdom.prestige.toLocaleString()}
              detail={`+${economy.prestigePerHour}/hr`}
            />
            <StatCell
              label="Readiness"
              value={economy.attackPower.toLocaleString()}
              detail={`Defense ${economy.defensePower}`}
            />
            <StatCell
              label="Stability"
              value={`${economy.stability}%`}
              detail={`Pressure ${economy.pressure}`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--b0)] px-4 py-3 xl:border-l xl:border-t-0">
            <NotificationBell userId={kingdom.userId} />
            <ProfileButton
              username={kingdom.ownerName}
              avatarUrl={kingdom.ownerAvatarUrl}
              kingdomName={kingdom.name}
              prestige={kingdom.prestige}
            />
          </div>
        </div>
      </div>

      <div className="relative flex flex-1">
        <div className="pointer-events-auto absolute left-0 top-0 z-30 hidden h-full w-[320px] overflow-y-auto border-r border-[var(--b1)] bg-[linear-gradient(180deg,rgba(5,8,13,0.97),rgba(6,10,16,0.9))] lg:block">
          <div className="pb-[84px]">
            <div className="border-b border-[var(--b0)] px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                Operations
              </div>
              <div className="mt-1 font-[var(--font-head)] text-lg text-[var(--silver-0)]">
                Kingdom Command
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px border-b border-[var(--b0)] bg-[var(--b0)]">
              <div className="bg-[rgba(7,10,16,0.96)] px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                  Open Slots
                </div>
                <div className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
                  {boardSummary.openSlots}
                </div>
              </div>
              <div className="bg-[rgba(7,10,16,0.96)] px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                  Ruin Sites
                </div>
                <div className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
                  {boardSummary.ruins}
                </div>
              </div>
              <div className="bg-[rgba(7,10,16,0.96)] px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                  Knowledge
                </div>
                <div className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
                  {economy.knowledgePerHour}/hr
                </div>
              </div>
              <div className="bg-[rgba(7,10,16,0.96)] px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--silver-3)]">
                  Supply
                </div>
                <div className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
                  {economy.supplyPerHour}/hr
                </div>
              </div>
            </div>
            <div className="border-b border-[var(--b0)] px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                Build Orders
              </div>
              <div className="mt-1 font-[var(--font-head)] text-lg text-[var(--silver-0)]">
                {buildModeType
                  ? "Choose a tile on the board"
                  : "Select a district from the right"}
              </div>
            </div>
            <div className="border-b border-[var(--b0)] px-5 py-4 text-sm leading-6 text-[var(--silver-2)]">
              {buildModeType ? (
                <>
                  Build mode is active for{" "}
                  <span className="text-[var(--silver-0)]">
                    {buildModeType.replaceAll("_", " ")}
                  </span>
                  . Click any empty or ruined tile to found that district.
                </>
              ) : (
                <>
                  Your roads, defenses, and economy now react to every district
                  you place and upgrade.
                </>
              )}
              {highlightedTileLabel ? (
                <div className="mt-3 rounded-[16px] border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--silver-3)]">
                  Focus Tile: {highlightedTileLabel}
                </div>
              ) : null}
            </div>
            <div className="hidden border-b border-[var(--b0)] xl:block">
              <MinimapPanel
                buildings={structures}
                activeBuildingId={activeBuilding?.id ?? null}
                onSelectBuilding={handleSelectBuilding}
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-auto absolute right-0 top-0 z-30 h-full w-full max-w-[420px] overflow-y-auto border-l border-[var(--b1)] bg-[linear-gradient(180deg,rgba(5,8,13,0.97),rgba(6,10,16,0.9))]">
          <div className="border-b border-[var(--b1)] px-5 py-6">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
              Inspector
            </div>
            <div className="mt-2 font-[var(--font-head)] text-[1.9rem] leading-none text-[var(--silver-0)]">
              {activeBuilding?.name ?? "War Table"}
            </div>
            <div className="mt-2 text-sm italic text-[var(--silver-2)]">
              {activeBuilding?.isPlaceholder
                ? "This ruined district can be reclaimed with any unlocked structure."
                : "Review the district, commit an upgrade, or expand the kingdom from the build list below."}
            </div>
          </div>

          <div className="border-b border-[var(--b0)] px-5 py-5">
            {activeBuilding ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
                      Selected District
                    </div>
                    <div className="mt-2 font-[var(--font-head)] text-[1.6rem] leading-none text-[var(--silver-0)]">
                      {activeBuilding.name ??
                        activeBuilding.type.replaceAll("_", " ")}
                    </div>
                    <BuildingDots level={activeBuilding.level} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectBuilding(activeBuilding)}
                    className="border border-[var(--b1)] px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-[var(--silver-2)]">
                    Focus
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                      Level
                    </div>
                    <div className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
                      {activeBuilding.level}/5
                    </div>
                  </div>
                  <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                      Tile
                    </div>
                    <div className="mt-2 font-[var(--font-head)] text-2xl text-[var(--silver-0)]">
                      {activeBuilding.x},{activeBuilding.y}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={!canUpgrade}
                  className="mt-5 w-full border border-[rgba(200,88,26,0.58)] bg-[linear-gradient(180deg,rgba(36,16,10,0.86),rgba(24,10,6,0.92))] px-5 py-3.5 font-[var(--font-head)] text-[1rem] uppercase tracking-[0.18em] text-[var(--ember-hi)] transition hover:border-[var(--ember)] hover:text-[#ffd2ad] disabled:cursor-not-allowed disabled:opacity-55">
                  {activeBuilding.isPlaceholder
                    ? "Select A Structure To Reclaim"
                    : isUpgrading
                    ? "Upgrading..."
                    : activeBuilding.level >= 5
                    ? "Max Level"
                    : `Upgrade / ${upgradeCost?.toLocaleString() ?? "0"} Gold`}
                </button>
                {upgradeError ? (
                  <div className="mt-3 text-sm text-[#ff8e8e]">
                    {upgradeError}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="text-sm text-[var(--silver-2)]">
                Select a district on the board to inspect it.
              </div>
            )}
          </div>

          <div className="border-b border-[var(--b0)] px-5 py-5">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
              District Foundry
            </div>
            <div className="mt-2 text-sm text-[var(--silver-2)]">
              Unlocked structures can be placed on any open tile. Locked ones
              awaken from GitHub progress.
            </div>

            <div className="mt-4 space-y-3">
              {catalog.map((entry) => (
                <div
                  key={entry.type}
                  className={`border px-4 py-4 ${
                    entry.unlocked
                      ? "border-[var(--b0)] bg-[rgba(255,186,186,0.02)]"
                      : "border-[rgba(120,140,160,0.12)] bg-[rgba(255,255,255,0.01)] opacity-60"
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-[var(--font-head)] text-[1.25rem] leading-none text-[var(--silver-0)]">
                        {entry.metadata.label}
                      </div>
                      <div className="mt-2 text-sm text-[var(--silver-2)]">
                        {entry.metadata.effect}
                      </div>
                      <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[var(--silver-3)]">
                        {entry.placedCount} built / {entry.nextTierLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleBuildMode(entry.unlocked ? entry.type : null)
                      }
                      disabled={
                        !entry.unlocked ||
                        boardSummary.openSlots <= 0 ||
                        isPlacingBuilding
                      }
                      className={`min-w-[120px] border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
                        buildModeType === entry.type
                          ? "border-[var(--ember)] bg-[rgba(44,21,13,0.72)] text-[var(--ember-hi)]"
                          : "border-[var(--b1)] text-[var(--silver-2)] hover:text-[var(--silver-0)]"
                      } disabled:cursor-not-allowed disabled:opacity-100`}>
                      {buildModeType === entry.type
                        ? "Cancel"
                        : entry.unlocked
                        ? "Place"
                        : "Locked"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--silver-3)]">
              Advisory
            </div>
            <div className="mt-3 border border-[var(--b0)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-sm leading-6 text-[var(--silver-2)]">
              Strong economies come from markets and town halls, pressure falls
              when walls and barracks rise, and knowledge feeds stability
              through libraries and observatories.
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 border-t border-[var(--b1)] bg-[rgba(4,6,10,0.92)] px-3 py-3">
          <div className="flex items-center text-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleBuildMode(buildModeType)}
              className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-2.5">
              {buildModeType ? "Cancel Build" : "Build Mode"}
            </button>
            <Link
              href="/leaderboard"
              className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-2.5">
              Scout
            </Link>
            <Link
              href="/raids/history"
              className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-2.5">
              Raid Log
            </Link>
            <button
              type="button"
              onClick={() => void toggleRaids()}
              disabled={isTogglingRaids}
              className={`pointer-events-auto realm-button min-w-[140px] border px-4 py-2.5 text-sm transition disabled:opacity-55 ${
                kingdom.raids_enabled
                  ? "border-[rgba(200,88,26,0.58)] bg-[linear-gradient(180deg,rgba(36,16,10,0.86),rgba(24,10,6,0.92))] text-[var(--ember-hi)] hover:border-[var(--ember)]"
                  : "border-[var(--b1)] bg-[rgba(255,255,255,0.02)] text-[var(--silver-3)] hover:text-[var(--silver-1)]"
              }`}>
              {isTogglingRaids
                ? "Updating..."
                : kingdom.raids_enabled
                ? "War: Open"
                : "War: Sealed"}
            </button>
            <Link
              href="/marketplace"
              className="pointer-events-auto realm-button realm-button-secondary min-w-[120px] px-4 py-2.5">
              Cosmetics
            </Link>
            <div className="min-w-2 grow" />
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || cooldownRemaining > 0}
              className="pointer-events-auto realm-button min-w-[260px] border border-[rgba(79,162,103,0.35)] bg-[rgba(16,50,22,0.78)] px-5 py-3 text-[#7fdb91] disabled:opacity-55">
              {isSyncing
                ? "Syncing GitHub..."
                : `Sync GitHub / ${lastSyncedLabel}`}
            </button>
          </div>
        </div>
      </div>

      {syncError ? (
        <div className="pointer-events-auto absolute bottom-[82px] left-5 z-40 rounded-[16px] border border-[#a84d4d] bg-[#2a1111]/95 px-4 py-3 text-sm text-[#ffc5c5]">
          {syncError}
        </div>
      ) : null}

      {placementError ? (
        <div className="pointer-events-auto absolute bottom-[82px] left-5 z-40 rounded-[16px] border border-[#805520] bg-[rgba(40,22,8,0.95)] px-4 py-3 text-sm text-[#ffd7a8]">
          {placementError}
        </div>
      ) : null}

      {isPlacingBuilding ? (
        <div className="pointer-events-auto absolute bottom-[82px] left-5 z-40 rounded-[16px] border border-[rgba(79,162,103,0.35)] bg-[rgba(16,50,22,0.95)] px-4 py-3 text-sm text-[#b8f3c4]">
          Establishing district...
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-40">
        <AchievementToast />
      </div>
    </div>
  );
}
