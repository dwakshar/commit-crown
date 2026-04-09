import type { BuildingData } from '@/src/types/game'

type PhaserModule = typeof import('phaser')
type PhaserContainer = import('phaser').GameObjects.Container
type PhaserScene = import('phaser').Scene

type SelectableScene = PhaserScene & {
  selectBuilding: (building: BuildingData) => void
  canSelectBuilding: () => boolean
}

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

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function deriveSkinTint(skinId: string | null | undefined) {
  if (!skinId) {
    return null
  }

  const hash = hashString(skinId)
  const hue = hash % 360
  return Phaser.Display.Color.HSLToColor(hue / 360, 0.72, 0.62).color
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
    this.add(this.createLevelDots())

    this.setSize(72, 96)
    this.setInteractive(new Phaser.Geom.Rectangle(-36, -96, 72, 96), Phaser.Geom.Rectangle.Contains)

    this.drawOutline()
    this.bindInteractions(scene as SelectableScene)
    scene.add.existing(this)
  }

  private createVisual(): PhaserContainer {
    if (!this.buildingData.isPlaceholder) {
      const tint = deriveSkinTint(this.buildingData.skinId)
      const shadow = this.scene.add.ellipse(0, -2, 82, 24, 0x060a10, 0.26)
      const sprite = this.scene.add
        .image(0, -24, this.buildingData.type)
        .setDisplaySize(94, 94)
        .setOrigin(0.5, 1)
        .setTint(tint ?? 0xffffff)
      const glow = this.scene.add
        .ellipse(0, -54, 62, 18, 0xf8df9f, 0.06 + this.buildingData.level * 0.015)
        .setBlendMode(Phaser.BlendModes.SCREEN)

      return this.scene.add.container(0, 0, [shadow, glow, sprite])
    }

    const ruins = this.scene.add.container(0, -10)
    const shadow = this.scene.add.ellipse(0, 4, 84, 18, 0x05080d, 0.28)
    const base = this.scene.add
      .image(0, -10, 'prop-ruins')
      .setOrigin(0.5, 1)
      .setTint(0xa0acb8)
      .setAlpha(0.92)
    const mist = this.scene.add.ellipse(0, 8, 72, 18, 0x090c11, 0.4)
    const label = this.scene.add
      .text(0, 14, this.buildingData.placeholderLabel ?? 'Recover district', {
        color: '#d2d9e2',
        fontSize: '10px',
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.84)

    ruins.add([shadow, mist, base, label])

    return ruins
  }

  private createLevelDots(): PhaserContainer {
    const dots = this.scene.add.container(0, -8)
    if (this.buildingData.isPlaceholder) {
      return dots
    }

    const spacing = 10
    const startX = -((this.buildingData.level - 1) * spacing) / 2

    for (let index = 0; index < this.buildingData.level; index += 1) {
      const dot = this.scene.add
        .circle(startX + index * spacing, 0, 3, 0xffd166)
        .setStrokeStyle(1, 0x5c3b08, 0.8)

      dots.add(dot)
    }

    return dots
  }

  private drawOutline(): void {
    this.outline.clear()
    this.outline.lineStyle(2, this.buildingData.isPlaceholder ? 0xa8b7c7 : 0xf8f2c4, 0.95)
    this.outline.strokeRoundedRect(-34, -90, 68, 66, 10)
  }

  private bindInteractions(scene: SelectableScene): void {
    this.on('pointerover', () => {
      this.setScale(1.04)
      this.outline.setVisible(true)
    })

    this.on('pointerout', () => {
      this.setScale(1)
      this.outline.setVisible(false)
    })

    this.on('pointerup', () => {
      if (!scene.canSelectBuilding()) {
        return
      }

      scene.selectBuilding(this.buildingData)
    })
  }
}
