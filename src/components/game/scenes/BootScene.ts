type PhaserModule = typeof import("phaser");
type G = import("phaser").GameObjects.Graphics;

type PhaserGlobal = typeof globalThis & {
  Phaser?: PhaserModule;
};

function getPhaser(): PhaserModule {
  const phaser = (globalThis as PhaserGlobal).Phaser;
  if (!phaser) {
    throw new Error(
      "Phaser runtime is unavailable. Load Phaser before importing scenes."
    );
  }
  return phaser;
}

const Phaser = getPhaser();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tintColor(base: number, amount: number) {
  const color = Phaser.Display.Color.IntegerToColor(base);
  const mix = amount >= 0 ? 255 : 0;
  const ratio = Math.abs(amount);
  return Phaser.Display.Color.GetColor(
    Math.round(color.red + (mix - color.red) * ratio),
    Math.round(color.green + (mix - color.green) * ratio),
    Math.round(color.blue + (mix - color.blue) * ratio)
  );
}

// Draw an isometric diamond fill
function isoDiamond(
  g: G,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  fill: number,
  alpha = 1
) {
  g.fillStyle(fill, alpha);
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx, cy - hh),
      new Phaser.Geom.Point(cx + hw, cy),
      new Phaser.Geom.Point(cx, cy + hh),
      new Phaser.Geom.Point(cx - hw, cy),
    ],
    true
  );
}

// Draw the three visible faces of an isometric box
// cx,cy = iso top-face diamond center; hw/hh = half-width/height of top; wallH = side depth
function isoBox(
  g: G,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  wallH: number,
  topColor: number,
  leftColor: number,
  rightColor: number
) {
  // Left face: W→S→S+depth→W+depth
  g.fillStyle(leftColor, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx - hw, cy),
      new Phaser.Geom.Point(cx, cy + hh),
      new Phaser.Geom.Point(cx, cy + hh + wallH),
      new Phaser.Geom.Point(cx - hw, cy + wallH),
    ],
    true
  );

  // Right face: S→E→E+depth→S+depth
  g.fillStyle(rightColor, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx, cy + hh),
      new Phaser.Geom.Point(cx + hw, cy),
      new Phaser.Geom.Point(cx + hw, cy + wallH),
      new Phaser.Geom.Point(cx, cy + hh + wallH),
    ],
    true
  );

  // Top face
  isoDiamond(g, cx, cy, hw, hh, topColor);
}

// Hipped (pyramid) roof: from eave diamond up to a single peak point
function hippedRoof(
  g: G,
  ex: number,
  ey: number, // eave iso diamond center
  ehw: number,
  ehh: number, // eave half-dimensions
  peakX: number,
  peakY: number,
  leftFront: number,
  rightFront: number,
  rightBack: number
) {
  const N = { x: ex, y: ey - ehh };
  const E = { x: ex + ehw, y: ey };
  const S = { x: ex, y: ey + ehh };
  const W = { x: ex - ehw, y: ey };
  const P = { x: peakX, y: peakY };

  // Left-front face (lit side, viewer's left)
  g.fillStyle(leftFront, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(W.x, W.y),
      new Phaser.Geom.Point(S.x, S.y),
      new Phaser.Geom.Point(P.x, P.y),
    ],
    true
  );

  // Right-front face (shadow side, viewer's right)
  g.fillStyle(rightFront, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(S.x, S.y),
      new Phaser.Geom.Point(E.x, E.y),
      new Phaser.Geom.Point(P.x, P.y),
    ],
    true
  );

  // Right-back (partially visible)
  g.fillStyle(rightBack, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(E.x, E.y),
      new Phaser.Geom.Point(N.x, N.y),
      new Phaser.Geom.Point(P.x, P.y),
    ],
    true
  );

  // Left-back (same as right-back, darkest)
  g.fillStyle(tintColor(rightBack, -0.08), 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(N.x, N.y),
      new Phaser.Geom.Point(W.x, W.y),
      new Phaser.Geom.Point(P.x, P.y),
    ],
    true
  );
}

// ─── Town Hall ────────────────────────────────────────────────────────────────
// Canvas: 160×200.  Building base (ground contact) is near canvas y=175.
// Bottom-center anchor = canvas (80, 200).

function generateTownHall(g: G) {
  g.clear();

  const cx = 80; // horizontal center

  // ── Step 1: Foundation raised platform ───────────────────────────────────
  // Outer platform — wide stone base step
  isoBox(
    g,
    cx,
    148,
    56,
    20,
    13,
    0xa09078, // top: warm stone
    0x7a6c58, // left: lit side
    0x5c5040 // right: shadow side
  );

  // Inner platform — second step (slightly smaller, slightly taller)
  isoBox(g, cx, 136, 48, 17, 10, 0xb0a080, 0x887868, 0x685848);

  // Stone detail on outer platform top face
  g.lineStyle(1, 0x706050, 0.22);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 28, 148, cx + 28, 143));
  g.strokeLineShape(new Phaser.Geom.Line(cx - 10, 152, cx + 10, 148));
  g.lineStyle(1, 0xd0c0a0, 0.18);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 30, 135, cx, 128));

  // ── Step 2: Main building walls ───────────────────────────────────────────
  // Wall base sits on inner platform top. Wall height = 52px.
  const wCy = 128; // wall iso-face center y
  const wHW = 44,
    wHH = 16,
    wH = 52;

  // Left wall (lit face)
  g.fillStyle(0xd4bc80, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx - wHW, wCy),
      new Phaser.Geom.Point(cx, wCy + wHH),
      new Phaser.Geom.Point(cx, wCy + wHH - wH),
      new Phaser.Geom.Point(cx - wHW, wCy - wH),
    ],
    true
  );

  // Right wall (shadow face)
  g.fillStyle(0x9c8440, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx, wCy + wHH),
      new Phaser.Geom.Point(cx + wHW, wCy),
      new Phaser.Geom.Point(cx + wHW, wCy - wH),
      new Phaser.Geom.Point(cx, wCy + wHH - wH),
    ],
    true
  );

  // Wall top face (roof platform)
  isoDiamond(g, cx, wCy - wH, wHW, wHH, 0xe0cc88);

  // ── Architectural accent: cornice band at top of walls ───────────────────
  // Thin bright strip along top edge of left wall
  g.lineStyle(2, 0xf0d898, 0.55);
  g.strokeLineShape(
    new Phaser.Geom.Line(cx - wHW, wCy - wH, cx, wCy + wHH - wH)
  );
  g.strokeLineShape(
    new Phaser.Geom.Line(cx, wCy + wHH - wH, cx + wHW, wCy - wH)
  );

  // ── Step 3: Windows ───────────────────────────────────────────────────────
  // Left wall: 2 arched windows
  const leftWinPositions = [
    { x: cx - 32, y: wCy - 22 },
    { x: cx - 16, y: wCy - 10 },
  ];
  for (const wp of leftWinPositions) {
    // Dark frame
    g.fillStyle(0x2a1e0e, 0.9);
    g.fillRect(wp.x - 5, wp.y - 12, 10, 16);
    // Warm glow pane
    g.fillStyle(0xffda70, 0.85);
    g.fillRect(wp.x - 3, wp.y - 10, 6, 12);
    // Arched top (3 dots approximating arch)
    g.fillStyle(0xffda70, 0.85);
    g.fillCircle(wp.x, wp.y - 10, 3);
    // Window cross mullion
    g.fillStyle(0x2a1e0e, 0.7);
    g.fillRect(wp.x - 3, wp.y - 5, 6, 1);
    g.fillRect(wp.x, wp.y - 10, 1, 12);
  }

  // Right wall: 2 windows (dimmer, shadow side)
  const rightWinPositions = [
    { x: cx + 16, y: wCy - 10 },
    { x: cx + 32, y: wCy - 22 },
  ];
  for (const wp of rightWinPositions) {
    g.fillStyle(0x1e1608, 0.9);
    g.fillRect(wp.x - 5, wp.y - 12, 10, 16);
    g.fillStyle(0xd4a030, 0.7);
    g.fillRect(wp.x - 3, wp.y - 10, 6, 12);
    g.fillCircle(wp.x, wp.y - 10, 3);
    g.fillStyle(0x1e1608, 0.6);
    g.fillRect(wp.x - 3, wp.y - 5, 6, 1);
    g.fillRect(wp.x, wp.y - 10, 1, 12);
  }

  // ── Step 4: Main door arch ────────────────────────────────────────────────
  // Centered at the S point of wall bottom
  const doorX = cx,
    doorY = wCy + wHH - 4;
  g.fillStyle(0x2a1808, 0.95);
  g.fillRect(doorX - 7, doorY - 18, 14, 18);
  // Door arch top
  g.fillStyle(0x2a1808, 0.95);
  g.fillCircle(doorX, doorY - 18, 7);
  // Door glow (inner light)
  g.fillStyle(0xff9830, 0.35);
  g.fillCircle(doorX, doorY - 12, 5);
  // Door frame decorative border
  g.lineStyle(1, 0xc89040, 0.5);
  g.strokeRect(doorX - 8, doorY - 19, 16, 20);

  // ── Step 5: Hipped roof ───────────────────────────────────────────────────
  // Eave line extends slightly beyond wall top
  const eCy = wCy - wH; // eave center y = wall top face center
  const eHW = wHW + 5,
    eHH = wHH + 4; // eave extends beyond wall
  const peakX = cx,
    peakY = eCy - 38; // peak 38px above eave center

  hippedRoof(
    g,
    cx,
    eCy,
    eHW,
    eHH,
    peakX,
    peakY,
    0xc84030, // left-front: warm terracotta (lit)
    0x8c2418, // right-front: deep shadow terracotta
    0xa03020 // right-back
  );

  // Roof ridge highlight (bright edge along eave left-front slope)
  g.lineStyle(2, 0xe05840, 0.5);
  g.strokeLineShape(new Phaser.Geom.Line(cx - eHW, eCy, peakX, peakY));

  // Eave overhang edge line — defines crisp roof base
  g.lineStyle(2, 0x6a1808, 0.55);
  g.strokePoints(
    [
      new Phaser.Geom.Point(cx, eCy - eHH),
      new Phaser.Geom.Point(cx + eHW, eCy),
      new Phaser.Geom.Point(cx, eCy + eHH),
      new Phaser.Geom.Point(cx - eHW, eCy),
    ],
    true
  );

  // ── Step 6: Central tower (sits at roof peak) ─────────────────────────────
  const tCy = peakY + 4; // tower iso-diamond center
  const tHW = 11,
    tHH = 5;
  const tWallH = 28; // tower wall height

  // Tower walls
  g.fillStyle(0xd0b870, 1); // left face — lit
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx - tHW, tCy),
      new Phaser.Geom.Point(cx, tCy + tHH),
      new Phaser.Geom.Point(cx, tCy + tHH - tWallH),
      new Phaser.Geom.Point(cx - tHW, tCy - tWallH),
    ],
    true
  );

  g.fillStyle(0x9a8040, 1); // right face — shadow
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx, tCy + tHH),
      new Phaser.Geom.Point(cx + tHW, tCy),
      new Phaser.Geom.Point(cx + tHW, tCy - tWallH),
      new Phaser.Geom.Point(cx, tCy + tHH - tWallH),
    ],
    true
  );

  // Tower top face
  isoDiamond(g, cx, tCy - tWallH, tHW, tHH, 0xe8d080);

  // Tower crenellations (merlons) on top
  const crenelY = tCy - tWallH - tHH;
  for (let m = -1; m <= 1; m++) {
    g.fillStyle(0xd8c070, 1);
    g.fillRect(cx + m * 7 - 3, crenelY - 6, 5, 5);
  }

  // ── Step 7: Spire ─────────────────────────────────────────────────────────
  const spireBase = tCy - tWallH - tHH - 2;
  const spireTip = spireBase - 28;

  // Spire left face
  g.fillStyle(0xc03828, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx - tHW, spireBase),
      new Phaser.Geom.Point(cx, spireBase + tHH),
      new Phaser.Geom.Point(cx, spireTip),
    ],
    true
  );

  // Spire right face
  g.fillStyle(0x882018, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx, spireBase + tHH),
      new Phaser.Geom.Point(cx + tHW, spireBase),
      new Phaser.Geom.Point(cx, spireTip),
    ],
    true
  );

  // Spire highlight edge
  g.lineStyle(1, 0xe04838, 0.5);
  g.strokeLineShape(new Phaser.Geom.Line(cx - tHW, spireBase, cx, spireTip));

  // ── Step 8: Flag ──────────────────────────────────────────────────────────
  // Pole
  g.lineStyle(2, 0x5c3c18, 1);
  g.strokeLineShape(new Phaser.Geom.Line(cx, spireTip, cx, spireTip - 18));

  // Flag body
  g.fillStyle(0xe83018, 0.95);
  g.fillTriangle(cx, spireTip - 17, cx + 18, spireTip - 11, cx, spireTip - 5);
  // Flag highlight stripe
  g.fillStyle(0xff6040, 0.55);
  g.fillTriangle(cx, spireTip - 16, cx + 15, spireTip - 11, cx, spireTip - 7);
  // Gold finial at top of pole
  g.fillStyle(0xffd040, 1);
  g.fillCircle(cx, spireTip - 18, 2);

  // ── Step 9: Ambient occlusion at building base ────────────────────────────
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(cx, wCy + wHH + 2, 96, 18);

  g.generateTexture("town_hall", 160, 200);
}

// ─── Generic building generator (all other types) ─────────────────────────────
// Canvas: 128×128. Each type has its own palette + roof/accent style.

const BUILDING_DEFS = {
  arcane_tower: {
    wallTop: 0xb0a0e8,
    wallLeft: 0x8070d0,
    wallRight: 0x5848a8,
    roofLeft: 0x6040c0,
    roofRight: 0x3828a0,
    accent: 0xe8d8ff,
    glow: 0xc8a0ff,
    style: "tower",
  },
  library: {
    wallTop: 0xc8a868,
    wallLeft: 0xa88040,
    wallRight: 0x785c28,
    roofLeft: 0x6a5030,
    roofRight: 0x4e3820,
    accent: 0xffe0a0,
    glow: 0xffd070,
    style: "dome",
  },
  iron_forge: {
    wallTop: 0xb0b8c4,
    wallLeft: 0x889098,
    wallRight: 0x60686e,
    roofLeft: 0x484e54,
    roofRight: 0x343840,
    accent: 0xff8840,
    glow: 0xff6020,
    style: "chimney",
  },
  barracks: {
    wallTop: 0xd87070,
    wallLeft: 0xa84848,
    wallRight: 0x7a3030,
    roofLeft: 0x582020,
    roofRight: 0x3e1414,
    accent: 0xf8d0b0,
    glow: 0xff9060,
    style: "battlement",
  },
  observatory: {
    wallTop: 0x90d4e4,
    wallLeft: 0x60a8ba,
    wallRight: 0x407a8e,
    roofLeft: 0x305870,
    roofRight: 0x203a50,
    accent: 0xd0f4ff,
    glow: 0x80e4ff,
    style: "dome",
  },
  market: {
    wallTop: 0xf0b860,
    wallLeft: 0xc88c38,
    wallRight: 0x986020,
    roofLeft: 0x784018,
    roofRight: 0x522808,
    accent: 0xffe090,
    glow: 0xffcc40,
    style: "awning",
  },
  wall: {
    wallTop: 0xd4dce4,
    wallLeft: 0xa4acb8,
    wallRight: 0x78828e,
    roofLeft: 0x585e66,
    roofRight: 0x404448,
    accent: 0xf0f4f8,
    glow: 0xe8eef4,
    style: "battlement",
  },
  monument: {
    wallTop: 0xf0ece4,
    wallLeft: 0xd0cac0,
    wallRight: 0xa8a09a,
    roofLeft: 0x888078,
    roofRight: 0x605a54,
    accent: 0xfff8e0,
    glow: 0xffe860,
    style: "spire",
  },
} as const;

type DefKey = keyof typeof BUILDING_DEFS;

function generateBuilding(g: G, key: DefKey) {
  const d = BUILDING_DEFS[key];
  g.clear();

  const cx = 64,
    canvasH = 128;

  // ── Shadow ────────────────────────────────────────────────────────────────
  g.fillStyle(0x000000, 0.14);
  g.fillEllipse(cx, canvasH - 18, 82, 24);
  g.fillStyle(0x000000, 0.1);
  g.fillEllipse(cx, canvasH - 22, 56, 14);

  // ── Foundation platform ───────────────────────────────────────────────────
  isoBox(g, cx, 94, 42, 15, 9, 0x9a8a78, 0x72665a, 0x564e44);

  // Stone detail
  g.lineStyle(1, 0x706050, 0.2);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 22, 91, cx + 22, 86));

  // ── Main building body ────────────────────────────────────────────────────
  const bCy = 85,
    bHW = 36,
    bHH = 14,
    bWallH = 44;

  g.fillStyle(d.wallLeft, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx - bHW, bCy),
      new Phaser.Geom.Point(cx, bCy + bHH),
      new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
      new Phaser.Geom.Point(cx - bHW, bCy - bWallH),
    ],
    true
  );

  g.fillStyle(d.wallRight, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(cx, bCy + bHH),
      new Phaser.Geom.Point(cx + bHW, bCy),
      new Phaser.Geom.Point(cx + bHW, bCy - bWallH),
      new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
    ],
    true
  );

  isoDiamond(g, cx, bCy - bWallH, bHW, bHH, d.wallTop);

  // Top edge highlight
  g.lineStyle(1, tintColor(d.wallTop, 0.25), 0.4);
  g.strokeLineShape(
    new Phaser.Geom.Line(cx - bHW, bCy - bWallH, cx, bCy + bHH - bWallH)
  );

  // ── Window on left wall ───────────────────────────────────────────────────
  const winX = cx - 22,
    winY = bCy - 20;
  g.fillStyle(0x0a0808, 0.9);
  g.fillRect(winX - 5, winY - 10, 10, 14);
  g.fillCircle(winX, winY - 10, 5);
  g.fillStyle(d.glow, 0.82);
  g.fillRect(winX - 3, winY - 8, 6, 10);
  g.fillCircle(winX, winY - 8, 3);
  // mullion
  g.fillStyle(0x0a0808, 0.6);
  g.fillRect(winX - 3, winY - 3, 6, 1);

  // Window on right wall (dimmer)
  const rWinX = cx + 22,
    rWinY = bCy - 20;
  g.fillStyle(0x080606, 0.9);
  g.fillRect(rWinX - 5, rWinY - 10, 10, 14);
  g.fillCircle(rWinX, rWinY - 10, 5);
  g.fillStyle(tintColor(d.glow, -0.2), 0.6);
  g.fillRect(rWinX - 3, rWinY - 8, 6, 10);
  g.fillCircle(rWinX, rWinY - 8, 3);

  // ── Style-specific roof / top feature ─────────────────────────────────────
  const eCy = bCy - bWallH;
  const eHW = bHW + 4,
    eHH = bHH + 3;

  if (d.style === "tower" || d.style === "spire") {
    // Tall peaked top
    const peakY = eCy - 46;
    hippedRoof(
      g,
      cx,
      eCy,
      eHW,
      eHH,
      cx,
      peakY,
      d.roofLeft,
      d.roofRight,
      tintColor(d.roofRight, 0.05)
    );
    // Spire finial
    g.fillStyle(d.accent, 0.9);
    g.fillTriangle(cx - 4, peakY, cx + 4, peakY, cx, peakY - 14);
    // Glow at tip
    g.fillStyle(d.glow, 0.5);
    g.fillCircle(cx, peakY - 14, 3);
  } else if (d.style === "dome") {
    // Rounded dome approximated with stacked ellipses
    const domeBaseY = eCy - 4;
    // Dome body (6 ellipses stacked to fake a curve)
    for (let i = 0; i < 6; i++) {
      const progress = i / 6;
      const domeW = eHW * 2 * (1 - progress * 0.55);
      const domeH = eHH * 2 * (1 - progress * 0.6);
      const domeColor = tintColor(d.roofLeft, progress * 0.3);
      g.fillStyle(domeColor, 1);
      g.fillEllipse(cx, domeBaseY - i * 5, domeW, domeH);
    }
    // Dome tip knob
    g.fillStyle(d.accent, 0.9);
    g.fillCircle(cx, domeBaseY - 30, 4);
    g.fillStyle(d.glow, 0.5);
    g.fillCircle(cx, domeBaseY - 34, 2);
  } else if (d.style === "battlement") {
    // Flat roof with crenellations
    hippedRoof(
      g,
      cx,
      eCy,
      eHW,
      eHH,
      cx,
      eCy - 18,
      d.roofLeft,
      d.roofRight,
      tintColor(d.roofRight, 0.05)
    );
    // Merlons along parapet
    const mY = eCy - 18;
    for (let m = -2; m <= 2; m++) {
      g.fillStyle(d.wallLeft, 1);
      g.fillRect(cx + m * 10 - 3, mY - 10, 6, 8);
    }
  } else if (d.style === "chimney") {
    // Industrial: flat roof + chimney stacks
    hippedRoof(
      g,
      cx,
      eCy,
      eHW,
      eHH,
      cx,
      eCy - 20,
      d.roofLeft,
      d.roofRight,
      tintColor(d.roofRight, 0.05)
    );
    // Two chimneys
    for (const chx of [cx - 14, cx + 10]) {
      g.fillStyle(tintColor(d.wallLeft, -0.1), 1);
      g.fillRect(chx - 4, eCy - 36, 8, 18);
      g.fillStyle(0x181010, 1);
      g.fillRect(chx - 5, eCy - 38, 10, 5);
      // Smoke glow
      g.fillStyle(d.glow, 0.22);
      g.fillCircle(chx, eCy - 42, 6);
      g.fillStyle(d.glow, 0.12);
      g.fillCircle(chx + 2, eCy - 48, 4);
    }
  } else if (d.style === "awning") {
    // Market: roof + colorful awning overhang at front
    hippedRoof(
      g,
      cx,
      eCy,
      eHW,
      eHH,
      cx,
      eCy - 22,
      d.roofLeft,
      d.roofRight,
      tintColor(d.roofRight, 0.05)
    );
    // Awning strips on left wall
    for (let s = 0; s < 3; s++) {
      const aColor = s % 2 === 0 ? d.accent : tintColor(d.roofLeft, 0.1);
      const ay = bCy - 12 + s * 8;
      g.fillStyle(aColor, 0.85);
      g.fillPoints(
        [
          new Phaser.Geom.Point(cx - bHW, ay),
          new Phaser.Geom.Point(cx, ay + bHH * 0.45),
          new Phaser.Geom.Point(cx, ay + bHH * 0.45 + 5),
          new Phaser.Geom.Point(cx - bHW - 3, ay + 5),
        ],
        true
      );
    }
  }

  // ── Type-specific accent detail ───────────────────────────────────────────
  if (key === "arcane_tower") {
    // Glowing rune circle on left wall
    g.lineStyle(1, d.glow, 0.45);
    g.strokeCircle(cx - 22, bCy - 26, 8);
    g.fillStyle(d.glow, 0.15);
    g.fillCircle(cx - 22, bCy - 26, 8);
  } else if (key === "monument") {
    // Carved inscription lines
    g.lineStyle(1, 0xfff8d0, 0.3);
    for (let l = 0; l < 4; l++) {
      g.strokeLineShape(
        new Phaser.Geom.Line(
          cx - 20,
          bCy - 14 - l * 7,
          cx - 8,
          bCy - 14 - l * 7 - 3
        )
      );
    }
  } else if (key === "barracks") {
    // Banner hanging on left wall
    g.fillStyle(0xb82020, 0.9);
    g.fillRect(cx - 30, bCy - 34, 8, 14);
    g.fillStyle(0xff8040, 0.7);
    g.fillRect(cx - 29, bCy - 33, 6, 6);
  }

  g.generateTexture(key, 128, 128);
}

// ─── Prop textures (unchanged core props + improvements) ─────────────────────

function generatePropTextures(g: G) {
  // ── prop-tree (96×96) — grass-blade cluster ──────────────────────────────
  g.clear();
  // Ground shadow
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(48, 84, 64, 16);
  // Back blades — dark, create depth
  g.fillStyle(0x3a6228, 0.85);
  g.fillTriangle(20, 78, 18, 36, 26, 78);
  g.fillTriangle(70, 78, 78, 38, 74, 78);
  g.fillTriangle(44, 78, 40, 20, 50, 78);
  g.fillTriangle(54, 78, 58, 22, 60, 78);
  // Mid blades — main mass
  g.fillStyle(0x508040, 1);
  g.fillTriangle(30, 78, 26, 16, 36, 78);
  g.fillTriangle(62, 78, 70, 18, 68, 78);
  g.fillTriangle(48, 78, 44, 6, 54, 78);
  // Front blades — lighter, add body
  g.fillStyle(0x6cb050, 0.9);
  g.fillTriangle(10, 78, 8, 50, 16, 78);
  g.fillTriangle(80, 78, 88, 52, 86, 78);
  g.fillTriangle(36, 78, 32, 28, 42, 78);
  g.fillTriangle(60, 78, 64, 30, 56, 78);
  // Sunlit tip glints
  g.fillStyle(0x98d865, 0.55);
  g.fillCircle(29, 20, 4);
  g.fillCircle(49, 10, 5);
  g.fillCircle(69, 22, 4);
  g.fillCircle(11, 52, 3);
  g.fillCircle(85, 54, 3);
  // Ground mat — anchors blades to terrain
  g.fillStyle(0x3e6a2e, 0.5);
  g.fillEllipse(48, 76, 70, 18);
  g.generateTexture("prop-tree", 96, 96);

  // ── prop-tree-b (96×96) — asymmetric grass-blade variant ─────────────────
  g.clear();
  // Ground shadow
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(46, 84, 60, 14);
  // Back blades
  g.fillStyle(0x3a6228, 0.85);
  g.fillTriangle(16, 78, 14, 40, 22, 78);
  g.fillTriangle(64, 78, 72, 30, 68, 78);
  g.fillTriangle(40, 78, 38, 18, 46, 78);
  g.fillTriangle(58, 78, 62, 26, 64, 78);
  // Mid blades
  g.fillStyle(0x4e7e3e, 1);
  g.fillTriangle(26, 78, 22, 12, 32, 78);
  g.fillTriangle(66, 78, 74, 22, 72, 78);
  g.fillTriangle(46, 78, 42, 4, 52, 78);
  // Front lighter blades
  g.fillStyle(0x68a84c, 0.9);
  g.fillTriangle(34, 78, 30, 22, 40, 78);
  g.fillTriangle(58, 78, 62, 24, 54, 78);
  g.fillTriangle(12, 78, 8, 56, 16, 78);
  g.fillTriangle(76, 78, 84, 50, 80, 78);
  // Tip highlights
  g.fillStyle(0x90cc60, 0.5);
  g.fillCircle(25, 16, 4);
  g.fillCircle(47, 8, 4);
  g.fillCircle(71, 26, 3);
  // Ground mat
  g.fillStyle(0x3a6228, 0.45);
  g.fillEllipse(46, 74, 66, 16);
  g.generateTexture("prop-tree-b", 96, 96);

  // ── prop-stones (56×56) — small pebble cluster ───────────────────────────
  g.clear();
  // Ground shadow
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(28, 50, 46, 11);
  // Back-left pebble (dark, receding)
  g.fillStyle(0x6a6860, 1);
  g.fillEllipse(14, 36, 16, 10);
  g.fillStyle(0x848280, 0.7);
  g.fillEllipse(12, 34, 10, 6);
  // Center pebble (main, largest)
  g.fillStyle(0x7c7a72, 1);
  g.fillEllipse(30, 32, 22, 14);
  g.fillStyle(0x9a9890, 1);
  g.fillEllipse(27, 29, 16, 10);
  g.fillStyle(0xb8b6ae, 0.55);
  g.fillEllipse(24, 27, 8, 5);
  // Right pebble (medium)
  g.fillStyle(0x72706a, 1);
  g.fillEllipse(44, 37, 16, 10);
  g.fillStyle(0x908e88, 0.8);
  g.fillEllipse(43, 35, 10, 6);
  // Tiny foreground pebbles
  g.fillStyle(0x8a8880, 0.9);
  g.fillEllipse(20, 44, 9, 6);
  g.fillEllipse(36, 44, 8, 5);
  g.fillStyle(0xb0aea8, 0.45);
  g.fillEllipse(20, 42, 5, 3);
  g.fillEllipse(36, 43, 4, 3);
  g.generateTexture("prop-stones", 56, 56);

  // ── prop-stone-b (48×48) — two-pebble variant ────────────────────────────
  g.clear();
  // Ground shadow
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(24, 43, 40, 10);
  // Left pebble
  g.fillStyle(0x706e68, 1);
  g.fillEllipse(15, 32, 18, 11);
  g.fillStyle(0x908e88, 0.9);
  g.fillEllipse(13, 30, 12, 7);
  g.fillStyle(0xb2b0aa, 0.5);
  g.fillEllipse(11, 28, 6, 4);
  // Right pebble (slightly smaller, forward)
  g.fillStyle(0x767470, 1);
  g.fillEllipse(33, 34, 16, 10);
  g.fillStyle(0x949290, 0.85);
  g.fillEllipse(32, 32, 10, 6);
  g.fillStyle(0xb4b2ac, 0.45);
  g.fillEllipse(31, 30, 5, 3);
  // Tiny front accent pebbles
  g.fillStyle(0x8c8a84, 0.9);
  g.fillEllipse(24, 40, 10, 6);
  g.fillEllipse(10, 39, 7, 4);
  g.fillEllipse(38, 40, 6, 4);
  g.generateTexture("prop-stone-b", 48, 48);

  // ── prop-bush (52×52) ─────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(26, 47, 40, 12);
  g.fillStyle(0x1e4228, 1);
  g.fillCircle(26, 30, 18);
  g.fillStyle(0x2d5e38, 0.95);
  g.fillCircle(16, 27, 13);
  g.fillCircle(36, 27, 13);
  g.fillStyle(0x3d7244, 1);
  g.fillCircle(26, 20, 12);
  g.fillStyle(0x62a86a, 0.52);
  g.fillCircle(21, 16, 7);
  g.fillStyle(0xc04848, 0.7);
  g.fillCircle(30, 23, 2);
  g.fillCircle(22, 26, 2);
  g.generateTexture("prop-bush", 52, 52);

  // ── prop-flower (28×28) ───────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x3e6e28, 1);
  g.fillRect(10, 14, 2, 10);
  g.fillRect(15, 12, 2, 12);
  g.fillRect(20, 15, 2, 9);
  g.fillStyle(0xe8c040, 0.9);
  g.fillCircle(11, 12, 4);
  g.fillStyle(0xfff080, 0.6);
  g.fillCircle(11, 12, 2);
  g.fillStyle(0xd060c0, 0.9);
  g.fillCircle(16, 10, 4);
  g.fillStyle(0xf8a8f0, 0.6);
  g.fillCircle(16, 10, 2);
  g.fillStyle(0xf8f8f8, 0.88);
  g.fillCircle(21, 13, 3);
  g.fillStyle(0xffff80, 0.7);
  g.fillCircle(21, 13, 1);
  g.fillStyle(0x4a7830, 0.5);
  g.fillEllipse(15, 23, 22, 6);
  g.generateTexture("prop-flower", 28, 28);

  // ── prop-grass-tuft (36×36) ───────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x3e6a2e, 0.8);
  g.fillTriangle(8, 28, 6, 8, 12, 28);
  g.fillTriangle(26, 28, 24, 10, 30, 28);
  g.fillStyle(0x52884a, 1);
  g.fillTriangle(14, 28, 12, 6, 18, 28);
  g.fillStyle(0x60a058, 0.95);
  g.fillTriangle(19, 28, 17, 4, 24, 28);
  g.fillStyle(0x88d070, 0.45);
  g.fillCircle(15, 7, 2);
  g.fillCircle(20, 5, 2);
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(18, 29, 26, 6);
  g.generateTexture("prop-grass-tuft", 36, 36);

  // ── prop-grass-b (36×36) — mirrored/rotated variant for variety ──────────
  g.clear();
  g.fillStyle(0x3a6628, 0.8);
  g.fillTriangle(28, 28, 30, 8, 24, 28);
  g.fillTriangle(10, 28, 12, 10, 6, 28);
  g.fillStyle(0x4e8244, 1);
  g.fillTriangle(22, 28, 24, 6, 18, 28);
  g.fillStyle(0x5a9850, 0.95);
  g.fillTriangle(17, 28, 19, 4, 12, 28);
  g.fillStyle(0x80c865, 0.45);
  g.fillCircle(21, 7, 2);
  g.fillCircle(16, 5, 2);
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(18, 29, 26, 6);
  g.generateTexture("prop-grass-b", 36, 36);

  // ── prop-banner ───────────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x4a3322, 1);
  g.fillRect(28, 18, 5, 32);
  g.fillStyle(0xc9581a, 1);
  g.fillTriangle(33, 18, 52, 28, 33, 36);
  g.fillStyle(0xffdb9b, 0.8);
  g.fillTriangle(33, 22, 46, 28, 33, 32);
  g.generateTexture("prop-banner", 64, 64);

  // ── prop-ruins ────────────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x081019, 0.25);
  g.fillEllipse(32, 52, 46, 16);
  g.fillStyle(0x5f6974, 0.9);
  g.fillRect(16, 32, 10, 12);
  g.fillRect(28, 26, 10, 18);
  g.fillRect(40, 34, 8, 10);
  g.fillStyle(0x9aa7b4, 0.35);
  g.fillRect(16, 28, 32, 4);
  g.generateTexture("prop-ruins", 64, 64);

  // ── prop-beacon ───────────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x081019, 0.22);
  g.fillEllipse(32, 54, 40, 14);
  g.fillStyle(0x102438, 0.92);
  g.fillRect(28, 22, 8, 26);
  g.fillStyle(0xe07030, 0.96);
  g.fillRect(30, 16, 4, 8);
  g.fillStyle(0xf8c08a, 0.26);
  g.fillEllipse(32, 16, 18, 10);
  g.generateTexture("prop-beacon", 64, 64);

  // ── prop-log (56×32) ──────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(28, 28, 52, 10);
  g.fillStyle(0x5a3c1a, 1);
  g.fillEllipse(28, 18, 50, 14);
  g.fillStyle(0x6e4c24, 1);
  g.fillEllipse(50, 18, 12, 14);
  g.lineStyle(1, 0x3a2010, 0.5);
  g.strokeCircle(50, 18, 4);
  g.strokeCircle(50, 18, 2);
  g.lineStyle(1, 0x3e2812, 0.4);
  g.strokeLineShape(new Phaser.Geom.Line(10, 16, 46, 14));
  g.strokeLineShape(new Phaser.Geom.Line(10, 20, 46, 18));
  g.fillStyle(0x406030, 0.6);
  g.fillEllipse(20, 13, 12, 5);
  g.fillEllipse(35, 15, 9, 4);
  g.fillStyle(0x8a6030, 0.3);
  g.fillEllipse(22, 14, 18, 5);
  g.generateTexture("prop-log", 56, 32);
}

// ─── Boot scene ───────────────────────────────────────────────────────────────

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    const g = this.make.graphics();

    // Town hall gets its own rich dedicated generator
    generateTownHall(g);

    // All other building types
    const otherTypes: DefKey[] = [
      "arcane_tower",
      "library",
      "iron_forge",
      "barracks",
      "observatory",
      "market",
      "wall",
      "monument",
    ];
    for (const key of otherTypes) {
      generateBuilding(g, key);
    }

    generatePropTextures(g);
    g.destroy();
  }

  create(): void {
    this.scene.start("KingdomScene");
  }
}
