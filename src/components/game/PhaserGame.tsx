"use client";

import { useEffect, useRef } from "react";

import type { BuildingData, KingdomData } from "@/src/types/game";

type PhaserModule = typeof import("phaser");
type PhaserGameInstance = import("phaser").Game;

type PhaserGlobal = typeof globalThis & {
  Phaser?: PhaserModule;
};

export interface PhaserGameProps {
  kingdomData: KingdomData;
  userId: string;
  isOwner: boolean;
}

export function PhaserGame({ kingdomData, userId, isOwner }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<PhaserGameInstance | null>(null);
  const initialPropsRef = useRef({ kingdomData, userId, isOwner });

  useEffect(() => {
    let cancelled = false;

    const initializeGame = async () => {
      if (!containerRef.current || gameRef.current) {
        return;
      }

      const phaserModule = await import("phaser");
      const Phaser = (phaserModule.default ?? phaserModule) as PhaserModule;
      (globalThis as PhaserGlobal).Phaser = Phaser;

      const [{ BootScene }, { KingdomScene }] = await Promise.all([
        import("@/src/components/game/scenes/BootScene"),
        import("@/src/components/game/scenes/KingdomScene"),
      ]);

      if (cancelled || !containerRef.current) {
        return;
      }

      const config: import("phaser").Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: "100%",
        height: "100%",
        backgroundColor: "#0d0d1a",
        scene: [BootScene, KingdomScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: "100%",
          height: "100%",
        },
        callbacks: {
          preBoot: (game) => {
            game.registry.set(
              "kingdomData",
              initialPropsRef.current.kingdomData
            );
            game.registry.set("userId", initialPropsRef.current.userId);
            game.registry.set("isOwner", initialPropsRef.current.isOwner);
          },
        },
      };

      const game = new Phaser.Game(config);
      const handleBuildingSelected = (building: BuildingData) => {
        window.dispatchEvent(
          new CustomEvent<BuildingData>("codekingdom:building-selected", {
            detail: building,
          })
        );
      };
      const handleTileSelected = (tile: { x: number; y: number }) => {
        window.dispatchEvent(
          new CustomEvent<{ x: number; y: number }>(
            "codekingdom:tile-selected",
            {
              detail: tile,
            }
          )
        );
      };

      game.events.on("building-selected", handleBuildingSelected);
      game.events.on("tile-selected", handleTileSelected);
      gameRef.current = game;
    };

    void initializeGame();

    return () => {
      cancelled = true;

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleFocusBuilding = (event: Event) => {
      const customEvent = event as CustomEvent<BuildingData>;
      gameRef.current?.events.emit("focus-building", customEvent.detail);
    };
    const handleBuildModeChanged = (event: Event) => {
      const customEvent = event as CustomEvent<BuildingData["type"] | null>;
      gameRef.current?.events.emit("build-mode-changed", customEvent.detail);
    };

    window.addEventListener(
      "codekingdom:focus-building",
      handleFocusBuilding as EventListener
    );
    window.addEventListener(
      "codekingdom:build-mode-changed",
      handleBuildModeChanged as EventListener
    );

    return () => {
      window.removeEventListener(
        "codekingdom:focus-building",
        handleFocusBuilding as EventListener
      );
      window.removeEventListener(
        "codekingdom:build-mode-changed",
        handleBuildModeChanged as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;

    if (!game) {
      return;
    }

    game.registry.set("kingdomData", kingdomData);
    game.registry.set("userId", userId);
    game.registry.set("isOwner", isOwner);
    game.events.emit("kingdom-updated", kingdomData);
  }, [isOwner, kingdomData, userId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
