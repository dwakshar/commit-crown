import { Building } from "@/src/components/game/entities/Building";
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

  // Deterministic hash for a tile position (used for decoration seeding)
  private hashXY(x: number, y: number): number {
    return Math.abs(((x * 2971 + y * 2609) ^ (x * y * 1297 + x * 3571)) | 0);
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

    // Shallow water glow around the board — lighter blue near land
    // Layered ellipses create a depth gradient effect
    const boardCenterX = worldBounds.centerX;
    const boardCenterY = worldBounds.centerY;

    const glowLayers = [
      { rx: 1200, ry: 560, color: 0x1e4a68, alpha: 0.6 },
      { rx: 1000, ry: 470, color: 0x225572, alpha: 0.55 },
      { rx: 820, ry: 390, color: 0x275e7a, alpha: 0.5 },
      { rx: 660, ry: 320, color: 0x2c6882, alpha: 0.45 },
      { rx: 520, ry: 250, color: 0x31708a, alpha: 0.4 },
    ];

    for (const layer of glowLayers) {
      wg.fillStyle(layer.color, layer.alpha);
      wg.fillEllipse(boardCenterX, boardCenterY, layer.rx * 2, layer.ry * 2);
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
    const boardRadius = 580;

    for (let i = 0; i < numStrips; i++) {
      const sg = this.add.graphics();

      // Angle varies per strip — creates organic scatter of shimmer lines
      const angle = (i / numStrips) * Math.PI * 2;
      const dist = 200 + (i % 3) * 120;
      const lx = cx + Math.cos(angle) * dist;
      const ly = cy + Math.sin(angle) * dist * 0.5;
      const len = 60 + (i % 4) * 40;
      const halfLen = len / 2;

      // Only draw shimmer outside the board diamond (approximate with ellipse check)
      const distFromCenter = Math.sqrt((lx - cx) ** 2 + ((ly - cy) * 2) ** 2);
      if (distFromCenter < boardRadius * 0.72) continue;

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

  selectBuilding(building: BuildingData): void {
    const selectedBuilding = this.buildingMap.get(building.id);
    if (!selectedBuilding || !this.selectionMarker) return;

    const screenPosition = this.isoToScreen(building.x, building.y);
    const yOffset =
      -8 - (this.terrainData[building.y]?.[building.x]?.elevation || 0) * 20;

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
      const tile = this.screenToTile(pointer.worldX, pointer.worldY);
      if (tile && this.isTileAvailable(tile.x, tile.y)) {
        this.game.events.emit("tile-selected", tile);
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
    this.renderLighting();
  }

  private renderBuildings(kingdomData: KingdomData): void {
    this.buildingLayer?.destroy(true);
    this.buildingLayer = this.add.container();
    this.buildingMap.clear();
    this.selectionMarker?.setVisible(false);

    const sortedBuildings = [...kingdomData.buildings].sort(
      (a, b) => a.x + a.y - (b.x + b.y)
    );

    sortedBuildings.forEach((buildingData) => {
      const elevation =
        this.terrainData[buildingData.y]?.[buildingData.x]?.elevation || 0;
      const point = this.isoToScreen(buildingData.x, buildingData.y);
      const yOffset = -elevation * 20;
      const building = new Building(
        this,
        point.x,
        point.y + yOffset,
        buildingData
      );

      building.setDepth(point.y + yOffset);
      this.buildingLayer?.add(building);
      this.buildingMap.set(buildingData.id, building);
    });
  }

  private renderDecor(kingdomData: KingdomData): void {
    this.decorLayer?.destroy(true);
    this.decorLayer = this.add.container();

    const occupiedTiles = new Set(
      kingdomData.buildings
        .filter((b) => !b.isPlaceholder)
        .map((b) => `${b.x}:${b.y}`)
    );
    const placeholderTiles = new Set(
      kingdomData.buildings
        .filter((b) => b.isPlaceholder)
        .map((b) => `${b.x}:${b.y}`)
    );

    const themeKey = kingdomData.themeId ?? "realm";

    for (let y = 1; y < this.gridSize - 1; y++) {
      for (let x = 1; x < this.gridSize - 1; x++) {
        if (occupiedTiles.has(`${x}:${y}`)) continue;

        const point = this.isoToScreen(x, y);
        const elevation = this.terrainData[y]?.[x]?.elevation || 0;
        const yOffset = -elevation * 20;
        const seed = this.hashXY(x + this.hashXY(themeKey.length, x), y);
        const tile = this.terrainData[y][x];
        const cls = this.classifyTile(x, y, tile);
        const depth = point.y + yOffset;

        // Ruins on placeholder tiles
        if (placeholderTiles.has(`${x}:${y}`)) {
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

        // Skip non-green border tiles — nothing grows on sand/shore
        if (
          cls === "shore" ||
          cls === "wet_sand" ||
          cls === "transition" ||
          cls === "stone_patch" ||
          cls === "dirt_path"
        )
          continue;

        // All remaining tiles are green grass — shorthand check
        const isGreen =
          cls === "grass_dry" ||
          cls === "grass_mid" ||
          cls === "grass_lush" ||
          cls === "grass_deep";
        if (!isGreen) continue;

        // ── 2 big trees only, on lush/deep tiles ─────────────────────────────
        if (seed % 4 === 2 && (cls === "grass_lush" || cls === "grass_deep")) {
          const key = seed % 3 === 0 ? "prop-tree-b" : "prop-tree";
          const scale = 0.72 + (seed % 5) * 0.04;
          const tint = key === "prop-tree" ? 0xffffff : 0xeeeeff;
          const sprite = this.add
            .image(point.x + (seed % 9) - 4, point.y + yOffset, key)
            .setOrigin(0.5, 0.92)
            .setScale(scale)
            .setTint(tint)
            .setDepth(depth + 4);
          this.decorLayer.add(sprite);
          continue;
        }

        // ── Rocks — scattered on green tiles ─────────────────────────────────
        if (seed % 18 === 2) {
          const rx = point.x + (this.hashXY(x + 1, y) % 16) - 8;
          const ry = point.y + yOffset + (this.hashXY(x, y + 1) % 8) - 4;
          const rock = this.add
            .image(rx, ry, "prop-stones")
            .setOrigin(0.5, 0.9)
            .setScale(0.42 + (seed % 4) * 0.06)
            .setDepth(ry);
          this.decorLayer.add(rock);
          continue;
        }

        // ── Dense flowers — every 3rd green tile, 2-3 per spot → ~200+ ───────
        if (seed % 2 === 1) {
          const numFlowers = 2 + (seed % 2);
          for (let f = 0; f < numFlowers; f++) {
            const fx = point.x + (this.hashXY(x + f * 3, y + f) % 26) - 13;
            const fy =
              point.y + yOffset + (this.hashXY(x + f, y + f * 2) % 10) - 5;
            const flower = this.add
              .image(fx, fy, "prop-flower")
              .setOrigin(0.5, 0.85)
              .setScale(0.48 + (seed % 3) * 0.06)
              .setDepth(fy);
            this.decorLayer.add(flower);
          }
          continue;
        }

        // ── Grass tufts — all remaining green tiles → ~200+ ──────────────────
        {
          const gx = point.x + (seed % 13) - 6;
          const gy = point.y + yOffset + (seed % 7) - 3;
          const gScale = 0.4 + (seed % 4) * 0.06;
          const tuft = this.add
            .image(gx, gy, "prop-grass-tuft")
            .setOrigin(0.5, 0.9)
            .setScale(gScale)
            .setDepth(gy);
          this.decorLayer.add(tuft);
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

    // Vignette — darken edges via 4 corner overlays
    const vw = worldBounds.width * 0.55;
    const vh = worldBounds.height * 0.55;
    const corners = [
      { x: worldBounds.x, y: worldBounds.y },
      { x: worldBounds.x + worldBounds.width, y: worldBounds.y },
      { x: worldBounds.x, y: worldBounds.y + worldBounds.height },
      {
        x: worldBounds.x + worldBounds.width,
        y: worldBounds.y + worldBounds.height,
      },
    ];
    for (const corner of corners) {
      this.lightingOverlay.fillStyle(0x020810, 0.14);
      this.lightingOverlay.fillEllipse(corner.x, corner.y, vw, vh);
    }

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
    this.renderWorld(kingdomData);
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
    // Water graphics are destroyed as part of removeAll(true) above,
    // but we still need to clear our references and tweens
    this.waterShimmerTweens.forEach((t) => t.destroy());
    this.waterShimmerTweens = [];
    this.waterShimmerGraphics = [];
    this.waterLayer = undefined;
    this.drawWaterLayer();
    this.drawTerrain();
    this.renderWorld(this.getKingdomData());
  }

  private handleShutdown(): void {
    this.destroyWaterLayer();
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
  }

  private handlePlacementPointerMove(pointer: import("phaser").Input.Pointer) {
    if (!this.buildModeType || this.isDraggingCamera) {
      this.placementMarker?.setVisible(false);
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
          new Phaser.Geom.Point(
            point.x,
            point.y + yOffset - this.tileHeight / 2
          ),
          new Phaser.Geom.Point(
            point.x + this.tileWidth / 2,
            point.y + yOffset
          ),
          new Phaser.Geom.Point(
            point.x,
            point.y + yOffset + this.tileHeight / 2
          ),
          new Phaser.Geom.Point(
            point.x - this.tileWidth / 2,
            point.y + yOffset
          ),
        ],
        true
      )
      .setDepth(point.y + yOffset + 10)
      .setVisible(true);
  }

  // ─── Tile picking ──────────────────────────────────────────────────────────

  private screenToTile(worldX: number, worldY: number) {
    const rawX =
      ((worldX - this.originX) / (this.tileWidth / 2) +
        (worldY - this.originY) / (this.tileHeight / 2)) /
      2;
    const rawY =
      ((worldY - this.originY) / (this.tileHeight / 2) -
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
}
