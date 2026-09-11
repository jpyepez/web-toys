/**
 * The sky config — the deliverable the lab exists to produce.
 *
 * To change the scene, open the lab (`bun run dev`, then `/lab.html`), switch
 * the background to `sky`, tune it in the FRAME view at BOTH aspects, hit Save,
 * and copy the `scenery.sky` block back here — read out of `src/lab/saved/*.json`,
 * never eyeballed off a screenshot of the panel. The generator itself lives in
 * `sky.ts` and is shared by the lab and the Toy, so what moves between them is
 * only these numbers.
 *
 * These are the composed starting values, not yet a harvest: the shape-class and
 * colour rules are settled and asserted, the taste is not. Every number here is
 * a knob in the lab.
 */

import type { SkyConfig } from './sky';

export const SKY: SkyConfig = {
  // LOW. The tall sky above is this Toy's load-bearing space — where the child
  // watches a balloon go — and the ground is only the thing it was tied to. This
  // is the one number that most decides whether the Toy reads as "up and away"
  // or as "a field with balloons in it".
  groundY: 0.86,
  groundRelief: 0.1,
  bankCount: 2,
  bankSpread: 2.8,
  bankRise: 0.055,
  // One bank on a phone, two once the frame is wide enough to hold a second
  // without the pair meeting in the middle — at which point they would stop
  // being two cropped corners and become one span across the top.
  cloudCount: 1.2,
  cloudSpan: 2.9,
  cloudDepth: 0.17,
  // Down from 0.085. That was under the check's 1/8-diameter ceiling and still
  // drew a rank of countable scallops along the underside — a mass whose lobes
  // can be counted is the puff readmitted as a row of small puffs, which is the
  // rival band arriving one octave down rather than being escaped.
  lobeRatio: 0.06,
  lobeVariance: 0.62,
  tuftDensity: 2.4,
  tuftHeight: 0.3,
  tuftWidth: 0.18,
  bladesPerTuft: 5,
  // Shallower than the meadow's 0.14, and shallower again after the squint test.
  // The ground band here is already thin by design, so a foreground at the
  // meadow's depth eats most of it and the two read as one mass; worse, at 0.1
  // of a phone's height the two corner masses greyscaled as dark as the balloons
  // themselves, which is an AREA failure no per-colour rule can catch.
  foreDepth: 0.06,
  foreHeight: 0.42,
  pegHeight: 0.7,
  pegThickness: 0.1,
  pegX: 0.5,
  // The fan, in balloons. `bunchSpread` is the upper row's span and `bunchRise`
  // how far it floats above the peg — together they put the bunch across the
  // reachable middle of a phone (roughly 43% to 80% of viewport height): clear
  // of the bottom palm-rest dead zone where a thumb rests, clear of the top
  // safe-area, and leaving the top ~40% of the frame as open sky.
  bunchSpread: 2.2,
  bunchRise: 1.8,
  bunchStagger: 0.9,
  moteCount: 3,
};

/**
 * The scene seed. Fixed, not random: the composition was COMPOSED — the bunch
 * hangs off the peg this seed produces, and the cloud banks' stagger and crop
 * were judged at this value. A fresh seed each load would reroll the picture the
 * Toy was designed around.
 */
export const SKY_SEED = 4271;
