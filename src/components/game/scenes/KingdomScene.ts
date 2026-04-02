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
  grassColors: [number, number]
  gridLine: number
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function toHexColor(value: number) {
  return `#${value.toString(16).padStart(6, '0')}`
}

function deriveThemePalette(themeId: string | null | undefined): ThemePalette {
  if (!themeId) {
    return {
      background: '#0d0d1a',
      grassColors: [0x3f7d3a, 0x4b8f43],
      gridLine: 0x20361f,
    }
  }

  const hash = hashString(themeId)
  const hue = hash % 360
  const alternateHue = (hue + 18) % 360
  const saturation = 36 + (hash % 18)
  const lightness = 28 + (hash % 10)
  const grassPrimary = Phaser.Display.Color.HSLToColor(hue / 360, saturation / 100, lightness / 100).color
  const grassSecondary = Phaser.Display.Color.HSLToColor(
    alternateHue / 360,
    Math.min((saturation + 8) / 100, 1),
    Math.min((lightness + 6) / 100, 1),
  ).color
  const background = Phaser.Display.Color.HSLToColor(hue / 360, 0.32, 0.1).color
  const gridLine = Phaser.Display.Color.HSLToColor(hue / 360, 0.35, 0.16).color

  return {
    background: toHexColor(background),
    grassColors: [grassPrimary, grassSecondary],
    gridLine,
  }
}

export class KingdomScene extends Phaser.Scene {
  private readonly tileWidth = 64
  private readonly tileHeight = 32
  private readonly gridSize = 20

  private originX = 0
  private originY = 120
  private buildingLayer?: PhaserContainer
  private selectionMarker?: PhaserGraphics
  private buildingMap = new Map<string, Building>()

  constructor() {
    super('KingdomScene')
  }

  create(): void {
    const kingdomData = this.getKingdomData()
    this.cameras.main.setBackgroundColor(deriveThemePalette(kingdomData.themeId).background)
    this.originX = this.scale.width / 2

    this.drawGrid()
    this.renderBuildings(kingdomData)

    this.game.events.on('kingdom-updated', this.handleKingdomUpdated, this)
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
    const grid = this.add.graphics()
    const themePalette = deriveThemePalette(this.getKingdomData().themeId)
    const grassColors = themePalette.grassColors

    for (let y = 0; y < this.gridSize; y += 1) {
      for (let x = 0; x < this.gridSize; x += 1) {
        const point = this.isoToScreen(x, y)
        const color = grassColors[(x + y) % grassColors.length]

        grid.fillStyle(color, 1)
        grid.lineStyle(1, themePalette.gridLine, 0.45)
        grid.fillPoints(
          [
            new Phaser.Geom.Point(point.x, point.y - this.tileHeight / 2),
            new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y),
            new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2),
            new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y),
          ],
          true,
        )
        grid.strokePoints(
          [
            new Phaser.Geom.Point(point.x, point.y - this.tileHeight / 2),
            new Phaser.Geom.Point(point.x + this.tileWidth / 2, point.y),
            new Phaser.Geom.Point(point.x, point.y + this.tileHeight / 2),
            new Phaser.Geom.Point(point.x - this.tileWidth / 2, point.y),
          ],
          true,
        )
      }
    }

    this.selectionMarker = this.add.graphics().setVisible(false)
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

  private handleKingdomUpdated(updatedKingdom?: KingdomData): void {
    const kingdomData = updatedKingdom ?? this.getKingdomData()
    this.cameras.main.setBackgroundColor(deriveThemePalette(kingdomData.themeId).background)
    this.renderBuildings(kingdomData)
  }

  private handleResize(gameSize: { width: number }): void {
    this.originX = gameSize.width / 2
    this.children.removeAll(true)
    this.buildingLayer = undefined
    this.selectionMarker = undefined
    this.drawGrid()
    this.renderBuildings(this.getKingdomData())
  }

  private handleShutdown(): void {
    this.game.events.off('kingdom-updated', this.handleKingdomUpdated, this)
    this.scale.off('resize', this.handleResize, this)
  }
}
