/**
 * The floe — the scene generator for "an ice floe in open water".
 *
 * ONE GENERATOR, READ BY EVERYTHING THAT NEEDS A POSITION. The backdrop draws
 * the floe; the cast STANDS on it (`rests`); a swiped penguin LANDS in the water
 * (`slots`, chosen by `landingFor`); the Outro lines everyone up (`row`); the
 * ghost finger demonstrates on a rest. The placeholder this replaces kept a
 * percentage scatter of rest spots beside a separately-drawn oval, and slid each
 * penguin a fixed number of PIXELS — so on a phone a slow swipe from the middle
 * stopped on the ice while claiming to be in the water, and a fast one left the
 * screen. Two hand-maintained lists of positions cannot be kept in agreement;
 * one generator read by all of them cannot fall out of it.
 *
 * THE ONE MASS THAT IS NOT CROPPED, AND WHY. The house style says every mass is
 * cropped by a frame edge, because a shape that stops neatly inside the viewport
 * reads as a sticker. The spec says the floe has water on EVERY side, because
 * every Swipe direction has to end somewhere good — there is no aiming in this
 * Toy. The spec wins: the floe is the mechanic. What keeps it from being a
 * sticker or a rival is that it is (a) far outside the cast's size band — it
 * carries the whole cast, so it is at least 2.5 penguins across by construction,
 * and `check()` holds that line; (b) hand-cut, never a clean convex ellipse; and
 * (c) shown with its thickness and its shadow on the water, so it sits IN the
 * sea rather than on top of the picture. Cropping and overlap come from
 * everything else: the far shelves are cut by the top edge, the ripples are
 * open marks, and the cast overlaps the floe's back edge.
 *
 * Sorted by shape class, with a penguin as the unit:
 *
 *   | class               | shape                              | rival? |
 *   | ice chunk, berg     | convex, closed, penguin-sized      | YES    |
 *   | ripple, glint       | elongated, open, short             | no     |
 *   | shelf               | cropped by the frame, >= 2.5       | no     |
 *   | the floe            | closed, >= 2.5, carries the cast   | no (the one exception) |
 *
 * No loose ice chunks, no little bergs. A chunk of ice the size of a penguin,
 * floating in the water the penguins land in, is precisely a second cast.
 *
 * FRAME SPACE. Authored in a `0..100` x `0..h` box whose aspect matches the
 * viewport, so nothing is stretched. Every SIZE is a multiple of `pw`, a
 * penguin's width in frame units; only POSITIONS are frame fractions. A phone
 * is ~4.5 penguins wide and ~10 tall; a 16:10 desktop ~11 by ~7. So a phone
 * stacks the cast in two staggered rows and a desktop stands them in one
 * zig-zag line on a longer floe — more sea sideways, never the same floe
 * enlarged.
 */

import {
  closedPath,
  contourRing,
  polygonPath,
  quadPts,
  taperedOutline,
  type Pt,
} from '../../shell/art/geometry';
import { line as houseLine } from '../../shell/art/house';
import { jitter, jitteredGrid, stream } from '../../shell/art/rng';

/**
 * Scenery contour weight as a fraction of the CAST's contour. The contour
 * belongs to the figure; this is enough line to say the ice is drawn and not
 * enough to compete. A rule, not a taste decision, so it is not a knob.
 */
const SCENERY_CONTOUR_RATIO = 0.5;
/** The cast's contour in its own 100-wide box, expressed per penguin width. */
const CAST_CONTOUR_PER_PW = houseLine.contour / 100;

/**
 * How much of a swimming penguin shows above the waterline, and how wide it is,
 * in penguins. Mirrors the swimming pose in `PenguinDrawing` — a landing slot is
 * only good if that visible part is in the water, not over the ice.
 */
export const SWIM_VISIBLE_H = 0.72;
export const SWIM_HALF_W = 0.46;
/** A standing penguin's height above its feet, in penguins (its box is 1.2 tall). */
export const STAND_H = 1.14;
/** A ripple's thickness, in penguins — under 1/8, so it is a mark, never a thing. */
const RIPPLE_W = 0.045;

/** The box the scene is composed into. `w` is always 100; `h` follows the aspect. */
export type Frame = { w: number; h: number };

/**
 * Every taste decision in the floe. The RULES are hardcoded below; these are
 * the numbers nobody has settled yet, tuned in the lab's frame view.
 */
export type FloeConfig = {
  /** Distance between neighbouring penguins on the floe, in penguins. */
  spacing: number;
  /** How far behind the back row the front row stands, in penguins. */
  rowGap: number;
  /** The zig-zag a single-row layout gets, so it is not a line of soldiers. */
  zigzag: number;
  /** Ice beyond the outermost feet, sideways, in penguins. */
  padX: number;
  /** Ice behind the back row's feet, in penguins. */
  padBack: number;
  /** Ice in front of the front row's feet, in penguins. */
  padFront: number;
  /** The floe's centre, as a fraction of the frame height. */
  floeY: number;
  /** The slab's visible thickness, in penguins. */
  thickness: number;
  /** How far the floe's shadow falls on the water, in penguins. */
  shadowDrop: number;
  /** How boxy the floe is: 2 is an ellipse, higher is a slab. */
  squareness: number;
  /** Radial jitter of the outline, as a fraction of its radius. */
  jag: number;
  /** Narrowest the side water may be, in penguins. */
  sideWater: number;
  /** The far shelves' reach along the top edge, in penguins (>= 2.5). */
  shelfReach: number;
  /** How far down the frame the shelves come, in penguins. */
  shelfDepth: number;
  /** Ripples per square penguin of open water. */
  rippleDensity: number;
  /** A ripple's length, in penguins. */
  rippleLength: number;
  /** Spacing of the candidate landing slots, in penguins. */
  slotSpacing: number;
};

export const FLOE_DEFAULTS: FloeConfig = {
  spacing: 1.02,
  rowGap: 0.78,
  zigzag: 0.32,
  padX: 0.62,
  padBack: 0.42,
  padFront: 0.42,
  floeY: 0.56,
  thickness: 0.2,
  shadowDrop: 0.16,
  squareness: 3.2,
  jag: 0.035,
  sideWater: 0.55,
  shelfReach: 3,
  shelfDepth: 0.75,
  rippleDensity: 0.32,
  rippleLength: 0.5,
  slotSpacing: 1.08,
};

export type Shelf = { top: string; face: string; ink: string; topInk: string; bottom: number };
export type Ripple = { d: string; light: boolean };

export type FloeArt = {
  /** The floe's top surface, its outline points, and its contour ring. */
  floe: { top: string; pts: Pt[]; face: string; facePts: Pt[]; ink: string; faceInk: string; shadow: string };
  /** Where each penguin stands — its FEET — on the floe. */
  rests: Pt[];
  /** Points in open water a swimming penguin can bob at — its waterline. */
  slots: Pt[];
  /** The Outro line-up, in the water — waterline points. */
  row: Pt[];
  shelves: Shelf[];
  ripples: Ripple[];
  /** Penguin width in frame units, carried so consumers never re-derive it. */
  pw: number;
  frame: Frame;
};

/* ------------------------------------------------------------------ *
 * Geometry helpers
 * ------------------------------------------------------------------ */

function inside(p: Pt, poly: readonly Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const bounds = (pts: readonly Pt[]) => ({
  minX: Math.min(...pts.map((p) => p[0])),
  maxX: Math.max(...pts.map((p) => p[0])),
  minY: Math.min(...pts.map((p) => p[1])),
  maxY: Math.max(...pts.map((p) => p[1])),
});

/** A hand-cut slab: a superellipse sampled and jittered, so it is never a clean primitive. */
function slab(cx: number, cy: number, rx: number, ry: number, power: number, jag: number, rnd: () => number): Pt[] {
  const n = 28;
  const pts: Pt[] = [];
  const phase = rnd() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / power);
    const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / power);
    // Low-order wobble plus a little per-vertex jitter: a cut edge, not a wave.
    const m = 1 + jag * Math.sin(3 * t + phase) + jitter(rnd, jag * 0.6);
    pts.push([cx + x * rx * m, cy + y * ry * m]);
  }
  return pts;
}

/* ------------------------------------------------------------------ *
 * The generator
 * ------------------------------------------------------------------ */

/** Splits `n` penguins into rows of at most `perRow`, the longer row at the back. */
function rowsFor(n: number, perRow: number): number[] {
  const rows = Math.ceil(n / perRow);
  const out: number[] = [];
  let left = n;
  for (let r = 0; r < rows; r++) {
    const take = Math.ceil(left / (rows - r));
    out.push(take);
    left -= take;
  }
  return out;
}

export function buildFloe(cfg: FloeConfig, frame: Frame, pw: number, seed: number, castSize: number): FloeArt {
  const rnd = (name: string) => stream(seed, `floe-${name}`);
  const widthInP = frame.w / pw;

  /* --- rests: the cast's layout decides the floe, not the other way round --- */
  // Never more than two rows: a third row stacks the cast into a tower with no
  // sea left above or below it. On a very narrow phone the penguins stand a
  // little closer instead.
  const room = widthInP - 2 * cfg.sideWater - 2 * cfg.padX;
  const fit = Math.floor(room / cfg.spacing) + 1;
  const perRow = Math.max(1, Math.min(castSize, Math.max(fit, Math.ceil(castSize / 2))));
  const spacing = perRow > 1 ? Math.max(0.8, Math.min(cfg.spacing, room / (perRow - 1))) : cfg.spacing;
  const rows = rowsFor(castSize, perRow);
  const single = rows.length === 1;
  const restRnd = rnd('rests');
  const local: Pt[] = [];
  rows.forEach((count, r) => {
    const y = r * cfg.rowGap;
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * spacing;
      const zig = single ? (i % 2 === 0 ? -1 : 1) * cfg.zigzag * 0.5 : 0;
      local.push([x + jitter(restRnd, 0.06), y + zig + jitter(restRnd, 0.05)]);
    }
  });
  const lb = bounds(local);
  // Penguins are in penguins here; scale and centre on the frame.
  const floeH = lb.maxY - lb.minY + cfg.padBack + cfg.padFront;
  const floeW = lb.maxX - lb.minX + 2 * cfg.padX;
  const cy = frame.h * cfg.floeY;
  const cx = frame.w / 2;
  const restTop = cy - (floeH / 2 - cfg.padBack) * pw;
  const rests: Pt[] = local.map(([x, y]) => [cx + x * pw, restTop + (y - lb.minY) * pw]);

  /* --- the floe ------------------------------------------------------------ */
  const rx = (floeW / 2) * pw;
  const ry = (floeH / 2) * pw;
  const pts = slab(cx, cy, rx, ry, cfg.squareness, cfg.jag, rnd('slab'));
  const thick = cfg.thickness * pw;
  const facePts = pts.map(([x, y]) => [x, y + thick] as Pt);
  const shadowPts = pts.map(([x, y]) => [x + cfg.shadowDrop * pw * 0.6, y + thick + cfg.shadowDrop * pw] as Pt);
  const ink = pw * CAST_CONTOUR_PER_PW * SCENERY_CONTOUR_RATIO;
  const floe = {
    top: closedPath(pts),
    pts,
    face: closedPath(facePts),
    facePts,
    ink: contourRing(pts, ink, houseLine.taper, houseLine.wobble, rnd('floe-ink')),
    faceInk: contourRing(facePts, ink * 1.2, houseLine.taper, houseLine.wobble, rnd('face-ink')),
    shadow: closedPath(shadowPts),
  };

  /* --- shelves: cropped by the top edge, and by a side edge ----------------- */
  // Counts follow the frame: a phone has room for one, a wide frame for two.
  const reach = Math.max(2.5, Math.min(cfg.shelfReach, widthInP * 0.62));
  const shelfCount = widthInP >= reach * 2 + 1.5 ? 2 : 1;
  const shelves: Shelf[] = [];
  for (let s = 0; s < shelfCount; s++) {
    const r = rnd(`shelf-${s}`);
    const fromLeft = s === 0;
    const len = reach * pw * (0.9 + r() * 0.2);
    const depth = cfg.shelfDepth * pw * (0.85 + r() * 0.3);
    const x0 = fromLeft ? -pw : frame.w + pw;
    const x1 = fromLeft ? len : frame.w - len;
    // The cut edge: high where it leaves the side edge, dipping, then rising to
    // the top edge — so the shelf is cropped TWICE and reads as land beyond.
    const edge: Pt[] = [];
    const steps = 9;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const sag = Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)) * 0.35 + (1 - t) * 0.75;
      edge.push([x, depth * sag + jitter(r, pw * 0.05)]);
    }
    edge[edge.length - 1] = [x1, -pw * 0.2];
    const topPts: Pt[] = [[x0, -pw], ...edge, [x1, -pw]];
    const faceEdge = edge.map(([x, y]) => [x, y + thick] as Pt);
    const facePoly: Pt[] = [[x0, -pw], ...faceEdge, [x1, -pw]];
    shelves.push({
      top: polygonPath(smoothOpen(topPts)),
      face: polygonPath(smoothOpen(facePoly)),
      ink: polygonPath(smoothOpen(facePoly.map(([x, y]) => [x, y + ink * 1.2] as Pt))),
      topInk: polygonPath(smoothOpen(topPts.map(([x, y]) => [x, y + ink * 0.9] as Pt))),
      bottom: Math.max(...faceEdge.map((p) => p[1])),
    });
  }
  const shelfBottom = shelves.length ? Math.max(...shelves.map((s) => s.bottom)) : 0;

  /* --- landing slots -------------------------------------------------------- */
  const ice: Pt[][] = [pts, facePts];
  const onIce = (p: Pt) => ice.some((poly) => inside(p, poly));
  /** A swimming penguin at `p` (its waterline) is clear of the ice and in the frame. */
  const swimFits = ([x, y]: Pt) => {
    const hw = SWIM_HALF_W * pw;
    const top = y - SWIM_VISIBLE_H * pw;
    if (x - hw < pw * 0.15 || x + hw > frame.w - pw * 0.15) return false;
    if (top < shelfBottom + pw * 0.05 || y > frame.h - pw * 0.18) return false;
    for (const fx of [-hw, 0, hw]) for (const fy of [top, (top + y) / 2, y + pw * 0.08]) {
      if (onIce([x + fx, fy])) return false;
    }
    return true;
  };
  const cols = Math.max(1, Math.round(widthInP / cfg.slotSpacing));
  const rowsN = Math.max(1, Math.round(frame.h / pw / (cfg.slotSpacing * 0.85)));
  const slots = jitteredGrid(cols, rowsN, frame.w, frame.h, 0.35, rnd('slots')).filter(swimFits);

  /* --- the Outro row: high in the open water above the floe ------------------ */
  // High, not midway: the Completion overlay is a card centred in the viewport,
  // and the row has to stay visible above it while it pops and splashes. Just
  // under the shelves is the highest open water there is.
  const floeTop = bounds(pts).minY;
  const rowY = Math.min(floeTop - pw * 0.12, shelfBottom + (SWIM_VISIBLE_H + 0.15) * pw);
  const rowStep = Math.min(pw * 1.12, (frame.w - pw * 1.1) / Math.max(1, castSize - 1));
  const row: Pt[] = Array.from({ length: castSize }, (_, i) => [
    cx + (i - (castSize - 1) / 2) * rowStep,
    rowY + (i % 2 === 0 ? 0 : pw * 0.06),
  ]);

  /* --- ripples: short open marks in the open water -------------------------- */
  const ripples: Ripple[] = [];
  const area = (frame.w / pw) * (frame.h / pw);
  const want = Math.round(area * cfg.rippleDensity);
  const rr = rnd('ripples');
  const rgCols = Math.max(1, Math.round(Math.sqrt(want * (frame.w / frame.h))));
  const rgRows = Math.max(1, Math.round(want / rgCols));
  for (const [x, y] of jitteredGrid(rgCols, rgRows, frame.w, frame.h, 0.8, rr)) {
    const len = cfg.rippleLength * pw * (0.7 + rr() * 0.6);
    const a: Pt = [x - len / 2, y];
    const b: Pt = [x + len / 2, y + jitter(rr, len * 0.08)];
    if (y < shelfBottom + pw * 0.15) continue;
    if ([a, b, [x, y] as Pt].some((p) => onIce(p) || onIce([p[0], p[1] - pw * 0.12]))) continue;
    const bow = len * 0.14;
    ripples.push({ d: taperedOutline(quadPts(a, [x, y - bow], b, 10), pw * RIPPLE_W, 0.5), light: rr() < 0.35 });
  }

  return { floe, rests, slots, row, shelves, ripples, pw, frame };
}

/** Densifies an open polyline with a Catmull-Rom pass, so a cut edge has no corners. */
function smoothOpen(pts: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 4; k++) {
      const t = k / 4;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/* ------------------------------------------------------------------ *
 * Landing
 * ------------------------------------------------------------------ */

/**
 * Where a swiped penguin ends up: the free water slot that best agrees with the
 * stroke. Direction dominates — every direction is good, so the penguin goes the
 * way it was swiped — and `reach` (0..1, from the stroke's speed) pushes it
 * further out along that direction. Never a slot another penguin has taken, so
 * each Swipe moves exactly one penguin to a place of its own, and progress stays
 * visible as five separate swimmers rather than a pile.
 *
 * Returns -1 only if every slot is taken, which `check`-style tests rule out by
 * asserting there are more slots than penguins at every shipped frame.
 */
export function landingFor(
  art: Pick<FloeArt, 'slots' | 'pw'>,
  from: Pt,
  dir: Pt,
  reach: number,
  taken: ReadonlySet<number>,
): number {
  const len = Math.hypot(dir[0], dir[1]) || 1;
  const ux = dir[0] / len;
  const uy = dir[1] / len;
  const want = art.pw * (1.3 + 2.4 * Math.min(1, Math.max(0, reach)));
  let best = -1;
  let bestScore = Infinity;
  art.slots.forEach(([x, y], i) => {
    if (taken.has(i)) return;
    const vx = x - from[0];
    const vy = y - from[1];
    const d = Math.hypot(vx, vy) || 1;
    const cos = (vx * ux + vy * uy) / d;
    const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
    const score = angle * 2.2 + Math.abs(d - want) / art.pw * 0.45;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

/* ------------------------------------------------------------------ *
 * The self-audit
 * ------------------------------------------------------------------ */

/**
 * The shape-class rules, as violations. Empty means the config is legal at a
 * penguin width of `pw` frame units — evaluated by the tests at every frame the
 * Toy ships into, and live in the lab.
 */
export function check(cfg: FloeConfig, pw: number, frame: Frame = { w: 100, h: 216 }): string[] {
  const out: string[] = [];
  const widthInP = frame.w / pw;
  const reach = Math.min(cfg.shelfReach, widthInP * 0.62);
  if (reach < 2.5) out.push(`shelf reach ${reach.toFixed(2)} penguins is in the rival band — grow it or remove it`);
  if (cfg.rippleLength > 0.9) out.push('ripples long enough to read as rafts');
  if (RIPPLE_W > 0.125) out.push('ripples wide enough to count as objects');
  if (cfg.thickness > 0.5) out.push('a floe thicker than half a penguin is a wall');
  if (cfg.sideWater < 0.5) out.push('side water under half a penguin puts a swipe toward the browser edge');
  return out;
}
