/**
 * The Counting Sheep meadow palette — this Toy's own scene + Critter colours,
 * owned locally per ADR-0004.
 *
 * WHAT CHANGED, AND WHY. Every value used to be a hand-picked `hsl()` tuple, and
 * converting them exposed a hierarchy that was not merely off but inverted:
 *
 *   - The WOOL sat at L 0.933 — level with the paper the whole collection prints
 *     on (0.94) — which made the Critter the LIGHTEST thing in its own picture.
 *     Against the four regions a Sheep is walked across it cleared 0.045 (clouds),
 *     0.111 (near hill), 0.148 (sky) and 0.227 (far hill), every one of them
 *     under the 0.30 floor. Greyscaled, the Toy was a small dark head floating on
 *     a lime field; the Sheep's whole mass dissolved.
 *   - `hillNear` carried chroma 0.197 — 1.46x the cast's ENTIRE chroma budget and
 *     1.8x the 0.8x ceiling scenery is held to. The ground was the most saturated
 *     thing on screen.
 *
 * So the fleece comes DOWN to the house cast lightness (HITL decision) and the
 * scene goes up into the corridor. The Sheep is now the darkest, most saturated,
 * most contoured thing in the frame, which is the one rule everything else
 * serves. What is given up is a storybook-white sheep — and unwashed wool is
 * oatmeal rather than white anyway; this Toy shipped an "amber fleece" once
 * already, before the pivot that whitened it.
 *
 * Colours are AUTHORED in OKLCH and DERIVED: the five sheep share
 * `cast.lightness` and `cast.chroma` from the house style and differ ONLY in hue,
 * every crop and shade is `shade()` of its own body, and the catchlight is the
 * PAPER, not `#fff`.
 *
 * HUES ARE GAMUT-CHOSEN, NOT SWEPT. sRGB's chroma ceiling collapses on the
 * yellow-green side as lightness drops: at L 0.50 hue 65 tops out at C 0.111 and
 * hue 90 at 0.103, both under the cast's 0.135. A sibling set has to share
 * chroma to BE a sibling set, so the five hues are picked from the arcs that can
 * actually hold 0.135 — which is why there is a moss sheep at 140 and not a
 * caramel one at 65.
 */

import { hex, shade, tint, type Oklch } from '../../shell/art/oklch';
import { cast, ink as houseInk, paper as housePaper, shading } from '../../shell/art/house';

/* ------------------------------------------------------------------ *
 * Scene — a designed FIELD, not a depicted place
 * ------------------------------------------------------------------ */

/*
 * Everything the Sheep is walked across lives in one narrow LIGHT band,
 * 0.835–0.925, and the cast sits at 0.50 below it. That partition is the whole
 * design: minimum contrast holds by construction and cannot be broken by adding
 * a background element, only by moving a band.
 *
 * The register is bright DAY, deliberately. Nestlings owns dusk, and the two
 * Toys reading as the same time of day would flatten the collection; a Toy
 * called Counting Sheep also has an obvious pull toward night that the ink rule
 * refuses outright — a dark ground under a dark-ink cast kills the contour, and
 * the light-rim alternative turns every Critter into a cutout.
 */
const skyBase: Oklch = { l: 0.885, c: 0.045, h: 230 };
const skyHighBase: Oklch = { l: 0.855, c: 0.055, h: 236 };
/*
 * THE TWO GROUND PLANES. Both are corridor-class — the Sheep is walked across
 * every square unit of them — so lightness is spent on clearing the CAST and has
 * almost nothing left to separate the planes from each other. Depth between them
 * is bought with CHROMA and hue instead: the far bank sits closer to the sky and
 * lower in chroma, which is atmospheric perspective as arithmetic rather than as
 * taste, and where they overlap they are told apart by occlusion.
 *
 * Reaching for lightness here reproduces exactly the washed-out scene the
 * corridor rule was corrected for once already.
 *
 * The hue gap is 36 degrees and it started at 18, which was not enough to do the
 * job on its own: the far bank was a 0.035 lightness step away from the near one
 * and barely separated from it at all, so a wide frame's extra plane read as a
 * faint wash rather than as distance. Since lightness is spent and chroma is
 * capped, hue is the only axis with any room left, and it has to actually be
 * used.
 */
const bankFarBase: Oklch = { l: 0.87, c: 0.042, h: 168 };
const bankNearBase: Oklch = { l: 0.835, c: 0.075, h: 132 };
/** The sun. Corridor-class — a Sheep walks straight over it — and held just
 *  under the paper, which stays the lightest surface in the app. */
const sunBase: Oklch = { l: 0.925, c: 0.062, h: 92 };
/** The leaf mass on the cropped bough overhead. Corridor-class because the
 *  Sheep's slide-in carries it under the bough's reach at a wide aspect. */
const boughLeafBase: Oklch = { l: 0.86, c: 0.05, h: 128 };

/*
 * The objects are governed by the INK rather than by the corridor, and that
 * split is the correction to how the corridor rule was first applied. Squeezing
 * air, grass, wood and blossom into one 0.10 lightness band gives four materials
 * the same weight and the whole scene reads washed out. A Sheep crosses an
 * object briefly, and its contour is what keeps it legible there.
 */
/*
 * THE FOREGROUND GRASS — the repoussoir in the two bottom corners, and the
 * strongest "this is a place" cue the scene has. It wanted to be much darker
 * than this, around L 0.42, which is what makes a foreground mass read as being
 * IN FRONT rather than as one more layer of the same wall. The ink rule refused
 * it and the refusal was right: the bottom corners are where a hand rests, and
 * at 0.42 the contour stops separating from the mass.
 */
const foreGrassBase: Oklch = { l: 0.6, c: 0.085, h: 138 };
/** The grass tufts standing along the walking line. Lighter than the foreground
 *  because they are BEHIND the Sheep, and thin enough that their area never adds
 *  up to a mass — the failure mode that inverted the Nestlings canopy. */
const tuftBase: Oklch = { l: 0.7, c: 0.09, h: 135 };
// Hue 74, not the 52 a brown reaches for. At L 0.55 a hue of 52 is warm bark;
// lifted to 0.72 the same hue is SALMON — high-lightness low-chroma orange reads
// pink, not wood. Yellowing it is what keeps it a branch.
const boughBase: Oklch = { l: 0.72, c: 0.068, h: 74 };
/** Wildflower heads. Object-class, and only ever drawn as a counted MASS of
 *  lobes under an eighth of a Sheep — a single bloom at Sheep scale would be a
 *  sixth character. */
const flowerBase: Oklch = { l: 0.7, c: 0.1, h: 20 };

/* ------------------------------------------------------------------ *
 * The cast — one hue each, everything else shared
 * ------------------------------------------------------------------ */

/**
 * Hues only. Lightness and chroma come from the house style, which is what makes
 * the five a family instead of five independently-picked colours. Every one is
 * on an arc that holds the cast's chroma inside sRGB at the cast's lightness —
 * see the header on why that rules out the yellow-greens.
 */
const FLEECE_HUE = {
  terracotta: 20,
  amber: 48,
  moss: 140,
  slate: 258,
  rose: 330,
} as const;

export type FleeceName = keyof typeof FLEECE_HUE;

/** The five, in the order the loop sends them onto the stage. */
export const FLEECES: readonly FleeceName[] = ['terracotta', 'amber', 'moss', 'slate', 'rose'];

/**
 * The OKLCH values the palette is derived FROM, exported so the rules can be
 * asserted directly rather than round-tripped back out of hex. Consumers paint
 * with `palette`; only tests and future derivations need these.
 */
export const source = {
  paper: housePaper,
  ink: houseInk,
  /** The regions a Sheep is walked across. These must clear the CAST. */
  corridor: [skyBase, skyHighBase, bankFarBase, bankNearBase, sunBase, boughLeafBase] as const,
  /** Small objects a Sheep passes or stands among. These must clear the INK. */
  objects: [foreGrassBase, tuftBase, boughBase, flowerBase] as const,
  skyBase,
  skyHighBase,
  bankFarBase,
  bankNearBase,
  sunBase,
  boughLeafBase,
  foreGrassBase,
  tuftBase,
  boughBase,
  flowerBase,
  fleece: FLEECE_HUE,
  cast,
} as const;

const body = (h: number): Oklch => ({ l: cast.lightness, c: cast.chroma, h });

/**
 * The cropped parts — face, ears, legs. A shorn sheep's face and legs are the
 * same animal in a different nap, so this is the body one step down the same
 * ramp, never an unrelated brown.
 */
const crop = (b: Oklch) =>
  shade(b, {
    dl: shading.occlusionDl * 1.15,
    hueRotate: shading.occlusionHueRotate * 0.6,
    dc: 0,
  });

const fleeceTokens = (name: FleeceName) => {
  const b = body(FLEECE_HUE[name]);
  return {
    body: hex(b),
    crop: hex(crop(b)),
    shade: hex(
      shade(b, {
        dl: shading.occlusionDl,
        hueRotate: shading.occlusionHueRotate,
        dc: shading.occlusionDc,
      }),
    ),
  };
};

const terracotta = fleeceTokens('terracotta');
const amber = fleeceTokens('amber');
const moss = fleeceTokens('moss');
const slate = fleeceTokens('slate');
const rose = fleeceTokens('rose');

/* ------------------------------------------------------------------ */

export const palette = {
  /* --- scene ------------------------------------------------------- */
  /** The open sky the whole scene sits in — light, so the contour works. Also
   *  the Card's surface tint, the same contract every other Toy's `tint` uses. */
  sky: hex(skyBase),
  /** A slight deepening toward the top of the field. Same corridor. */
  skyHigh: hex(skyHighBase),
  /** The far ground plane — cropped banks entering from the side edges. */
  bankFar: hex(bankFarBase),
  /** The near ground plane: the one the Sheep actually walks on. */
  bankNear: hex(bankNearBase),
  /**
   * The shaded rim along a bank's crest — one light direction, obeyed by every
   * element in the scene.
   *
   * The house shadow formula, unmodified in direction and only widened in
   * degrees. Worth stating because it looks like it needs inverting here and
   * does not: `shade()` rotates toward the AMBIENT, and from a yellow-green
   * bank a positive rotation lands cooler on its own.
   */
  bankShade: hex(
    shade(bankNearBase, {
      dl: shading.occlusionDl * 0.5,
      hueRotate: shading.occlusionHueRotate * 1.6,
      dc: 0.008,
    }),
  ),
  /** The sun — one oversized disc, cropped by the frame and by the banks. */
  sun: hex(sunBase),
  /** The leafy fringe on the bough that crops into a top corner. */
  boughLeaf: hex(boughLeafBase),
  /** The cropped bough overhead — what replaces the lollipop tree. */
  bough: hex(boughBase),
  /** Grass tufts standing along the walking line, behind the Sheep. */
  tuft: hex(tuftBase),
  /** Their shaded side, so the tufts obey the same light as everything else. */
  tuftShade: hex(
    shade(tuftBase, {
      dl: shading.occlusionDl * 0.6,
      hueRotate: shading.occlusionHueRotate,
      dc: 0,
    }),
  ),
  /** The cropped foreground grass in the bottom corners — the third plane. */
  foreGrass: hex(foreGrassBase),
  /** Its own shaded side. */
  foreGrassShade: hex(
    shade(foreGrassBase, {
      dl: shading.occlusionDl * 0.7,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    }),
  ),
  /** Wildflower petals, only ever drawn as a counted mass of tiny lobes. */
  flower: hex(flowerBase),
  /** The flower's centre — the same warm ramp, one step down. */
  flowerHeart: hex(
    shade(flowerBase, {
      dl: shading.occlusionDl * 1.4,
      hueRotate: shading.occlusionHueRotate,
      dc: 0,
    }),
  ),
  /**
   * The dismiss beat's bloom, caught in the fleece. Deliberately outside the
   * corridor: it is painted ON the Sheep for the length of one exit, not a
   * region anything is walked across, so the tracking constraint does not bind.
   */
  doneGlow: hex({ l: 0.93, c: 0.09, h: 92 }),

  /* --- house-style primitives, surfaced so every fill is a token ---- */
  /** The paper the collection prints on — also the catchlight. */
  paper: hex(housePaper),
  /** The contour ink. Warm near-black, never `#000`. */
  contour: hex(houseInk),

  /* --- shared Critter colours -------------------------------------- */
  /** The pale muzzle every Sheep shares — derived from the paper rather than
   *  invented, so it is the paper showing through the face. */
  sheepMuzzle: hex(tint(housePaper, { dl: -0.07, hueRotate: 12 })),
  /** The blush. Held below the body's chroma so the eye stays the most
   *  saturated thing on the face. */
  sheepCheek: hex({ l: 0.74, c: Math.min(0.075, cast.chroma * 0.9), h: 20 }),
  /** The eye. The same ink as the contour — the collection's one dark. */
  sheepEye: hex(houseInk),
  /** The catchlight is the PAPER showing through, not white. */
  sheepEyeShine: hex(housePaper),
  /** Hooves, drawn as tapered fills rather than strokes. */
  sheepHoof: hex(houseInk),

  /* --- per-fleece --------------------------------------------------- */
  terracottaBody: terracotta.body,
  terracottaCrop: terracotta.crop,
  terracottaShade: terracotta.shade,

  amberBody: amber.body,
  amberCrop: amber.crop,
  amberShade: amber.shade,

  mossBody: moss.body,
  mossCrop: moss.crop,
  mossShade: moss.shade,

  slateBody: slate.body,
  slateCrop: slate.crop,
  slateShade: slate.shade,

  roseBody: rose.body,
  roseCrop: rose.crop,
  roseShade: rose.shade,
} as const;
