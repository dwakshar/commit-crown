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
  town_hall: { top: 0xd9b46b, left: 0xb9873f, right: 0x8f5f2a },
  arcane_tower: { top: 0x9c8cff, left: 0x6c58d9, right: 0x5038ad },
  library: { top: 0xa97c50, left: 0x855d35, right: 0x684526 },
  iron_forge: { top: 0x9ca3af, left: 0x737b86, right: 0x565d68 },
  barracks: { top: 0xc95f5f, left: 0xa14242, right: 0x7d2f2f },
  observatory: { top: 0x7dc7d9, left: 0x5198ad, right: 0x356f82 },
  market: { top: 0xe0a458, left: 0xc17d34, right: 0x945826 },
  wall: { top: 0xc9d1d9, left: 0x9ea8b2, right: 0x7b8794 },
  monument: { top: 0xe6e9ef, left: 0xb8c0cb, right: 0x8a95a3 },
} as const

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload(): void {
    const graphics = this.make.graphics()

    Object.entries(BUILDING_COLORS).forEach(([key, palette]) => {
      graphics.clear()

      graphics.fillStyle(palette.top, 1)
      graphics.fillPoints(
        [
          new Phaser.Geom.Point(32, 0),
          new Phaser.Geom.Point(60, 16),
          new Phaser.Geom.Point(32, 32),
          new Phaser.Geom.Point(4, 16),
        ],
        true,
      )

      graphics.fillStyle(palette.left, 1)
      graphics.fillPoints(
        [
          new Phaser.Geom.Point(4, 16),
          new Phaser.Geom.Point(32, 32),
          new Phaser.Geom.Point(32, 60),
          new Phaser.Geom.Point(4, 44),
        ],
        true,
      )

      graphics.fillStyle(palette.right, 1)
      graphics.fillPoints(
        [
          new Phaser.Geom.Point(32, 32),
          new Phaser.Geom.Point(60, 16),
          new Phaser.Geom.Point(60, 44),
          new Phaser.Geom.Point(32, 60),
        ],
        true,
      )

      graphics.lineStyle(2, 0x0f1320, 0.35)
      graphics.strokePoints(
        [
          new Phaser.Geom.Point(32, 0),
          new Phaser.Geom.Point(60, 16),
          new Phaser.Geom.Point(32, 32),
          new Phaser.Geom.Point(4, 16),
        ],
        true,
      )

      graphics.generateTexture(key, 64, 64)
    })

    graphics.destroy()
  }

  create(): void {
    this.scene.start('KingdomScene')
  }
}
