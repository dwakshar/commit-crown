"use client";

import { useEffect } from "react";

import dynamic from "next/dynamic";

import { HUD } from "@/src/components/ui/HUD";
import { useKingdomStore } from "@/src/store/kingdomStore";
import type { BuildingData, KingdomData } from "@/src/types/game";

const PhaserGame = dynamic(
  () =>
    import("@/src/components/game/PhaserGame").then(
      (module) => module.PhaserGame
    ),
  {
    ssr: false,
  }
);

export function KingdomPageClient({
  kingdomData,
}: {
  kingdomData: KingdomData;
}) {
  const setKingdom = useKingdomStore((state) => state.setKingdom);
  const selectBuilding = useKingdomStore((state) => state.selectBuilding);
  const kingdom = useKingdomStore((state) => state.kingdom);

  useEffect(() => {
    setKingdom(kingdomData);
  }, [kingdomData, setKingdom]);

  useEffect(() => {
    const handleBuildingSelected = (event: Event) => {
      const customEvent = event as CustomEvent<BuildingData>;
      selectBuilding(customEvent.detail);
    };

    window.addEventListener(
      "codekingdom:building-selected",
      handleBuildingSelected as EventListener
    );

    return () => {
      window.removeEventListener(
        "codekingdom:building-selected",
        handleBuildingSelected as EventListener
      );
    };
  }, [selectBuilding]);

  useEffect(() => {
    const handleKingdomUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<KingdomData>;
      setKingdom(customEvent.detail);
    };

    window.addEventListener(
      "codekingdom:kingdom-updated",
      handleKingdomUpdated as EventListener
    );

    return () => {
      window.removeEventListener(
        "codekingdom:kingdom-updated",
        handleKingdomUpdated as EventListener
      );
    };
  }, [setKingdom]);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[var(--steel-0)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,0.12),transparent_45%),linear-gradient(180deg,#06080d_0%,#0a0f18_42%,#07090f_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent,transparent_3px,rgba(100,130,160,0.015)_3px,rgba(100,130,160,0.015)_4px)]" />
      </div>
      <div className="absolute inset-x-0 top-[116px] bottom-[64px] left-[58px] right-0 xl:right-[300px]">
        <PhaserGame
          kingdomData={kingdom ?? kingdomData}
          userId={kingdomData.userId}
          isOwner
        />
      </div>
      <HUD />
    </main>
  );
}
