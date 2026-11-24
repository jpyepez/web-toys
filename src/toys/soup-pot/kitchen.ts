/**
 * The kitchen — the scene generator for "a soup pot on a counter, seen from
 * straight above, with three mice peeking over its rim".
 *
 * ONE GENERATOR, READ BY EVERYTHING THAT NEEDS A POSITION. The backdrop draws
 * the counter, towel and pot; the soup, swirls, bubbles and steam sit inside the
 * pot's rim; the ladle pivots on the pot's centre; the mice stand on the rim
 * points this emits; the ghost finger circles the same centre; the Card preview
 * evaluates the same function into its own frame.
 *
 * THE POT IS AT THE FRAME'S CENTRE, ALWAYS. The Stir measures angle around the
 * centre of the Toy's root, which is the viewport. Putting the pot anywhere else
 * would make the circle a child draws on the pot and the circle the Toy counts
 * two different circles.
 *
 * THE CAMERA. Straight down. The ladle turns flat in the screen plane, and the
 * circle the child draws is the rim's own circle. The mice cheat the camera the
 * way picture books do — their faces turn up toward the viewer, chins on the
 * rim, bodies hidden behind the pot — because a mouse seen from directly above
 * is an unreadable oval with ears.
 *
 * Sorted by shape class, with a MOUSE as the unit:
 *
 *   | class                 | shape                              | rival? |
 *   | jar, plate, bowl, lid | convex, closed, mouse-sized        | YES    |
 *   | ladle bowl (closed)   | convex, closed, ~half a mouse      | YES    |
 *   | ladle (handle + rim)  | elongated, open                    | no     |
 *   | grain, swirl, steam   | elongated, open                    | no     |
 *   | bubble                | ≤ 1/8 mouse, part of a counted mass| no     |
 *   | towel                 | ≥ 2.5, cropped by a frame corner   | no     |
 *   | the pot               | closed, ≥ 2.5, IS the toy          | no (the one exception) |
 *
 * So: no jars, no spoons on the counter, no lid, and the ladle's bowl is drawn
 * as the open rim of a bowl dipping into the soup rather than a closed cup.
 *
 * THE ONE MASS THAT IS NOT CROPPED, AND WHY. The house style crops every mass
 * at a frame edge so nothing reads as a sticker. The pot can't be: the whole rim
 * is the circle being stirred, and a 16:10 window is far wider than a pot. What
 * keeps it from being a sticker or a rival is (a) size — `check()` holds it at
 * 2.5 mice across or more at every frame; (b) its shadow on the counter, so it
 * sits ON something; and (c) the mice overlapping its rim and the ladle
 * overlapping it, so it is part of the picture rather than laid on top. Cropping
 * comes from the towel, which is cut by a frame corner.
 *
 * FRAME SPACE. Authored in a `0..100` x `0..h` box whose aspect matches the
 * viewport. Every SIZE is a multiple of `mw`, a mouse's width in frame units;
 * only POSITIONS are frame fractions. Pot-local geometry (soup, swirls,
 * bubbles, steam, ladle, blorp) is authored around the origin so the Toy can
 * rotate and animate it about the pot's centre.
 */

import { blob, closedPath, contourRing, polygonPath, quadPts, ribbon, taperedOutline, type Pt } from '../../shell/art/geometry';
import { disorder, line as houseLine } from '../../shell/art/house';
import { jitter, jitteredGrid, stream } from '../../shell/art/rng';
import { MOUSE_KINDS, type MouseKind } from './palette';

/** Scenery contour as a fraction of the cast's. The contour belongs to the figure. */
const SCENERY_CONTOUR_RATIO = 0.5;
/** The cast's contour, per mouse width (a mouse is drawn in a 100-wide box). */
const CAST_CONTOUR_PER_MW = houseLine.contour / 100;
/**
 * The ladle's line as a fraction of the cast's. It is the prop under the
 * child's finger, so it gets more line than the scenery — but never as much as
 * a mouse: the contour belongs to the figure.
 */
const LADLE_CONTOUR_RATIO = 0.75;

/**
 * How far above its paws a mouse reaches (to the tips of its ears), and where
 * its head's centre sits, in mice. Mirrors `MouseDrawing`'s 100x100 box, whose
 * paws are at y 90 and head centre at y 52.
 */
export const MOUSE_REACH = 0.9;
export const MOUSE_HEAD_ABOVE_PAWS = 0.38;
export const MOUSE_HEAD_R = 0.32;

/** A bubble's widest diameter, in mice — under 1/8, so it is a mark in a mass. */
export const BUBBLE_MAX_D = 0.11;
/** Line widths for open marks, in mice. */
const GRAIN_W = 0.035;
const SWIRL_W = 0.07;
const STEAM_W = 0.13;

export type Frame = { w: number; h: number };

/** Every taste decision in the kitchen. The rules are hardcoded; these are tuned in the lab. */
export type KitchenConfig = {
  /** Largest the pot may be, as a fraction of the frame's width. */
  potWidth: number;
  /** Largest the pot may be, as a fraction of the frame's height. */
  potHeight: number;
  /** The rim's width, as a fraction of the pot's radius. */
  rimWidth: number;
  /** How much inner wall shows above the soup, as a fraction of the inner radius. */
  wallShow: number;
  /** The angle between neighbouring mice around the top of the rim, in degrees. */
  mouseSpread: number;
  /** How far the pot's shadow falls on the counter, in mice. */
  shadowDrop: number;
  /** Grain marks per square mouse of counter. */
  grainDensity: number;
  /** A grain mark's length, in mice. */
  grainLength: number;
  /** How far the towel reaches in from its corner, in mice (≥ 2.5). */
  towelReach: number;
  /** Bubbles in the soup once it bubbles. */
  bubbleCount: number;
  /** Steam wisps once it steams. */
  steamCount: number;
  /** Wisps in the Outro's blorp. */
  blorpCount: number;
};

export const KITCHEN_DEFAULTS: KitchenConfig = {
  potWidth: 0.86,
  potHeight: 0.6,
  rimWidth: 0.1,
  wallShow: 0.1,
  mouseSpread: 58,
  shadowDrop: 0.14,
  grainDensity: 0.3,
  grainLength: 0.9,
  towelReach: 2.8,
  bubbleCount: 11,
  steamCount: 3,
  blorpCount: 11,
};

export type Mouse = {
  kind: MouseKind;
  /** Where its paws rest on the rim — the mouse's anchor. */
  at: Pt;
  /** Its head's centre. */
  head: Pt;
};

export type Bubble = { x: number; y: number; r: number; d: string; delay: number };

export type KitchenArt = {
  frame: Frame;
  mw: number;
  /** The pot's centre: the frame's centre, and the Stir's. */
  centre: Pt;
  /** The rim's outer radius. */
  potR: number;
  /** The rim's inner radius. */
  innerR: number;
  /** The soup surface's radius. */
  soupR: number;
  counter: { grain: string[] };
  towel: { d: string; ink: string; stripes: string[]; pts: Pt[] };
  pot: {
    shadow: string;
    ink: string;
    rim: string;
    rimShade: string;
    innerInk: string;
    inner: string;
    innerShade: string;
    handles: Array<{ d: string; ink: string }>;
  };
  /** Pot-local (around the origin). */
  soup: { d: string; edge: string; swirls: string[]; bubbles: Bubble[] };
  /** Pot-local. Each wisp rises from the soup; the Toy animates them. */
  steam: string[];
  /** Pot-local. Drawn pointing along +x; the Toy rotates it to the finger. */
  ladle: { handle: string; handleInk: string; bowl: string; bowlInk: string; length: number };
  /** Pot-local. The Outro's burst of steam, radiating from the centre. */
  blorp: string[];
  mice: Mouse[];
  /**
   * The VISIBLE ink each kind of line carries, per side, in frame units —
   * reported so the tests can hold every one under the cast's. A ring drawn
   * under its fill shows only its outer half; one drawn on top shows all of it.
   */
  lines: { cast: number; pot: number; inner: number; handle: number; towel: number; soupEdge: number; ladle: number };
};

const deg = (d: number) => (d * Math.PI) / 180;

/** A ring between two radii, as one evenodd path. */
function ringPath(outer: Pt[], inner: Pt[]): string {
  return `${closedPath(outer)} ${closedPath([...inner].reverse())}`;
}

/** Points along an arc of radius `r` from `a0` to `a1` (radians), about the origin. */
function arcPts(r: number, a0: number, a1: number, n = 14): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = a0 + ((a1 - a0) * i) / n;
    return [Math.cos(t) * r, Math.sin(t) * r] as Pt;
  });
}

export function potRadius(cfg: KitchenConfig, frame: Frame): number {
  return Math.min((cfg.potWidth * frame.w) / 2, (cfg.potHeight * frame.h) / 2);
}

export function buildKitchen(cfg: KitchenConfig, frame: Frame, mw: number, seed: number): KitchenArt {
  const cx = frame.w / 2;
  const cy = frame.h / 2;
  const potR = potRadius(cfg, frame);
  const innerR = potR * (1 - cfg.rimWidth);
  const soupR = innerR * (1 - cfg.wallShow);
  // A mouse's contour ring is drawn under its fill, so half of it shows.
  const castLine = (CAST_CONTOUR_PER_MW * mw) / 2;
  const sceneryLine = castLine * SCENERY_CONTOUR_RATIO;
  const ladleLine = castLine * LADLE_CONTOUR_RATIO;

  /* --- the counter's grain: short open marks, scattered by blue noise ---- */
  const rGrain = stream(seed, 'kitchen-grain');
  const area = (frame.w * frame.h) / (mw * mw);
  const grainN = Math.round(area * cfg.grainDensity);
  const cols = Math.max(1, Math.round(Math.sqrt((grainN * frame.w) / frame.h)));
  const rows = Math.max(1, Math.round(grainN / cols));
  const grain: string[] = [];
  for (const [gx, gy] of jitteredGrid(cols, rows, frame.w, frame.h, 0.8, rGrain)) {
    const len = mw * cfg.grainLength * (0.7 + rGrain() * 0.6);
    const sag = jitter(rGrain, mw * 0.06);
    const a: Pt = [gx - len / 2, gy];
    const b: Pt = [gx + len / 2, gy + jitter(rGrain, mw * 0.04)];
    grain.push(taperedOutline(quadPts(a, [gx, gy + sag], b, 10), mw * GRAIN_W, 0.4 + rGrain() * 0.2));
  }

  /* --- the towel: cut by the bottom-right corner, never whole on screen ---- */
  const rTowel = stream(seed, 'kitchen-towel');
  const reach = cfg.towelReach * mw;
  const tilt = deg(-28 + jitter(rTowel, 4));
  const ux: Pt = [Math.cos(tilt), Math.sin(tilt)];
  const uy: Pt = [-Math.sin(tilt), Math.cos(tilt)];
  // A tilted slab whose near corner pokes in from the frame corner.
  const corner: Pt = [frame.w + mw * 0.6, frame.h + mw * 0.6];
  const inward: Pt = [-Math.SQRT1_2, -Math.SQRT1_2];
  const c0: Pt = [corner[0] + inward[0] * reach, corner[1] + inward[1] * reach];
  const half = reach * 0.9;
  const slab = (s: number, t: number): Pt => [c0[0] + ux[0] * s + uy[0] * t, c0[1] + ux[1] * s + uy[1] * t];
  // A rounded square (a superellipse): cloth has soft corners, and a sharp
  // vertex is where every contour primitive tears or juts.
  const towelPts: Pt[] = [];
  const sides = 48;
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const e = 2 / 7;
    const s0 = Math.sign(c) * Math.pow(Math.abs(c), e) * half;
    const t0 = Math.sign(sn) * Math.pow(Math.abs(sn), e) * half;
    towelPts.push(slab(s0 + jitter(rTowel, mw * 0.015), t0 + jitter(rTowel, mw * 0.015)));
  }
  const stripe = (t: number, w: number) =>
    polygonPath(ribbon([slab(-half * 1.1, t), slab(half * 1.1, t)], () => w / 2));
  const towel = {
    d: closedPath(towelPts),
    ink: contourRing(towelPts, sceneryLine * 2, houseLine.taper, houseLine.wobble, stream(seed, 'kitchen-towel-ink')),
    stripes: [stripe(-half * 0.55, mw * 0.16), stripe(-half * 0.3, mw * 0.07)],
    pts: towelPts,
  };

  /* --- the pot ----------------------------------------------------------- */
  const rPot = stream(seed, 'kitchen-pot');
  const outer = blob(cx, cy, potR, potR, disorder.blobAmp * 0.25, rPot, 64).pts;
  const inner = blob(cx, cy, innerR, innerR, disorder.blobAmp * 0.2, rPot, 64).pts;
  const drop = cfg.shadowDrop * mw;
  const shadow = blob(cx + drop * 0.8, cy + drop, potR * 1.02, potR * 1.02, disorder.blobAmp * 0.3, rPot, 48).d;
  // The rim's away side (light from the upper left): the rim minus a copy of
  // itself nudged toward the light leaves a crescent that follows its own edge.
  const nudge = potR * 0.05;
  const rimShade = `${closedPath(outer)} ${closedPath(outer.map(([x, y]) => [x - nudge, y - nudge] as Pt))}`;
  // Inside, the shadow falls the other way: the wall nearest the light is shaded.
  const innerShade = `${closedPath(inner)} ${closedPath(inner.map(([x, y]) => [x + innerR * 0.09, y + innerR * 0.09] as Pt))}`;
  // A loop handle seen from above: out from the rim, across, and back in — an
  // open U, so it is an elongated mark and never a closed rival.
  const handle = (side: -1 | 1) => {
    const mid = side > 0 ? 0 : Math.PI;
    const half = deg(13);
    const rIn = potR * 0.97;
    const rOut = potR + mw * 0.32;
    const at = (a: number, r: number): Pt => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    const pts: Pt[] = [
      ...quadPts(at(mid - half, rIn), at(mid - half * 1.05, rOut), at(mid, rOut + mw * 0.04), 8),
      ...quadPts(at(mid, rOut + mw * 0.04), at(mid + half * 1.05, rOut), at(mid + half, rIn), 8).slice(1),
    ];
    const w = mw * 0.12;
    return { d: polygonPath(ribbon(pts, () => w / 2)), ink: polygonPath(ribbon(pts, () => w / 2 + sceneryLine)) };
  };
  const pot = {
    shadow,
    // The pot's outline gets a little more than the rest of the scenery — it is
    // the one mass that isn't cropped — and still well under the cast's.
    ink: contourRing(outer, sceneryLine * 1.4 * 2, houseLine.taper, houseLine.wobble, stream(seed, 'kitchen-pot-ink')),
    rim: ringPath(outer, inner),
    rimShade,
    // Drawn on top of the inner wall, so its whole width shows.
    innerInk: contourRing(inner, sceneryLine, houseLine.taper, houseLine.wobble, stream(seed, 'kitchen-inner-ink')),
    inner: closedPath(inner),
    innerShade,
    handles: [handle(-1), handle(1)],
  };

  /* --- the soup, pot-local ------------------------------------------------ */
  const rSoup = stream(seed, 'kitchen-soup');
  const soupPts = blob(0, 0, soupR, soupR, disorder.blobAmp * 0.3, rSoup, 48).pts;
  const swirls = [0.32, 0.56, 0.8].map((f, i) => {
    const a0 = deg(i * 130 + jitter(rSoup, 15));
    const span = deg(80 + rSoup() * 40);
    return taperedOutline(arcPts(soupR * f, a0, a0 + span, 12), mw * SWIRL_W, 0.4);
  });
  const rBub = stream(seed, 'kitchen-bubbles');
  const bubbles: Bubble[] = [];
  for (let i = 0; i < cfg.bubbleCount; i++) {
    // A sunflower spread keeps them from clumping; jitter keeps it from reading as a pattern.
    const t = (i + 0.5) / cfg.bubbleCount;
    const rr = soupR * 0.82 * Math.sqrt(t) + jitter(rBub, mw * 0.05);
    const a = i * 2.39996 + jitter(rBub, 0.3);
    const r = (mw * BUBBLE_MAX_D * (0.55 + rBub() * 0.45)) / 2;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    const ring = blob(x, y, r, r, 0.05, rBub, 10).pts;
    const hole = blob(x - r * 0.15, y - r * 0.15, r * 0.55, r * 0.55, 0.05, rBub, 10).pts;
    bubbles.push({ x, y, r, d: ringPath(ring, hole), delay: rBub() });
  }
  const soup = {
    d: closedPath(soupPts),
    edge: contourRing(soupPts, sceneryLine, 0.2, houseLine.wobble, stream(seed, 'kitchen-soup-ink')),
    swirls,
    bubbles,
  };

  /* --- steam, pot-local: wavy wisps rising from the soup ------------------ */
  const rSteam = stream(seed, 'kitchen-steam');
  const steam: string[] = [];
  for (let i = 0; i < cfg.steamCount; i++) {
    // Wisps start on the far half of the soup and rise up past the rim, so
    // they read as steam climbing out of the pot, not as marks on the soup.
    const x0 = (i - (cfg.steamCount - 1) / 2) * soupR * 0.42 + jitter(rSteam, mw * 0.08);
    const y0 = -soupR * 0.1 + jitter(rSteam, mw * 0.1);
    const len = soupR * 0.9 + mw * (0.6 + rSteam() * 0.4);
    const sway = mw * 0.16 * (rSteam() < 0.5 ? -1 : 1);
    const pts: Pt[] = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      pts.push([x0 + Math.sin(t * Math.PI * 2) * sway * (0.4 + t), y0 - t * len]);
    }
    steam.push(taperedOutline(pts, mw * STEAM_W, 0.35));
  }

  /* --- the ladle, pot-local, pointing along +x --------------------------- */
  // The bowl sits inward, toward the centre, so the finger never hides it; the
  // handle runs out past the rim to where the finger is.
  const bowlAt = soupR * 0.3;
  const length = potR + mw * 0.45;
  const handlePts = quadPts([bowlAt + mw * 0.12, 0], [(bowlAt + length) / 2, -mw * 0.05], [length, mw * 0.02], 14);
  const handleW = (t: number) => mw * (0.055 + 0.03 * t);
  const handleBand = ribbon(handlePts, handleW);
  const handleInkBand = ribbon(handlePts, (t) => handleW(t) + ladleLine);
  // The bowl: the open rim of a cup dipping into the soup, a U facing the handle.
  const bowlR = mw * 0.24;
  const bowlArc = arcPts(bowlR, deg(55), deg(305), 16).map(([x, y]) => [bowlAt + x, y] as Pt);
  const ladle = {
    handle: polygonPath(handleBand),
    handleInk: polygonPath(handleInkBand),
    bowl: taperedOutline(bowlArc, mw * 0.11, 0.5),
    bowlInk: taperedOutline(bowlArc, mw * 0.11 + ladleLine * 2, 0.5),
    length,
  };

  /* --- the blorp, pot-local: wisps radiating outward --------------------- */
  const rBlorp = stream(seed, 'kitchen-blorp');
  const blorp: string[] = [];
  for (let i = 0; i < cfg.blorpCount; i++) {
    const a = (i / cfg.blorpCount) * Math.PI * 2 + jitter(rBlorp, 0.2);
    const r0 = soupR * 0.35;
    const r1 = potR + mw * (1.2 + rBlorp() * 0.8);
    const bend = jitter(rBlorp, 0.35);
    const pts: Pt[] = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      const rr = r0 + (r1 - r0) * t;
      const aa = a + bend * Math.sin(t * Math.PI);
      pts.push([Math.cos(aa) * rr, Math.sin(aa) * rr]);
    }
    blorp.push(taperedOutline(pts, mw * 0.2, 0.3));
  }

  /* --- the mice, peeking over the top of the rim ------------------------- */
  const mice: Mouse[] = MOUSE_KINDS.map((kind, i) => {
    const a = deg(-90 + (i - 1) * cfg.mouseSpread);
    const at: Pt = [cx + Math.cos(a) * potR * 0.96, cy + Math.sin(a) * potR * 0.96];
    return { kind, at, head: [at[0], at[1] - MOUSE_HEAD_ABOVE_PAWS * mw] };
  });

  return {
    frame,
    mw,
    centre: [cx, cy],
    potR,
    innerR,
    soupR,
    counter: { grain },
    towel,
    pot,
    soup,
    steam,
    ladle,
    blorp,
    mice,
    lines: {
      cast: castLine,
      pot: sceneryLine * 1.4,
      inner: sceneryLine,
      handle: sceneryLine,
      towel: sceneryLine,
      soupEdge: sceneryLine,
      ladle: ladleLine,
    },
  };
}

/* ------------------------------------------------------------------ *
 * The self-audit
 * ------------------------------------------------------------------ */

/**
 * The shape-class and composition rules, as violations. Empty means the config
 * is legal at a mouse width of `mw` frame units — evaluated by the tests at every
 * frame the Toy ships into, and live in the lab.
 */
export function check(cfg: KitchenConfig, mw: number, frame: Frame = { w: 100, h: 216 }): string[] {
  const out: string[] = [];
  const potR = potRadius(cfg, frame);
  if ((potR * 2) / mw < 2.5) out.push(`pot ${((potR * 2) / mw).toFixed(2)} mice across is in the rival band`);
  if (cfg.towelReach < 2.5) out.push('a towel under 2.5 mice is a rival');
  if (BUBBLE_MAX_D > 0.125) out.push('bubbles big enough to count as objects');
  if (cfg.grainLength * 1.3 * mw > frame.w * 0.6) out.push('grain long enough to read as a rule across the picture');
  // The top mouse's ears must stay in the frame — a cropped face is not a cast member.
  const topEars = frame.h / 2 - potR * 0.96 - MOUSE_REACH * mw;
  if (topEars < 0) out.push('the top mouse is cropped by the frame');
  // Neighbouring mice must not overlap each other.
  const gap = 2 * potR * 0.96 * Math.sin(deg(cfg.mouseSpread) / 2);
  if (gap < mw * 0.95) out.push(`mice ${(gap / mw).toFixed(2)} apart overlap`);
  return out;
}
