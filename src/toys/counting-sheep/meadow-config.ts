/**
 * The meadow config — the deliverable the lab exists to produce.
 *
 * To change the scene, open the lab (`bun run dev`, then `/lab.html`), switch
 * the background to `meadow`, tune it in the FRAME view at BOTH aspects, hit
 * Save, and copy the `scenery.meadow` block back here — read out of
 * `src/lab/saved/*.json`, never eyeballed off a screenshot of the panel. The
 * generator itself lives in `meadow.ts` and is shared by the lab and the Toy, so
 * what moves between them is only these numbers.
 *
 * These are the composed starting values, not yet a harvest: the shape-class and
 * colour rules are settled and asserted, the taste is not. Every number here is
 * a knob in the lab.
 */

import type { MeadowConfig } from './meadow';

export const MEADOW: MeadowConfig = {
  groundY: 0.72,
  groundRelief: 0.09,
  bankCount: 2,
  bankSpread: 2.8,
  bankRise: 0.1,
  tuftDensity: 2.6,
  tuftHeight: 0.34,
  tuftWidth: 0.2,
  bladesPerTuft: 5,
  flowerDensity: 1.4,
  flowerLobe: 0.045,
  foreDepth: 0.14,
  foreHeight: 0.5,
  // The sun is placed to be CROPPED rather than centred. Its size is in Sheep,
  // so a wide frame shrinks it relative to the viewport — at 68/0.16 it cleared
  // every edge on a 16:10 desktop and read as a flat disc laid on the sky, which
  // is the sticker failure the crop rule exists to prevent. Cornered, it is cut
  // by the top and the right on both frames.
  // Held at the peer-size FLOOR and pushed into the corner. It cannot go smaller
  // without dropping into the 1/8-to-2.5 band the cloud clusters occupied, and on
  // a phone a Sheep is 46% of the width, so 2.5 Sheep is ~115 frame units against
  // a 100-unit frame — every legal disc is wider than the screen. The only lever
  // left is how much of it the frame cuts off, so it sits in the corner and reads
  // as a warm quadrant rather than as a disc laid on the sky. See the note in the
  // hand-off: the real fix for "the sun is too big" is a smaller Sheep.
  sunScale: 2.5,
  sunX: 96,
  sunY: 0.02,
  // Down from 0.3 — at that width it was a wedge crossing the corner rather than
  // a limb, and the leaf mass around it read as one sausage with a stick in it.
  boughThickness: 0.16,
  boughReach: 2.2,
  boughDrop: 0.1,
  lobeRatio: 0.09,
  lobeVariance: 0.55,
  // Down from 3.4. The fringe ballooned well past the limb and closed into a
  // single blob with no sky through it; foliage in this style reads because of
  // the gaps between clusters, not in spite of them.
  leafDepth: 2.3,
  moteCount: 3,
};

/**
 * The scene seed. Fixed, not random: the composition was COMPOSED — the Sheep
 * stands on the walking line this seed produces, and the bank stagger and the
 * sun's crop were judged at this value. A fresh seed each load would reroll the
 * picture the Toy was designed around.
 */
export const MEADOW_SEED = 4271;
