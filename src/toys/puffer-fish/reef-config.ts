/**
 * The reef config — the deliverable the lab exists to produce.
 *
 * To change the scene, open the lab (`bun run dev`, then `/lab.html`), switch
 * the background to `reef`, tune it in the FRAME view at BOTH aspects, hit Save,
 * and copy the `scenery.reef` block back here — read out of
 * `src/lab/saved/*.json`, never eyeballed off a screenshot of the panel. The
 * generator itself lives in `reef.ts` and is shared by the lab and the Toy, so
 * what moves between them is only these numbers.
 *
 * These are the composed starting values, not yet a harvest: the shape-class and
 * colour rules are settled and asserted, the taste is not. Every number here is
 * a knob in the lab.
 */

import type { ReefConfig } from './reef';

export const REEF: ReefConfig = {
  // The seabed sits low. A puffer's whole activity is hovering in open water and
  // then rising out of frame, so the scene is mostly water column by design —
  // the sand is the floor of the picture, not its subject.
  bedY: 0.82,
  bedRelief: 0.08,
  // Where the Fish hovers, in Fish, measured to its body centre. This one number
  // replaces the old hardcoded `top: 42%`, and unlike it, it is a distance from
  // something the scene actually draws.
  hoverGap: 1.15,
  ridgeCount: 2,
  ridgeSpread: 2.8,
  ridgeRise: 0.08,
  frondDensity: 2.2,
  frondHeight: 0.38,
  frondWidth: 0.2,
  bladesPerFrond: 5,
  polypDensity: 1.4,
  polypLobe: 0.04,
  foreDepth: 0.13,
  foreHeight: 0.55,
  // The sun is placed to be CROPPED rather than centred, and it sits at the top
  // LEFT so the rays lean across the frame the same way the Fish swims into it.
  // Its size is in Fish, so a wide frame shrinks it relative to the viewport;
  // held at 3 it is clear of the peer band on both frames and cut by two edges
  // on both. Below 2.5 it would drop straight into the band the coral clumps
  // occupied, which is why the lab's slider cannot reach there.
  sunScale: 3,
  sunX: 10,
  sunY: 0.015,
  rayCount: 3,
  rayWidth: 0.34,
  rayTilt: 0.5,
  kelpThickness: 0.075,
  kelpCount: 0.8,
  // Big. A stipe that rises straight is a post; two posts are a fence.
  kelpSway: 0.95,
  lobeRatio: 0.075,
  lobeVariance: 0.55,
  leafDepth: 1.7,
  bubbleCount: 5,
};

/**
 * The scene seed. Fixed, not random: the composition was COMPOSED — the Fish
 * hovers over the bed this seed produces, and the kelp's roots and the ridge
 * stagger were judged at this value. A fresh seed each load would reroll the
 * picture the Toy was designed around.
 */
export const REEF_SEED = 4271;
