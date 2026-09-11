/**
 * A balloon's rendered size, and the one number that converts "where the scene
 * ties its strings" into "where this drawing goes".
 *
 * WHY THIS IS ITS OWN MODULE. Three things need these: the drawing that renders
 * a balloon, the scene generator that sizes every cloud, bank and blade against
 * one (`sky.ts`), and the Toy that stands the bunch on the peg. The generator is
 * pure geometry and must not import a component to get them, and the two
 * restating the same clamp is exactly how a scene silently changes class as the
 * frame grows — the failure the Nestlings canopy shipped when a bough authored
 * in frame units came out as a wall on a desktop. One module, read by all three.
 *
 * IT USED TO BE `min(230px, 58vw)`, which pins a balloon at 230px on any screen
 * wider than 400px: 59% of a phone's width and 16% of a 1440px desktop's. Five
 * of those at 59% cannot be a bunch on a phone without burying each other, and
 * the upper clamp is what lets a big viewport get a bigger balloon — and,
 * because the sky is measured in balloons, a proportionally bigger scene with
 * fewer, larger elements, which is calmer rather than busier. The lower bound
 * keeps the tap target generous on the narrowest phones: at 96px the painted
 * balloon is ~86px across, twice the 44px touch minimum.
 */

export const BALLOON_WIDTH = 'clamp(96px, 28vw, 190px)';
export const BALLOON_MIN_PX = 96;
export const BALLOON_VW = 0.28;
export const BALLOON_MAX_PX = 190;

/** The drawing's own box. Taller than wide, because a balloon on a string is. */
export const VB_W = 100;
export const VB_H = 132;
/** The aspect the layer above has to preserve when it places this drawing. */
export const BALLOON_ASPECT = VB_H / VB_W;

/**
 * Where the KNOT sits inside the box — the point the string leaves from, and the
 * point the scene's anchors address.
 *
 * It is the balloon's equivalent of the Sheep's `FOOT_FRACTION`, and it is load
 * bearing for the same reason: the body scales with `fill` about this point, so
 * the knot is the one part of the drawing that does not move as a balloon
 * inflates. Anchoring anywhere else would slide the whole bunch up the screen as
 * the child fills it.
 */
export const KNOT_Y = 104;
export const KNOT_FRACTION = KNOT_Y / VB_H;

/**
 * How far below the drawing's TOP edge the knot sits, as a multiple of the
 * balloon's rendered WIDTH.
 *
 * Expressed against width rather than height because width is what CSS is given
 * (`BALLOON_WIDTH`); the height follows from the viewBox aspect. Deriving it
 * here rather than restating it in the Toy is what keeps the strings on the peg
 * when the drawing's proportions change.
 */
export const KNOT_OFFSET = BALLOON_ASPECT * KNOT_FRACTION;

/** A balloon's width in frame units, mirroring the `BALLOON_WIDTH` clamp. */
export function balloonWidthInFrame(px: { w: number; h: number }): number {
  const balloonPx = Math.min(BALLOON_MAX_PX, Math.max(BALLOON_MIN_PX, px.w * BALLOON_VW));
  return (balloonPx / px.w) * 100;
}
