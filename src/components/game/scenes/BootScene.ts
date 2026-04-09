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

  drawIsoDiamond(graphics, 64, 100, 90, 36, 0x111827, 0.28)
  drawIsoDiamond(graphics, 64, 76, 72, 28, palette.top)

  graphics.fillStyle(palette.left, 1)
  graphics.fillPoints(
    [
      new Phaser.Geom.Point(28, 76),
      new Phaser.Geom.Point(64, 90),
      new Phaser.Geom.Point(64, 34),
      new Phaser.Geom.Point(28, 48),
    ],
    true,
  )

  graphics.fillStyle(palette.right, 1)
  graphics.fillPoints(
    [
      new Phaser.Geom.Point(64, 90),
      new Phaser.Geom.Point(100, 76),
      new Phaser.Geom.Point(100, 48),
      new Phaser.Geom.Point(64, 34),
    ],
    true,
  )

  graphics.fillStyle(palette.accent, 0.95)
  graphics.fillRect(55, 44, 18, 24)
  graphics.fillRect(40, 56, 10, 12)
  graphics.fillRect(78, 56, 10, 12)
  graphics.fillTriangle(64, 12, 40, 46, 88, 46)
  graphics.fillRect(60, 18, 8, 18)
  graphics.fillRect(72, 28, 8, 16)

  graphics.lineStyle(2, 0x09111c, 0.35)
  graphics.strokePoints(
    [
      new Phaser.Geom.Point(64, 20),
      new Phaser.Geom.Point(100, 48),
      new Phaser.Geom.Point(100, 76),
      new Phaser.Geom.Point(64, 90),
      new Phaser.Geom.Point(28, 76),
      new Phaser.Geom.Point(28, 48),
    ],
    true,
  )

  graphics.generateTexture(key, 128, 128)
}

function generatePropTextures(graphics: import('phaser').GameObjects.Graphics) {
  graphics.clear()
  graphics.fillStyle(0x0a1018, 0.24)
  graphics.fillEllipse(32, 56, 40, 16)
  graphics.fillStyle(0x315138, 1)
  graphics.fillTriangle(20, 44, 32, 14, 44, 44)
  graphics.fillTriangle(16, 52, 32, 24, 48, 52)
  graphics.fillStyle(0x49341f, 1)
  graphics.fillRect(29, 44, 6, 12)
  graphics.generateTexture('prop-tree', 64, 64)

  graphics.clear()
  graphics.fillStyle(0x0a1018, 0.2)
  graphics.fillEllipse(32, 52, 40, 14)
  graphics.fillStyle(0x6f7c89, 1)
  graphics.fillEllipse(24, 38, 18, 12)
  graphics.fillEllipse(36, 34, 20, 14)
  graphics.fillEllipse(44, 40, 16, 10)
  graphics.generateTexture('prop-stones', 64, 64)

  graphics.clear()
  graphics.fillStyle(0x4a3322, 1)
  graphics.fillRect(28, 18, 5, 32)
  graphics.fillStyle(0xc9581a, 1)
  graphics.fillTriangle(33, 18, 52, 28, 33, 36)
  graphics.fillStyle(0xffdb9b, 0.8)
  graphics.fillTriangle(33, 22, 46, 28, 33, 32)
  graphics.generateTexture('prop-banner', 64, 64)

  graphics.clear()
  graphics.fillStyle(0x0a1018, 0.25)
  graphics.fillEllipse(32, 52, 46, 16)
  graphics.fillStyle(0x6d7784, 0.9)
  graphics.fillRect(16, 32, 10, 12)
  graphics.fillRect(28, 26, 10, 18)
  graphics.fillRect(40, 34, 8, 10)
  graphics.fillStyle(0x9aa7b4, 0.35)
  graphics.fillRect(16, 28, 32, 4)
  graphics.generateTexture('prop-ruins', 64, 64)
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
