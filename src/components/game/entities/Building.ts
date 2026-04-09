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
      const basePlate = this.scene.add.ellipse(0, 6, 86, 28, 0x09111a, 0.42)
      const shadow = this.scene.add.ellipse(0, 0, 74, 22, 0x04080d, 0.32)
      const underGlow = this.scene.add
        .ellipse(0, -8, 58, 18, 0xe07030, 0.06 + this.buildingData.level * 0.012)
        .setBlendMode(Phaser.BlendModes.SCREEN)
      const sprite = this.scene.add
        .image(0, -18, this.buildingData.type)
        .setDisplaySize(104, 104)
        .setOrigin(0.5, 1)
        .setTint(tint ?? 0xffffff)
      const glow = this.scene.add
        .ellipse(0, -50, 76, 22, 0xf8df9f, 0.03 + this.buildingData.level * 0.012)
        .setBlendMode(Phaser.BlendModes.SCREEN)
      const mastLight = this.scene.add
        .ellipse(0, -70, 18, 18, 0xf7f2d8, 0.08)
        .setBlendMode(Phaser.BlendModes.SCREEN)

      return this.scene.add.container(0, 0, [basePlate, shadow, underGlow, glow, mastLight, sprite])
    }

    const ruins = this.scene.add.container(0, -10)
    const plate = this.scene.add.ellipse(0, 8, 86, 22, 0x09111a, 0.34)
    const shadow = this.scene.add.ellipse(0, 4, 74, 18, 0x05080d, 0.32)
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

    ruins.add([plate, shadow, mist, base, label])

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
    this.outline.lineStyle(2, this.buildingData.isPlaceholder ? 0x9fb4c8 : 0xf0c084, 0.92)
    this.outline.strokeRoundedRect(-38, -94, 76, 74, 12)
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
