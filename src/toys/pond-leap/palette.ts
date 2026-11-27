/**
 * The Pond Leap palette — this Toy's own pond and frog colours, owned locally
 * per ADR-0004. Authored in OKLCH and derived, never picked as `hsl()` tuples.
 *
 * The camera looks down on a pond. Sorted by the critter-art skill's two classes:
 *
 *  - CORRIDOR: the open water the frog leaps across. Teal, one light band, told
 *    apart by hue and chroma, at least 0.30 clear of the cast.
 *  - OBJECT: everything landed on or passed — the lily pads, the banks and their
 *    moss fringe, the duckweed, the blossoms on the last pad. Held to the INK
 *    rule (L ≥ 0.54) and carried by their contours.
 *  - CAST: one frog, at the house cast lightness and chroma.
 *
 * THE PAIR THAT MATTERS MOST IS FROG ON PAD, not frog on water: the frog spends
 * nearly all its time parked on a pad. A green pad at the frog's own family of
 * values swallowed it (the placeholder pad was 0.26 clear). So the pad is a pale
 * yellow-green, 0.31 clear of the frog and turned away from its hue, and the
 * water is lifted to keep the pads reading against it by hue and contour.
 */

import { hex, shade, tint, type Oklch } from '../../shell/art/oklch';
import { cast, ink as houseInk, paper as housePaper, shading } from '../../shell/art/house';

const waterBase: Oklch = { l: 0.88, c: 0.06, h: 205 };
const waterDeepBase: Oklch = { l: 0.845, c: 0.066, h: 212 };
const waterLightBase: Oklch = { l: 0.92, c: 0.035, h: 198 };
/** A ripple is the water's own light, a step lighter. */
const rippleBase = tint(waterLightBase, { dl: 0.01, hueRotate: 0 });

/** Pale yellow-green: 0.31 clear of the frog it carries, and off its hue. */
const padBase: Oklch = { l: 0.81, c: 0.075, h: 118 };
const padShadeBase = shade(padBase, {
  dl: shading.occlusionDl * 0.5,
  hueRotate: shading.occlusionHueRotate,
  dc: 0,
});
/** The veins: a feature line, a quiet step down from the leaf. */
const padVeinBase = shade(padBase, { dl: shading.occlusionDl * 0.3, hueRotate: 8, dc: 0 });
const blossomBase: Oklch = { l: 0.84, c: 0.07, h: 350 };
const blossomHeartBase: Oklch = { l: 0.88, c: 0.08, h: 90 };

/** The banks seen from above: warm, dry, and nothing like the leaves or the water. */
const bankBase: Oklch = { l: 0.86, c: 0.045, h: 75 };
const bankShadeBase = shade(bankBase, { dl: shading.occlusionDl * 0.5, hueRotate: shading.occlusionHueRotate, dc: 0 });
/** The moss fringe where the bank meets the water, and the duckweed specks. */
const mossBase: Oklch = { l: 0.78, c: 0.07, h: 112 };

const FROG_HUE = 145;
const frogBody: Oklch = { l: cast.lightness, c: cast.chroma, h: FROG_HUE };
const frogShade = shade(frogBody, {
  dl: shading.occlusionDl,
  hueRotate: shading.occlusionHueRotate,
  dc: shading.occlusionDc,
});
const frogBelly: Oklch = { l: 0.84, c: 0.07, h: 115 };
const cheekBase: Oklch = { l: 0.8, c: 0.075, h: 15 };

export const source = {
  paper: housePaper,
  ink: houseInk,
  /** Every region the frog is seen against in flight. These must clear the CAST. */
  corridor: [waterBase, waterDeepBase, waterLightBase, rippleBase] as const,
  /** Every object. These must clear the INK. */
  objects: [
    padBase,
    padShadeBase,
    padVeinBase,
    blossomBase,
    blossomHeartBase,
    bankBase,
    bankShadeBase,
    mossBase,
    frogBelly,
    cheekBase,
  ] as const,
  /** The surface the frog rests on, measured against it by the palette test. */
  pad: padBase,
  padShade: padShadeBase,
  frogHue: FROG_HUE,
  frogBody,
  cast,
} as const;

export const palette = {
  water: hex(waterBase),
  waterDeep: hex(waterDeepBase),
  waterLight: hex(waterLightBase),
  ripple: hex(rippleBase),

  pad: hex(padBase),
  padShade: hex(padShadeBase),
  padVein: hex(padVeinBase),
  blossom: hex(blossomBase),
  blossomHeart: hex(blossomHeartBase),

  bank: hex(bankBase),
  bankShade: hex(bankShadeBase),
  moss: hex(mossBase),

  paper: hex(housePaper),
  contour: hex(houseInk),

  frogBody: hex(frogBody),
  frogShade: hex(frogShade),
  frogBelly: hex(frogBelly),
  frogCheek: hex(cheekBase),
  frogEye: hex(houseInk),
  frogEyeShine: hex(housePaper),
} as const;
