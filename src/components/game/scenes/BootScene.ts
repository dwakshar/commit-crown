type PhaserModule = typeof import('phaser')

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

const BUILDING_COLORS = {
  town_hall: { top: 0xd8bb72, left: 0xb88840, right: 0x875b27, accent: 0xf7e3aa },
  arcane_tower: { top: 0xaa98ff, left: 0x745ee2, right: 0x4f38a8, accent: 0xe6d9ff },
  library: { top: 0xb58c60, left: 0x8f6639, right: 0x6f4b28, accent: 0xe2cda8 },
  iron_forge: { top: 0xb1b8c4, left: 0x818994, right: 0x5f6670, accent: 0xf08a4b },
  barracks: { top: 0xd36c6a, left: 0xa84b48, right: 0x7e3230, accent: 0xf1d8cb },
  observatory: { top: 0x88d2e3, left: 0x579caf, right: 0x386e82, accent: 0xcff2f5 },
  market: { top: 0xebae5f, left: 0xc98339, right: 0x955923, accent: 0xffe1a2 },
  wall: { top: 0xd1d8df, left: 0xa1abb6, right: 0x7a8591, accent: 0xf5f7fa },
  monument: { top: 0xecf0f5, left: 0xc2c8d1, right: 0x949daa, accent: 0xfff3cd },
} as const

function tintColor(base: number, amount: number) {
  const color = Phaser.Display.Color.IntegerToColor(base)
  const mix = amount >= 0 ? 255 : 0
  const ratio = Math.abs(amount)

  return Phaser.Display.Color.GetColor(
    Math.round(color.red + (mix - color.red) * ratio),
    Math.round(color.green + (mix - color.green) * ratio),
    Math.round(color.blue + (mix - color.blue) * ratio),
  )
}

function drawIsoDiamond(
  graphics: import('phaser').GameObjects.Graphics,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  fill: number,
  alpha = 1,
) {
  graphics.fillStyle(fill, alpha)
  graphics.fillPoints(
    [
      new Phaser.Geom.Point(centerX, centerY - height / 2),
      new Phaser.Geom.Point(centerX + width / 2, centerY),
      new Phaser.Geom.Point(centerX, centerY + height / 2),
      new Phaser.Geom.Point(centerX - width / 2, centerY),
    ],
    true,
  )
}

function generateBuildingTexture(
  graphics: import('phaser').GameObjects.Graphics,
  key: string,
  palette: { top: number; left: number; right: number; accent: number },
) {
  graphics.clear()

  drawIsoDiamond(graphics, 64, 104, 98, 34, 0x081019, 0.28)
  drawIsoDiamond(graphics, 64, 84, 86, 28, 0x0f1c2a, 0.95)
  drawIsoDiamond(graphics, 64, 78, 76, 30, tintColor(palette.top, -0.16), 1)
  drawIsoDiamond(graphics, 64, 72, 72, 28, palette.top)

  graphics.fillStyle(palette.left, 1)
  graphics.fillPoints(
    [
      new Phaser.Geom.Point(26, 72),
      new Phaser.Geom.Point(64, 88),
      new Phaser.Geom.Point(64, 26),
      new Phaser.Geom.Point(26, 42),
    ],
    true,
  )

  graphics.fillStyle(palette.right, 1)
  graphics.fillPoints(
    [
      new Phaser.Geom.Point(64, 88),
      new Phaser.Geom.Point(102, 72),
      new Phaser.Geom.Point(102, 42),
      new Phaser.Geom.Point(64, 26),
    ],
    true,
  )

  graphics.fillStyle(tintColor(palette.top, 0.12), 0.96)
  graphics.fillRect(48, 38, 32, 28)
  graphics.fillRect(54, 24, 20, 20)
  graphics.fillRect(38, 50, 12, 16)
  graphics.fillRect(78, 50, 12, 16)
  graphics.fillStyle(palette.accent, 0.96)
  graphics.fillRect(58, 44, 12, 18)
  graphics.fillRect(57, 28, 14, 10)
  graphics.fillStyle(0xf3f8ff, 0.65)
  graphics.fillRect(53, 46, 4, 8)
  graphics.fillRect(71, 46, 4, 8)
  graphics.fillRect(60, 30, 8, 4)
  graphics.fillStyle(tintColor(palette.accent, -0.2), 0.92)
  graphics.fillTriangle(64, 8, 42, 34, 86, 34)
  graphics.fillRect(61, 11, 6, 14)
  graphics.fillStyle(tintColor(palette.accent, 0.06), 0.36)
  graphics.fillRect(41, 51, 6, 10)
  graphics.fillRect(81, 51, 6, 10)

  graphics.lineStyle(2, 0x09111c, 0.5)
  graphics.strokePoints(
    [
      new Phaser.Geom.Point(64, 16),
      new Phaser.Geom.Point(102, 42),
      new Phaser.Geom.Point(102, 72),
      new Phaser.Geom.Point(64, 88),
      new Phaser.Geom.Point(26, 72),
      new Phaser.Geom.Point(26, 42),
    ],
    true,
  )

  graphics.lineStyle(1, 0xffffff, 0.08)
  graphics.strokeLineShape(new Phaser.Geom.Line(44, 36, 82, 36))
  graphics.strokeLineShape(new Phaser.Geom.Line(64, 16, 64, 88))

  graphics.generateTexture(key, 128, 128)
}

function generatePropTextures(graphics: import('phaser').GameObjects.Graphics) {
  // ── prop-tree (80×80) — round stylized tree with layered foliage ──
  graphics.clear()
  // Drop shadow
  graphics.fillStyle(0x000000, 0.18)
  graphics.fillEllipse(40, 72, 46, 14)
  // Foliage — three overlapping circles build depth
  graphics.fillStyle(0x274f30, 1)
  graphics.fillCircle(40, 42, 22)        // dark base layer
  graphics.fillStyle(0x336040, 1)
  graphics.fillCircle(30, 35, 16)        // left cluster
  graphics.fillCircle(50, 35, 16)        // right cluster
  graphics.fillStyle(0x3d7248, 1)
  graphics.fillCircle(40, 26, 17)        // top dome
  // Rim highlight — sells the round silhouette
  graphics.fillStyle(0x56a060, 0.5)
  graphics.fillCircle(34, 21, 8)
  // Trunk
  graphics.fillStyle(0x5c3d22, 1)
  graphics.fillRect(36, 56, 8, 18)
  // Trunk edge highlight
  graphics.fillStyle(0x8a6040, 0.38)
  graphics.fillRect(36, 56, 3, 18)
  graphics.generateTexture('prop-tree', 80, 80)

  // ── prop-stones (64×64) — polished rock cluster ──
  graphics.clear()
  // Drop shadow
  graphics.fillStyle(0x000000, 0.2)
  graphics.fillEllipse(32, 54, 44, 13)
  // Back/center rock (largest)
  graphics.fillStyle(0x687480, 1)
  graphics.fillEllipse(34, 36, 28, 19)
  // Left rock
  graphics.fillStyle(0x5e6a74, 1)
  graphics.fillEllipse(19, 41, 20, 14)
  // Right rock (smallest)
  graphics.fillStyle(0x70808c, 1)
  graphics.fillEllipse(47, 43, 15, 11)
  // Specular highlights
  graphics.fillStyle(0xb0bec8, 0.38)
  graphics.fillEllipse(30, 29, 11, 6)
  graphics.fillStyle(0xb0bec8, 0.22)
  graphics.fillEllipse(17, 37, 7, 4)
  graphics.generateTexture('prop-stones', 64, 64)

  // ── prop-bush (48×48) — compact leafy bush ──
  graphics.clear()
  // Drop shadow
  graphics.fillStyle(0x000000, 0.15)
  graphics.fillEllipse(24, 43, 34, 11)
  // Bush body — two side circles + centre
  graphics.fillStyle(0x2a5535, 1)
  graphics.fillCircle(24, 28, 15)
  graphics.fillStyle(0x366840, 0.92)
  graphics.fillCircle(16, 25, 11)
  graphics.fillCircle(32, 25, 11)
  // Top highlight
  graphics.fillStyle(0x56a060, 0.48)
  graphics.fillCircle(20, 20, 6)
  graphics.generateTexture('prop-bush', 48, 48)

  // ── prop-grass-tuft (32×32) — small ground clutter ──
  graphics.clear()
  // Three triangular blades
  graphics.fillStyle(0x488040, 1)
  graphics.fillTriangle(13, 22, 11, 7, 16, 22)
  graphics.fillStyle(0x5a9a4a, 0.9)
  graphics.fillTriangle(17, 22, 15, 4, 21, 22)
  graphics.fillStyle(0x488040, 0.85)
  graphics.fillTriangle(22, 22, 20, 9, 26, 22)
  // Blade tips — subtle highlight
  graphics.fillStyle(0x78c060, 0.45)
  graphics.fillCircle(16, 7, 2)
  graphics.fillCircle(18, 4, 2)
  graphics.generateTexture('prop-grass-tuft', 32, 32)

  // ── prop-banner (unchanged — used by Building entity) ──
  graphics.clear()
  graphics.fillStyle(0x4a3322, 1)
  graphics.fillRect(28, 18, 5, 32)
  graphics.fillStyle(0xc9581a, 1)
  graphics.fillTriangle(33, 18, 52, 28, 33, 36)
  graphics.fillStyle(0xffdb9b, 0.8)
  graphics.fillTriangle(33, 22, 46, 28, 33, 32)
  graphics.generateTexture('prop-banner', 64, 64)

  // ── prop-ruins (unchanged — used by Building entity) ──
  graphics.clear()
  graphics.fillStyle(0x081019, 0.25)
  graphics.fillEllipse(32, 52, 46, 16)
  graphics.fillStyle(0x5f6974, 0.9)
  graphics.fillRect(16, 32, 10, 12)
  graphics.fillRect(28, 26, 10, 18)
  graphics.fillRect(40, 34, 8, 10)
  graphics.fillStyle(0x9aa7b4, 0.35)
  graphics.fillRect(16, 28, 32, 4)
  graphics.generateTexture('prop-ruins', 64, 64)

  // ── prop-beacon (unchanged) ──
  graphics.clear()
  graphics.fillStyle(0x081019, 0.22)
  graphics.fillEllipse(32, 54, 40, 14)
  graphics.fillStyle(0x102438, 0.92)
  graphics.fillRect(28, 22, 8, 26)
  graphics.fillStyle(0xe07030, 0.96)
  graphics.fillRect(30, 16, 4, 8)
  graphics.fillStyle(0xf8c08a, 0.26)
  graphics.fillEllipse(32, 16, 18, 10)
  graphics.generateTexture('prop-beacon', 64, 64)
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload(): void {
    const graphics = this.make.graphics()

    Object.entries(BUILDING_COLORS).forEach(([key, palette]) => {
      generateBuildingTexture(graphics, key, palette)
    })

    generatePropTextures(graphics)
    graphics.destroy()
  }

  create(): void {
    this.scene.start('KingdomScene')
  }
}
