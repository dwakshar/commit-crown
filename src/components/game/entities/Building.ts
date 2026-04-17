import type { BuildingData } from '@/src/types/game'

type PhaserModule = typeof import('phaser')
type PhaserContainer = import('phaser').GameObjects.Container
type PhaserScene = import('phaser').Scene
type PhaserGraphics = import('phaser').GameObjects.Graphics

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

// Per-type config: display size and sprite anchor offset (spriteY > 0 = anchor below tile center)
const ASSET_CONFIG: Record<
  BuildingData['type'],
  { dispW: number; dispH: number; spriteY: number }
> = {
  town_hall:     { dispW: 184, dispH: 200, spriteY: 22 },
  arcane_tower:  { dispW:  88, dispH: 110, spriteY: 26 },
  library:       { dispW:  92, dispH:  96, spriteY: 21 },
  iron_forge:    { dispW:  88, dispH:  96, spriteY: 21 },
  barracks:      { dispW:  92, dispH:  96, spriteY: 21 },
  observatory:   { dispW:  88, dispH: 100, spriteY: 22 },
  market:        { dispW:  92, dispH:  96, spriteY: 21 },
  wall:          { dispW:  88, dispH:  80, spriteY: 15 },
  monument:      { dispW:  88, dispH: 108, spriteY: 25 },
}

export class Building extends Phaser.GameObjects.Container {
  public readonly buildingData: BuildingData
  private readonly outline: PhaserGraphics

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
    if (this.buildingData.isPlaceholder) {
      return this.createRuinsVisual()
    }

    const cfg = ASSET_CONFIG[this.buildingData.type]
    const tint = deriveSkinTint(this.buildingData.skinId)
    const g = this.scene.add.graphics()

    // ── Soft drop shadow centered at tile face (no fW/fH needed) ────────────
    g.fillStyle(0x000000, 0.08)
    g.fillEllipse(2, 14, 92, 28)
    g.fillStyle(0x000000, 0.10)
    g.fillEllipse(1, 10, 62, 20)
    g.fillStyle(0x000000, 0.12)
    g.fillEllipse(0, 6, 38, 13)

    // ── Building sprite — texture already includes stone foundation ──────────
    // spriteY > 0 shifts anchor below tile center so foundation base sits on tile
    const sprite = this.scene.add
      .image(0, cfg.spriteY, this.buildingData.type)
      .setDisplaySize(cfg.dispW, cfg.dispH)
      .setOrigin(0.5, 1)
      .setTint(tint ?? 0xffffff)

    return this.scene.add.container(0, 0, [g, sprite])
  }

  private createRuinsVisual(): PhaserContainer {
    const ruins = this.scene.add.container(0, -8)
    const g = this.scene.add.graphics()

    // Soft shadow — no MULTIPLY
    g.fillStyle(0x000000, 0.12)
    g.fillEllipse(0, 14, 82, 24)
    g.fillStyle(0x000000, 0.08)
    g.fillEllipse(0, 12, 58, 16)

    // Broken foundation remnant
    g.fillStyle(0x5a5248, 0.85)
    g.fillPoints(
      [
        new Phaser.Geom.Point(0, -12),
        new Phaser.Geom.Point(28, 0),
        new Phaser.Geom.Point(0, 12),
        new Phaser.Geom.Point(-28, 0),
      ],
      true,
    )
    // Cracked seam
    g.lineStyle(1, 0x302820, 0.5)
    g.strokeLineShape(new Phaser.Geom.Line(-12, -4, 8, 6))

    const base = this.scene.add
      .image(0, -6, 'prop-ruins')
      .setOrigin(0.5, 1)
      .setDisplaySize(52, 52)
      .setTint(0x5a6858)
      .setAlpha(0.88)
      .setRotation(-0.06)

    const debris = this.scene.add.graphics()
    debris.fillStyle(0x404a3e, 0.75)
    for (let i = 0; i < 5; i++) {
      debris.fillRect((i * 8) - 18, 6 + (i % 3) * 2, 5, 3)
    }

    const label = this.scene.add
      .text(0, 20, this.buildingData.placeholderLabel ?? 'Rebuild', {
        color: '#8a9a8a',
        fontSize: '9px',
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.7)

    ruins.add([g, debris, base, label])
    return ruins
  }

  private createLevelIndicator(): PhaserContainer {
    const container = this.scene.add.container(0, -8)
    if (this.buildingData.isPlaceholder) return container

    const cfg = ASSET_CONFIG[this.buildingData.type]
    const dotY = cfg.spriteY - cfg.dispH - 8
    const spacing = 8
    const startX = -((this.buildingData.level - 1) * spacing) / 2

    for (let i = 0; i < this.buildingData.level; i++) {
      // Glow backing
      container.add(this.scene.add.circle(startX + i * spacing, dotY, 3.5, 0xffe090, 0.2))
      // Main dot
      container.add(this.scene.add.circle(startX + i * spacing, dotY, 2, 0xd4a030, 0.9))
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
