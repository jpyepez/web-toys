/**
 * The pond — the scene generator for Pond Leap, seen from above.
 *
 * ONE GENERATOR, READ BY THE TOY AND THE LAB. `buildPond` takes the viewport and
 * returns every plate behind the pads; the lab's frame view calls the very same
 * function, so a scene judged there is the scene the Toy draws.
 *
 * WHERE THE CAMERA IS. Above the water, looking down: the pads are round leaves,
 * the banks are the dry ground at the left and right edges, ripples are open
 * marks on the surface. The frog alone breaks that and shows its face (the Soup
 * Pot convention) — it is the Critter.
 *
 * Sorted by shape class, with a FROG as the unit:
 *
 *   | class          | shape                                   | rival? |
 *   | lily pad       | concave, ~1.6 frogs, carries the frog   | no (the mechanic, see PadDrawing) |
 *   | bank           | cropped by a side edge, full height     | no     |
 *   | deep water     | cropped by the frame, >= 2.5 frogs      | no     |
 *   | ripple         | open, short, under 1/8 frog thick       | no     |
 *   | duckweed       | under 1/8 frog, part of a counted mass  | no     |
 *   | a loose leaf, a rock, a flower in the water | convex, closed, frog-sized | YES — not drawn |
 *
 * No loose leaves: a pad-sized leaf the frog can't land on is a target that lies.
 *
 * FRAME SPACE. Authored in a `0..100` × `0..h` box whose aspect matches the
 * viewport, so nothing is stretched. Every SIZE is a multiple of `fw`, a frog's
 * width in frame units; only POSITIONS are frame fractions. The pads live in a
 * centred column at most 540 px wide, so a phone is all pond with banks shaved
 * to the edges, and a 16:10 desktop gets wide banks and more water either side —
 * more scene sideways, never the same pond enlarged.
 */

import { closedPath, grownContour, lobedAlong, quadPts, taperedOutline, type Pt } from '../../shell/art/geometry';
import { line as houseLine } from '../../shell/art/house';
import { jitter, jitteredGrid, stream } from '../../shell/art/rng';
import { PADS, STAGE_MAX_WIDTH_PX } from './pond';
import { frogPx } from './FrogDrawing';

/** The box the scene is composed into. `w` is always 100; `h` follows the aspect. */
export type Frame = { w: number; h: number };

/**
 * Scenery contour as a fraction of the CAST's, in rendered size. The contour
 * belongs to the figure. A rule, not a taste decision, so it is not a knob.
 */
export const SCENERY_CONTOUR_RATIO = 0.5;
/** A mark (ripple, duckweed) may be at most this thick, in frogs. */
export const MARK_MAX = 1 / 8;
/** A closed mass must be at least this wide, in frogs, to be scenery and not a rival. */
export const MASS_MIN = 2.5;

/** Every taste decision in the pond, tuned in the lab's frame view. */
export type PondConfig = {
  /** Bank width at its narrowest, in frogs. */
  bankReach: number;
  /** How much wider the banks get toward the bottom corners, in frogs. */
  bankFlare: number;
  /** The shoreline's sway, in frogs. */
  bankSway: number;
  /** Water kept between a bank and the pad column on a wide screen, in frogs. */
  bankInset: number;
  /** How much of a wide screen's free side margin the bank takes, 0–1: the rest is pond. */
  bankShare: number;
  /** Open water a bank keeps from any pad's rim, in frogs. */
  padClearance: number;
  /** The moss fringe's lobe radius, in frogs. */
  mossLobe: number;
  /** How far the deep-water masses reach into the frame, in frogs. */
  deepReach: number;
  /** Ripples per square frog of open water. */
  rippleDensity: number;
  /** A ripple's length, in frogs. */
  rippleLength: number;
  /** Duckweed specks per bank. */
  duckweed: number;
};

export const POND_DEFAULTS: PondConfig = {
  bankReach: 0.32,
  bankFlare: 0.55,
  bankSway: 0.12,
  bankInset: 0.9,
  bankShare: 0.4,
  padClearance: 0.28,
  mossLobe: 0.055,
  deepReach: 3.2,
  rippleDensity: 0.05,
  rippleLength: 0.42,
  duckweed: 14,
};

export type Bank = { side: -1 | 1; d: string; ink: string; shade: string; moss: string; edge: Pt[] };
export type Ripple = { d: string; light: boolean };
export type Speck = { x: number; y: number; r: number };
export type PondArt = {
  frame: Frame;
  fw: number;
  /** The pads' centres and radius, in frame units — where the scenery must not go. */
  pads: Pt[];
  padR: number;
  stage: { x0: number; x1: number };
  deep: Array<{ d: string; pts: Pt[] }>;
  banks: Bank[];
  ripples: Ripple[];
  duckweed: Speck[];
};

/** A pad's rendered width in px — mirrors `PAD_WIDTH` in `pond.ts`. */
export function padPx(w: number): number {
  return Math.min(150, Math.max(96, w * 0.28));
}

/** The viewport, in the units the generator works in. */
export function pondGeometry(wPx: number, hPx: number) {
  const k = 100 / wPx;
  const frame: Frame = { w: 100, h: hPx * k };
  const sw = Math.min(wPx, STAGE_MAX_WIDTH_PX) * k;
  const x0 = (100 - sw) / 2;
  const pads = PADS.map(([x, y]) => [x0 + x * sw, y * frame.h] as Pt);
  return { frame, fw: frogPx(wPx) * k, padR: (padPx(wPx) * k) / 2, stage: { x0, x1: x0 + sw }, pads };
}

/** The scenery contour, in frame units, for a frog `fw` wide. */
export const sceneryContour = (fw: number) => (houseLine.contour / 100) * fw * SCENERY_CONTOUR_RATIO;

/**
 * How far in from its edge a bank may reach at height `y` without crowding a
 * pad: the rim of every pad near that height, less the clearance.
 */
function bankLimit(side: -1 | 1, y: number, art: Pick<PondArt, 'pads' | 'padR' | 'fw'>, cfg: PondConfig): number {
  const keep = art.padR + cfg.padClearance * art.fw;
  let limit = Infinity;
  for (const [px, py] of art.pads) {
    const dy = Math.abs(py - y);
    if (dy >= keep) continue;
    // the pad's rim at this height, on the bank's side
    const half = Math.sqrt(keep * keep - dy * dy);
    limit = Math.min(limit, side < 0 ? px - half : 100 - (px + half));
  }
  return limit;
}

export function buildPond(cfg: PondConfig, wPx: number, hPx: number, seed: number): PondArt {
  const { frame, fw, padR, stage, pads } = pondGeometry(wPx, hPx);
  const base = { frame, fw, padR, stage, pads };
  const ink = sceneryContour(fw);

  // Deep water: two big soft masses, each cropped by a corner of the frame.
  const deep = ([
    [100, frame.h * 0.18],
    [0, frame.h * 0.62],
  ] as const).map(([cx, cy], i) => {
    const rnd = stream(seed, `deep-${i}`);
    const r = cfg.deepReach * fw;
    const pts: Pt[] = [];
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2;
      const m = 1 + 0.08 * Math.sin(2 * a + rnd() * 6) + 0.05 * Math.sin(3 * a + rnd() * 6);
      pts.push([cx + Math.cos(a) * r * 1.25 * m, cy + Math.sin(a) * r * 0.8 * m]);
    }
    return { d: closedPath(pts), pts };
  });

  // Banks: the dry ground along each side edge, full height, shaved clear of
  // every pad, wider toward the bottom corners and out to the pad column on a
  // wide screen.
  const banks: Bank[] = ([-1, 1] as const).map((side) => {
    const rnd = stream(seed, `bank-${side}`);
    const phase = rnd() * Math.PI * 2;
    const room = Math.max(0, stage.x0 - cfg.bankInset * fw); // free side margin, wide screens
    const n = 48;
    const edge: Pt[] = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const y = -fw + t * (frame.h + 2 * fw);
      const flare = cfg.bankFlare * fw * Math.max(0, (t - 0.55) / 0.45) ** 2;
      const sway = cfg.bankSway * fw * Math.sin(t * Math.PI * 3 + phase);
      const want = Math.max(cfg.bankReach * fw, room * cfg.bankShare) + flare + sway;
      const reach = Math.max(0.12 * fw, Math.min(want, bankLimit(side, y, base, cfg)));
      edge.push([side < 0 ? reach : 100 - reach, y]);
    }
    // Smooth the clamp's corners: a shore, not a stair.
    const smooth = edge.map((p, i) => {
      const a = edge[Math.max(0, i - 1)];
      const b = edge[Math.min(n, i + 1)];
      return [side < 0 ? Math.min(p[0], (a[0] + p[0] + b[0]) / 3) : Math.max(p[0], (a[0] + p[0] + b[0]) / 3), p[1]] as Pt;
    });
    const out = side < 0 ? -fw : 100 + fw;
    const poly: Pt[] = [...smooth, [out, frame.h + fw], [out, -fw]];
    // The drop to the water: a band just inside the shoreline.
    const inner = smooth.map(([x, y]) => [x - side * 0.09 * fw, y] as Pt);
    const shade = closedPath([...smooth, ...[...inner].reverse()]);
    // Moss lobes along the water's edge, on the water side.
    const mossPts = lobedAlong(side < 0 ? smooth : [...smooth].reverse(), () => 0, cfg.mossLobe * fw, 0.5, rnd, -1);
    return {
      side,
      d: closedPath(poly),
      ink: grownContour(side < 0 ? poly : [...poly].reverse(), ink, houseLine.taper, houseLine.wobble, stream(seed, `bank-ink-${side}`)),
      shade,
      // back along the bank side, the opposite way to the lobes
      moss: mossPts.length > 2 ? closedPath([...mossPts, ...(side < 0 ? [...inner].reverse() : inner).map(([x, y]) => [x - side * 0.05 * fw, y] as Pt)]) : '',
      edge: smooth,
    };
  });

  const inWater = (x: number, y: number, margin: number) => {
    for (const [px, py] of pads) if (Math.hypot(px - x, py - y) < padR + margin) return false;
    for (const b of banks) {
      const e = b.edge.reduce((best, p) => (Math.abs(p[1] - y) < Math.abs(best[1] - y) ? p : best));
      if (b.side < 0 ? x < e[0] + margin : x > e[0] - margin) return false;
    }
    return x > 0 && x < 100 && y > 0 && y < frame.h;
  };

  // Ripples: short open arcs on open water, counts following the frame.
  const ripples: Ripple[] = [];
  const area = (100 * frame.h) / (fw * fw);
  const want = Math.round(area * cfg.rippleDensity);
  const rr = stream(seed, 'ripples');
  const cols = Math.max(1, Math.round(Math.sqrt((want * 100) / frame.h)));
  const rows = Math.max(1, Math.round(want / cols));
  for (const [x, y] of jitteredGrid(cols, rows, 100, frame.h, 0.7, rr)) {
    const len = cfg.rippleLength * fw * (0.8 + rr() * 0.4);
    if (!inWater(x, y, len * 0.6)) continue;
    const bow = len * 0.18;
    const pts = quadPts([x - len / 2, y], [x, y - bow], [x + len / 2, y + jitter(rr, bow * 0.4)], 10);
    ripples.push({ d: taperedOutline(pts, MARK_MAX * fw * 0.55, 0.5), light: rr() > 0.4 });
  }

  // Duckweed: a counted scatter of specks drifting off each bank.
  const duckweed: Speck[] = [];
  for (const b of banks) {
    const rd = stream(seed, `duckweed-${b.side}`);
    let tries = 0;
    let placed = 0;
    while (placed < cfg.duckweed && tries++ < cfg.duckweed * 20) {
      const e = b.edge[Math.floor(rd() * b.edge.length)];
      const x = e[0] - b.side * (0.15 + rd() * 0.9) * fw;
      const y = e[1] + jitter(rd, 0.3 * fw);
      const r = fw * (0.025 + rd() * 0.025);
      if (inWater(x, y, r * 2)) {
        duckweed.push({ x, y, r });
        placed++;
      }
    }
  }

  return { ...base, deep, banks, ripples, duckweed };
}

/**
 * The shape-class rules, as violations. Empty means the config is legal at this
 * viewport. Run at every shipped frame by `pond-art.test.ts` and live in the lab.
 */
export function check(art: PondArt, cfg: PondConfig): string[] {
  const out: string[] = [];
  const { fw, pads, padR, frame } = art;
  for (const b of art.banks) {
    for (const [x, y] of b.edge) {
      for (const [px, py] of pads) {
        if (Math.hypot(px - x, py - y) < padR + cfg.padClearance * fw * 0.95) {
          out.push(`the ${b.side < 0 ? 'left' : 'right'} bank crowds a pad at y ${y.toFixed(1)}`);
          break;
        }
      }
    }
  }
  for (const d of art.deep) {
    const xs = d.pts.map((p) => p[0]);
    const ys = d.pts.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs);
    if (w < MASS_MIN * fw) out.push(`a deep-water mass is ${(w / fw).toFixed(2)} frogs wide, under ${MASS_MIN}`);
    const cropped = Math.min(...xs) < 0 || Math.max(...xs) > 100 || Math.min(...ys) < 0 || Math.max(...ys) > frame.h;
    if (!cropped) out.push('a deep-water mass stops inside the frame: a sticker');
  }
  for (const s of art.duckweed) if (s.r * 2 > MARK_MAX * fw) out.push(`a duckweed speck is ${((s.r * 2) / fw).toFixed(2)} frogs, over 1/8`);
  if (cfg.mossLobe * 2 > MARK_MAX) out.push(`a moss lobe is ${(cfg.mossLobe * 2).toFixed(2)} frogs, over 1/8`);
  return [...new Set(out)];
}
