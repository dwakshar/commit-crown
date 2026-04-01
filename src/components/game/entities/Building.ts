import type { BuildingData } from '@/src/types/game'

type PhaserModule = typeof import('phaser')
type PhaserContainer = import('phaser').GameObjects.Container
type PhaserScene = import('phaser').Scene

type SelectableScene = PhaserScene & {
  selectBuilding: (building: BuildingData) => void
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

    this.setSize(64, 96)
    if (!buildingData.isPlaceholder) {
      this.setInteractive(
        new Phaser.Geom.Rectangle(-32, -96, 64, 96),
        Phaser.Geom.Rectangle.Contains,
      )
    }

    this.drawOutline()
    if (!buildingData.isPlaceholder) {
      this.bindInteractions(scene as SelectableScene)
    }
    scene.add.existing(this)
  }

  private createVisual(): PhaserContainer {
    if (!this.buildingData.isPlaceholder) {
      return this.scene.add.container(0, 0, [
        this.scene.add.image(0, -32, this.buildingData.type).setOrigin(0.5, 1),
      ])
    }

    const ruins = this.scene.add.container(0, -18)
    const base = this.scene.add
      .image(0, -14, 'wall')
      .setOrigin(0.5, 1)
      .setTint(0x74808d)
      .setAlpha(0.42)
    const mist = this.scene.add.ellipse(0, 12, 72, 18, 0x090c11, 0.45)
    const label = this.scene.add
      .text(0, 18, this.buildingData.placeholderLabel ?? 'Code more to unlock', {
        color: '#b9c1cb',
        fontSize: '10px',
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.9)

    ruins.add([mist, base, label])

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
    if (this.buildingData.isPlaceholder) {
      return
    }

    this.outline.clear()
    this.outline.lineStyle(2, 0xf8f2c4, 0.95)
    this.outline.strokeRoundedRect(-30, -92, 60, 62, 8)
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

    this.on('pointerdown', () => {
      scene.selectBuilding(this.buildingData)
    })
  }
}
