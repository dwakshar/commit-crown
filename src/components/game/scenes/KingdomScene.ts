import { Building } from '@/src/components/game/entities/Building'
import type { BuildingData, KingdomData } from '@/src/types/game'

type PhaserModule = typeof import('phaser')
type PhaserContainer = import('phaser').GameObjects.Container
type PhaserGraphics = import('phaser').GameObjects.Graphics
type PhaserSprite = import('phaser').GameObjects.Sprite

type PhaserGlobal = typeof globalThis & {
  Phaser?: PhaserModule
}

function getPhaser(): PhaserModule {
  const phaser = (globalThis as PhaserGlobal).Phaser
  if (!phaser) {
    throw new Error('Phaser runtime is unavailable. Load Phaser before importing scenes.')
  }
  return phaser
}

const Phaser = getPhaser()

type IsoPoint = {
  x: number
  y: number
}

type TerrainTile = {
  x: number
  y: number
  elevation: number
  moisture: number
  variant: number
}

export class KingdomScene extends Phaser.Scene {
  private readonly tileWidth = 64
  private readonly tileHeight = 32
  private readonly gridSize = 24
  private readonly worldPadding = 300

  private originX = 0
  private originY = 140
  private buildingLayer?: PhaserContainer
  private terrainLayer?: PhaserGraphics
  private decorLayer?: PhaserContainer
  private selectionMarker?: PhaserGraphics
  private placementMarker?: PhaserGraphics
  private buildingMap = new Map<string, Building>()
  private buildModeType: BuildingData['type'] | null = null
  private isDraggingCamera = false
  private didCameraDrag = false
  private dragStartPointerX = 0
  private dragStartPointerY = 0
  private dragStartScrollX = 0
  private dragStartScrollY = 0
  private dragDistance = 0
  private terrainData: TerrainTile[][] = []
  private lightingOverlay?: PhaserGraphics

  constructor() {
    super('KingdomScene')
  }

  create(): void {
    const kingdomData = this.getKingdomData()
    this.cameras.main.setBackgroundColor('#1a1f2e')
    this.originX = this.scale.width / 2
    this.configureCamera()

    this.generateTerrainData()
    this.drawTerrain()
    this.renderWorld(kingdomData)
    this.registerCameraDrag()
    this.registerBuildMode()
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, this.handleMouseWheel, this)

    this.game.events.on('kingdom-updated', this.handleKingdomUpdated, this)
    this.game.events.on('focus-building', this.selectBuilding, this)
    this.game.events.on('build-mode-changed', this.handleBuildModeChanged, this)
    this.scale.on('resize', this.handleResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this)
  }

  // Terrain generation with realistic variation
  private generateTerrainData(): void {
    this.terrainData = []
    const center = (this.gridSize - 1) / 2

    for (let y = 0; y < this.gridSize; y++) {
      this.terrainData[y] = []
      for (let x = 0; x < this.gridSize; x++) {
        const distanceFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2)
        const maxDistance = this.gridSize / 2

        // Elevation falls off toward edges
        const baseElevation = Math.max(0, 1 - distanceFromCenter / maxDistance)
        const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.15
        const elevation = Math.max(0, Math.min(1, baseElevation + noise))

        // Moisture varies across the map
        const moisture = (Math.sin(x * 0.3) + Math.cos(y * 0.4)) * 0.5 + 0.5

        this.terrainData[y][x] = {
          x,
          y,
          elevation: elevation * 0.4, // Max elevation offset
          moisture,
          variant: (x + y * 3) % 4,
        }
      }
    }
  }

  isoToScreen(x: number, y: number): IsoPoint {
    return {
      x: (x - y) * (this.tileWidth / 2) + this.originX,
      y: (x + y) * (this.tileHeight / 2) + this.originY,
    }
  }

  selectBuilding(building: BuildingData): void {
    const selectedBuilding = this.buildingMap.get(building.id)
    if (!selectedBuilding || !this.selectionMarker) return

    const screenPosition = this.isoToScreen(building.x, building.y)
    const yOffset = -8 - (this.terrainData[building.y]?.[building.x]?.elevation || 0) * 20

    this.selectionMarker
      .clear()
      .lineStyle(2, 0xd4a574, 0.9)
      .strokePoints(
        [
          new Phaser.Geom.Point(screenPosition.x, screenPosition.y + yOffset - 12),
          new Phaser.Geom.Point(screenPosition.x + this.tileWidth / 2, screenPosition.y + yOffset + 4),
          new Phaser.Geom.Point(screenPosition.x, screenPosition.y + yOffset + 12),
          new Phaser.Geom.Point(screenPosition.x - this.tileWidth / 2, screenPosition.y + yOffset + 4),
        ],
        true,
      )
      .setDepth(selectedBuilding.depth - 1)
      .setVisible(true)

    this.game.events.emit('building-selected', building)
  }

  canSelectBuilding(): boolean {
    return !this.didCameraDrag
  }

  private getKingdomData(): KingdomData {
    return (this.registry.get('kingdomData') as KingdomData | undefined) ?? {
      id: 'unknown',
      userId: 'unknown',
      name: 'Unnamed Kingdom',
      gold: 0,
      prestige: 0,
      population: 0,
      defense_rating: 0,
      attack_rating: 0,
      building_slots: 0,
      last_synced_at: null,
      ownerName: 'Unknown Ruler',
      ownerAvatarUrl: null,
      themeId: null,
      buildings: [],
      githubStats: null,
    }
  }

  private drawTerrain(): void {
    this.terrainLayer?.destroy()
    this.placementMarker?.destroy()

    const grid = this.add.graphics()
    const center = (this.gridSize - 1) / 2

    // Draw tiles from back to front for proper depth
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const tile = this.terrainData[y][x]
        const point = this.isoToScreen(x, y)
        const elevation = tile.elevation * 20

        const isEdge = x === 0 || y === 0 || x === this.gridSize - 1 || y === this.gridSize - 1
        const distanceFromCenter = Math.abs(x - center) + Math.abs(y - center)
        const isCore = distanceFromCenter < 5

        // Calculate terrain colors based on moisture and elevation
        const baseColor = this.getTerrainColor(tile, isCore)
        const sideColor = this.darkenColor(baseColor, 0.15)
        const topY = point.y - elevation

        // Draw tile sides (elevation)
        if (tile.elevation > 0.05) {
          const sidePoints = [
            new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y),
            new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2),
            new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2 + elevation * 0.5),
            new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y + elevation * 0.5),
          ]
          grid.fillStyle(sideColor, 1)
          grid.fillPoints(sidePoints, true)

          const rightSidePoints = [
            new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2),
            new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y),
            new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y + elevation * 0.5),
            new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2 + elevation * 0.5),
          ]
          grid.fillStyle(this.darkenColor(sideColor, 0.08), 1)
          grid.fillPoints(rightSidePoints, true)
        }

        // Draw tile top
        const topPoints = [
          new Phaser.Geom.Point(point.x, topY - this.tileHeight / 2),
          new Phaser.Geom.Point(point.x + this.tileWidth / 2, topY),
          new Phaser.Geom.Point(point.x, topY + this.tileHeight / 2),
          new Phaser.Geom.Point(point.x - this.tileWidth / 2, topY),
        ]

        grid.fillStyle(baseColor, 1)
        grid.fillPoints(topPoints, true)

        // Faint grid lines - only on core tiles
        if (!isEdge && distanceFromCenter < 8) {
          grid.lineStyle(1, 0xffffff, 0.04)
          grid.strokePoints(topPoints, true)
        }

        // Subtle texture detail
        if (tile.variant === 0 && !isEdge) {
          grid.fillStyle(0xffffff, 0.02)
          grid.fillCircle(point.x + 4, topY, 2)
        }
      }
    }

    this.terrainLayer = grid
    this.selectionMarker = this.add.graphics().setVisible(false)
    this.placementMarker = this.add.graphics().setVisible(false)
  }

  private getTerrainColor(tile: TerrainTile, isCore: boolean): number {
    // Grass colors based on moisture and elevation
    const colors = [
      { r: 0x3d, g: 0x52, b: 0x3d }, // Dry grass
      { r: 0x45, g: 0x5a, b: 0x42 }, // Medium grass
      { r: 0x4a, g: 0x5d, b: 0x45 }, // Lush grass
      { r: 0x52, g: 0x62, b: 0x4a }, // Deep grass
    ]

    // Clamp moisture to valid range and handle undefined
    const moisture = Math.max(0, Math.min(1, tile.moisture ?? 0.5))
    const baseIndex = Math.min(colors.length - 1, Math.floor(moisture * (colors.length - 1)))
    const color1 = colors[baseIndex]
    const color2 = colors[Math.min(colors.length - 1, baseIndex + 1)]
    const blend = (moisture * (colors.length - 1)) - baseIndex

    // Blend between colors based on moisture
    const r = Math.round(color1.r + (color2.r - color1.r) * blend)
    const g = Math.round(color1.g + (color2.g - color1.g) * blend)
    const b = Math.round(color1.b + (color2.b - color1.b) * blend)

    // Darken edges
    if (!isCore) {
      const darken = Math.min(0.3, (Math.abs(tile.x - 12) + Math.abs(tile.y - 12)) * 0.02)
      return Phaser.Display.Color.GetColor(
        Math.round(r * (1 - darken)),
        Math.round(g * (1 - darken)),
        Math.round(b * (1 - darken)),
      )
    }

    return Phaser.Display.Color.GetColor(r, g, b)
  }

  private darkenColor(color: number, factor: number): number {
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff
    return Phaser.Display.Color.GetColor(
      Math.round(r * (1 - factor)),
      Math.round(g * (1 - factor)),
      Math.round(b * (1 - factor)),
    )
  }

  private configureCamera(): void {
    const camera = this.cameras.main
    const worldBounds = this.getWorldBounds()
    camera.setBounds(worldBounds.x, worldBounds.y, worldBounds.width, worldBounds.height)
    camera.centerOn(worldBounds.centerX, worldBounds.centerY)
  }

  private getWorldBounds() {
    const camera = this.cameras.main
    const horizontalPadding = Math.max(this.worldPadding, Math.floor(camera.width * 0.5))
    const verticalPadding = Math.max(this.worldPadding, Math.floor(camera.height * 0.4))
    const corners = [
      this.isoToScreen(0, 0),
      this.isoToScreen(this.gridSize - 1, 0),
      this.isoToScreen(0, this.gridSize - 1),
      this.isoToScreen(this.gridSize - 1, this.gridSize - 1),
    ]

    const minX = Math.min(...corners.map((p) => p.x)) - this.tileWidth - horizontalPadding
    const maxX = Math.max(...corners.map((p) => p.x)) + this.tileWidth + horizontalPadding
    const minY = Math.min(...corners.map((p) => p.y)) - this.tileHeight - verticalPadding
    const maxY = Math.max(...corners.map((p) => p.y)) + this.tileHeight + verticalPadding

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    }
  }

  private registerCameraDrag(): void {
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this)
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this)
    this.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this)
    this.input.on(Phaser.Input.Events.GAME_OUT, this.handlePointerUp, this)
  }

  private registerBuildMode(): void {
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePlacementPointerMove, this)
  }

  private handlePointerDown(pointer: import('phaser').Input.Pointer): void {
    if (!pointer.leftButtonDown()) return
    this.isDraggingCamera = true
    this.dragDistance = 0
    this.dragStartPointerX = pointer.x
    this.dragStartPointerY = pointer.y
    this.dragStartScrollX = this.cameras.main.scrollX
    this.dragStartScrollY = this.cameras.main.scrollY
  }

  private handlePointerMove(pointer: import('phaser').Input.Pointer): void {
    if (!this.isDraggingCamera || !pointer.isDown) return

    const deltaX = pointer.x - this.dragStartPointerX
    const deltaY = pointer.y - this.dragStartPointerY
    this.dragDistance = Math.hypot(deltaX, deltaY)

    if (this.dragDistance > 6) {
      this.didCameraDrag = true
      this.input.setDefaultCursor('grabbing')
    }

    this.cameras.main.setScroll(this.dragStartScrollX - deltaX, this.dragStartScrollY - deltaY)
  }

  private handlePointerUp(pointer?: import('phaser').Input.Pointer): void {
    this.isDraggingCamera = false
    this.input.setDefaultCursor('default')

    if (this.buildModeType && pointer && !this.didCameraDrag) {
      const tile = this.screenToTile(pointer.worldX, pointer.worldY)
      if (tile && this.isTileAvailable(tile.x, tile.y)) {
        this.game.events.emit('tile-selected', tile)
      }
    }

    if (!this.didCameraDrag) return
    this.time.delayedCall(0, () => {
      this.didCameraDrag = false
      this.dragDistance = 0
    })
  }

  private renderWorld(kingdomData: KingdomData): void {
    this.renderDecor(kingdomData)
    this.renderBuildings(kingdomData)
    this.renderLighting()
  }

  private renderBuildings(kingdomData: KingdomData): void {
    this.buildingLayer?.destroy(true)
    this.buildingLayer = this.add.container()
    this.buildingMap.clear()
    this.selectionMarker?.setVisible(false)

    const sortedBuildings = [...kingdomData.buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y))

    sortedBuildings.forEach((buildingData) => {
      const elevation = this.terrainData[buildingData.y]?.[buildingData.x]?.elevation || 0
      const point = this.isoToScreen(buildingData.x, buildingData.y)
      const yOffset = -elevation * 20
      const building = new Building(this, point.x, point.y + yOffset, buildingData)

      building.setDepth(point.y + yOffset)
      this.buildingLayer?.add(building)
      this.buildingMap.set(buildingData.id, building)
    })
  }

  private renderDecor(kingdomData: KingdomData): void {
    this.decorLayer?.destroy(true)
    this.decorLayer = this.add.container()

    const occupiedTiles = new Set(
      kingdomData.buildings.filter((b) => !b.isPlaceholder).map((b) => `${b.x}:${b.y}`),
    )
    const placeholderTiles = new Set(
      kingdomData.buildings.filter((b) => b.isPlaceholder).map((b) => `${b.x}:${b.y}`),
    )

    // Seed-based pseudo-random
    const hashString = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
      }
      return Math.abs(hash)
    }

    for (let y = 1; y < this.gridSize - 1; y++) {
      for (let x = 1; x < this.gridSize - 1; x++) {
        if (occupiedTiles.has(`${x}:${y}`)) continue

        const point = this.isoToScreen(x, y)
        const elevation = this.terrainData[y]?.[x]?.elevation || 0
        const yOffset = -elevation * 20
        const seed = hashString(`${kingdomData.themeId ?? 'realm'}:${x}:${y}`)

        // Ruins on placeholder tiles
        if (placeholderTiles.has(`${x}:${y}`)) {
          // Embedded ruins - partially sunk into terrain
          const ruins = this.add.image(point.x, point.y + yOffset - 2, 'prop-ruins')
            .setOrigin(0.5, 0.9)
            .setScale(0.65 + (seed % 3) * 0.03)
            .setTint(0x6a7a6a)
            .setAlpha(0.85)
            .setDepth(point.y + yOffset - 2)
          this.decorLayer.add(ruins)
          continue
        }

        // Low-profile natural elements - reduced density
        const isEdge = x <= 2 || y <= 2 || x >= this.gridSize - 3 || y >= this.gridSize - 3

        // Trees and rocks - only in specific zones, lower density
        if (!isEdge && seed % 23 === 0) {
          const texture = seed % 2 === 0 ? 'prop-tree' : 'prop-stones'
          const scale = 0.5 + ((seed >> 3) % 3) * 0.08
          const alpha = 0.5 + ((seed >> 5) % 2) * 0.1

          const sprite = this.add
            .image(point.x + (seed % 7) - 3, point.y + yOffset + 2, texture)
            .setOrigin(0.5, 0.95)
            .setScale(scale)
            .setAlpha(alpha)
            .setTint(texture === 'prop-tree' ? 0x3d5a3d : 0x5a5a5a)
            .setDepth(point.y + yOffset)
          this.decorLayer.add(sprite)
        }

        // Very occasional small rocks
        if (!isEdge && seed % 47 === 0) {
          const rock = this.add
            .image(point.x + (seed % 5) - 2, point.y + yOffset + 4, 'prop-stones')
            .setOrigin(0.5, 0.95)
            .setScale(0.3 + (seed % 2) * 0.1)
            .setAlpha(0.4)
            .setTint(0x6a6a6a)
            .setDepth(point.y + yOffset + 4)
          this.decorLayer.add(rock)
        }
      }
    }
  }

  private renderLighting(): void {
    // Soft directional lighting overlay
    this.lightingOverlay?.destroy()
    this.lightingOverlay = this.add.graphics()

    const worldBounds = this.getWorldBounds()

    // Gradient from top-left (light) to bottom-right (shadow)
    const steps = 20
    for (let i = 0; i < steps; i++) {
      const alpha = (i / steps) * 0.15
      const color = 0x0a0f1a

      this.lightingOverlay.fillStyle(color, alpha)
      this.lightingOverlay.fillRect(
        worldBounds.x + (worldBounds.width * i / steps),
        worldBounds.y + (worldBounds.height * i / steps),
        worldBounds.width / steps,
        worldBounds.height / steps,
      )
    }

    this.lightingOverlay.setDepth(100)
  }

  private handleKingdomUpdated(updatedKingdom?: KingdomData): void {
    const kingdomData = updatedKingdom ?? this.getKingdomData()
    this.renderWorld(kingdomData)
  }

  private handleResize(gameSize: { width: number }): void {
    this.originX = gameSize.width / 2
    this.configureCamera()
    this.children.removeAll(true)
    this.buildingLayer = undefined
    this.decorLayer = undefined
    this.terrainLayer = undefined
    this.selectionMarker = undefined
    this.placementMarker = undefined
    this.lightingOverlay = undefined
    this.drawTerrain()
    this.renderWorld(this.getKingdomData())
  }

  private handleShutdown(): void {
    this.game.events.off('kingdom-updated', this.handleKingdomUpdated, this)
    this.game.events.off('focus-building', this.selectBuilding, this)
    this.game.events.off('build-mode-changed', this.handleBuildModeChanged, this)
    this.scale.off('resize', this.handleResize, this)
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this)
    this.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this)
    this.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this)
    this.input.off(Phaser.Input.Events.GAME_OUT, this.handlePointerUp, this)
    this.input.off(Phaser.Input.Events.POINTER_WHEEL, this.handleMouseWheel, this)
  }

  private handleBuildModeChanged(buildModeType: BuildingData['type'] | null) {
    this.buildModeType = buildModeType
    this.placementMarker?.setVisible(false)
  }

  private handlePlacementPointerMove(pointer: import('phaser').Input.Pointer) {
    if (!this.buildModeType || this.isDraggingCamera) {
      this.placementMarker?.setVisible(false)
      return
    }

    const tile = this.screenToTile(pointer.worldX, pointer.worldY)
    if (!tile) {
      this.placementMarker?.setVisible(false)
      return
    }

    this.drawPlacementMarker(tile.x, tile.y, this.isTileAvailable(tile.x, tile.y))
  }

  private handleMouseWheel(
    _pointer: import('phaser').Input.Pointer,
    _gameObjects: unknown,
    _deltaX: number,
    deltaY: number,
  ) {
    const nextZoom = Phaser.Math.Clamp(this.cameras.main.zoom - deltaY * 0.001, 0.65, 1.15)
    this.cameras.main.setZoom(nextZoom)
  }

  private drawPlacementMarker(x: number, y: number, isValid: boolean) {
    const marker = this.placementMarker
    if (!marker) return

    const point = this.isoToScreen(x, y)
    const elevation = this.terrainData[y]?.[x]?.elevation || 0
    const yOffset = -elevation * 20
    const color = isValid ? 0x6b8c5a : 0x8c5a5a

    marker
      .clear()
      .lineStyle(2, color, 0.85)
      .strokePoints(
        [
          new Phaser.Geom.Point(point.x, point.y + yOffset - this.tileHeight / 2),
          new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y + yOffset),
          new Phaser.Geom.Point(point.x, point.y + yOffset + this.tileHeight / 2),
          new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y + yOffset),
        ],
        true,
      )
      .setDepth(point.y + yOffset + 10)
      .setVisible(true)
  }

  private screenToTile(worldX: number, worldY: number) {
    const rawX = ((worldX - this.originX) / (this.tileWidth / 2) + (worldY - this.originY) / (this.tileHeight / 2)) / 2
    const rawY = ((worldY - this.originY) / (this.tileHeight / 2) - (worldX - this.originX) / (this.tileWidth / 2)) / 2
    const x = Math.round(rawX)
    const y = Math.round(rawY)

    if (x < 0 || y < 0 || x >= this.gridSize || y >= this.gridSize) return null
    return { x, y }
  }

  private isTileAvailable(x: number, y: number) {
    return !this.getKingdomData().buildings.some(
      (b) => !b.isPlaceholder && b.x === x && b.y === y,
    )
  }
}