/**
 * The Penguin Slide palette — this Toy's own ice-and-water scene and cast
 * colours, owned locally per ADR-0004. Authored in OKLCH and DERIVED, never
 * picked as `hsl()` tuples: `hsl()`'s L is a channel midpoint, not a lightness,
 * so "these are siblings" is unassertable in it.
 *
 * A COLD PALETTE THAT IS STILL LIGHT. Polar scenes reach for deep navy water by
 * reflex, and deep water is exactly what this Toy cannot have: a penguin is
 * SWIPED across the floe and then lives in the water, bobbing, for the rest of
 * the Toy. Both surfaces are therefore corridor class — regions the cast is moved
 * across and sits in — and both live in one narrow light band, 0.80–0.925, with
 * the cast at 0.50 below it. Cold survives as HUE and as low chroma, not as
 * darkness, the same bargain the Nestlings dusk makes.
 *
 * Inside that band, ice and water are told apart by chroma and hue rather than
 * by lightness: ice is near-neutral and blue, water is greener and more
 * saturated, and the floe's shaded face rotates toward violet so it can never be
 * mistaken for the sea it stands in. The scenery contour does the rest.
 *
 * THE CAST CANNOT BE BLACK-AND-WHITE. A real penguin's back is near-black, and a
 * near-black body under a near-black contour is a silhouette with no inside. The
 * five share the house `cast.lightness`/`cast.chroma` and differ only in hue, the
 * same family rule as every other Toy; what keeps them penguins is the pale
 * face-and-belly patch, the warm beak and feet, and the silhouette.
 *
 * Hues are chosen from where sRGB actually HAS 0.135 chroma at L 0.50: roughly
 * 0–45, 130–150 and 250–360. The teal a cold scene wants sits in a gamut hole
 * (it caps at ~0.09 there), which is why there is a green penguin and no teal
 * one — mapping a teal into gamut would quietly break the sibling rule.
 */

import { hex, shade, tint, type Oklch } from '../../shell/art/oklch';
import { cast, ink as houseInk, paper as housePaper, shading } from '../../shell/art/house';

/* ------------------------------------------------------------------ *
 * Scene — every member is corridor class
 * ------------------------------------------------------------------ */

/** The open sea. Greener and more saturated than the ice, at a lower lightness. */
const waterBase: Oklch = { l: 0.83, c: 0.07, h: 212 };
/**
 * Deeper water — the ripple marks and the floe's shadow on the sea. It is the
 * corridor's floor and sets the whole scene's worst case: 0.80 is exactly
 * `cast.minBackdropDeltaL` clear of the cast, so nothing in the scene may go
 * below it.
 */
const waterDeepBase: Oklch = { l: 0.8, c: 0.078, h: 222 };
/** Glints, the ripple a swimming penguin makes, and the splash. */
const waterLightBase: Oklch = { l: 0.905, c: 0.04, h: 205 };
/** The floe's top — the lightest scene colour, held under the paper. */
const iceBase: Oklch = { l: 0.925, c: 0.022, h: 225 };
/** The far ice shelves cropped at the top corners — a step back toward the sea. */
const shelfBase: Oklch = { l: 0.895, c: 0.03, h: 232 };

/**
 * The shaded face of a slab of ice — the light is from the upper left, so every
 * floe shows its lower edge. It is `shade()` of the ice, rotated further than the
 * house default so it lands on violet, well away from the water's green-blue.
 * At the default rotation it came out within a few degrees of the sea it stands
 * in, and the floe's thickness read as a stripe of water.
 */
const iceFace = (base: Oklch) =>
  shade(base, { dl: 0.09, hueRotate: shading.occlusionHueRotate * 1.4, dc: 0.03 });

/* ------------------------------------------------------------------ *
 * The cast
 * ------------------------------------------------------------------ */

/**
 * Hues only. Lightness and chroma come from the house style. Names are the
 * silhouette each penguin is drawn with (see `PenguinDrawing`), not a claim of
 * zoological accuracy: the chick is the brown one because king-penguin chicks
 * are brown, and that is the only hue a child might already know.
 */
const PENGUIN_HUE = {
  emperor: 258,
  fairy: 295,
  rockhopper: 340,
  gentoo: 140,
  chick: 38,
} as const;

export type PenguinKind = keyof typeof PENGUIN_HUE;
export const PENGUIN_KINDS = Object.keys(PENGUIN_HUE) as PenguinKind[];

/**
 * The beak and feet. Warm on purpose — the one warm note in a cold picture is
 * where a child's eye lands on a face. Lighter than the body so it reads against
 * the body's own hue rather than merging into it, and below the body's chroma
 * would make it brown; it sits at it.
 */
const beakBase: Oklch = { l: 0.7, c: cast.chroma, h: 62 };
/** The rockhopper's crest — yellow, and the brightest saturated thing it wears. */
const crestBase: Oklch = { l: 0.82, c: 0.13, h: 95 };

export const source = {
  paper: housePaper,
  ink: houseInk,
  /** Every region a penguin is swiped across or bobs in. These must clear the CAST. */
  corridor: [
    waterBase,
    waterDeepBase,
    waterLightBase,
    iceBase,
    shelfBase,
    iceFace(iceBase),
    iceFace(shelfBase),
  ] as const,
  waterBase,
  waterDeepBase,
  waterLightBase,
  iceBase,
  shelfBase,
  beakBase,
  crestBase,
  kinds: PENGUIN_HUE,
  cast,
} as const;

const body = (h: number): Oklch => ({ l: cast.lightness, c: cast.chroma, h });

/** A flipper is the body in shadow — the same derivation as every occlusion. */
const flipper = (b: Oklch) =>
  shade(b, { dl: shading.occlusionDl, hueRotate: shading.occlusionHueRotate * 0.6, dc: 0 });

const kindTokens = (kind: PenguinKind) => {
  const b = body(PENGUIN_HUE[kind]);
  return {
    body: hex(b),
    flipper: hex(flipper(b)),
    shade: hex(
      shade(b, {
        dl: shading.occlusionDl,
        hueRotate: shading.occlusionHueRotate,
        dc: shading.occlusionDc,
      }),
    ),
  };
};

const emperor = kindTokens('emperor');
const fairy = kindTokens('fairy');
const rockhopper = kindTokens('rockhopper');
const gentoo = kindTokens('gentoo');
const chick = kindTokens('chick');

export const palette = {
  /* --- scene ------------------------------------------------------- */
  water: hex(waterBase),
  waterDeep: hex(waterDeepBase),
  waterLight: hex(waterLightBase),
  ice: hex(iceBase),
  iceFace: hex(iceFace(iceBase)),
  /** Contact shadows on the floe — the ice's own occlusion, never grey. */
  iceShadow: hex(
    shade(iceBase, {
      dl: shading.occlusionDl,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    }),
  ),
  shelf: hex(shelfBase),
  shelfFace: hex(iceFace(shelfBase)),

  /* --- house-style primitives, surfaced so every fill is a token ---- */
  paper: hex(housePaper),
  contour: hex(houseInk),

  /* --- shared Critter colours -------------------------------------- */
  /** The face-and-belly patch — derived from the paper, so it is never `#fff`. */
  penguinBelly: hex(tint(housePaper, { dl: -0.03, hueRotate: 120 })),
  penguinBeak: hex(beakBase),
  penguinFoot: hex(shade(beakBase, { dl: 0.06, hueRotate: -8, dc: 0 })),
  penguinCrest: hex(crestBase),
  /** The blush, held under the body's chroma so the eye outranks it. */
  penguinCheek: hex({ l: 0.78, c: Math.min(0.08, cast.chroma * 0.6), h: 15 }),
  penguinEye: hex(houseInk),
  penguinEyeShine: hex(housePaper),

  /* --- per-kind ---------------------------------------------------- */
  emperorBody: emperor.body,
  emperorFlipper: emperor.flipper,
  emperorShade: emperor.shade,
  fairyBody: fairy.body,
  fairyFlipper: fairy.flipper,
  fairyShade: fairy.shade,
  rockhopperBody: rockhopper.body,
  rockhopperFlipper: rockhopper.flipper,
  rockhopperShade: rockhopper.shade,
  gentooBody: gentoo.body,
  gentooFlipper: gentoo.flipper,
  gentooShade: gentoo.shade,
  chickBody: chick.body,
  chickFlipper: chick.flipper,
  chickShade: chick.shade,
} as const;
