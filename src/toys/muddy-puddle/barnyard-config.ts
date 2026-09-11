/**
 * The barnyard config — the deliverable the lab exists to produce.
 *
 * To change the scene, open the lab (`bun run dev`, then `/lab.html`), switch
 * the background to `barnyard`, tune it in the FRAME view at BOTH aspects, hit
 * Save, and copy the `scenery.barnyard` block back here — read out of
 * `src/lab/saved/*.json`, never eyeballed off a screenshot of the panel. The
 * generator itself lives in `barnyard.ts` and is shared by the lab and the Toy,
 * so what moves between them is only these numbers.
 *
 * These are the composed starting values, not yet a harvest: the shape-class and
 * colour rules are settled and asserted, the taste is not. Every number here is
 * a knob in the lab.
 */

import type { BarnyardConfig } from './barnyard';

export const BARNYARD: BarnyardConfig = {
  groundY: 0.7,
  groundRelief: 0.08,
  bankCount: 2,
  bankSpread: 2.8,
  bankRise: 0.09,
  // Held above the peer-size floor and pushed off the left edge. It cannot go
  // smaller without dropping into the 1/8-to-2.5 band the old gable silhouette
  // occupied, and on a phone a Critter is 50% of the width, so 2.5 Critters is
  // ~125 frame units against a 100-unit frame — every legal barn is wider than
  // the screen. The only lever left is how much of it the frame cuts off, so it
  // enters at the left and reads as a wall rather than as a building.
  barnScale: 2.9,
  // Down from 0.42. The barn stays far past the peer-size floor — it is the
  // crop, not the scale, that was wrong. At 0.42 the visible wall was a flat
  // slab across the left 42% of both frames, and area is what the squint test
  // catches: a mid-dark mass that size competes with the cast for weight no
  // matter how correct each individual colour is.
  barnReach: 0.3,
  barnEave: 0.34,
  barnPitch: 0.26,
  fenceReach: 2.1,
  postHeight: 0.3,
  postWidth: 0.05,
  postDensity: 1.6,
  strawDensity: 2.4,
  strawHeight: 0.22,
  strawWidth: 0.13,
  bladesPerTuft: 5,
  // The pool the whole Toy is named after, and the shape most at risk of being
  // drawn "correctly" as a tidy oval. At 2.7 Critters it clears the cast's size
  // band, and the generator places its centre from its own radius so the right
  // edge always crops it.
  puddleSpread: 2.7,
  puddleFlat: 0.3,
  puddleDrop: 0.04,
  rippleCount: 4,
  foreDepth: 0.09,
  clodRadius: 0.04,
  moteCount: 3,
};

/**
 * The scene seed. Fixed, not random: the composition was COMPOSED — a Critter
 * stands on the trotting line this seed produces, the barn's crop and the fence
 * jitter were judged at this value. A fresh seed each load would reroll the
 * picture the Toy was designed around.
 */
export const BARNYARD_SEED = 4271;
