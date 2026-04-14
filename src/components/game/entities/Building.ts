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

// Per-type config: display size and foundation dimensions
const ASSET_CONFIG: Record<
  BuildingData['type'],
  { dispW: number; dispH: number; fW: number; fH: number; fDepth: number }
> = {
  town_hall:     { dispW: 116, dispH: 145, fW: 86, fH: 30, fDepth: 11 },
  arcane_tower:  { dispW:  88, dispH: 110, fW: 62, fH: 22, fDepth:  7 },
  library:       { dispW:  92, dispH:  96, fW: 66, fH: 24, fDepth:  8 },
  iron_forge:    { dispW:  88, dispH:  96, fW: 64, fH: 22, fDepth:  7 },
  barracks:      { dispW:  92, dispH:  96, fW: 66, fH: 22, fDepth:  7 },
  observatory:   { dispW:  88, dispH: 100, fW: 62, fH: 22, fDepth:  7 },
  market:        { dispW:  92, dispH:  96, fW: 66, fH: 22, fDepth:  7 },
  wall:          { dispW:  88, dispH:  80, fW: 64, fH: 20, fDepth:  6 },
  monument:      { dispW:  88, dispH: 108, fW: 62, fH: 22, fDepth:  7 },
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

    // ── Soft drop shadow (NO blend mode — avoids dark blob artefacts) ──────
    const sw = cfg.fW * 1.55
    const sh = cfg.fH * 1.55
    g.fillStyle(0x000000, 0.08)
    g.fillEllipse(2, cfg.fH * 0.9, sw, sh)
    g.fillStyle(0x000000, 0.10)
    g.fillEllipse(1, cfg.fH * 0.7, sw * 0.68, sh * 0.72)
    g.fillStyle(0x000000, 0.12)
    g.fillEllipse(0, cfg.fH * 0.5, sw * 0.42, sh * 0.50)

    // ── Isometric stone foundation slab ────────────────────────────────────
    this.drawFoundation(g, cfg.fW, cfg.fH, cfg.fDepth)

    // ── Building sprite (sits ON the foundation) ───────────────────────────
    // Sprite anchor (origin 0.5, 1) = bottom-center of displayed image.
    // We raise it so the texture base aligns with the foundation front edge.
    const spriteY = -(cfg.fH * 0.28)
    const sprite = this.scene.add
      .image(0, spriteY, this.buildingData.type)
      .setDisplaySize(cfg.dispW, cfg.dispH)
      .setOrigin(0.5, 1)
      .setTint(tint ?? 0xffffff)

    // Ambient occlusion ring at sprite base — very subtle darkening where
    // structure meets foundation, no blend mode needed
    g.fillStyle(0x000000, 0.09)
    g.fillEllipse(0, spriteY + 2, cfg.fW * 0.72, cfg.fH * 0.55)

    return this.scene.add.container(0, 0, [g, sprite])
  }

  // Isometric stone slab drawn in local container space.
  // Foundation top-face center is at container (0, 0).
  private drawFoundation(g: PhaserGraphics, fW: number, fH: number, fd: number): void {
    const hW = fW / 2
    const hH = fH / 2

    // Left side face — lit from above-left
    g.fillStyle(0x6e6454, 1)
    g.fillPoints(
      [
        new Phaser.Geom.Point(-hW, 0),
        new Phaser.Geom.Point(0, hH),
        new Phaser.Geom.Point(0, hH + fd),
        new Phaser.Geom.Point(-hW, fd),
      ],
      true,
    )

    // Right side face — in shadow
    g.fillStyle(0x524840, 1)
    g.fillPoints(
      [
        new Phaser.Geom.Point(0, hH),
        new Phaser.Geom.Point(hW, 0),
        new Phaser.Geom.Point(hW, fd),
        new Phaser.Geom.Point(0, hH + fd),
      ],
      true,
    )

    // Top face — warm stone colour
    g.fillStyle(0x988670, 1)
    g.fillPoints(
      [
        new Phaser.Geom.Point(0, -hH),
        new Phaser.Geom.Point(hW, 0),
        new Phaser.Geom.Point(0, hH),
        new Phaser.Geom.Point(-hW, 0),
      ],
      true,
    )

    // Subtle stone highlight on top-left edge
    g.lineStyle(1, 0xc8b898, 0.35)
    g.strokeLineShape(new Phaser.Geom.Line(-hW + 3, -2, hW - 3, -hH + 3))

    // Faint mortar line across center
    g.lineStyle(1, 0x706050, 0.2)
    g.strokeLineShape(new Phaser.Geom.Line(-hW * 0.6, hH * 0.2, hW * 0.6, -hH * 0.2))
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
    const dotY = -(cfg.dispH * 0.82)
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
