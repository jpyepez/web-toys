/**
 * How big a Critter is, and where its feet are — the numbers the scene is
 * measured in.
 *
 * WHY THIS IS ITS OWN MODULE. Counting Sheep keeps the equivalent constants in
 * `SheepDrawing.tsx`, because there is exactly one Sheep component. This Toy has
 * FIVE drawings that must render at the same size and stand on the same line, so
 * the constants cannot live in any one of them without four files importing
 * their scale from a sibling animal. The scene imports them too — `barnyard.ts`
 * expresses every size as a multiple of a Critter — so a shared seam is the only
 * arrangement in which "a post is a third of a Critter" stays true.
 *
 * WHY THE WIDTH IS A CLAMP. It used to be `min(220px, 55vw)`, which pins a
 * Critter at 220px on any screen wider than 400px: 55% of a phone's width and
 * 15% of a 1440px desktop's. The upper bound lets a big viewport get a bigger
 * Critter — and, because the yard is measured in Critters, a proportionally
 * bigger scene with fewer, larger elements, which is calmer rather than busier.
 * The lower bound keeps the wipe target generous on the narrowest phones, which
 * matters more here than in any tap Toy: the whole interaction is a sustained
 * drag across the animal's own surface.
 */

/** The shipped width. Read by every drawing and mirrored by `useBarnyardScene`. */
export const CRITTER_WIDTH = 'clamp(150px, 50vw, 240px)';
export const CRITTER_MIN_PX = 150;
export const CRITTER_VW = 0.5;
export const CRITTER_MAX_PX = 240;

/**
 * The box every Critter is drawn in. One box for all five so their silhouettes
 * are directly comparable and the mud blanket's coordinates mean the same thing
 * on each — the blobs are authored per animal but in this shared space.
 */
export const VB_W = 100;
export const VB_H = 92;
/** The aspect the layer above has to preserve when it places a drawing. */
export const CRITTER_ASPECT = VB_H / VB_W;

/** Where the feet sit in the box, so a Critter can be stood on the trotting
 *  line rather than at a CSS multiplier tuned against nothing. */
export const FOOT_Y = 85;
export const FOOT_FRACTION = FOOT_Y / VB_H;

/**
 * How far below the drawing's TOP edge the feet sit, as a multiple of the
 * Critter's rendered WIDTH — the one number that converts "where the trotting
 * line is" into "where this element goes".
 *
 * Expressed against width rather than height because width is what CSS is given
 * (`CRITTER_WIDTH`); the height follows from the viewBox aspect. Deriving it
 * here rather than restating it in the Toy is what keeps a Critter on the ground
 * when the drawings' proportions change.
 */
export const FOOT_OFFSET = CRITTER_ASPECT * FOOT_FRACTION;

/** One fixed seed for the whole cast: the disorder is authored, not random. */
export const SEED = 4271;
