/**
 * Pond Leap's pure rules: where the lily pads are, and how far a Pull sends the
 * frog. No React here, so the rules are testable without a DOM.
 */

/** A point as a fraction of the stage (0–1 across, 0–1 down). */
export type Pad = readonly [x: number, y: number];

/**
 * The winding path of six lily pads, from the bottom edge to the top. The frog
 * starts on the first and the Goal is the last. Positions are fractions of the
 * stage; sizes are CSS (see `PAD_WIDTH`), so a wide screen gets the same pond
 * in a centred column, never a stretched one.
 */
export const PADS: readonly Pad[] = [
  [0.5, 0.86],
  [0.3, 0.7],
  [0.68, 0.56],
  [0.34, 0.42],
  [0.66, 0.28],
  [0.4, 0.13],
];
export const LAST_PAD = PADS.length - 1;

/** A pad's width, and the frog's, as CSS lengths — both follow the viewport. */
export const PAD_WIDTH = 'clamp(96px, 28vw, 150px)';
export const FROG_WIDTH = 'clamp(60px, 17vw, 92px)';
/** The widest the stage gets: a phone-shaped column, centred on a wide screen. */
export const STAGE_MAX_WIDTH_PX = 540;

/** A Pull shorter than this (DOM px) is a tap, not a Pull: the frog stays put. */
export const MIN_PULL_PX = 28;
/** The frog stretches no further than this (DOM px), however far the finger goes. */
export const MAX_PULL_PX = 150;

/**
 * How many pads a Pull of `distance` px leaps: 0 for a tap, otherwise exactly 1.
 * Length never picks the pad: a child can't judge "two pads' worth" of pull, so
 * every real Pull goes to the next pad and length only loads the spring.
 */
export function padsForPull(distance: number): 0 | 1 {
  return distance < MIN_PULL_PX ? 0 : 1;
}

/**
 * The pad a Pull lands on: the next one, or the same pad for a tap. Never
 * behind `from` and never past the last: progress only moves forward.
 */
export function landingPad(from: number, distance: number): number {
  return Math.min(LAST_PAD, Math.max(0, from) + padsForPull(distance));
}

/**
 * The rail a Pull runs along on pad `from`, in degrees (screen axes, 0 = right,
 * 90 = down): straight back, directly away from the next pad, for a stage of
 * `w` × `h` px. The frog stretches only along it, whichever way the finger
 * goes, so the stretch always points where the frog will really fly.
 */
export function railAngle(from: number, w: number, h: number): number {
  const i = Math.min(Math.max(0, from), LAST_PAD - 1);
  const dx = (PADS[i][0] - PADS[i + 1][0]) * w;
  const dy = (PADS[i][1] - PADS[i + 1][1]) * h;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * How far (px) the frog is drawn back along the rail for a Pull of `distance`:
 * up to the cap, and never so far that it leaves the `w` × `h` stage. `margin`
 * keeps the whole frog on screen (its rough half-size). The rail on the first
 * pad points at the bottom edge, so this bites there.
 */
export function railReach(from: number, w: number, h: number, distance: number, margin: number): number {
  const a = (railAngle(from, w, h) * Math.PI) / 180;
  const [ux, uy] = [Math.cos(a), Math.sin(a)];
  const [x, y] = [PADS[from][0] * w, PADS[from][1] * h];
  let room = MAX_PULL_PX;
  if (ux > 1e-6) room = Math.min(room, (w - margin - x) / ux);
  if (ux < -1e-6) room = Math.min(room, (margin - x) / ux);
  if (uy > 1e-6) room = Math.min(room, (h - margin - y) / uy);
  if (uy < -1e-6) room = Math.min(room, (margin - y) / uy);
  return Math.max(0, Math.min(distance, room));
}

/** How loaded the spring is, 0–1: the pull's length against the cap. */
export function stretchOf(distance: number): number {
  return Math.min(1, Math.max(0, distance) / MAX_PULL_PX);
}
