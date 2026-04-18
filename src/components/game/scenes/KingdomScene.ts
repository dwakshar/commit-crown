import { Building } from "@/src/components/game/entities/Building";
import {
  decodeWaterSlotPosition,
  encodeWaterSlotPosition,
  getValidWaterSlotsForType,
  isWaterBuildingType,
} from "@/src/lib/kingdom";
import type { BuildingData, KingdomData } from "@/src/types/game";

type PhaserModule = typeof import("phaser");
type PhaserContainer = import("phaser").GameObjects.Container;
type PhaserGraphics = import("phaser").GameObjects.Graphics;
type PhaserTween = import("phaser").Tweens.Tween;

type PhaserGlobal = typeof globalThis & {
  Phaser?: PhaserModule;
};

function getPhaser(): PhaserModule {
  const phaser = (globalThis as PhaserGlobal).Phaser;
  if (!phaser) {
    throw new Error(
      "Phaser runtime is unavailable. Load Phaser before importing scenes."
    );
  }
  return phaser;
}

const Phaser = getPhaser();

type IsoPoint = {
  x: number;
  y: number;
};

type TerrainTile = {
  x: number;
  y: number;
  elevation: number;
  moisture: number;
  variant: number;
};

// Tile terrain classification
type TileClass =
  | "shore"
  | "wet_sand"
  | "transition"
  | "dirt_path"
  | "stone_patch"
  | "grass_dry"
  | "grass_mid"
  | "grass_lush"
  | "grass_deep";

type TileSet = Set<string>;
type WaterSlot = {
  index: number;
  x: number;
  y: number;
  /** Visual rect width for slot highlight and placement marker */
  w: number;
  /** Visual rect height for slot highlight and placement marker */
  h: number;
};

export class KingdomScene extends Phaser.Scene {
  private readonly tileWidth = 64;
  private readonly tileHeight = 32;
  private readonly gridSize = 24;
  private readonly worldPadding = 320;

  private originX = 0;
  private originY = 140;
  private buildingLayer?: PhaserContainer;
  private terrainLayer?: PhaserGraphics;
  private decorLayer?: PhaserContainer;
  private waterLayer?: PhaserGraphics;
  private waterSlotLayer?: PhaserGraphics;
  private selectionMarker?: PhaserGraphics;
  private placementMarker?: PhaserGraphics;
  private buildingMap = new Map<string, Building>();
  private buildModeType: BuildingData["type"] | null = null;
  private isDraggingCamera = false;
  private didCameraDrag = false;
  private dragStartPointerX = 0;
  private dragStartPointerY = 0;
  private dragStartScrollX = 0;
  private dragStartScrollY = 0;
  private dragDistance = 0;
  private terrainData: TerrainTile[][] = [];
  private lightingOverlay?: PhaserGraphics;
  private waterShimmerTweens: PhaserTween[] = [];
  private waterShimmerGraphics: PhaserGraphics[] = [];
  // Decoration cache — rebuilt only when occupied/placeholder tile set changes
  private occupiedKey = "";
  // Building reconciliation — track previous data to skip unchanged sprites
  private buildingDataCache = new Map<string, BuildingData>();

  constructor() {
    super("KingdomScene");
  }

  create(): void {
    const kingdomData = this.getKingdomData();
    // Deep ocean blue — visible as water around the board
    this.cameras.main.setBackgroundColor("#152e44");
    this.originX = this.scale.width / 2;
    this.configureCamera();

    this.generateTerrainData();
    this.drawWaterLayer();
    this.drawTerrain();
    this.renderWorld(kingdomData);
    this.renderLighting();
    this.registerCameraDrag();
    this.registerBuildMode();
    this.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      this.handleMouseWheel,
      this
    );

    this.game.events.on("kingdom-updated", this.handleKingdomUpdated, this);
    this.game.events.on("focus-building", this.selectBuilding, this);
    this.game.events.on(
      "build-mode-changed",
      this.handleBuildModeChanged,
      this
    );
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  // ─── Terrain generation ────────────────────────────────────────────────────

  private generateTerrainData(): void {
    this.terrainData = [];
    const center = (this.gridSize - 1) / 2;

    for (let y = 0; y < this.gridSize; y++) {
      this.terrainData[y] = [];
      for (let x = 0; x < this.gridSize; x++) {
        const distanceFromCenter = Math.sqrt(
          (x - center) ** 2 + (y - center) ** 2
        );
        const maxDistance = this.gridSize / 2;

        // Elevation: high in center, falls off to zero at edge
        const baseElevation = Math.max(0, 1 - distanceFromCenter / maxDistance);
        const noise =
          Math.sin(x * 0.52) * Math.cos(y * 0.47) * 0.12 +
          Math.sin(x * 0.18 + 1.1) * Math.cos(y * 0.23 + 0.7) * 0.06;
        const elevation = Math.max(0, Math.min(1, baseElevation + noise));

        // Moisture: smooth variation across the map, more lush toward center
        const moisture =
          (Math.sin(x * 0.28 + 0.4) * Math.cos(y * 0.35 + 0.2) * 0.45 + 0.55) *
          (0.6 + baseElevation * 0.4);

        this.terrainData[y][x] = {
          x,
          y,
          elevation: elevation * 0.38,
          moisture: Math.max(0, Math.min(1, moisture)),
          variant: this.hashXY(x, y) % 4,
        };
      }
    }
  }

  // Stable key representing which tiles are occupied/placeholder — used to
  // skip expensive decoration re-renders when only gold/level changed.
  private computeOccupiedKey(buildings: BuildingData[]): string {
    return buildings
      .map((b) => `${b.isPlaceholder ? "p" : "b"}:${b.x}:${b.y}`)
      .sort()
      .join("|");
  }

  // Deterministic hash for a tile position (used for decoration seeding)
  private hashXY(x: number, y: number): number {
    return Math.abs(((x * 2971 + y * 2609) ^ (x * y * 1297 + x * 3571)) | 0);
  }

  private toTileKey(x: number, y: number): string {
    return `${x}:${y}`;
  }

  private computeDecorBufferTiles(buildings: BuildingData[]): TileSet {
    const reservedTiles = new Set<string>();

    for (const building of buildings) {
      if (building.isPlaceholder) continue;

      const clearance =
        building.type === "town_hall" || building.type === "monument" ? 1 : 0;

      for (let dy = -clearance; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = building.x + dx;
          const ty = building.y + dy;

          if (
            tx < 1 ||
            ty < 1 ||
            tx >= this.gridSize - 1 ||
            ty >= this.gridSize - 1
          ) {
            continue;
          }

          if (Math.abs(dx) + Math.abs(dy) <= clearance + 1) {
            reservedTiles.add(this.toTileKey(tx, ty));
          }
        }
      }
    }

    return reservedTiles;
  }

  private drawOccupiedFoundation(
    x: number,
    y: number,
    depth: number,
    tileClass: TileClass
  ): void {
    if (!this.decorLayer) return;

    const point = this.isoToScreen(x, y);
    const elevation = this.terrainData[y]?.[x]?.elevation || 0;
    const yOffset = -elevation * 20;
    const centerY = point.y + yOffset + this.tileHeight / 2;
    const foundation = this.add.graphics();

    const palette =
      tileClass === "stone_patch"
        ? { fill: 0x918573, edge: 0x706452, glow: 0xb8ab95 }
        : { fill: 0x7f775e, edge: 0x615741, glow: 0xa2977e };

    foundation.fillStyle(palette.fill, 0.9);
    foundation.fillPoints(
      [
        new Phaser.Geom.Point(point.x, point.y + yOffset + 2),
        new Phaser.Geom.Point(point.x + 26, centerY),
        new Phaser.Geom.Point(point.x, point.y + yOffset + 26),
        new Phaser.Geom.Point(point.x - 26, centerY),
      ],
      true
    );
    foundation.lineStyle(2, palette.edge, 0.55);
    foundation.strokePoints(
      [
        new Phaser.Geom.Point(point.x, point.y + yOffset + 2),
        new Phaser.Geom.Point(point.x + 26, centerY),
        new Phaser.Geom.Point(point.x, point.y + yOffset + 26),
        new Phaser.Geom.Point(point.x - 26, centerY),
      ],
      true
    );
    foundation.fillStyle(palette.glow, 0.18);
    foundation.fillEllipse(point.x, centerY - 1, 36, 12);
    foundation.setDepth(depth - 1);

    this.decorLayer.add(foundation);
  }

  // ─── Terrain classification ────────────────────────────────────────────────

  private classifyTile(x: number, y: number, tile: TerrainTile): TileClass {
    const distToEdge = Math.min(
      x,
      y,
      this.gridSize - 1 - x,
      this.gridSize - 1 - y
    );

    // Shore bands — outermost two rings become beach
    if (distToEdge === 0) return "shore";
    if (distToEdge === 1) return "wet_sand";
    if (distToEdge === 2) return "transition";

    // Stone patches in the inner edge band — scattered, not uniform
    if (distToEdge >= 3 && distToEdge <= 5) {
      const h = this.hashXY(x, y);
      if (h % 11 < 2) return "stone_patch";
    }

    // Dirt paths: cross-shaped roads through the center
    if (this.isDirtPath(x, y)) return "dirt_path";

    // Normal grass based on moisture
    if (tile.moisture < 0.38) return "grass_dry";
    if (tile.moisture < 0.58) return "grass_mid";
    if (tile.moisture < 0.78) return "grass_lush";
    return "grass_deep";
  }

  private isDirtPath(x: number, y: number): boolean {
    const mid = this.gridSize / 2;
    // Two main roads crossing at center — creates a natural + shape
    const onHorizontal = Math.abs(y - mid) < 1.4;
    const onVertical = Math.abs(x - mid) < 1.4;
    return onHorizontal || onVertical;
  }

  // ─── Terrain colors ────────────────────────────────────────────────────────

  private getTileTopColor(cls: TileClass, tile: TerrainTile): number {
    const h = this.hashXY(tile.x, tile.y);

    const palettes: Record<TileClass, number[]> = {
      shore: [0xd4b870, 0xcaae66, 0xc8a860],
      wet_sand: [0xb09458, 0xa88c50, 0xb89a5e],
      transition: [0x8a9458, 0x82904e, 0x7e8c4a],
      dirt_path: [0x8a7248, 0x826840, 0x7c6038, 0x866a42],
      stone_patch: [0x7c7a6a, 0x726e60, 0x6a6658, 0x787262],
      grass_dry: [0x5e7634, 0x567030, 0x4e682c, 0x60782e],
      grass_mid: [0x6a8038, 0x627834, 0x5c7430, 0x688038],
      grass_lush: [0x728840, 0x6a803c, 0x708a3e, 0x7a9042],
      grass_deep: [0x7a9044, 0x729040, 0x7c923e, 0x809448],
    };

    const opts = palettes[cls];
    return opts[h % opts.length];
  }

  private getTileSideColors(cls: TileClass): { left: number; right: number } {
    const sidePalettes: Record<TileClass, { left: number; right: number }> = {
      shore: { left: 0x9a7840, right: 0x7a5c2e },
      wet_sand: { left: 0x8a7038, right: 0x6c5428 },
      transition: { left: 0x627040, right: 0x4c5830 },
      dirt_path: { left: 0x6a5430, right: 0x4e3c1e },
      stone_patch: { left: 0x5c5a50, right: 0x48463e },
      grass_dry: { left: 0x445828, right: 0x334420 },
      grass_mid: { left: 0x4c6030, right: 0x384825 },
      grass_lush: { left: 0x526830, right: 0x3e5028 },
      grass_deep: { left: 0x586c30, right: 0x42522a },
    };
    return sidePalettes[cls];
  }

  // ─── Water layer ───────────────────────────────────────────────────────────

  private drawWaterLayer(): void {
    this.destroyWaterLayer();

    const worldBounds = this.getWorldBounds();
    const wg = this.add.graphics();

    const boardCenterX = worldBounds.centerX;
    const boardCenterY = worldBounds.centerY;
    const ringLayers = [
      { inset: -460, color: 0x1b4562, alpha: 0.62 },
      { inset: -340, color: 0x21526e, alpha: 0.56 },
      { inset: -240, color: 0x275d78, alpha: 0.5 },
      { inset: -155, color: 0x2c6680, alpha: 0.44 },
      { inset: -85, color: 0x31708a, alpha: 0.38 },
    ];

    const boardHalfWidth = (this.gridSize - 1) * (this.tileWidth / 2);
    const boardHalfHeight = (this.gridSize - 1) * (this.tileHeight / 2);

    for (const layer of ringLayers) {
      const halfWidth = boardHalfWidth - layer.inset;
      const halfHeight = boardHalfHeight - layer.inset * 0.5;

      wg.fillStyle(layer.color, layer.alpha);
      wg.fillPoints(
        [
          new Phaser.Geom.Point(boardCenterX, boardCenterY - halfHeight),
          new Phaser.Geom.Point(boardCenterX + halfWidth, boardCenterY),
          new Phaser.Geom.Point(boardCenterX, boardCenterY + halfHeight),
          new Phaser.Geom.Point(boardCenterX - halfWidth, boardCenterY),
        ],
        true
      );
    }

    wg.setDepth(-300);
    this.waterLayer = wg;

    // Animated shimmer strips — diagonal bands that pulse in alpha
    // They follow the isometric axis (constant x+y = k → horizontal screen strips)
    this.createWaterShimmer(worldBounds, boardCenterX, boardCenterY);
  }

  private createWaterShimmer(
    worldBounds: { x: number; y: number; width: number; height: number },
    cx: number,
    cy: number
  ): void {
    const numStrips = 9;
    const boardHalfWidth = (this.gridSize - 1) * (this.tileWidth / 2);
    const boardHalfHeight = (this.gridSize - 1) * (this.tileHeight / 2);

    for (let i = 0; i < numStrips; i++) {
      const sg = this.add.graphics();

      // Angle varies per strip — creates organic scatter of shimmer lines
      const angle = (i / numStrips) * Math.PI * 2;
      const dist = 200 + (i % 3) * 120;
      const lx = cx + Math.cos(angle) * dist;
      const ly = cy + Math.sin(angle) * dist * 0.5;
      const len = 60 + (i % 4) * 40;
      const halfLen = len / 2;

      // Only draw shimmer outside the board diamond.
      const diamondDistance =
        Math.abs((lx - cx) / boardHalfWidth) +
        Math.abs((ly - cy) / boardHalfHeight);
      if (diamondDistance < 1.08) continue;

      sg.lineStyle(2, 0x78c8e8, 1);
      sg.beginPath();
      sg.moveTo(lx - halfLen, ly);
      // Slight curve via midpoint
      sg.lineTo(lx, ly - 3);
      sg.lineTo(lx + halfLen, ly);
      sg.strokePath();

      sg.setAlpha(0);
      sg.setDepth(-200);

      const tween = this.tweens.add({
        targets: sg,
        alpha: { from: 0, to: 0.18 + (i % 3) * 0.06 },
        duration: 1600 + i * 280,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 350,
      });

      this.waterShimmerGraphics.push(sg);
      this.waterShimmerTweens.push(tween);
    }
  }

  private destroyWaterLayer(): void {
    this.waterShimmerTweens.forEach((t) => t.destroy());
    this.waterShimmerTweens = [];
    this.waterShimmerGraphics.forEach((g) => g.destroy());
    this.waterShimmerGraphics = [];
    this.waterLayer?.destroy();
    this.waterLayer = undefined;
  }

  // ─── Terrain drawing ───────────────────────────────────────────────────────

  private drawTerrain(): void {
    this.terrainLayer?.destroy();
    this.placementMarker?.destroy();

    const grid = this.add.graphics();

    // Draw tiles back-to-front for correct painter's algorithm depth
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const tile = this.terrainData[y][x];
        const point = this.isoToScreen(x, y);
        const elevation = tile.elevation * 20;
        const topY = point.y - elevation;

        const cls = this.classifyTile(x, y, tile);
        const topColor = this.getTileTopColor(cls, tile);
        const sides = this.getTileSideColors(cls);

        // ── Elevation side faces ──────────────────────────────────────────────
        if (tile.elevation > 0.03) {
          // Left face
          grid.fillStyle(sides.left, 1);
          grid.fillPoints(
            [
              new Phaser.Geom.Point(
                point.x - this.tileWidth / 2,
                topY + this.tileHeight / 2 + elevation * 0.5
              ),
              new Phaser.Geom.Point(
                point.x - this.tileWidth / 2,
                topY + this.tileHeight / 2
              ),
              new Phaser.Geom.Point(point.x, topY + this.tileHeight),
              new Phaser.Geom.Point(
                point.x,
                topY + this.tileHeight + elevation * 0.5
              ),
            ],
            true
          );

          // Right face — slightly darker (more angled away from light)
          grid.fillStyle(sides.right, 1);
          grid.fillPoints(
            [
              new Phaser.Geom.Point(point.x, topY + this.tileHeight),
              new Phaser.Geom.Point(
                point.x + this.tileWidth / 2,
                topY + this.tileHeight / 2
              ),
              new Phaser.Geom.Point(
                point.x + this.tileWidth / 2,
                topY + this.tileHeight / 2 + elevation * 0.5
              ),
              new Phaser.Geom.Point(
                point.x,
                topY + this.tileHeight + elevation * 0.5
              ),
            ],
            true
          );
        }

        // ── Top face ──────────────────────────────────────────────────────────
        const topPoints = [
          new Phaser.Geom.Point(point.x, topY),
          new Phaser.Geom.Point(
            point.x + this.tileWidth / 2,
            topY + this.tileHeight / 2
          ),
          new Phaser.Geom.Point(point.x, topY + this.tileHeight),
          new Phaser.Geom.Point(
            point.x - this.tileWidth / 2,
            topY + this.tileHeight / 2
          ),
        ];

        grid.fillStyle(topColor, 1);
        grid.fillPoints(topPoints, true);

        // ── Top-face micro detail (breaks up flat tiles without grid lines) ──
        this.drawTileDetail(grid, cls, tile, point.x, topY);
      }
    }

    this.terrainLayer = grid;
    this.selectionMarker = this.add.graphics().setVisible(false);
    this.placementMarker = this.add.graphics().setVisible(false);
  }

  private drawTileDetail(
    g: PhaserGraphics,
    cls: TileClass,
    tile: TerrainTile,
    px: number,
    topY: number
  ): void {
    const h = this.hashXY(tile.x, tile.y);
    const cy = topY + this.tileHeight / 2;

    if (cls === "grass_lush" || cls === "grass_deep") {
      // Subtle light speckles — mimics light through canopy
      if (h % 5 < 2) {
        g.fillStyle(0xffffff, 0.025);
        g.fillCircle(px + (h % 9) - 4, cy + (h % 5) - 2, 3);
      }
    } else if (cls === "shore" || cls === "wet_sand") {
      // Sandy ripple marks
      if (h % 3 === 0) {
        g.lineStyle(1, 0xc8a040, 0.12);
        g.strokeLineShape(
          new Phaser.Geom.Line(
            px - 8 + (h % 5),
            cy - 1,
            px + 8 - (h % 3),
            cy + 1
          )
        );
      }
    } else if (cls === "stone_patch") {
      // Subtle crack lines
      if (h % 4 === 0) {
        g.lineStyle(1, 0x3a3830, 0.2);
        g.strokeLineShape(
          new Phaser.Geom.Line(px - 4 + (h % 7), cy - 2, px + 2, cy + 2)
        );
      }
    } else if (cls === "dirt_path") {
      // Worn track marks
      if (h % 6 < 2) {
        g.fillStyle(0x5a3e18, 0.15);
        g.fillCircle(px + (h % 11) - 5, cy + (h % 3) - 1, 2);
      }
    }
  }

  // ─── Coordinate utilities ──────────────────────────────────────────────────

  isoToScreen(x: number, y: number): IsoPoint {
    return {
      x: (x - y) * (this.tileWidth / 2) + this.originX,
      y: (x + y) * (this.tileHeight / 2) + this.originY,
    };
  }

  private getBuildingRenderPoint(building: BuildingData): {
    x: number;
    y: number;
    depth: number;
  } {
    if (isWaterBuildingType(building.type)) {
      const slot = this.getWaterSlotPosition(building);
      if (!slot) {
        return { x: this.originX, y: this.originY, depth: this.originY };
      }

      return {
        x: slot.x,
        y: slot.y,
        depth: slot.y + 12,
      };
    }

    const elevation =
      this.terrainData[building.y]?.[building.x]?.elevation || 0;
    const point = this.isoToScreen(building.x, building.y);
    const yOffset = this.tileHeight / 2 - elevation * 20;
    return {
      x: point.x,
      y: point.y + yOffset,
      depth: point.y + yOffset,
    };
  }

  selectBuilding(building: BuildingData): void {
    const selectedBuilding = this.buildingMap.get(building.id);
    if (!selectedBuilding || !this.selectionMarker) return;

    if (isWaterBuildingType(building.type)) {
      const slot = this.getWaterSlotPosition(building);
      if (!slot) return;

      this.selectionMarker
        .clear()
        .lineStyle(2, 0xd4a574, 0.9)
        .strokeRect(slot.x - slot.w / 2, slot.y - slot.h / 2, slot.w, slot.h)
        .setDepth(selectedBuilding.depth - 1)
        .setVisible(true);

      this.game.events.emit("building-selected", building);
      return;
    }

    const screenPosition = this.isoToScreen(building.x, building.y);
    const yOffset =
      this.tileHeight / 2 +
      8 -
      (this.terrainData[building.y]?.[building.x]?.elevation || 0) * 20;

    this.selectionMarker
      .clear()
      .lineStyle(2, 0xd4a574, 0.9)
      .strokePoints(
        [
          new Phaser.Geom.Point(
            screenPosition.x,
            screenPosition.y + yOffset - 12
          ),
          new Phaser.Geom.Point(
            screenPosition.x + this.tileWidth / 2,
            screenPosition.y + yOffset + 4
          ),
          new Phaser.Geom.Point(
            screenPosition.x,
            screenPosition.y + yOffset + 12
          ),
          new Phaser.Geom.Point(
            screenPosition.x - this.tileWidth / 2,
            screenPosition.y + yOffset + 4
          ),
        ],
        true
      )
      .setDepth(selectedBuilding.depth - 1)
      .setVisible(true);

    this.game.events.emit("building-selected", building);
  }

  canSelectBuilding(): boolean {
    return !this.didCameraDrag;
  }

  private getKingdomData(): KingdomData {
    return (
      (this.registry.get("kingdomData") as KingdomData | undefined) ?? {
        id: "unknown",
        userId: "unknown",
        name: "Unnamed Kingdom",
        gold: 0,
        prestige: 0,
        population: 0,
        defense_rating: 0,
        attack_rating: 0,
        building_slots: 0,
        last_synced_at: null,
        ownerName: "Unknown Ruler",
        ownerAvatarUrl: null,
        themeId: null,
        buildings: [],
        githubStats: null,
      }
    );
  }

  // ─── Camera ────────────────────────────────────────────────────────────────

  private configureCamera(): void {
    const camera = this.cameras.main;
    const worldBounds = this.getWorldBounds();
    camera.setBounds(
      worldBounds.x,
      worldBounds.y,
      worldBounds.width,
      worldBounds.height
    );
    camera.centerOn(worldBounds.centerX, worldBounds.centerY);
  }

  private getWorldBounds() {
    const camera = this.cameras.main;
    const horizontalPadding = Math.max(
      this.worldPadding,
      Math.floor(camera.width * 0.5)
    );
    const verticalPadding = Math.max(
      this.worldPadding,
      Math.floor(camera.height * 0.4)
    );
    const corners = [
      this.isoToScreen(0, 0),
      this.isoToScreen(this.gridSize - 1, 0),
      this.isoToScreen(0, this.gridSize - 1),
      this.isoToScreen(this.gridSize - 1, this.gridSize - 1),
    ];

    const minX =
      Math.min(...corners.map((p) => p.x)) - this.tileWidth - horizontalPadding;
    const maxX =
      Math.max(...corners.map((p) => p.x)) + this.tileWidth + horizontalPadding;
    const minY =
      Math.min(...corners.map((p) => p.y)) - this.tileHeight - verticalPadding;
    const maxY =
      Math.max(...corners.map((p) => p.y)) + this.tileHeight + verticalPadding;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  private getWaterSlots(): WaterSlot[] {
    const worldBounds = this.getWorldBounds();
    const cx = worldBounds.centerX;
    const cy = worldBounds.centerY;

    // Board diamond half-extents: halfW=736, halfH=368 (for a 24×24 iso grid).
    // The 4 slots are positioned just outside each diagonal edge of the board,
    // in the visible water ring. Each zone sits perpendicular to its board edge:
    //   |dx/736| + |dy/368| > 1  →  outside board  ✓
    //   |dx/1196| + |dy/598| < 1  →  inside water  ✓
    //
    // Slot 0 — Royal Flagship (NW edge zone, largest)
    // Slots 1-3 — smaller vessels (NE, SW, SE edge zones)
    return [
      { index: 0, x: cx - 430, y: cy - 280, w: 300, h: 120 },
      { index: 1, x: cx + 430, y: cy - 280, w: 240, h: 100 },
      { index: 2, x: cx - 430, y: cy + 280, w: 240, h: 100 },
      { index: 3, x: cx + 430, y: cy + 280, w: 240, h: 100 },
    ];
  }

  private getWaterSlotPosition(building: BuildingData): WaterSlot | null {
    const slotIndex = decodeWaterSlotPosition(building.x, building.y);
    if (slotIndex === null) return null;
    return this.getWaterSlots()[slotIndex] ?? null;
  }

  private getNearestWaterSlot(
    worldX: number,
    worldY: number
  ): WaterSlot | null {
    if (!this.buildModeType) return null;

    // Only consider slots valid for the current vessel type.
    const validIndices = getValidWaterSlotsForType(this.buildModeType);
    const candidates = this.getWaterSlots().filter((s) =>
      validIndices.includes(s.index)
    );

    // Highlight when cursor is inside the zone rectangle (with a margin).
    // This mirrors how board tiles highlight on hover — no arbitrary distance.
    const margin = 28;
    for (const slot of candidates) {
      if (
        worldX >= slot.x - slot.w / 2 - margin &&
        worldX <= slot.x + slot.w / 2 + margin &&
        worldY >= slot.y - slot.h / 2 - margin &&
        worldY <= slot.y + slot.h / 2 + margin
      ) {
        return slot;
      }
    }
    return null;
  }

  /**
   * Draw subtle zone outlines for valid water slots when the player is in water
   * build mode. Pass null (or a non-water type) to hide all slot indicators.
   * Never called outside of build-mode entry/exit — slots are invisible at rest,
   * exactly like board tile highlights.
   */
  private drawWaterSlots(buildType: BuildingData["type"] | null = null): void {
    this.waterSlotLayer?.destroy();
    this.waterSlotLayer = undefined;

    if (!buildType || !isWaterBuildingType(buildType)) return;

    const graphics = this.add.graphics();
    const validIndices = getValidWaterSlotsForType(buildType);

    for (const slot of this.getWaterSlots()) {
      if (!validIndices.includes(slot.index)) continue;
      // Subtle dashed-style outline — same visual language as the board tile highlights
      graphics.lineStyle(1.5, 0x9edff3, 0.4);
      graphics.strokeRect(slot.x - slot.w / 2, slot.y - slot.h / 2, slot.w, slot.h);
      graphics.fillStyle(0x9edff3, 0.08);
      graphics.fillRect(slot.x - slot.w / 2, slot.y - slot.h / 2, slot.w, slot.h);
    }

    graphics.setDepth(-140);
    this.waterSlotLayer = graphics;
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  private registerCameraDrag(): void {
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      this.handlePointerDown,
      this
    );
    this.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      this.handlePointerMove,
      this
    );
    this.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.input.on(Phaser.Input.Events.GAME_OUT, this.handlePointerUp, this);
  }

  private registerBuildMode(): void {
    this.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      this.handlePlacementPointerMove,
      this
    );
  }

  private handlePointerDown(pointer: import("phaser").Input.Pointer): void {
    if (!pointer.leftButtonDown()) return;
    this.isDraggingCamera = true;
    this.dragDistance = 0;
    this.dragStartPointerX = pointer.x;
    this.dragStartPointerY = pointer.y;
    this.dragStartScrollX = this.cameras.main.scrollX;
    this.dragStartScrollY = this.cameras.main.scrollY;
  }

  private handlePointerMove(pointer: import("phaser").Input.Pointer): void {
    if (!this.isDraggingCamera || !pointer.isDown) return;

    const deltaX = pointer.x - this.dragStartPointerX;
    const deltaY = pointer.y - this.dragStartPointerY;
    this.dragDistance = Math.hypot(deltaX, deltaY);

    if (this.dragDistance > 6) {
      this.didCameraDrag = true;
      this.input.setDefaultCursor("grabbing");
    }

    this.cameras.main.setScroll(
      this.dragStartScrollX - deltaX,
      this.dragStartScrollY - deltaY
    );
  }

  private handlePointerUp(pointer?: import("phaser").Input.Pointer): void {
    this.isDraggingCamera = false;
    this.input.setDefaultCursor("default");

    if (this.buildModeType && pointer && !this.didCameraDrag) {
      if (isWaterBuildingType(this.buildModeType)) {
        const slot = this.getNearestWaterSlot(pointer.worldX, pointer.worldY);
        if (slot && this.isWaterSlotAvailable(slot.index)) {
          this.game.events.emit(
            "tile-selected",
            encodeWaterSlotPosition(slot.index)
          );
        }
      } else {
        const tile = this.screenToTile(pointer.worldX, pointer.worldY);
        if (tile && this.isTileAvailable(tile.x, tile.y)) {
          this.game.events.emit("tile-selected", tile);
        }
      }
    }

    if (!this.didCameraDrag) return;
    this.time.delayedCall(0, () => {
      this.didCameraDrag = false;
      this.dragDistance = 0;
    });
  }

  // ─── World rendering ───────────────────────────────────────────────────────

  private renderWorld(kingdomData: KingdomData): void {
    this.renderDecor(kingdomData);
    this.renderBuildings(kingdomData);
    // renderLighting is static — called separately in create() and handleResize()
  }

  private renderBuildings(kingdomData: KingdomData): void {
    // Reconcile: remove buildings that no longer exist
    const newIds = new Set(kingdomData.buildings.map((b) => b.id));
    for (const [id, building] of this.buildingMap) {
      if (!newIds.has(id)) {
        building.destroy();
        this.buildingMap.delete(id);
        this.buildingDataCache.delete(id);
      }
    }

    if (!this.buildingLayer) {
      this.buildingLayer = this.add.container();
    }
    const layer = this.buildingLayer;

    this.selectionMarker?.setVisible(false);

    const sortedBuildings = [...kingdomData.buildings].sort(
      (a, b) =>
        this.getBuildingRenderPoint(a).depth -
        this.getBuildingRenderPoint(b).depth
    );

    sortedBuildings.forEach((buildingData) => {
      const cached = this.buildingDataCache.get(buildingData.id);
      const needsRecreate =
        !cached ||
        cached.level !== buildingData.level ||
        cached.isPlaceholder !== buildingData.isPlaceholder;

      if (needsRecreate) {
        // Destroy the stale sprite if it exists, then create a fresh one
        const existing = this.buildingMap.get(buildingData.id);
        if (existing) {
          existing.destroy();
          this.buildingMap.delete(buildingData.id);
        }

        const renderPoint = this.getBuildingRenderPoint(buildingData);
        const building = new Building(
          this,
          renderPoint.x,
          renderPoint.y,
          buildingData
        );
        building.setDepth(renderPoint.depth);
        layer.add(building);
        this.buildingMap.set(buildingData.id, building);
      }

      this.buildingDataCache.set(buildingData.id, buildingData);
    });

    // Re-sort container children so painter's-algorithm depth stays correct
    // after any additions. n is small (≤ building_slots) so this is cheap.
    layer.sort("depth");
  }

  private renderDecor(kingdomData: KingdomData): void {
    this.occupiedKey = this.computeOccupiedKey(kingdomData.buildings);
    this.decorLayer?.destroy(true);
    this.decorLayer = this.add.container();

    const occupiedTiles = new Set(
      kingdomData.buildings
        .filter((b) => !b.isPlaceholder)
        .map((b) => this.toTileKey(b.x, b.y))
    );
    const placeholderTiles = new Set(
      kingdomData.buildings
        .filter((b) => b.isPlaceholder)
        .map((b) => this.toTileKey(b.x, b.y))
    );
    const decorBufferTiles = this.computeDecorBufferTiles(
      kingdomData.buildings
    );

    const themeKey = kingdomData.themeId ?? "realm";

    for (let y = 1; y < this.gridSize - 1; y++) {
      for (let x = 1; x < this.gridSize - 1; x++) {
        const point = this.isoToScreen(x, y);
        const elevation = this.terrainData[y]?.[x]?.elevation || 0;
        const yOffset = -elevation * 20;
        const seed = this.hashXY(x + this.hashXY(themeKey.length, x), y);
        const tile = this.terrainData[y][x];
        const cls = this.classifyTile(x, y, tile);
        const depth = point.y + yOffset;
        const tileKey = this.toTileKey(x, y);

        if (occupiedTiles.has(tileKey)) {
          this.drawOccupiedFoundation(x, y, depth, cls);
          continue;
        }

        // Ruins on placeholder tiles
        if (placeholderTiles.has(tileKey)) {
          const ruins = this.add
            .image(point.x, point.y + yOffset - 2, "prop-ruins")
            .setOrigin(0.5, 0.9)
            .setScale(0.54 + (seed % 3) * 0.04)
            .setTint(0x6a7a6a)
            .setAlpha(0.85)
            .setDepth(depth);
          this.decorLayer.add(ruins);
          continue;
        }

        // Skip shore/sand border — nothing placed there
        if (cls === "shore" || cls === "wet_sand" || cls === "transition")
          continue;

        if (decorBufferTiles.has(tileKey)) continue;

        // All remaining tiles are green grass
        const isGreen =
          cls === "grass_dry" ||
          cls === "grass_mid" ||
          cls === "grass_lush" ||
          cls === "grass_deep";
        if (!isGreen) continue;

        // ── Dense grass carpet: 100 random sub-tile attempts → ~45 sprites ────
        // Each attempt is a random point in the tile bounding box;
        // the diamond constraint |dx/32| + |dy/16 − 1| < 0.92 rejects
        // corners outside the iso diamond, leaving ~47% = ~47 placements.
        {
          const tileCX = point.x;
          const tileNY = point.y + yOffset;
          const tileHW = this.tileWidth / 2; // 32

          // Per-class tint palette for colour variation
          const tints =
            cls === "grass_dry"
              ? [0xddf0aa, 0xe8f0b4, 0xd8e89a]
              : cls === "grass_mid"
              ? [0xeefccc, 0xffffff, 0xe8f8c0]
              : cls === "grass_deep"
              ? [0xccffcc, 0xd8ffd8, 0xc4f8c4]
              : /* grass_lush */ [0xffffff, 0xeeffcc, 0xf4ffdc];

          for (let i = 0; i < 100; i++) {
            const s2 = this.hashXY(x * 71 + i, y * 83 + i * 13);
            const s3 = this.hashXY(s2 + x * 7, s2 + y * 11 + i);

            // Random position in tile bounding box: dx ∈ [-32,32], dy ∈ [0,32]
            const dx = (s2 % 65) - 32;
            const dy = s3 % 33;

            // Reject outside iso diamond
            if (Math.abs(dx) / tileHW + Math.abs(dy / 16 - 1) > 0.92) continue;

            const gx = tileCX + dx;
            const gy = tileNY + dy;

            const isFlower = s2 % 10 === 0;
            const key = isFlower
              ? "prop-flower"
              : s2 % 4 === 0
              ? "prop-grass-b"
              : "prop-grass-tuft";
            const scale = isFlower
              ? 0.38 + (s2 % 4) * 0.06
              : 0.22 + (s2 % 8) * 0.04; // 0.22–0.50

            this.decorLayer.add(
              this.add
                .image(gx, gy, key)
                .setOrigin(0.5, 0.9)
                .setScale(scale)
                .setTint(tints[s2 % 3])
                .setDepth(gy)
            );
          }
        }
      }
    }
  }

  // ─── Lighting ──────────────────────────────────────────────────────────────

  private renderLighting(): void {
    this.lightingOverlay?.destroy();
    this.lightingOverlay = this.add.graphics();

    const worldBounds = this.getWorldBounds();
    const cx = worldBounds.centerX;
    const cy = worldBounds.centerY;

    // Subtle ambient atmosphere — very slight warm-to-cool directional tone
    this.lightingOverlay.fillStyle(0x040810, 0.08);
    this.lightingOverlay.fillRect(
      worldBounds.x,
      worldBounds.y,
      worldBounds.width,
      worldBounds.height
    );


    // Center warmth — soft golden glow to highlight the playfield
    this.lightingOverlay.fillStyle(0xffe8a0, 0.028);
    this.lightingOverlay.fillEllipse(cx, cy, 900, 440);

    // Inner center highlight — even subtler, smaller ellipse
    this.lightingOverlay.fillStyle(0xfffce8, 0.018);
    this.lightingOverlay.fillEllipse(cx, cy, 480, 240);

    this.lightingOverlay.setDepth(100);
  }

  // ─── Event handlers ────────────────────────────────────────────────────────

  private handleKingdomUpdated(updatedKingdom?: KingdomData): void {
    const kingdomData = updatedKingdom ?? this.getKingdomData();
    const newKey = this.computeOccupiedKey(kingdomData.buildings);
    // Decoration depends only on which tiles are occupied/placeholder, not on
    // gold, prestige, or other fields — skip the expensive rebuild when unchanged.
    if (newKey !== this.occupiedKey) {
      this.renderDecor(kingdomData);
    }
    this.renderBuildings(kingdomData);
  }

  private handleResize(gameSize: { width: number }): void {
    this.originX = gameSize.width / 2;
    this.configureCamera();
    this.children.removeAll(true);
    this.buildingLayer = undefined;
    this.decorLayer = undefined;
    this.terrainLayer = undefined;
    this.selectionMarker = undefined;
    this.placementMarker = undefined;
    this.lightingOverlay = undefined;
    // Clear reconciliation caches — all objects were destroyed by removeAll
    this.buildingMap.clear();
    this.buildingDataCache.clear();
    this.occupiedKey = "";
    // Water graphics are destroyed as part of removeAll(true) above,
    // but we still need to clear our references and tweens
    this.waterShimmerTweens.forEach((t) => t.destroy());
    this.waterShimmerTweens = [];
    this.waterShimmerGraphics = [];
    this.waterLayer = undefined;
    this.waterSlotLayer = undefined;
    this.drawWaterLayer();
    this.drawWaterSlots(this.buildModeType);
    this.drawTerrain();
    this.renderWorld(this.getKingdomData());
    this.renderLighting();
  }

  private handleShutdown(): void {
    this.destroyWaterLayer();
    this.waterSlotLayer?.destroy();
    this.game.events.off("kingdom-updated", this.handleKingdomUpdated, this);
    this.game.events.off("focus-building", this.selectBuilding, this);
    this.game.events.off(
      "build-mode-changed",
      this.handleBuildModeChanged,
      this
    );
    this.scale.off("resize", this.handleResize, this);
    this.input.off(
      Phaser.Input.Events.POINTER_DOWN,
      this.handlePointerDown,
      this
    );
    this.input.off(
      Phaser.Input.Events.POINTER_MOVE,
      this.handlePointerMove,
      this
    );
    this.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.input.off(Phaser.Input.Events.GAME_OUT, this.handlePointerUp, this);
    this.input.off(
      Phaser.Input.Events.POINTER_WHEEL,
      this.handleMouseWheel,
      this
    );
  }

  private handleBuildModeChanged(buildModeType: BuildingData["type"] | null) {
    this.buildModeType = buildModeType;
    this.placementMarker?.setVisible(false);
    // Show zone outlines only when placing a water building, like how the board
    // shows tile highlights only during land build mode.
    this.drawWaterSlots(buildModeType);
  }

  private handlePlacementPointerMove(pointer: import("phaser").Input.Pointer) {
    if (!this.buildModeType || this.isDraggingCamera) {
      this.placementMarker?.setVisible(false);
      return;
    }

    if (isWaterBuildingType(this.buildModeType)) {
      const slot = this.getNearestWaterSlot(pointer.worldX, pointer.worldY);
      if (!slot) {
        this.placementMarker?.setVisible(false);
        return;
      }

      this.drawWaterPlacementMarker(
        slot,
        this.isWaterSlotAvailable(slot.index)
      );
      return;
    }

    const tile = this.screenToTile(pointer.worldX, pointer.worldY);
    if (!tile) {
      this.placementMarker?.setVisible(false);
      return;
    }

    this.drawPlacementMarker(
      tile.x,
      tile.y,
      this.isTileAvailable(tile.x, tile.y)
    );
  }

  private handleMouseWheel(
    _pointer: import("phaser").Input.Pointer,
    _gameObjects: unknown,
    _deltaX: number,
    deltaY: number
  ) {
    const nextZoom = Phaser.Math.Clamp(
      this.cameras.main.zoom - deltaY * 0.001,
      0.65,
      1.15
    );
    this.cameras.main.setZoom(nextZoom);
  }

  // ─── Placement marker ──────────────────────────────────────────────────────

  private drawPlacementMarker(x: number, y: number, isValid: boolean) {
    const marker = this.placementMarker;
    if (!marker) return;

    const point = this.isoToScreen(x, y);
    const elevation = this.terrainData[y]?.[x]?.elevation || 0;
    const yOffset = -elevation * 20;
    const color = isValid ? 0x6b8c5a : 0x8c5a5a;

    marker
      .clear()
      .lineStyle(2, color, 0.85)
      .strokePoints(
        [
          new Phaser.Geom.Point(point.x, point.y + yOffset),
          new Phaser.Geom.Point(
            point.x + this.tileWidth / 2,
            point.y + yOffset + this.tileHeight / 2
          ),
          new Phaser.Geom.Point(point.x, point.y + yOffset + this.tileHeight),
          new Phaser.Geom.Point(
            point.x - this.tileWidth / 2,
            point.y + yOffset + this.tileHeight / 2
          ),
        ],
        true
      )
      .setDepth(point.y + yOffset + this.tileHeight / 2 + 10)
      .setVisible(true);
  }

  private drawWaterPlacementMarker(slot: WaterSlot, isValid: boolean) {
    const marker = this.placementMarker;
    if (!marker) return;

    const color = isValid ? 0x7cd3ec : 0xaa6767;

    marker
      .clear()
      .lineStyle(2, color, 0.9)
      .strokeRect(slot.x - slot.w / 2, slot.y - slot.h / 2, slot.w, slot.h)
      .setDepth(slot.y + slot.h)
      .setVisible(true);
  }

  // ─── Tile picking ──────────────────────────────────────────────────────────

  private screenToTile(worldX: number, worldY: number) {
    // Shift worldY up by half a tile so detection is centered on the
    // tile face (N-vertex to S-vertex) rather than anchored at N vertex.
    const adjY = worldY - this.tileHeight / 2;
    const rawX =
      ((worldX - this.originX) / (this.tileWidth / 2) +
        (adjY - this.originY) / (this.tileHeight / 2)) /
      2;
    const rawY =
      ((adjY - this.originY) / (this.tileHeight / 2) -
        (worldX - this.originX) / (this.tileWidth / 2)) /
      2;
    const x = Math.round(rawX);
    const y = Math.round(rawY);

    if (x < 0 || y < 0 || x >= this.gridSize || y >= this.gridSize) return null;
    return { x, y };
  }

  private isTileAvailable(x: number, y: number) {
    return !this.getKingdomData().buildings.some(
      (b) => !b.isPlaceholder && b.x === x && b.y === y
    );
  }

  private isWaterSlotAvailable(_slotIndex: number) {
    // Water slots have no occupancy limit — multiple vessels can share a zone,
    // matching the board's behaviour where tiles are only blocked by the same
    // building occupying the exact encoded position in the DB.
    return true;
  }
}
