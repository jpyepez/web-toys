/**
 * The harvested canopy config — the deliverable the lab exists to produce.
 *
 * Read out of `src/lab/saved/robin-contour-4271.json`, not eyeballed off a
 * screenshot of the panel. To change the scene, open the lab (`bun run dev`,
 * then `/lab.html`), tune it in the frame view at BOTH aspects, hit Save, and
 * copy the `scenery.canopy` block back here. The generator itself lives in
 * `canopy.ts` and is shared by the lab and the Toy, so what moves between them
 * is only these numbers.
 */

import type { CanopyConfig } from './canopy';

export const CANOPY: CanopyConfig = {
  ceilingDepth: 0.22,
  ceilingRelief: 0.55,
  lobeRatio: 0.095,
  lobeVariance: 0.55,
  massCount: 4,
  massDepth: 0.15,
  limbDensity: 1,
  limbThickness: 0.115,
  limbReach: 3.4,
  limbRake: 0.1,
  twigCount: 3,
  leafDepth: 4.2,
  perchesPerLimb: 2,
  boughThickness: 0.46,
  understoryDepth: 0.13,
  moonScale: 3,
  moonX: 58,
  moonY: 0.44,
  moteCount: 3,
};

/**
 * The scene seed. Fixed, not random: the composition was COMPOSED — the birds
 * are placed on limbs this seed produces, and the perch spread and the moon's
 * crop through the leaves were both judged at this value. A fresh seed each load
 * would reroll the picture the toy was designed around.
 */
export const CANOPY_SEED = 4271;
