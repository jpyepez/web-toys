/**
 * The house style — harvested verbatim from `src/lab/saved/bluebird-contour-4271.json`.
 *
 * These are cross-Toy primitives in the ADR-0004 sense: the paper the whole
 * collection is printed on, the contour ink, how a shadow is derived, how much
 * disorder every repeated element carries. They are NOT scene content — each Toy
 * still owns its own sky, ground and cast (`toys/<toy>/palette.ts`), and nothing
 * here names a meadow, a dusk or an ocean.
 *
 * The rules these encode, and why each one is here rather than hand-tuned per Toy:
 *
 *  - **Paper is the lightest surface in the app, and nothing is pure white.**
 *    A highlight is the paper showing through, never `#fff`.
 *  - **Ink is a warm near-black, never `#000`.** A true black contour against a
 *    coloured fill is the harshest combination available; Dick Bruna gets away
 *    with black only because his fills are saturated, which `castChroma` keeps.
 *  - **Shadows are a formula.** `shade()` rotates the hue toward the ambient and
 *    holds or raises chroma. Adding black kills chroma and produces the muddy
 *    look this collection is trying to leave behind.
 *  - **Siblings share lightness and chroma and differ only in hue.** Authoring in
 *    OKLCH is what makes that statement true rather than aspirational — `hsl()`'s
 *    L is a channel midpoint, not a lightness, which is how the Balloons sky
 *    ended up perceptually lighter than the balloon in front of it.
 */

import type { Oklch } from './oklch';

/** The ground every colour in the collection sits on. Never pure white. */
export const paper: Oklch = { l: 0.94, c: 0.018, h: 85 };

/** The contour ink. Warm near-black — RULE 3 caps ink at L 0.35. */
export const ink: Oklch = { l: 0.24, c: 0.03, h: 40 };

/**
 * Shared lightness and chroma for every Critter in the collection, so a cast
 * reads as a family and a Critter never dissolves into its own backdrop. A Toy
 * picks only the HUE per Critter.
 */
export const cast = {
  /**
   * Down from 0.68, and the change came out of measuring rather than taste.
   *
   * A Critter is dragged across the WHOLE frame, so its legibility is set by the
   * WORST contrast anywhere it can go, never the average — and a minimum over a
   * region is exactly what looking at a screenshot misses, because the mush zone
   * is a small part of the frame and you never happen to park a bird in it.
   *
   * On a light ground the binding constraint is not the field but the halftone
   * DOTS, which sit below it: a bird is measured against the dots it actually
   * overlaps. 0.50 clears the dots by the floor and the field by the target.
   */
  lightness: 0.5,
  chroma: 0.135,
  /**
   * Raised from 0.12, which was a number I picked rather than derived, and which
   * the shipped palette was passing by one hundredth.
   *
   * 0.30 is roughly WCAG's 3:1 floor for non-text contrast; 0.40 is the target,
   * because contrast sensitivity roughly DOUBLES between age four and adulthood
   * at the coarse spatial scale a whole critter is detected at. An adult
   * reviewing this screen is a systematically optimistic instrument.
   */
  minBackdropDeltaL: 0.3,
  targetBackdropDeltaL: 0.4,
  /**
   * Small background objects — the nest, a branch — are held to a different
   * rule. Requiring a large ΔL against every square unit of a small target the
   * critter is meant to LAND on is over-application; what must hold there is
   * that the INK clears it, so the silhouette reads even where the fill doesn't.
   */
  minInkDeltaL: 0.3,
} as const;

/**
 * Line weights, as ratios rather than absolutes so they scale with a Toy's
 * viewBox. Three tiers, each owning exactly one structural meaning — contour,
 * feature, detail. Using one weight for two meanings is what reads as a vector
 * default rather than a drawing.
 */
export const line = {
  contour: 2.6,
  /** Feature lines (a wing's edge) sit at ~0.62 of the contour. */
  featureRatio: 0.62,
  detail: 1.05,
  /** How much heavier a contour gets on a form's underside. */
  taper: 0.42,
  /** The hand. Bruna kept his brush's wobble deliberately and named it. */
  wobble: 0.14,
} as const;

/** RULE 8 — the shadow formula, applied through `shade()`, never picked by eye. */
export const shading = {
  occlusionDl: 0.12,
  occlusionHueRotate: 24,
  occlusionDc: 0.02,
  contactStrength: 0.5,
} as const;

/** RULE 5 & 7 — Molnár's 1% disorder, and the break from bilateral symmetry. */
export const disorder = {
  blobAmp: 0.035,
  instanceRotate: 3,
  instanceScale: 0.05,
  instanceHue: 5,
  asymmetry: 1,
} as const;

/** RULE 10 — the static, screen-space paper grain. Never animated, never scaled. */
export const print = {
  grainFrequency: 0.72,
  grainOpacity: 0.14,
  plateOpacity: 0.93,
} as const;
