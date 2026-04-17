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

// ─── Town Hall (256×280) ──────────────────────────────────────────────────────
// Grand royal palace spanning 4 grid tiles (2×2 footprint).
// Foundation spans ~2 tile widths. Bottom-centre anchor = canvas (128, 280).
// Ground contact (foundation south corner) ≈ canvas y=271.

function generateTownHall(g: G) {
  g.clear();
  const cx = 128;

  // ── Foundation: 3 grand white marble tiers ────────────────────────────────
  // Tier 1 — widest base
  isoBox(g, cx, 224, 88, 33, 14, 0xd4d0c8, 0xb4b0a8, 0x8e8a84);
  g.lineStyle(1, 0xd4a828, 0.30);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 88, 224, cx, 257));
  g.strokeLineShape(new Phaser.Geom.Line(cx, 257, cx + 88, 224));
  // Base frieze — gold leaf engravings
  g.lineStyle(1, 0xffe060, 0.22);
  for (let f = 0; f < 9; f++) {
    const fx = cx - 76 + f * 17;
    g.strokeLineShape(new Phaser.Geom.Line(fx, 228, fx + 8, 226));
  }
  // Rosette medallions on tier 1 left face
  for (let r = 0; r < 4; r++) {
    const rx = cx - 72 + r * 18, ry = 238;
    g.lineStyle(1, 0xffd040, 0.40); g.strokeCircle(rx, ry, 4.5);
    g.fillStyle(0xffd040, 0.22); g.fillCircle(rx, ry, 4.5);
    g.fillStyle(0xffe880, 0.60); g.fillCircle(rx, ry, 2);
  }

  // Tier 2
  isoBox(g, cx, 206, 74, 28, 12, 0xe4e0d8, 0xc4c0b8, 0xa09c96);
  g.lineStyle(1, 0xd4a828, 0.35);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 74, 206, cx, 234));
  g.strokeLineShape(new Phaser.Geom.Line(cx, 234, cx + 74, 206));
  // Tier 2 baluster caps
  g.fillStyle(0xffd040, 0.35);
  for (let b = 0; b < 6; b++) { g.fillRect(cx - 60 + b * 12, 208, 6, 4); }

  // Tier 3 — finest white marble
  isoBox(g, cx, 192, 60, 23, 10, 0xf4f0e8, 0xd4d0c8, 0xb0aca4);
  g.lineStyle(1, 0xe8c040, 0.44);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 60, 192, cx, 215));
  g.strokeLineShape(new Phaser.Geom.Line(cx, 215, cx + 60, 192));
  // Inscription panel on tier 3 left face
  g.fillStyle(0xc8b890, 0.18); g.fillRect(cx - 50, 199, 22, 13);
  g.lineStyle(1, 0xfff8e0, 0.32);
  for (let l = 0; l < 4; l++) { g.strokeLineShape(new Phaser.Geom.Line(cx - 48, 201 + l * 3, cx - 32, 200 + l * 3)); }
  // Gold crown emblem on tier 3
  g.fillStyle(0xd4a828, 0.52); g.fillTriangle(cx - 16, 201, cx - 8, 201, cx - 12, 196);
  g.fillStyle(0xffe060, 0.72); g.fillRect(cx - 17, 200, 9, 3);
  g.fillStyle(0xffd040, 0.80);
  for (const ox of [-14, -12, -10] as number[]) { g.fillCircle(cx + ox, 198, 1.5); }

  // ── Corner towers NW + NE (drawn before main body — painter's order) ──────
  const ctHW = 11, ctHH = 6;
  const towerDef = (tx: number, tyCen: number, tH: number, dimRight: boolean) => {
    // Walls
    g.fillStyle(0xf0ece4, 1);
    g.fillPoints([new Phaser.Geom.Point(tx - ctHW, tyCen), new Phaser.Geom.Point(tx, tyCen + ctHH), new Phaser.Geom.Point(tx, tyCen + ctHH - tH), new Phaser.Geom.Point(tx - ctHW, tyCen - tH)], true);
    g.fillStyle(0xc8c4bc, 1);
    g.fillPoints([new Phaser.Geom.Point(tx, tyCen + ctHH), new Phaser.Geom.Point(tx + ctHW, tyCen), new Phaser.Geom.Point(tx + ctHW, tyCen - tH), new Phaser.Geom.Point(tx, tyCen + ctHH - tH)], true);
    isoDiamond(g, tx, tyCen - tH, ctHW, ctHH, 0xfaf6ee);
    // Gold banding (2 rings)
    for (const off of [28, 54] as number[]) {
      g.fillStyle(0xd4a828, 0.44); g.fillRect(tx - ctHW, tyCen - off, ctHW, 3);
      g.fillStyle(0xb08820, 0.34); g.fillRect(tx, tyCen - off, ctHW, 3);
    }
    // Tower window
    const wx = dimRight ? tx + 1 : tx - ctHW + 2, wy = tyCen - 42;
    g.fillStyle(0x100806, 1); g.fillRect(wx, wy, 5, 13); g.fillCircle(wx + 2, wy, 2.5);
    g.fillStyle(dimRight ? 0xd4a030 : 0xffd060, dimRight ? 0.62 : 0.82); g.fillRect(wx + 1, wy + 2, 3, 9);
    // Gold spire
    const tTop = tyCen - tH, tPeak = tTop - 22;
    g.fillStyle(0xd8a828, 1); g.fillPoints([new Phaser.Geom.Point(tx - ctHW - 2, tTop), new Phaser.Geom.Point(tx, tTop + ctHH + 2), new Phaser.Geom.Point(tx, tPeak)], true);
    g.fillStyle(0x9a7010, 1); g.fillPoints([new Phaser.Geom.Point(tx, tTop + ctHH + 2), new Phaser.Geom.Point(tx + ctHW + 2, tTop), new Phaser.Geom.Point(tx, tPeak)], true);
    g.lineStyle(1, 0xf0c838, 0.44); g.strokeLineShape(new Phaser.Geom.Line(tx - ctHW - 2, tTop, tx, tPeak));
    g.fillStyle(0xffe060, 0.92); g.fillCircle(tx, tPeak, 3);
    // Tower flag
    g.lineStyle(1, 0x4a3018, 1); g.strokeLineShape(new Phaser.Geom.Line(tx, tPeak, tx, tPeak - 14));
    g.fillStyle(0xe83018, 0.90); g.fillTriangle(tx, tPeak - 14, tx + 12, tPeak - 8, tx, tPeak - 2);
    g.fillStyle(0xff6040, 0.50); g.fillTriangle(tx, tPeak - 13, tx + 9, tPeak - 8, tx, tPeak - 3);
    g.fillStyle(0xffd040, 1); g.fillCircle(tx, tPeak - 14, 1.8);
  };
  towerDef(80,  178, 78, false); // NW tower
  towerDef(176, 178, 78, true);  // NE tower

  // ── Main palace body ──────────────────────────────────────────────────────
  const bCy = 182, bHW = 54, bHH = 20, bWallH = 70;

  // Left face — sunlit warm white marble
  g.fillStyle(0xfaf0dc, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - bHW, bCy),
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
    new Phaser.Geom.Point(cx - bHW, bCy - bWallH),
  ], true);
  // Right face — marble in shade
  g.fillStyle(0xd0c8a8, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx + bHW, bCy),
    new Phaser.Geom.Point(cx + bHW, bCy - bWallH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
  ], true);
  isoDiamond(g, cx, bCy - bWallH, bHW, bHH, 0xfef8ec);

  // Gold cornice with dentil detail across top of walls
  g.fillStyle(0xe8c040, 0.55); g.fillRect(cx - bHW, bCy - bWallH - 5, bHW, 6);
  g.fillStyle(0xb08820, 0.42); g.fillRect(cx, bCy - bWallH - 5, bHW, 6);
  for (let d = 0; d < 9; d++) { g.fillStyle(0xffd040, 0.52); g.fillRect(cx - bHW + 4 + d * 7, bCy - bWallH - 4, 4, 3); }

  // Colonnade: 5 marble columns on left face with gold capitals + bases
  for (let p = 0; p < 5; p++) {
    const px = cx - bHW + 10 + p * 11;
    g.fillStyle(0xfff8e8, 0.72); g.fillRect(px - 2, bCy - bWallH + 4, 3, bWallH - 8);
    g.fillStyle(0xc8a840, 0.46); g.fillRect(px + 1, bCy - bWallH + 4, 2, bWallH - 8);
    g.fillStyle(0xffd040, 0.60); g.fillRect(px - 3, bCy - bWallH - 1, 7, 4);
    g.fillStyle(0xffd040, 0.48); g.fillRect(px - 3, bCy - 5, 7, 4);
  }

  // Gold string course at mid-wall
  const scY = bCy - Math.floor(bWallH * 0.52);
  g.fillStyle(0xd4a828, 0.50); g.fillRect(cx - bHW, scY, bHW, 4);
  g.fillStyle(0xb08820, 0.38); g.fillRect(cx, scY + 1, bHW, 4);

  // Windows left face — 4 tall arched, amber-gold glow
  for (const [wx, wy] of [[cx - 46, bCy - 22], [cx - 34, bCy - 14], [cx - 20, bCy - 8], [cx - 8, bCy - 2]] as [number, number][]) {
    g.fillStyle(0x1a1006, 1); g.fillRect(wx - 5, wy - 22, 10, 22); g.fillCircle(wx, wy - 22, 5);
    g.fillStyle(0xffd060, 0.90); g.fillRect(wx - 3, wy - 20, 6, 18); g.fillCircle(wx, wy - 20, 3);
    g.fillStyle(0xffee90, 0.40); g.fillRect(wx - 1, wy - 20, 3, 9);
    g.fillStyle(0x1a1006, 0.58); g.fillRect(wx - 3, wy - 11, 6, 1); g.fillRect(wx, wy - 20, 1, 18);
  }
  // Windows right face — 3 (dim warm gold)
  for (const [wx, wy] of [[cx + 10, bCy - 8], [cx + 28, bCy - 18], [cx + 42, bCy - 26]] as [number, number][]) {
    g.fillStyle(0x120c04, 1); g.fillRect(wx - 4, wy - 20, 9, 20); g.fillCircle(wx + 0.5, wy - 20, 4.5);
    g.fillStyle(0xd4a030, 0.68); g.fillRect(wx - 2, wy - 18, 5, 16); g.fillCircle(wx + 0.5, wy - 18, 2.5);
    g.fillStyle(0x120c04, 0.52); g.fillRect(wx - 2, wy - 10, 5, 1);
  }

  // Grand arched entrance — portcullis + royal crest
  const dX = cx, dY = bCy + bHH - 4;
  g.fillStyle(0x120806, 1); g.fillRect(dX - 14, dY - 32, 28, 32); g.fillCircle(dX, dY - 32, 14);
  // Portcullis grid
  g.lineStyle(1, 0x282010, 0.58);
  for (let pk = -2; pk <= 2; pk++) { g.strokeLineShape(new Phaser.Geom.Line(dX + pk * 5, dY - 30, dX + pk * 5, dY - 2)); }
  for (let pr = 0; pr < 4; pr++) { g.strokeLineShape(new Phaser.Geom.Line(dX - 12, dY - 7 - pr * 7, dX + 12, dY - 7 - pr * 7)); }
  // Interior warmth glow
  g.fillStyle(0xff9820, 0.28); g.fillCircle(dX, dY - 18, 12);
  g.fillStyle(0xffc040, 0.22); g.fillCircle(dX, dY - 22, 7);
  // Gold arch frame
  g.lineStyle(2, 0xd4a828, 0.68); g.strokeRect(dX - 15, dY - 33, 30, 34);
  // Royal crown crest above arch — 3 points + circle emblem
  g.fillStyle(0xd4a828, 0.72); g.fillTriangle(dX - 12, dY - 36, dX + 12, dY - 36, dX, dY - 48);
  g.fillStyle(0xffe060, 0.52); g.fillTriangle(dX - 8, dY - 36, dX + 8, dY - 36, dX, dY - 46);
  for (const ox of [-10, 0, 10] as number[]) { g.fillStyle(0xffd040, 0.82); g.fillCircle(dX + ox, dY - 36, 2.5); }
  g.lineStyle(1, 0xffd840, 0.58); g.strokeCircle(dX, dY - 42, 3.5);
  g.fillStyle(0xfff0a0, 0.65); g.fillCircle(dX, dY - 42, 1.8);

  // ── Golden tiled hipped roof ───────────────────────────────────────────────
  const eCy = bCy - bWallH, eHW = bHW + 8, eHH = bHH + 6;
  const peakY = eCy - 34; // = 78
  hippedRoof(g, cx, eCy, eHW, eHH, cx, peakY, 0xd8a828, 0x9a7010, 0xbc9020);
  g.lineStyle(2, 0xf0c838, 0.46); g.strokeLineShape(new Phaser.Geom.Line(cx - eHW, eCy, cx, peakY));
  // Eave gold trim diamond edge
  g.lineStyle(2, 0xd4a828, 0.54);
  g.strokePoints([
    new Phaser.Geom.Point(cx, eCy - eHH),
    new Phaser.Geom.Point(cx + eHW, eCy),
    new Phaser.Geom.Point(cx, eCy + eHH),
    new Phaser.Geom.Point(cx - eHW, eCy),
  ], true);
  // Roof tile scale lines
  g.lineStyle(1, 0xb88010, 0.24);
  for (let t = 0; t < 4; t++) {
    const ty = eCy - 10 - t * 9, tw = eHW * (1 - t * 0.20);
    g.strokeLineShape(new Phaser.Geom.Line(cx - tw, ty, cx + tw, ty));
  }
  // Dormer window glows on left slope
  for (const [dox, doy] of [[cx - eHW * 0.52, eCy - 9], [cx - eHW * 0.22, eCy - 20]] as [number, number][]) {
    g.fillStyle(0xffd060, 0.44); g.fillCircle(dox, doy, 4);
    g.fillStyle(0xffee90, 0.28); g.fillCircle(dox, doy, 2.5);
  }

  // ── Central grand tower ───────────────────────────────────────────────────
  const tCy = peakY + 6, tHW = 18, tHH = 8, tWallH = 36;
  // Left face
  g.fillStyle(0xf8f2e4, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - tHW, tCy),
    new Phaser.Geom.Point(cx, tCy + tHH),
    new Phaser.Geom.Point(cx, tCy + tHH - tWallH),
    new Phaser.Geom.Point(cx - tHW, tCy - tWallH),
  ], true);
  // Right face
  g.fillStyle(0xc8be9c, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, tCy + tHH),
    new Phaser.Geom.Point(cx + tHW, tCy),
    new Phaser.Geom.Point(cx + tHW, tCy - tWallH),
    new Phaser.Geom.Point(cx, tCy + tHH - tWallH),
  ], true);
  isoDiamond(g, cx, tCy - tWallH, tHW, tHH, 0xfdf8ee);
  // 3 gold banding rings on tower
  for (let tb = 1; tb <= 3; tb++) {
    const tby = tCy - Math.floor(tWallH * tb / 4);
    g.fillStyle(0xe8c040, 0.52); g.fillRect(cx - tHW, tby, tHW, 3);
    g.fillStyle(0xb08820, 0.40); g.fillRect(cx, tby + 1, tHW, 3);
  }
  // Tower windows (arched, bright gold-lit)
  for (const [wx, wy] of [[cx - 13, tCy - 16], [cx - 7, tCy - 28]] as [number, number][]) {
    g.fillStyle(0x100806, 1); g.fillRect(wx - 3, wy - 12, 6, 12); g.fillCircle(wx, wy - 12, 3);
    g.fillStyle(0xffd060, 0.92); g.fillRect(wx - 2, wy - 10, 4, 9); g.fillCircle(wx, wy - 10, 2);
    g.fillStyle(0xffee90, 0.38); g.fillRect(wx - 1, wy - 10, 2, 5);
  }
  g.fillStyle(0x0c0604, 1); g.fillRect(cx + 8, tCy - 22, 5, 12); g.fillCircle(cx + 10, tCy - 22, 2.5);
  g.fillStyle(0xd4a030, 0.62); g.fillRect(cx + 9, tCy - 20, 3, 9);
  // Royal crenellations — 3 gold-tipped merlons
  const tcTop = tCy - tWallH;
  for (let m = -1; m <= 1; m++) {
    g.fillStyle(0xf8f0e0, 1); g.fillRect(cx + m * 9 - 3, tcTop - 10, 5, 9);
    g.fillStyle(0xffe060, 0.52); g.fillRect(cx + m * 9 - 3, tcTop - 10, 5, 2);
    g.fillStyle(0xd4a828, 0.40); g.fillRect(cx + m * 9 + 2, tcTop - 10, 2, 9);
    g.fillStyle(0xffd040, 0.85); g.fillCircle(cx + m * 9 - 1, tcTop - 10, 1.5);
  }

  // ── Grand central spire — gold with spiral stripe ──────────────────────────
  const sBase = tcTop, sHW = tHW + 3, sHH = tHH + 2;
  const sPeak = sBase - 24; // ≈ y=22
  g.fillStyle(0xd8a828, 1);
  g.fillPoints([new Phaser.Geom.Point(cx - sHW, sBase), new Phaser.Geom.Point(cx, sBase + sHH), new Phaser.Geom.Point(cx, sPeak)], true);
  g.fillStyle(0x9a7010, 1);
  g.fillPoints([new Phaser.Geom.Point(cx, sBase + sHH), new Phaser.Geom.Point(cx + sHW, sBase), new Phaser.Geom.Point(cx, sPeak)], true);
  g.lineStyle(1, 0xf0c838, 0.46); g.strokeLineShape(new Phaser.Geom.Line(cx - sHW, sBase, cx, sPeak));
  // Gold spiral stripe
  g.lineStyle(1, 0xffe060, 0.32);
  g.strokeLineShape(new Phaser.Geom.Line(cx - sHW * 0.72, sBase - 5, cx, sPeak + 8));
  g.strokeLineShape(new Phaser.Geom.Line(cx - sHW * 0.40, sBase - 14, cx, sPeak + 3));
  // Small side flag on spire base for grandeur
  g.lineStyle(1, 0x4a3018, 1); g.strokeLineShape(new Phaser.Geom.Line(cx - sHW - 2, sBase - 2, cx - sHW - 2, sBase - 16));
  g.fillStyle(0xc82818, 0.80); g.fillTriangle(cx - sHW - 2, sBase - 16, cx - sHW + 9, sBase - 10, cx - sHW - 2, sBase - 4);

  // ── Royal golden orb at spire peak ────────────────────────────────────────
  g.fillStyle(0xd4a820, 0.18); g.fillCircle(cx, sPeak - 2, 11);
  g.fillStyle(0xe8c030, 0.38); g.fillCircle(cx, sPeak - 2, 7);
  g.fillStyle(0xffd040, 0.68); g.fillCircle(cx, sPeak - 2, 4.5);
  g.fillStyle(0xffe870, 0.94); g.fillCircle(cx, sPeak - 2, 2.5);
  g.fillStyle(0xfffff0, 1.00); g.fillCircle(cx, sPeak - 2, 1.2);

  // ── Tall flagpole + royal banner at very top ───────────────────────────────
  g.lineStyle(2, 0x5c3c18, 1); g.strokeLineShape(new Phaser.Geom.Line(cx, sPeak - 7, cx, sPeak - 20));
  g.fillStyle(0xe83018, 0.96); g.fillTriangle(cx, sPeak - 20, cx + 18, sPeak - 13, cx, sPeak - 7);
  g.fillStyle(0xff6040, 0.55); g.fillTriangle(cx, sPeak - 19, cx + 14, sPeak - 13, cx, sPeak - 8);
  // Crown finial at pole tip
  g.fillStyle(0xffd040, 1); g.fillCircle(cx, sPeak - 20, 2.5);

  g.generateTexture('town_hall', 256, 280);
}

// ─── Individual artistic building generators (128×128 each) ──────────────────

function generateArcane(g: G) {
  g.clear();
  const cx = 64;

  // Foundation — deep inscribed arcane stone
  isoBox(g, cx, 97, 38, 14, 8, 0x2a2060, 0x1c1448, 0x120e30);
  g.lineStyle(1, 0x7050d0, 0.40); g.strokeCircle(cx, 88, 15);
  g.lineStyle(1, 0x9070e0, 0.22); g.strokeCircle(cx, 88, 8);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    g.lineStyle(1, 0xc0a0ff, 0.18);
    g.strokeLineShape(new Phaser.Geom.Line(
      cx + Math.cos(a) * 6, 88 + Math.sin(a) * 3.5,
      cx + Math.cos(a) * 13, 88 + Math.sin(a) * 7.5
    ));
  }

  // Tall narrow tower body
  const bCy = 90, bHW = 20, bHH = 8, bWallH = 50;
  g.fillStyle(0x5040a8, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - bHW, bCy),
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
    new Phaser.Geom.Point(cx - bHW, bCy - bWallH),
  ], true);
  g.fillStyle(0x2c1e70, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx + bHW, bCy),
    new Phaser.Geom.Point(cx + bHW, bCy - bWallH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
  ], true);
  isoDiamond(g, cx, bCy - bWallH, bHW, bHH, 0x6858c0);

  // 3 architectural banding rings
  for (let b = 1; b <= 3; b++) {
    const by = bCy - Math.floor(bWallH * b / 4);
    g.fillStyle(0x8070e0, 0.40);
    g.fillPoints([
      new Phaser.Geom.Point(cx - bHW, by + 2),
      new Phaser.Geom.Point(cx, by + 7 + 2),
      new Phaser.Geom.Point(cx, by + 7),
      new Phaser.Geom.Point(cx - bHW, by),
    ], true);
    g.fillStyle(0x4030a0, 0.30);
    g.fillPoints([
      new Phaser.Geom.Point(cx, by + 7 + 2),
      new Phaser.Geom.Point(cx + bHW, by + 2),
      new Phaser.Geom.Point(cx + bHW, by),
      new Phaser.Geom.Point(cx, by + 7),
    ], true);
  }

  // Arched windows — bright glowing violet
  for (const wp of [[cx - 13, bCy - 16], [cx - 8, bCy - 34]] as [number, number][]) {
    const [wx, wy] = wp;
    g.fillStyle(0x100820, 1); g.fillRect(wx - 3, wy - 12, 6, 14); g.fillCircle(wx, wy - 12, 3);
    g.fillStyle(0xd0a0ff, 0.88); g.fillRect(wx - 2, wy - 10, 4, 10); g.fillCircle(wx, wy - 10, 2);
    g.fillStyle(0xffffff, 0.28); g.fillRect(wx - 1, wy - 10, 2, 5);
  }
  // Right wall window (dim)
  g.fillStyle(0x0a0614, 1); g.fillRect(cx + 8, bCy - 26, 5, 13); g.fillCircle(cx + 10, bCy - 26, 2.5);
  g.fillStyle(0x9060d0, 0.52); g.fillRect(cx + 9, bCy - 24, 3, 9);

  // Rune glyph — circle + tri-star on left wall
  g.lineStyle(1, 0xc0a0ff, 0.42); g.strokeCircle(cx - 11, bCy - 46, 5);
  g.lineStyle(1, 0xe0c0ff, 0.28);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 15, bCy - 42, cx - 7, bCy - 50));
  g.strokeLineShape(new Phaser.Geom.Line(cx - 15, bCy - 50, cx - 7, bCy - 42));
  g.strokeLineShape(new Phaser.Geom.Line(cx - 16, bCy - 46, cx - 6, bCy - 46));

  // Conical spire
  const eY = bCy - bWallH, eHW = bHW + 3, eHH = bHH + 2, peakY = eY - 28;
  g.fillStyle(0x4030a0, 1);
  g.fillPoints([new Phaser.Geom.Point(cx - eHW, eY), new Phaser.Geom.Point(cx, eY + eHH), new Phaser.Geom.Point(cx, peakY)], true);
  g.fillStyle(0x221870, 1);
  g.fillPoints([new Phaser.Geom.Point(cx, eY + eHH), new Phaser.Geom.Point(cx + eHW, eY), new Phaser.Geom.Point(cx, peakY)], true);
  g.lineStyle(1, 0x8070e0, 0.38); g.strokeLineShape(new Phaser.Geom.Line(cx - eHW, eY, cx, peakY));

  // Crystal orb at spire peak
  g.fillStyle(0xc0a0ff, 0.14); g.fillCircle(cx, peakY - 2, 9);
  g.fillStyle(0xe0c8ff, 0.34); g.fillCircle(cx, peakY - 2, 5);
  g.fillStyle(0xf4e8ff, 0.78); g.fillCircle(cx, peakY - 2, 3);
  g.fillStyle(0xffffff, 0.95); g.fillCircle(cx, peakY - 2, 1.5);

  // Floating magical wisps around tower top
  for (const wp of [[cx - 18, eY - 6, 0.30], [cx + 20, eY - 4, 0.24], [cx - 23, eY - 18, 0.18], [cx + 15, eY - 20, 0.20]] as [number, number, number][]) {
    g.fillStyle(0xa078ff, wp[2]); g.fillCircle(wp[0], wp[1], 2.5);
    g.fillStyle(0xd0b0ff, wp[2] * 0.45); g.fillCircle(wp[0], wp[1], 4.5);
  }

  g.generateTexture('arcane_tower', 128, 128);
}

function generateLibrary(g: G) {
  g.clear();
  const cx = 64;

  // Foundation — warm carved sandstone
  isoBox(g, cx, 96, 40, 15, 8, 0xc8a868, 0xa07c40, 0x785828);
  g.lineStyle(1, 0x705820, 0.22);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 22, 93, cx + 22, 88));
  g.lineStyle(1, 0xddc080, 0.16);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 32, 100, cx, 92));

  // Main body — wide noble sandstone
  const bCy = 87, bHW = 34, bHH = 13, bWallH = 40;
  g.fillStyle(0xe8d090, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - bHW, bCy),
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
    new Phaser.Geom.Point(cx - bHW, bCy - bWallH),
  ], true);
  g.fillStyle(0xa88040, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx + bHW, bCy),
    new Phaser.Geom.Point(cx + bHW, bCy - bWallH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
  ], true);
  isoDiamond(g, cx, bCy - bWallH, bHW, bHH, 0xf0e0a8);

  // Cornice band at top of walls
  g.fillStyle(0xfff0c0, 0.50); g.fillRect(cx - bHW, bCy - bWallH - 3, bHW, 4);
  g.fillStyle(0xb89040, 0.40); g.fillRect(cx, bCy - bWallH - 3, bHW, 4);

  // Classical pillar columns on left face (3 pillars)
  for (let p = 0; p < 3; p++) {
    const px = cx - bHW + 9 + p * 12;
    g.fillStyle(0xf8e8a8, 0.65); g.fillRect(px - 3, bCy - bWallH + 2, 3, bWallH - 6);
    g.fillStyle(0xb89048, 0.50); g.fillRect(px, bCy - bWallH + 2, 3, bWallH - 6);
    g.fillStyle(0xfff8d0, 0.55); g.fillRect(px - 4, bCy - bWallH - 1, 8, 3);
    g.fillStyle(0xfff8d0, 0.45); g.fillRect(px - 4, bCy - 4, 8, 3);
  }

  // Large arched windows — warm golden book-glow
  for (const wp of [[cx - 22, bCy - 14], [cx - 10, bCy - 8]] as [number, number][]) {
    const [wx, wy] = wp;
    g.fillStyle(0x1e120a, 1); g.fillRect(wx - 5, wy - 18, 10, 18); g.fillCircle(wx, wy - 18, 5);
    g.fillStyle(0xffd060, 0.88); g.fillRect(wx - 3, wy - 16, 6, 14); g.fillCircle(wx, wy - 16, 3);
    g.fillStyle(0xffee90, 0.35); g.fillRect(wx - 1, wy - 16, 3, 7);
    g.fillStyle(0x1e120a, 0.60); g.fillRect(wx - 3, wy - 9, 6, 1); g.fillRect(wx, wy - 16, 1, 14);
  }
  // Right wall window
  g.fillStyle(0x120c06, 1); g.fillRect(cx + 14, bCy - 14, 9, 16); g.fillCircle(cx + 18, bCy - 14, 4.5);
  g.fillStyle(0xd4a030, 0.65); g.fillRect(cx + 16, bCy - 12, 5, 12); g.fillCircle(cx + 18, bCy - 12, 2.5);

  // Hipped terracotta roof
  const eCy = bCy - bWallH, eHW = bHW + 5, eHH = bHH + 4, peakY = eCy - 22;
  hippedRoof(g, cx, eCy, eHW, eHH, cx, peakY, 0xc84828, 0x8c2c14, 0xa03c20);
  g.lineStyle(1, 0xe06040, 0.38); g.strokeLineShape(new Phaser.Geom.Line(cx - eHW, eCy, cx, peakY));
  // Eave edge line
  g.lineStyle(1, 0x6a1808, 0.45);
  g.strokePoints([
    new Phaser.Geom.Point(cx, eCy - eHH),
    new Phaser.Geom.Point(cx + eHW, eCy),
    new Phaser.Geom.Point(cx, eCy + eHH),
    new Phaser.Geom.Point(cx - eHW, eCy),
  ], true);

  // Central cupola/lantern on roof
  isoBox(g, cx, peakY + 2, 8, 4, 10, 0xd4b870, 0xa88840, 0x785c28);
  g.fillStyle(0xffd070, 0.65); g.fillEllipse(cx, peakY - 8, 10, 8);
  g.fillStyle(0xffe090, 0.38); g.fillEllipse(cx, peakY - 12, 7, 5);
  // Weathervane
  g.lineStyle(1, 0x905820, 1); g.strokeLineShape(new Phaser.Geom.Line(cx, peakY - 8, cx, peakY - 18));
  g.fillStyle(0xd4a840, 0.90); g.fillTriangle(cx, peakY - 18, cx + 9, peakY - 13, cx, peakY - 9);

  g.generateTexture('library', 128, 128);
}

function generateIronForge(g: G) {
  g.clear();
  const cx = 64;

  // Foundation — dark rough industrial stone
  isoBox(g, cx, 97, 40, 15, 9, 0x5a5c60, 0x3c3e42, 0x282a2c);
  g.lineStyle(1, 0x7a7c80, 0.25); g.strokeLineShape(new Phaser.Geom.Line(cx - 24, 94, cx + 24, 89));

  // Main body — heavy squat forge
  const bCy = 87, bHW = 36, bHH = 14, bWallH = 42;
  g.fillStyle(0x9094a0, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - bHW, bCy),
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
    new Phaser.Geom.Point(cx - bHW, bCy - bWallH),
  ], true);
  g.fillStyle(0x585c68, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx + bHW, bCy),
    new Phaser.Geom.Point(cx + bHW, bCy - bWallH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
  ], true);
  isoDiamond(g, cx, bCy - bWallH, bHW, bHH, 0xacb0bc);

  // Iron reinforcement bands (3 horizontal straps)
  for (let rib = 0; rib < 3; rib++) {
    const ry = bCy - 10 - rib * 12;
    g.fillStyle(0x383c44, 0.80); g.fillRect(cx - bHW + 2, ry, bHW - 2, 3);
    g.fillStyle(0x282c34, 0.70); g.fillRect(cx + 2, ry + rib, bHW - 2, 3);
    // Rivet dots
    g.fillStyle(0x606870, 0.90);
    for (let rv = 0; rv < 3; rv++) { g.fillCircle(cx - bHW + 7 + rv * 10, ry + 1.5, 1.5); }
  }

  // Large forge door — arched, glowing with fire
  const dX = cx, dY = bCy + bHH - 3;
  g.fillStyle(0x120804, 1); g.fillRect(dX - 9, dY - 22, 18, 22); g.fillCircle(dX, dY - 22, 9);
  g.fillStyle(0xff6010, 0.40); g.fillCircle(dX, dY - 12, 10);
  g.fillStyle(0xff8020, 0.40); g.fillCircle(dX, dY - 14, 7);
  g.fillStyle(0xffaa40, 0.55); g.fillCircle(dX, dY - 16, 4);
  g.fillStyle(0xffdd80, 0.72); g.fillCircle(dX, dY - 18, 2);
  g.lineStyle(2, 0x484c54, 0.80); g.strokeRect(dX - 10, dY - 23, 20, 24);

  // Bellows on left wall
  g.fillStyle(0x382c1c, 0.85); g.fillRect(cx - 30, bCy - 30, 12, 18);
  g.lineStyle(1, 0x504030, 0.60);
  for (let bl = 0; bl < 5; bl++) { g.strokeLineShape(new Phaser.Geom.Line(cx - 30, bCy - 14 - bl * 3, cx - 18, bCy - 12 - bl * 3)); }

  // Flat forge roof
  const eCy = bCy - bWallH;
  hippedRoof(g, cx, eCy, bHW + 3, bHH + 2, cx, eCy - 10, 0x4c5058, 0x34383e, tintColor(0x34383e, 0.05));

  // Two smoking brick chimneys
  for (const cx2 of [cx - 12, cx + 8]) {
    const chBaseY = eCy - 2;
    g.fillStyle(0x7a4830, 1); g.fillRect(cx2 - 5, chBaseY - 28, 10, 28);
    g.lineStyle(1, 0x603820, 0.40);
    for (let br = 0; br < 5; br++) { g.strokeLineShape(new Phaser.Geom.Line(cx2 - 5, chBaseY - 6 - br * 5, cx2 + 5, chBaseY - 6 - br * 5)); }
    g.fillStyle(0x303438, 1); g.fillRect(cx2 - 6, chBaseY - 30, 12, 4);
    g.fillStyle(0x50545c, 0.70); g.fillRect(cx2 - 6, chBaseY - 30, 12, 2);
    // Smoke + fire glow
    g.fillStyle(0xff5010, 0.30); g.fillCircle(cx2, chBaseY - 34, 7);
    g.fillStyle(0xff7030, 0.20); g.fillCircle(cx2 + 2, chBaseY - 40, 6);
    g.fillStyle(0x606060, 0.12); g.fillCircle(cx2 - 1, chBaseY - 46, 5);
  }

  g.generateTexture('iron_forge', 128, 128);
}

function generateBarracks(g: G) {
  g.clear();
  const cx = 64;

  // Foundation — warm military ochre stone
  isoBox(g, cx, 97, 40, 15, 8, 0xb49060, 0x907040, 0x6a4c20);
  g.lineStyle(1, 0x604820, 0.20); g.strokeLineShape(new Phaser.Geom.Line(cx - 24, 94, cx + 24, 89));

  // Main body — wide fortress walls
  const bCy = 87, bHW = 36, bHH = 14, bWallH = 42;
  g.fillStyle(0xd4a870, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - bHW, bCy),
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
    new Phaser.Geom.Point(cx - bHW, bCy - bWallH),
  ], true);
  g.fillStyle(0x8a5828, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx + bHW, bCy),
    new Phaser.Geom.Point(cx + bHW, bCy - bWallH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
  ], true);
  isoDiamond(g, cx, bCy - bWallH, bHW, bHH, 0xe8c080);

  // Shield emblem with crossed swords on left wall
  g.fillStyle(0x8a3820, 0.75); g.fillRect(cx - 22, bCy - 30, 14, 17);
  g.fillStyle(0xb83028, 0.55); g.fillRect(cx - 22, bCy - 30, 14, 8);
  g.lineStyle(2, 0xd4b040, 0.85);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 21, bCy - 29, cx - 9, bCy - 14));
  g.strokeLineShape(new Phaser.Geom.Line(cx - 9, bCy - 29, cx - 21, bCy - 14));
  g.lineStyle(1, 0xffe080, 0.40); g.strokeLineShape(new Phaser.Geom.Line(cx - 21, bCy - 28, cx - 17, bCy - 24));

  // Arrow-slit windows (narrow vertical)
  for (const wp of [[cx - 7, bCy - 20], [cx - 28, bCy - 16]] as [number, number][]) {
    g.fillStyle(0x1a0e08, 1); g.fillRect(wp[0] - 2, wp[1] - 16, 4, 16);
    g.fillStyle(0xff9040, 0.28); g.fillRect(wp[0] - 1, wp[1] - 14, 2, 10);
  }
  g.fillStyle(0x100806, 1); g.fillRect(cx + 20, bCy - 18, 3, 14);
  g.fillStyle(0xd06020, 0.20); g.fillRect(cx + 21, bCy - 16, 1, 10);

  // Battlement parapet + merlons
  const mBaseY = bCy - bWallH;
  hippedRoof(g, cx, mBaseY, bHW + 3, bHH + 2, cx, mBaseY - 12, 0x8c6030, 0x5e3c18, tintColor(0x5e3c18, 0.05));
  for (let m = -3; m <= 3; m++) {
    const mx = cx + m * 10, moff = m < 0 ? m * 1.5 : 0;
    g.fillStyle(0xd0a870, 1); g.fillRect(mx - 3, mBaseY - 20 + moff, 6, 10);
    g.fillStyle(0xe8c088, 0.70); g.fillRect(mx - 3, mBaseY - 20 + moff, 6, 2);
    g.fillStyle(0x6a4820, 0.60); g.fillRect(mx + 3, mBaseY - 20 + moff, 2, 10);
  }

  // Red banner hanging from left battlement
  g.fillStyle(0x6a1a1a, 1); g.fillRect(cx - 28, mBaseY - 16, 3, 20);
  g.fillStyle(0xb82020, 0.90); g.fillRect(cx - 25, mBaseY - 14, 10, 14);
  g.fillStyle(0xe04030, 0.52); g.fillRect(cx - 24, mBaseY - 13, 8, 6);
  for (let f = 0; f < 5; f++) { g.fillStyle(0xd4a830, 0.80); g.fillRect(cx - 25 + f * 2, mBaseY - 1, 2, 4); }

  // Corner torches with warm flame glow
  for (const tp of [[cx - 34, bCy - 26], [cx + 30, bCy - 22]] as [number, number][]) {
    g.fillStyle(0x4a3020, 1); g.fillRect(tp[0] - 1, tp[1] - 10, 2, 8);
    g.fillStyle(0xff8020, 0.48); g.fillCircle(tp[0], tp[1] - 10, 5);
    g.fillStyle(0xffcc40, 0.68); g.fillCircle(tp[0], tp[1] - 11, 3);
    g.fillStyle(0xfff0a0, 0.90); g.fillCircle(tp[0], tp[1] - 12, 1.5);
  }

  g.generateTexture('barracks', 128, 128);
}

function generateObservatory(g: G) {
  g.clear();
  const cx = 64;

  // Foundation — blue-grey scholarly stone
  isoBox(g, cx, 97, 38, 14, 8, 0x7898a8, 0x508090, 0x385c6e);
  // Five-star constellation on foundation top face
  const sPts: [number, number][] = [[cx - 12, 89], [cx, 85], [cx + 12, 89], [cx - 8, 93], [cx + 8, 93]];
  g.lineStyle(1, 0x90c0e0, 0.30);
  for (let i = 0; i < 5; i++) {
    g.strokeLineShape(new Phaser.Geom.Line(sPts[i][0], sPts[i][1], sPts[(i + 2) % 5][0], sPts[(i + 2) % 5][1]));
  }

  // Main body — elegant stone cylinder base
  const bCy = 87, bHW = 30, bHH = 12, bWallH = 44;
  g.fillStyle(0x98b8cc, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - bHW, bCy),
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
    new Phaser.Geom.Point(cx - bHW, bCy - bWallH),
  ], true);
  g.fillStyle(0x5c8090, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx + bHW, bCy),
    new Phaser.Geom.Point(cx + bHW, bCy - bWallH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
  ], true);
  isoDiamond(g, cx, bCy - bWallH, bHW, bHH, 0xb8d4e4);

  // Star constellation etching on left wall
  g.lineStyle(1, 0xd0ecff, 0.26);
  g.strokeCircle(cx - 20, bCy - 20, 3); g.strokeCircle(cx - 10, bCy - 30, 2); g.strokeCircle(cx - 15, bCy - 13, 2);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 20, bCy - 20, cx - 10, bCy - 30));
  g.strokeLineShape(new Phaser.Geom.Line(cx - 20, bCy - 20, cx - 15, bCy - 13));
  g.strokeLineShape(new Phaser.Geom.Line(cx - 10, bCy - 30, cx - 15, bCy - 13));

  // Circular porthole windows — cosmic blue-teal glow
  for (const wp of [[cx - 20, bCy - 14], [cx - 8, bCy - 25]] as [number, number][]) {
    g.fillStyle(0x08161e, 1); g.fillCircle(wp[0], wp[1], 6);
    g.fillStyle(0x40a8d0, 0.75); g.fillCircle(wp[0], wp[1], 4);
    g.fillStyle(0x80d8f8, 0.52); g.fillCircle(wp[0], wp[1], 2.5);
    g.fillStyle(0xc0f4ff, 0.72); g.fillCircle(wp[0], wp[1], 1);
  }
  g.fillStyle(0x081014, 1); g.fillCircle(cx + 16, bCy - 18, 5);
  g.fillStyle(0x2880a8, 0.55); g.fillCircle(cx + 16, bCy - 18, 3);

  // Copper dome — stacked ellipses for pseudo-3D curve
  const dBase = bCy - bWallH + 2;
  const domeLevels: [number, number, number, number][] = [
    [bHW * 2 - 2, 28, 0x4a8870, dBase],
    [bHW * 1.7, 22, 0x3d7860, dBase - 6],
    [bHW * 1.3, 16, 0x347060, dBase - 12],
    [bHW * 0.9, 11, 0x2e6458, dBase - 17],
    [bHW * 0.5, 6,  0x285850, dBase - 22],
  ];
  for (const [dw, dh, col, dy] of domeLevels) { g.fillStyle(col, 1); g.fillEllipse(cx, dy, dw, dh); }
  // Dome slit/opening for telescope
  g.fillStyle(0x0a1820, 0.80); g.fillRect(cx - 3, dBase - 22, 6, 18);
  // Telescope inside slit
  g.fillStyle(0xd4a840, 0.70); g.fillRect(cx - 2, dBase - 20, 4, 12);
  g.fillStyle(0xffe090, 0.50); g.fillCircle(cx, dBase - 20, 2.5);
  // Brass ring at dome base
  g.lineStyle(2, 0xd4a840, 0.55); g.strokeEllipse(cx, dBase, bHW * 2 - 2, 28);
  // Patina streaks on dome
  g.lineStyle(1, 0x80c0a0, 0.28);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 8, dBase - 6, cx - 4, dBase - 20));
  g.strokeLineShape(new Phaser.Geom.Line(cx + 6, dBase - 4, cx + 3, dBase - 18));
  // Finial spire
  g.fillStyle(0xd4a840, 0.85); g.fillTriangle(cx - 2, dBase - 22, cx + 2, dBase - 22, cx, dBase - 30);
  g.fillStyle(0xffe890, 0.62); g.fillCircle(cx, dBase - 30, 2);

  g.generateTexture('observatory', 128, 128);
}

function generateMarket(g: G) {
  g.clear();
  const cx = 64;

  // Foundation — warm ochre stone
  isoBox(g, cx, 97, 40, 15, 8, 0xd4a050, 0xb07830, 0x845418);
  g.lineStyle(1, 0x785020, 0.22); g.strokeLineShape(new Phaser.Geom.Line(cx - 24, 94, cx + 24, 89));

  // Main body — wide lively bazaar
  const bCy = 87, bHW = 36, bHH = 14, bWallH = 38;
  g.fillStyle(0xf0c068, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - bHW, bCy),
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
    new Phaser.Geom.Point(cx - bHW, bCy - bWallH),
  ], true);
  g.fillStyle(0xb87830, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx + bHW, bCy),
    new Phaser.Geom.Point(cx + bHW, bCy - bWallH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
  ], true);
  isoDiamond(g, cx, bCy - bWallH, bHW, bHH, 0xfcd878);

  // Wide arched entrance — open and inviting
  const dX = cx, dY = bCy + bHH - 2;
  g.fillStyle(0x180c04, 1); g.fillRect(dX - 10, dY - 20, 20, 20); g.fillCircle(dX, dY - 20, 10);
  g.fillStyle(0xffa030, 0.35); g.fillCircle(dX, dY - 12, 9);
  g.fillStyle(0xffcc50, 0.45); g.fillCircle(dX, dY - 14, 5);
  g.lineStyle(2, 0xd49020, 0.58); g.strokeRect(dX - 11, dY - 21, 22, 22);

  // Multi-color striped awning on left wall
  const awColors = [0xe83020, 0xf0c030, 0x28a048, 0xe83020, 0xf0c030];
  for (let s = 0; s < 5; s++) {
    const ay = bCy - 6 + s * 5;
    g.fillStyle(awColors[s], 0.88);
    g.fillPoints([
      new Phaser.Geom.Point(cx - bHW - 2, ay),
      new Phaser.Geom.Point(cx, ay + 6),
      new Phaser.Geom.Point(cx, ay + 10),
      new Phaser.Geom.Point(cx - bHW - 2, ay + 4),
    ], true);
  }
  // Awning scallop fringe
  for (let f = 0; f < 7; f++) { g.fillStyle(0xf0c030, 0.68); g.fillCircle(cx - bHW + 4 + f * 6, bCy + 21, 3); }

  // Hanging lanterns
  for (const lp of [[cx - 18, bCy - 28], [cx - 5, bCy - 33], [cx + 8, bCy - 26]] as [number, number][]) {
    g.lineStyle(1, 0x806030, 0.68); g.strokeLineShape(new Phaser.Geom.Line(lp[0], bCy - bWallH + 2, lp[0], lp[1] - 4));
    g.fillStyle(0xffd040, 0.85); g.fillEllipse(lp[0], lp[1], 7, 10);
    g.fillStyle(0xffee80, 0.50); g.fillEllipse(lp[0], lp[1], 4, 6);
    g.fillStyle(0xfff8d0, 0.24); g.fillCircle(lp[0], lp[1] - 3, 5);
  }

  // Bunting flags across roofline
  const buntY = bCy - bWallH + 2;
  g.lineStyle(1, 0x806030, 0.48); g.strokeLineShape(new Phaser.Geom.Line(cx - bHW + 4, buntY, cx + bHW - 4, buntY));
  const buntColors = [0xe83020, 0xf0c030, 0x2060e0, 0x28a048, 0xe83020, 0xf0c030];
  for (let f = 0; f < 6; f++) {
    g.fillStyle(buntColors[f], 0.80);
    g.fillTriangle(cx - bHW + 8 + f * 10, buntY, cx - bHW + 14 + f * 10, buntY, cx - bHW + 11 + f * 10, buntY + 7);
  }

  // Warm terracotta roof
  const eCy = bCy - bWallH, eHW = bHW + 4, eHH = bHH + 3;
  hippedRoof(g, cx, eCy, eHW, eHH, cx, eCy - 18, 0xc87820, 0x885010, tintColor(0x885010, 0.05));
  g.lineStyle(1, 0xe09030, 0.38); g.strokeLineShape(new Phaser.Geom.Line(cx - eHW, eCy, cx, eCy - 18));

  g.generateTexture('market', 128, 128);
}

function generateWall(g: G) {
  g.clear();
  const cx = 64;

  // Wide low foundation — heavy limestone
  isoBox(g, cx, 96, 44, 16, 10, 0xb8bec4, 0x8a9098, 0x606870);
  g.lineStyle(1, 0x606870, 0.28); g.strokeLineShape(new Phaser.Geom.Line(cx - 20, 93, cx - 12, 98));
  g.lineStyle(1, 0xd0d8de, 0.16); g.strokeLineShape(new Phaser.Geom.Line(cx - 32, 94, cx, 87));

  // Main wall body — broad fortress wall
  const bCy = 86, bHW = 38, bHH = 15, bWallH = 34;
  g.fillStyle(0xd4dce4, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - bHW, bCy),
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
    new Phaser.Geom.Point(cx - bHW, bCy - bWallH),
  ], true);
  g.fillStyle(0x909aa4, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, bCy + bHH),
    new Phaser.Geom.Point(cx + bHW, bCy),
    new Phaser.Geom.Point(cx + bHW, bCy - bWallH),
    new Phaser.Geom.Point(cx, bCy + bHH - bWallH),
  ], true);
  isoDiamond(g, cx, bCy - bWallH, bHW, bHH, 0xe8eef4);

  // Stone block coursing lines on left face
  g.lineStyle(1, 0xa8b0b8, 0.32);
  for (let row = 0; row < 3; row++) {
    const ry = bCy - 8 - row * 10;
    g.strokeLineShape(new Phaser.Geom.Line(cx - bHW + 2, ry, cx - 2, ry + 13));
    for (let col = 0; col < 4; col++) {
      const bx = cx - bHW + col * 10 + (row % 2) * 5;
      g.strokeLineShape(new Phaser.Geom.Line(bx, ry, bx, ry - 10));
    }
  }
  // Weathering/moss spots
  g.fillStyle(0x707860, 0.18);
  g.fillEllipse(cx - 28, bCy - 12, 8, 5); g.fillEllipse(cx - 16, bCy - 22, 6, 4); g.fillEllipse(cx - 8, bCy - 8, 5, 3);

  // Arrow slit on left face
  g.fillStyle(0x1e2428, 1); g.fillRect(cx - 24, bCy - 24, 3, 16);
  g.fillStyle(0x0a0e10, 0.50); g.fillRect(cx - 24, bCy - 22, 3, 10);

  // Stone buttress on right side
  isoBox(g, cx + bHW - 6, bCy - 8, 8, 5, bWallH - 6, 0xa8b0b8, 0x7a8490, 0x586068);

  // Parapet base on top
  isoBox(g, cx, bCy - bWallH, bHW + 2, bHH + 1, 6, 0xe0e8f0, 0xb0bac4, 0x808a94);
  // Pronounced crenellated merlons
  const mBase = bCy - bWallH;
  for (let m = -3; m <= 3; m++) {
    const mx = cx + m * 11, moff = m < 0 ? m * 1.5 : 0;
    g.fillStyle(0xd8e0e8, 1); g.fillRect(mx - 4, mBase - 22 + moff, 7, 14);
    g.fillStyle(0xecf2f8, 0.60); g.fillRect(mx - 4, mBase - 22 + moff, 7, 3);
    g.fillStyle(0xb0b8c4, 0.65); g.fillRect(mx + 3, mBase - 22 + moff, 2, 14);
  }

  // Wall torch bracket with flame
  g.fillStyle(0x483830, 1); g.fillRect(cx - 8, mBase - 14, 3, 10);
  g.fillStyle(0xff8020, 0.48); g.fillCircle(cx - 6, mBase - 14, 5);
  g.fillStyle(0xffcc40, 0.68); g.fillCircle(cx - 6, mBase - 15, 3);
  g.fillStyle(0xfff0a0, 0.90); g.fillCircle(cx - 6, mBase - 16, 1.5);

  g.generateTexture('wall', 128, 128);
}

function generateMonument(g: G) {
  g.clear();
  const cx = 64;

  // Grand stepped marble plinth — 3 tiers
  isoBox(g, cx, 99, 40, 15, 8,  0xd8d4cc, 0xb8b4ac, 0x908c84); // bottom tier
  isoBox(g, cx, 89, 32, 12, 7,  0xe8e4dc, 0xc4c0b8, 0x9c9890); // mid tier
  isoBox(g, cx, 80, 24, 10, 6,  0xf4f0e8, 0xd4d0c8, 0xacaaa0); // top tier

  // Gold trim edge lines on each tier
  g.lineStyle(1, 0xd4a830, 0.34);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 40, 99, cx, 91));
  g.strokeLineShape(new Phaser.Geom.Line(cx - 32, 89, cx, 83));
  g.strokeLineShape(new Phaser.Geom.Line(cx - 24, 80, cx, 74));

  // Inscribed relief panel on bottom tier left face
  g.fillStyle(0xa89880, 0.20); g.fillRect(cx - 30, 92, 12, 10);
  g.lineStyle(1, 0xfff8e0, 0.34);
  for (let l = 0; l < 4; l++) { g.strokeLineShape(new Phaser.Geom.Line(cx - 28, 94 + l * 2, cx - 20, 94 + l * 2 - 1)); }
  g.lineStyle(1, 0xd4a830, 0.44); g.strokeCircle(cx - 15, 96, 3);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 18, 96, cx - 12, 96));
  g.strokeLineShape(new Phaser.Geom.Line(cx - 15, 93, cx - 15, 99));

  // Obelisk/column rising from top tier
  const colBase = 72, colHW = 10, colHH = 5, colH = 42;
  // Column left face (marble, lit)
  g.fillStyle(0xf0ece4, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - colHW, colBase),
    new Phaser.Geom.Point(cx, colBase + colHH),
    new Phaser.Geom.Point(cx, colBase + colHH - colH),
    new Phaser.Geom.Point(cx - colHW + 3, colBase - colH + 2),
  ], true);
  // Column right face (shadow)
  g.fillStyle(0xb8b4ac, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx, colBase + colHH),
    new Phaser.Geom.Point(cx + colHW, colBase),
    new Phaser.Geom.Point(cx + colHW - 3, colBase - colH + 2),
    new Phaser.Geom.Point(cx, colBase + colHH - colH),
  ], true);
  isoDiamond(g, cx, colBase - colH, colHW - 2, colHH - 1, 0xfaf8f0);

  // Column fluting grooves
  g.lineStyle(1, 0xd0ccc4, 0.34);
  for (let fl = 0; fl < 4; fl++) {
    const fx = cx - colHW + 2 + fl * 4;
    g.strokeLineShape(new Phaser.Geom.Line(fx, colBase - 4, fx + 2, colBase - colH + 8));
  }

  // Ornate capital at column top
  isoBox(g, cx, colBase - colH, colHW + 3, colHH + 2, 4, 0xfaf8f0, 0xd8d4cc, 0xb0aca4);
  g.lineStyle(1, 0xd4a830, 0.48);
  g.strokeLineShape(new Phaser.Geom.Line(cx - colHW - 3, colBase - colH, cx, colBase - colH + colHH + 2));
  g.strokeLineShape(new Phaser.Geom.Line(cx, colBase - colH + colHH + 2, cx + colHW + 3, colBase - colH));

  // Glowing golden crown at apex
  const crownY = colBase - colH - 6;
  g.fillStyle(0xd4a820, 0.14); g.fillCircle(cx, crownY, 14);
  g.fillStyle(0xd4a820, 0.28); g.fillCircle(cx, crownY, 9);
  g.fillStyle(0xffd040, 0.55); g.fillCircle(cx, crownY, 5);
  g.fillStyle(0xffe880, 0.85); g.fillCircle(cx, crownY, 3);
  g.fillStyle(0xfffff0, 0.96); g.fillCircle(cx, crownY, 1.5);
  // Radial glow rays
  g.lineStyle(1, 0xffd040, 0.18);
  for (let r = 0; r < 8; r++) {
    const ra = (r * Math.PI) / 4;
    g.strokeLineShape(new Phaser.Geom.Line(
      cx + Math.cos(ra) * 6, crownY + Math.sin(ra) * 4,
      cx + Math.cos(ra) * 14, crownY + Math.sin(ra) * 9
    ));
  }

  g.generateTexture('monument', 128, 128);
}

// ─── Prop textures (unchanged core props + improvements) ─────────────────────

function generateRoyalFlagship(g: G) {
  g.clear();
  const cx = 96;

  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(cx, 110, 96, 20);
  g.fillStyle(0x89d8f0, 0.1);
  g.fillEllipse(cx, 106, 118, 26);
  g.fillStyle(0x55351c, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - 50, 84),
    new Phaser.Geom.Point(cx + 40, 84),
    new Phaser.Geom.Point(cx + 54, 96),
    new Phaser.Geom.Point(cx - 34, 104),
    new Phaser.Geom.Point(cx - 62, 97),
  ], true);
  g.lineStyle(2, 0xd8b060, 0.55);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 44, 88, cx + 34, 88));
  g.fillStyle(0xdac48a, 1);
  g.fillRect(cx - 16, 58, 44, 12);
  g.fillStyle(0xc09048, 0.95);
  g.fillRect(cx - 6, 46, 28, 12);
  g.fillStyle(0xeedca8, 0.95);
  g.fillRect(cx + 2, 34, 18, 12);
  g.fillStyle(0x8b5e28, 1);
  g.fillRect(cx - 1, 28, 4, 60);
  g.fillRect(cx + 18, 38, 4, 48);
  g.fillStyle(0xf8f0d2, 0.96);
  g.fillTriangle(cx + 3, 30, cx + 3, 72, cx + 46, 56);
  g.fillStyle(0xe9dfbf, 0.88);
  g.fillTriangle(cx + 22, 40, cx + 22, 77, cx + 58, 63);
  g.lineStyle(2, 0xc82418, 0.95);
  g.strokeLineShape(new Phaser.Geom.Line(cx + 3, 30, cx + 46, 56));
  g.fillStyle(0xc82618, 0.92);
  g.fillTriangle(cx + 18, 18, cx + 44, 25, cx + 18, 31);
  g.fillStyle(0xffd86a, 0.95);
  g.fillCircle(cx + 18, 18, 3);
  g.fillStyle(0xe2c870, 0.94);
  g.fillRect(cx - 10, 66, 22, 8);
  g.fillStyle(0xb99230, 0.8);
  g.fillCircle(cx, 70, 5);

  g.generateTexture('royal_flagship', 192, 128);
}

function generateSentinelSkiff(g: G) {
  g.clear();
  const cx = 64;

  g.fillStyle(0x000000, 0.1);
  g.fillEllipse(cx, 102, 66, 14);
  g.fillStyle(0x38566c, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - 32, 82),
    new Phaser.Geom.Point(cx + 20, 82),
    new Phaser.Geom.Point(cx + 34, 90),
    new Phaser.Geom.Point(cx - 12, 96),
    new Phaser.Geom.Point(cx - 40, 92),
  ], true);
  g.fillStyle(0x5a7f9b, 0.95);
  g.fillRect(cx - 6, 66, 20, 10);
  g.fillStyle(0x2d4354, 0.95);
  g.fillRect(cx + 2, 52, 4, 32);
  g.fillStyle(0xa8dff6, 0.92);
  g.fillTriangle(cx + 6, 54, cx + 6, 82, cx + 28, 68);
  g.lineStyle(2, 0x7fe6ff, 0.45);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 26, 86, cx + 18, 86));
  g.fillStyle(0x6ce8ff, 0.32);
  g.fillCircle(cx - 10, 94, 6);

  g.generateTexture('sentinel_skiff', 128, 128);
}

function generateBulwarkBarge(g: G) {
  g.clear();
  const cx = 64;

  g.fillStyle(0x000000, 0.1);
  g.fillEllipse(cx, 102, 74, 16);
  g.fillStyle(0x4a3322, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - 34, 82),
    new Phaser.Geom.Point(cx + 22, 82),
    new Phaser.Geom.Point(cx + 34, 92),
    new Phaser.Geom.Point(cx - 18, 98),
    new Phaser.Geom.Point(cx - 40, 92),
  ], true);
  g.fillStyle(0x7e5b38, 0.92);
  g.fillRect(cx - 12, 64, 28, 12);
  g.fillStyle(0x6b727d, 1);
  g.fillRect(cx - 4, 52, 18, 12);
  g.fillStyle(0x515862, 1);
  g.fillRect(cx + 12, 58, 12, 10);
  g.fillStyle(0xc4ccd8, 0.95);
  g.fillRect(cx - 22, 60, 6, 24);
  g.fillRect(cx + 18, 64, 6, 20);
  g.fillStyle(0xe4b650, 0.88);
  g.fillCircle(cx - 19, 58, 3);
  g.fillCircle(cx + 21, 62, 3);
  g.lineStyle(2, 0x9aa8ba, 0.42);
  g.strokeLineShape(new Phaser.Geom.Line(cx - 28, 86, cx + 18, 86));

  g.generateTexture('bulwark_barge', 128, 128);
}

function generateSupplyTender(g: G) {
  g.clear();
  const cx = 64;

  g.fillStyle(0x000000, 0.1);
  g.fillEllipse(cx, 102, 68, 14);
  g.fillStyle(0x6e4724, 1);
  g.fillPoints([
    new Phaser.Geom.Point(cx - 30, 84),
    new Phaser.Geom.Point(cx + 20, 84),
    new Phaser.Geom.Point(cx + 30, 92),
    new Phaser.Geom.Point(cx - 14, 98),
    new Phaser.Geom.Point(cx - 36, 93),
  ], true);
  g.fillStyle(0xc99a48, 0.96);
  g.fillRect(cx - 10, 68, 28, 12);
  g.fillStyle(0xb67a34, 0.92);
  g.fillRect(cx - 2, 54, 18, 12);
  g.fillStyle(0x84501e, 1);
  g.fillRect(cx + 6, 44, 4, 38);
  g.fillStyle(0xf2dec0, 0.92);
  g.fillTriangle(cx + 10, 46, cx + 10, 78, cx + 30, 64);
  g.fillStyle(0xead4a8, 0.96);
  g.fillRect(cx - 22, 70, 8, 8);
  g.fillRect(cx - 20, 60, 8, 8);
  g.fillRect(cx - 18, 50, 8, 8);
  g.fillStyle(0x6cd2ea, 0.28);
  g.fillCircle(cx - 4, 95, 5);

  g.generateTexture('supply_tender', 128, 128);
}

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

    generateTownHall(g);
    generateArcane(g);
    generateLibrary(g);
    generateIronForge(g);
    generateBarracks(g);
    generateObservatory(g);
    generateMarket(g);
    generateWall(g);
    generateMonument(g);
    generateRoyalFlagship(g);
    generateSentinelSkiff(g);
    generateBulwarkBarge(g);
    generateSupplyTender(g);

    generatePropTextures(g);
    g.destroy();
  }

  create(): void {
    this.scene.start("KingdomScene");
  }
}
