import { Building } from '@/src/components/game/entities/Building'
import type { BuildingData, KingdomData } from '@/src/types/game'

type PhaserModule = typeof import('phaser')
type PhaserContainer = import('phaser').GameObjects.Container
type PhaserGraphics = import('phaser').GameObjects.Graphics

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

type ThemePalette = {
  background: string
  tileTop: [number, number]
  tileMid: [number, number]
  tileShadow: number
  gridLine: number
  accent: number
  road: number
  water: number
  border: number
  beacon: number
  fog: number
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function tileKey(x: number, y: number) {
  return `${x}:${y}`
}

function deriveThemePalette(themeId: string | null | undefined): ThemePalette {
  if (!themeId) {
    return {
      background: '#0d0d1a',
      tileTop: [0x223a30, 0x2d4b3d],
      tileMid: [0x182a24, 0x20332d],
      tileShadow: 0x0a1218,
      gridLine: 0x33524a,
      accent: 0xd1b06a,
      road: 0x6f5637,
      water: 0x18324f,
      border: 0x101b2b,
      beacon: 0xe07030,
      fog: 0x0b1219,
    }
  }

  const hash = hashString(themeId)
  const hue = hash % 360
  const alternateHue = (hue + 18) % 360
  const saturation = 36 + (hash % 18)
  const lightness = 28 + (hash % 10)
  const topPrimary = Phaser.Display.Color.HSLToColor(hue / 360, saturation / 100, lightness / 100).color
  const topSecondary = Phaser.Display.Color.HSLToColor(
    alternateHue / 360,
    Math.min((saturation + 8) / 100, 1),
    Math.min((lightness + 6) / 100, 1),
  ).color
  const midPrimary = Phaser.Display.Color.HSLToColor(hue / 360, 0.28, 0.18).color
  const midSecondary = Phaser.Display.Color.HSLToColor(alternateHue / 360, 0.28, 0.22).color
  const background = Phaser.Display.Color.HSLToColor(hue / 360, 0.32, 0.1).color
  const gridLine = Phaser.Display.Color.HSLToColor(hue / 360, 0.35, 0.16).color
  const accent = Phaser.Display.Color.HSLToColor(((hue + 28) % 360) / 360, 0.72, 0.68).color
  const road = Phaser.Display.Color.HSLToColor(((hue + 12) % 360) / 360, 0.26, 0.36).color
  const water = Phaser.Display.Color.HSLToColor(((hue + 180) % 360) / 360, 0.44, 0.26).color
  const border = Phaser.Display.Color.HSLToColor(hue / 360, 0.34, 0.12).color
  const beacon = Phaser.Display.Color.HSLToColor(((hue + 24) % 360) / 360, 0.82, 0.58).color
  const fog = Phaser.Display.Color.HSLToColor(hue / 360, 0.3, 0.08).color

  return {
    background: `#${background.toString(16).padStart(6, '0')}`,
    tileTop: [topPrimary, topSecondary],
    tileMid: [midPrimary, midSecondary],
    tileShadow: Phaser.Display.Color.HSLToColor(hue / 360, 0.22, 0.08).color,
    gridLine,
    accent,
    road,
    water,
    border,
    beacon,
    fog,
  }
}

export class KingdomScene extends Phaser.Scene {
  private readonly tileWidth = 64
  private readonly tileHeight = 32
  private readonly gridSize = 20
  private readonly worldPadding = 220

  private originX = 0
  private originY = 120
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

  constructor() {
    super('KingdomScene')
  }

  create(): void {
    const kingdomData = this.getKingdomData()
    this.cameras.main.setBackgroundColor(deriveThemePalette(kingdomData.themeId).background)
    this.originX = this.scale.width / 2
    this.configureCamera()

    this.drawGrid()
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

  isoToScreen(x: number, y: number): IsoPoint {
    return {
      x: (x - y) * (this.tileWidth / 2) + this.originX,
      y: (x + y) * (this.tileHeight / 2) + this.originY,
    }
  }

  selectBuilding(building: BuildingData): void {
    const selectedBuilding = this.buildingMap.get(building.id)

    if (!selectedBuilding || !this.selectionMarker) {
      return
    }

    const screenPosition = this.isoToScreen(building.x, building.y)

    this.selectionMarker
      .clear()
      .lineStyle(3, 0xffe082, 0.95)
      .strokePoints(
        [
          new Phaser.Geom.Point(screenPosition.x, screenPosition.y - 16),
          new Phaser.Geom.Point(screenPosition.x + this.tileWidth / 2, screenPosition.y),
          new Phaser.Geom.Point(screenPosition.x, screenPosition.y + 16),
          new Phaser.Geom.Point(screenPosition.x - this.tileWidth / 2, screenPosition.y),
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

  private drawGrid(): void {
    this.terrainLayer?.destroy()
    this.placementMarker?.destroy()

    const grid = this.add.graphics()
    const themePalette = deriveThemePalette(this.getKingdomData().themeId)
    const tileTop = themePalette.tileTop
    const tileMid = themePalette.tileMid
    const center = (this.gridSize - 1) / 2

    for (let y = 0; y < this.gridSize; y += 1) {
      for (let x = 0; x < this.gridSize; x += 1) {
        const point = this.isoToScreen(x, y)
        const isWaterEdge = x === 0 || y === 0 || x === this.gridSize - 1 || y === this.gridSize - 1
        const distanceFromCenter = Math.abs(x - center) + Math.abs(y - center)
        const isCitadelBand = distanceFromCenter < 4.6
        const topFill = isWaterEdge
          ? themePalette.water
          : isCitadelBand
            ? Phaser.Display.Color.GetColor(
                Math.round(
                  Phaser.Display.Color.IntegerToColor(tileTop[(x + y) % tileTop.length]).red * 0.86 +
                    Phaser.Display.Color.IntegerToColor(themePalette.accent).red * 0.14,
                ),
                Math.round(
                  Phaser.Display.Color.IntegerToColor(tileTop[(x + y) % tileTop.length]).green * 0.86 +
                    Phaser.Display.Color.IntegerToColor(themePalette.accent).green * 0.14,
                ),
                Math.round(
                  Phaser.Display.Color.IntegerToColor(tileTop[(x + y) % tileTop.length]).blue * 0.86 +
                    Phaser.Display.Color.IntegerToColor(themePalette.accent).blue * 0.14,
                ),
              )
            : tileTop[(x + y) % tileTop.length]
        const midFill = isWaterEdge ? themePalette.border : tileMid[(x + y) % tileMid.length]
        const topPoints = [
          new Phaser.Geom.Point(point.x, point.y - this.tileHeight / 2),
          new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y),
          new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2),
          new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y),
        ]

        grid.fillStyle(themePalette.tileShadow, 0.95)
        grid.fillPoints(
          [
            new Phaser.Geom.Point(point.x, point.y - this.tileHeight / 2 + 10),
            new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y + 10),
            new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2 + 10),
            new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y + 10),
          ],
          true,
        )
        grid.fillStyle(midFill, 1)
        grid.fillPoints(
          [
            new Phaser.Geom.Point(point.x, point.y - this.tileHeight / 2 + 4),
            new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y + 4),
            new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2 + 4),
            new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y + 4),
          ],
          true,
        )
        grid.fillStyle(topFill, 1)
        grid.lineStyle(1, themePalette.gridLine, 0.38)
        grid.fillPoints(topPoints, true)
        grid.strokePoints(topPoints, true)

        grid.lineStyle(1, 0xffffff, isWaterEdge ? 0.04 : 0.025)
        grid.strokePoints(
          [
            new Phaser.Geom.Point(point.x, point.y - this.tileHeight / 2 + 1),
            new Phaser.Geom.Point(point.x + this.tileWidth / 2 - 4, point.y - 2),
            new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2 - 8),
          ],
          false,
        )

        if (isWaterEdge) {
          grid.lineStyle(2, themePalette.accent, 0.08)
          grid.strokePoints(
            topPoints,
            true,
          )
        }
      }
    }

    this.terrainLayer = grid
    this.drawAtmosphere(themePalette)
    this.selectionMarker = this.add.graphics().setVisible(false)
    this.placementMarker = this.add.graphics().setVisible(false)
  }

  private drawAtmosphere(themePalette: ThemePalette) {
    const worldBounds = this.getWorldBounds()
    const glow = this.add.graphics()

    glow.fillStyle(themePalette.fog, 0.55)
    glow.fillEllipse(worldBounds.centerX, worldBounds.centerY - 30, 1200, 640)
    glow.fillStyle(themePalette.accent, 0.04)
    glow.fillEllipse(worldBounds.centerX, worldBounds.centerY - 40, 460, 180)
    glow.fillStyle(themePalette.beacon, 0.03)
    glow.fillEllipse(worldBounds.centerX, worldBounds.centerY - 56, 220, 80)
    glow.setDepth(-20)
  }

  private configureCamera(): void {
    const camera = this.cameras.main
    const worldBounds = this.getWorldBounds()

    camera.setBounds(worldBounds.x, worldBounds.y, worldBounds.width, worldBounds.height)
    camera.centerOn(worldBounds.centerX, worldBounds.centerY)
  }

  private getWorldBounds() {
    const camera = this.cameras.main
    const horizontalPadding = Math.max(this.worldPadding, Math.floor(camera.width * 0.45))
    const verticalPadding = Math.max(this.worldPadding, Math.floor(camera.height * 0.35))
    const corners = [
      this.isoToScreen(0, 0),
      this.isoToScreen(this.gridSize - 1, 0),
      this.isoToScreen(0, this.gridSize - 1),
      this.isoToScreen(this.gridSize - 1, this.gridSize - 1),
    ]

    const minX = Math.min(...corners.map((point) => point.x)) - this.tileWidth - horizontalPadding
    const maxX = Math.max(...corners.map((point) => point.x)) + this.tileWidth + horizontalPadding
    const minY = Math.min(...corners.map((point) => point.y)) - this.tileHeight - verticalPadding
    const maxY = Math.max(...corners.map((point) => point.y)) + this.tileHeight + verticalPadding

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
    if (!pointer.leftButtonDown()) {
      return
    }

    this.isDraggingCamera = true
    this.dragDistance = 0
    this.dragStartPointerX = pointer.x
    this.dragStartPointerY = pointer.y
    this.dragStartScrollX = this.cameras.main.scrollX
    this.dragStartScrollY = this.cameras.main.scrollY
  }

  private handlePointerMove(pointer: import('phaser').Input.Pointer): void {
    if (!this.isDraggingCamera || !pointer.isDown) {
      return
    }

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

    if (!this.didCameraDrag) {
      return
    }

    this.time.delayedCall(0, () => {
      this.didCameraDrag = false
      this.dragDistance = 0
    })
  }

  private renderWorld(kingdomData: KingdomData): void {
    this.renderDecor(kingdomData)
    this.renderBuildings(kingdomData)
  }

  private renderBuildings(kingdomData: KingdomData): void {
    this.buildingLayer?.destroy(true)
    this.buildingLayer = this.add.container()
    this.buildingMap.clear()
    this.selectionMarker?.setVisible(false)

    const sortedBuildings = [...kingdomData.buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y))

    sortedBuildings.forEach((buildingData) => {
      const point = this.isoToScreen(buildingData.x, buildingData.y)
      const building = new Building(this, point.x, point.y, buildingData)

      building.setDepth(point.y)
      this.buildingLayer?.add(building)
      this.buildingMap.set(buildingData.id, building)
    })
  }

  private renderDecor(kingdomData: KingdomData): void {
    this.decorLayer?.destroy(true)
    this.decorLayer = this.add.container()

    const occupiedTiles = new Set(
      kingdomData.buildings.filter((building) => !building.isPlaceholder).map((building) => tileKey(building.x, building.y)),
    )
    const placeholderTiles = new Set(
      kingdomData.buildings.filter((building) => building.isPlaceholder).map((building) => tileKey(building.x, building.y)),
    )
    const theme = deriveThemePalette(kingdomData.themeId)
    const roadGraphics = this.add.graphics()
    const townHall = kingdomData.buildings.find((building) => building.type === 'town_hall')

    if (townHall) {
      roadGraphics.lineStyle(10, 0x0b1017, 0.24)
      kingdomData.buildings
        .filter((building) => !building.isPlaceholder && building.id !== townHall.id)
        .forEach((building) => {
          const path = this.getRoadPath(townHall, building)
          const points = path.map(({ x, y }) => {
            const point = this.isoToScreen(x, y)
            return new Phaser.Geom.Point(point.x, point.y)
          })

          roadGraphics.strokePoints(points, false)
        })

      roadGraphics.lineStyle(5, theme.road, 0.52)
      kingdomData.buildings
        .filter((building) => !building.isPlaceholder && building.id !== townHall.id)
        .forEach((building) => {
          const path = this.getRoadPath(townHall, building)
          const points = path.map(({ x, y }) => {
            const point = this.isoToScreen(x, y)
            return new Phaser.Geom.Point(point.x, point.y)
          })

          roadGraphics.strokePoints(points, false)
        })
    }

    this.decorLayer.add(roadGraphics)

    for (let y = 1; y < this.gridSize - 1; y += 1) {
      for (let x = 1; x < this.gridSize - 1; x += 1) {
        if (occupiedTiles.has(tileKey(x, y))) {
          continue
        }

        const point = this.isoToScreen(x, y)
        const seed = hashString(`${kingdomData.themeId ?? 'realm'}:${x}:${y}`)
        const propRoll = seed % 9

        if (placeholderTiles.has(tileKey(x, y))) {
          const ruins = this.add.image(point.x, point.y + 2, 'prop-ruins').setAlpha(0.68).setDepth(point.y - 1)
          if (seed % 2 === 0) {
            const beacon = this.add
              .image(point.x + 10, point.y - 10, 'prop-beacon')
              .setScale(0.7)
              .setTint(theme.beacon)
              .setAlpha(0.7)
              .setDepth(point.y)
            this.decorLayer.add(beacon)
          }
          this.decorLayer.add(ruins)
          continue
        }

        if (propRoll <= 2) {
          const texture = propRoll === 0 ? 'prop-tree' : 'prop-stones'
          const sprite = this.add
            .image(point.x, point.y + 4, texture)
            .setScale(0.78 + ((seed >> 3) % 4) * 0.05)
            .setAlpha(0.3 + ((seed >> 5) % 3) * 0.1)
            .setDepth(point.y - 1)
          this.decorLayer.add(sprite)
        }

        if (seed % 17 === 0 || seed % 19 === 0) {
          const banner = this.add
            .image(point.x + 10, point.y - 10, 'prop-banner')
            .setScale(0.68)
            .setAlpha(0.42)
            .setTint(theme.accent)
            .setDepth(point.y)
          this.decorLayer.add(banner)
        }

        if (seed % 41 === 0) {
          const beacon = this.add
            .image(point.x - 6, point.y - 8, 'prop-beacon')
            .setScale(0.64)
            .setTint(theme.beacon)
            .setAlpha(0.56)
            .setDepth(point.y)
          this.decorLayer.add(beacon)
        }
      }
    }
  }

  private handleKingdomUpdated(updatedKingdom?: KingdomData): void {
    const kingdomData = updatedKingdom ?? this.getKingdomData()
    this.cameras.main.setBackgroundColor(deriveThemePalette(kingdomData.themeId).background)
    this.renderWorld(kingdomData)
  }

  private handleResize(gameSize: { width: number }): void {
    this.originX = gameSize.width / 2
    this.configureCamera()
    this.children.removeAll(true)
    this.buildingLayer = undefined
    this.decorLayer = undefined
    this.selectionMarker = undefined
    this.placementMarker = undefined
    this.drawGrid()
    this.renderWorld(this.getKingdomData())
  }

  private handleShutdown(): void {
    this.game.events.off('kingdom-updated', this.handleKingdomUpdated, this)
    this.game.events.off('focus-building', this.selectBuilding, this)
    this.game.events.off('build-mode-changed', this.handleBuildModeChanged, this)
    this.scale.off('resize', this.handleResize, this)
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this)
    this.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this)
    this.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePlacementPointerMove, this)
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
    const nextZoom = Phaser.Math.Clamp(this.cameras.main.zoom - deltaY * 0.001, 0.78, 1.32)
    this.cameras.main.setZoom(nextZoom)
  }

  private drawPlacementMarker(x: number, y: number, isValid: boolean) {
    const marker = this.placementMarker

    if (!marker) {
      return
    }

    const point = this.isoToScreen(x, y)
    marker
      .clear()
      .lineStyle(3, isValid ? 0x8fd694 : 0xff8f8f, 0.98)
      .fillStyle(isValid ? 0x8fd694 : 0xff8f8f, 0.16)
      .fillPoints(
        [
          new Phaser.Geom.Point(point.x, point.y - this.tileHeight / 2),
          new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y),
          new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2),
          new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y),
        ],
        true,
      )
      .strokePoints(
        [
          new Phaser.Geom.Point(point.x, point.y - this.tileHeight / 2),
          new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y),
          new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2),
          new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y),
        ],
        true,
      )
      .setDepth(point.y + 2)
      .setVisible(true)
  }

  private screenToTile(worldX: number, worldY: number) {
    const rawX = ((worldX - this.originX) / (this.tileWidth / 2) + (worldY - this.originY) / (this.tileHeight / 2)) / 2
    const rawY = ((worldY - this.originY) / (this.tileHeight / 2) - (worldX - this.originX) / (this.tileWidth / 2)) / 2
    const x = Math.round(rawX)
    const y = Math.round(rawY)

    if (x < 0 || y < 0 || x >= this.gridSize || y >= this.gridSize) {
      return null
    }

    return { x, y }
  }

  private isTileAvailable(x: number, y: number) {
    return !this.getKingdomData().buildings.some(
      (building) => !building.isPlaceholder && building.x === x && building.y === y,
    )
  }

  private getRoadPath(from: BuildingData, to: BuildingData) {
    const path: Array<{ x: number; y: number }> = []
    let currentX = from.x
    let currentY = from.y

    path.push({ x: currentX, y: currentY })

    while (currentX !== to.x) {
      currentX += currentX < to.x ? 1 : -1
      path.push({ x: currentX, y: currentY })
    }

    while (currentY !== to.y) {
      currentY += currentY < to.y ? 1 : -1
      path.push({ x: currentX, y: currentY })
    }

    return path
  }
}
