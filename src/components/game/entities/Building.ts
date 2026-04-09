import type { BuildingData } from '@/src/types/game'

type PhaserModule = typeof import('phaser')
type PhaserContainer = import('phaser').GameObjects.Container
type PhaserScene = import('phaser').Scene

type PhaserGlobal = typeof globalThis & {
  Phaser?: PhaserModule
}

function getPhaser(): PhaserModule {
  const phaser = (globalThis as PhaserGlobal).Phaser
  if (!phaser) {
    throw new Error('Phaser runtime is unavailable. Load Phaser before importing game entities.')
  }
  return phaser
}

const Phaser = getPhaser()

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function deriveSkinTint(skinId: string | null | undefined) {
  if (!skinId) return null
  const hash = hashString(skinId)
  const hue = hash % 360
  return Phaser.Display.Color.HSLToColor(hue / 360, 0.55, 0.58).color
}

export class Building extends Phaser.GameObjects.Container {
  public readonly buildingData: BuildingData
  private readonly outline: import('phaser').GameObjects.Graphics

  constructor(scene: PhaserScene, x: number, y: number, buildingData: BuildingData) {
    super(scene, x, y)
    this.buildingData = buildingData
    this.outline = scene.add.graphics().setVisible(false)

    this.add(this.createVisual())
    this.add(this.outline)
    this.add(this.createLevelIndicator())

    this.setSize(64, 80)
    this.setInteractive(
      new Phaser.Geom.Rectangle(-32, -80, 64, 80),
      Phaser.Geom.Rectangle.Contains,
    )

    this.bindInteractions(scene as SelectableScene)
    scene.add.existing(this)
  }

  private createVisual(): PhaserContainer {
    if (!this.buildingData.isPlaceholder) {
      const tint = deriveSkinTint(this.buildingData.skinId)
      const seed = hashString(this.buildingData.id)

      // Ground plate - subtle, grounded in terrain
      const groundPlate = this.scene.add
        .ellipse(0, 4, 72, 20, 0x0d1410, 0.5)
        .setBlendMode(Phaser.BlendModes.MULTIPLY)

      // Building sprite - properly grounded at bottom
      const sprite = this.scene.add
        .image(0, -6, this.buildingData.type)
        .setDisplaySize(88, 88)
        .setOrigin(0.5, 1)
        .setTint(tint ?? 0xffffff)

      // Level-based wear/decal
      const wear = this.scene.add.graphics()
      if (this.buildingData.level > 1) {
        wear.fillStyle(0xffffff, 0.03 * this.buildingData.level)
        for (let i = 0; i < this.buildingData.level; i++) {
          wear.fillCircle((seed % 20) - 10, -20 - (i * 12), 2 + (seed % 3))
        }
      }

      return this.scene.add.container(0, 0, [groundPlate, sprite, wear])
    }

    // Ruins/Placeholder - broken, uneven, embedded in terrain
    const ruins = this.scene.add.container(0, -8)

    // Broken foundation
    const foundation = this.scene.add
      .ellipse(0, 8, 68, 18, 0x1a1f1a, 0.6)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)

    // Ruined structure - tilted and broken
    const base = this.scene.add
      .image(0, -6, 'prop-ruins')
      .setOrigin(0.5, 1)
      .setTint(0x4a5a4a)
      .setAlpha(0.9)
      .setRotation(-0.05)

    // Debris/scatter
    const debris = this.scene.add.graphics()
    debris.fillStyle(0x3a4a3a, 0.8)
    // Random debris pieces
    for (let i = 0; i < 5; i++) {
      const dx = (i * 7) - 14
      const dy = 8 + (i % 3) * 2
      debris.fillRect(dx, dy, 4, 3)
    }

    // Recovery label
    const label = this.scene.add
      .text(0, 18, this.buildingData.placeholderLabel ?? 'Rebuild', {
        color: '#8a9a8a',
        fontSize: '9px',
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.7)

    ruins.add([foundation, debris, base, label])
    return ruins
  }

  private createLevelIndicator(): PhaserContainer {
    const container = this.scene.add.container(0, -8)
    if (this.buildingData.isPlaceholder) return container

    // Subtle level dots - embedded in structure
    const spacing = 8
    const startX = -((this.buildingData.level - 1) * spacing) / 2
    const yPos = -58

    for (let i = 0; i < this.buildingData.level; i++) {
      const dot = this.scene.add
        .circle(startX + i * spacing, yPos, 2, 0xc4a35a)
        .setAlpha(0.8)
      container.add(dot)
    }

    return container
  }

  private bindInteractions(scene: SelectableScene): void {
    this.on('pointerover', () => {
      this.setScale(1.02)
      this.outline.setVisible(true)
    })

    this.on('pointerout', () => {
      this.setScale(1)
      this.outline.setVisible(false)
    })

    this.on('pointerup', () => {
      if (!scene.canSelectBuilding()) return
      scene.selectBuilding(this.buildingData)
    })
  }
}

type SelectableScene = PhaserScene & {
  selectBuilding: (building: BuildingData) => void
  canSelectBuilding: () => boolean
}