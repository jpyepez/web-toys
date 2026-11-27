/**
 * The Pond Leap palette — this Toy's own pond and frog colours, owned locally
 * per ADR-0004. Authored in OKLCH and derived, never picked as `hsl()` tuples.
 *
 *  - CORRIDOR: the water the frog leaps across. Teal, one light band, told
 *    apart by hue and chroma, at least 0.30 clear of the cast.
 *  - OBJECT: the lily pads, landed on and never lived in. Held to the INK rule
 *    (L ≥ 0.54) and carried by their contour.
 *  - CAST: one frog, at the house cast lightness and chroma.
 *
 * Placeholder art: the final palette is for a later art ticket.
 */

import { hex, shade, tint, type Oklch } from '../../shell/art/oklch';
import { cast, ink as houseInk, paper as housePaper, shading } from '../../shell/art/house';

const waterBase: Oklch = { l: 0.85, c: 0.07, h: 200 };
const waterDeepBase: Oklch = { l: 0.81, c: 0.075, h: 208 };
const waterLightBase: Oklch = { l: 0.91, c: 0.04, h: 195 };

const padBase: Oklch = { l: 0.76, c: 0.1, h: 130 };
const padShadeBase = shade(padBase, {
  dl: shading.occlusionDl * 0.6,
  hueRotate: shading.occlusionHueRotate,
  dc: 0,
});
const bloomBase: Oklch = { l: 0.82, c: 0.08, h: 350 };

const FROG_HUE = 145;
const frogBody: Oklch = { l: cast.lightness, c: cast.chroma, h: FROG_HUE };
const frogShade = shade(frogBody, {
  dl: shading.occlusionDl,
  hueRotate: shading.occlusionHueRotate,
  dc: shading.occlusionDc,
});
const frogBelly: Oklch = { l: 0.8, c: 0.1, h: 120 };
const cheekBase: Oklch = { l: 0.78, c: 0.08, h: 15 };

export const source = {
  paper: housePaper,
  ink: houseInk,
  /** Every region the frog is seen against. These must clear the CAST. */
  corridor: [waterBase, waterDeepBase, waterLightBase] as const,
  /** Every object. These must clear the INK. */
  objects: [padBase, padShadeBase, bloomBase, frogBelly] as const,
  frogHue: FROG_HUE,
  frogBody,
  cast,
} as const;

export const palette = {
  water: hex(waterBase),
  waterDeep: hex(waterDeepBase),
  waterLight: hex(waterLightBase),

  pad: hex(padBase),
  padShade: hex(padShadeBase),
  bloom: hex(bloomBase),

  paper: hex(housePaper),
  contour: hex(houseInk),
  /** A ripple is the water's own light, a step lighter. */
  ripple: hex(tint(waterLightBase, { dl: 0.02, hueRotate: 0 })),

  frogBody: hex(frogBody),
  frogShade: hex(frogShade),
  frogBelly: hex(frogBelly),
  frogCheek: hex(cheekBase),
  frogEye: hex(houseInk),
  frogEyeShine: hex(housePaper),
} as const;
