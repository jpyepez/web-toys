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
/** A Pull at least this long (DOM px) leaps two pads rather than one. */
export const LONG_PULL_PX = 110;
/** The frog stretches no further than this (DOM px), however far the finger goes. */
export const MAX_PULL_PX = 150;

/** How many pads a Pull of `distance` px leaps: 0 for a tap, 1, or 2. */
export function padsForPull(distance: number): 0 | 1 | 2 {
  if (distance < MIN_PULL_PX) return 0;
  return distance >= LONG_PULL_PX ? 2 : 1;
}

/**
 * The pad a Pull lands on. Always a real pad, never behind `from`, and never
 * past the last one: progress only moves forward and the frog can't miss.
 */
export function landingPad(from: number, distance: number): number {
  return Math.min(LAST_PAD, Math.max(0, from) + padsForPull(distance));
}

/** How loaded the spring is, 0–1: the pull's length against the cap. */
export function stretchOf(distance: number): number {
  return Math.min(1, Math.max(0, distance) / MAX_PULL_PX);
}
