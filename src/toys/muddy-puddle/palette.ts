/**
 * The Muddy Puddle barnyard palette — this Toy's own scene + Critter colours,
 * owned locally per ADR-0004.
 *
 * WHAT CHANGED, AND WHY. Every value used to be a hand-picked `hsl()` tuple, and
 * converting them exposed the same inversion the meadow had:
 *
 *   - `lambWool` sat at L 0.925 and `calfSpot` at 0.925 — level with the paper
 *     the whole collection prints on (0.94) — so two of the five Critters were
 *     the LIGHTEST things in their own picture. Against the sky they cleared
 *     0.09; against the grass, 0.16. Both under the 0.30 floor.
 *   - `barn` carried chroma 0.16 and `grass` 0.12 — the barn was more saturated
 *     than any Critter, so the most eye-catching thing on screen was a building
 *     nobody can touch.
 *   - `mud` sat at L 0.42 and the five bodies at 0.72–0.93, which is the one
 *     relationship this Toy cannot get wrong and the only one it got right.
 *
 * So the five animals come DOWN to the house cast lightness and the scene goes
 * up into the corridor, exactly as the Sheep did. What is given up is the pastel
 * kawaii cast — a pink piglet becomes a deeper rose, a lemon duckling an amber
 * one — and what is bought is a Critter that stays the darkest, most saturated,
 * most contoured thing in the frame wherever a child drags it.
 *
 * HUES ARE GAMUT-CHOSEN, NOT PICKED. sRGB holds the cast's 0.135 chroma at L
 * 0.50 on only three arcs — 0..48, 130..151 and 248..359 — so there is no
 * natural tan calf (hue ~60) and no lemon duckling (~90) available at all. The
 * five sit on the arcs that can actually carry the shared chroma, which is why
 * the lamb is moss and the calf is slate: a Friesian's cool grey and an unwashed
 * fleece are the two the substitution costs least, and species read from
 * SILHOUETTE here anyway — the muzzle, the bill, the tuft, the lobed wool.
 *
 * WHY THE MUD IS ITS OWN CLASS. Mud is neither scene nor Critter: it is caked ON
 * the cast, so while a Critter is muddy the mud IS the figure. It is therefore
 * held to the cast's rules rather than the corridor's, and it is allowed to run
 * DARKER than the cast — at L 0.36 the muddy Critter reads as one heavy dark
 * mass against a field 0.48 lighter, which is the "who's under there?" beat the
 * whole Toy turns on. Its hue was moved off 50 to 58 for one reason: at 50 it
 * was two degrees from the duckling's body, so that one animal's reveal would
 * have been a lightness step with no colour change in it at all.
 */

import { hex, shade, tint, type Oklch } from '../../shell/art/oklch';
import { cast, ink as houseInk, paper as housePaper, shading } from '../../shell/art/house';

/* ------------------------------------------------------------------ *
 * Scene — a designed FIELD, not a depicted place
 * ------------------------------------------------------------------ */

/*
 * THE CORRIDOR. Everything a Critter is trotted across or splashed into lives in
 * one narrow light band, 0.836–0.902, with the cast at 0.50 below it. The
 * partition is the whole design: the contrast floor holds by construction and
 * cannot be broken by adding a background element, only by moving a band.
 *
 * Bright mid-afternoon, deliberately. Nestlings owns dusk and the Sheep own
 * midday; a barnyard reads warmer than the meadow through hue and chroma rather
 * than through lightness, because lightness is entirely spent on clearing the
 * cast and has nothing left to spend on mood.
 */
const skyBase: Oklch = { l: 0.885, c: 0.042, h: 232 };
const skyHighBase: Oklch = { l: 0.858, c: 0.052, h: 240 };
/*
 * THE TWO GROUND PLANES, same construction as the meadow's banks and for the
 * same reason: both are corridor-class, so lightness is already spent and depth
 * between them has to be bought with CHROMA and HUE. The far plane sits closer
 * to the sky and lower in chroma — atmospheric perspective as arithmetic — and
 * where they overlap, occlusion tells them apart.
 */
const fieldFarBase: Oklch = { l: 0.878, c: 0.038, h: 156 };
const fieldBase: Oklch = { l: 0.84, c: 0.07, h: 122 };
/**
 * THE PUDDLE, and it is corridor-class rather than object-class because the last
 * Critter of the play lands in it — a region the cast is dragged into is a
 * corridor however small it looks.
 *
 * A pale wet clay, which is the counter-intuitive half of this palette and is
 * forced rather than chosen. "A dark ground under a dark-ink cast" is refused
 * outright: the contour stops separating the moment the ground approaches the
 * ink, so a Critter splashing into a realistically dark pool would lose its own
 * outline exactly where the Toy most wants it seen. A thin wet film over clay
 * really is far lighter than a thick clod of the same earth, so the puddle and
 * the mud caked on the cast are the same substance at two thicknesses — which is
 * also why they share a hue family.
 */
const puddleBase: Oklch = { l: 0.836, c: 0.058, h: 66 };
/** The wet sheen on the puddle's surface. Same corridor, near the paper. */
const puddleSheenBase: Oklch = { l: 0.902, c: 0.03, h: 74 };

/*
 * The objects are governed by the INK rather than by the corridor. A Critter
 * passes them rather than living in them, and its contour is what keeps it
 * legible there — so what must hold is that the ink clears them, not that they
 * clear the whole cast. Applying the corridor rule here instead is what once
 * squeezed air, grass, wood and paint into one 0.10 band and washed a scene out.
 */
/**
 * THE BARN. One oversized mass cropped by two frame edges — the element that
 * says "barnyard" in a scene with no barnyard-shaped objects left in it.
 *
 * It used to be a 20-unit gable silhouette standing free on the horizon: convex,
 * closed, and 0.55 of a Critter on a phone. That is the lollipop tree with a
 * roof on it, and the fence beside it was a row of five identical uprights —
 * a treeline, one octave down. Grown past 2.5 Critters and pushed off the edge,
 * the same barn stops being an object to sort and becomes a place to be in.
 *
 * L 0.62 is a barn red the ink can still outline. A real barn red is around 0.42
 * and it is not available: below 0.54 the contour dies against it.
 */
const barnBase: Oklch = { l: 0.62, c: 0.085, h: 32 };
/** Weathered rail-and-post timber. Pale, so the fence reads as line rather than
 *  as mass — the run is elongated-open by shape class and must stay that way in
 *  value too, or five uprights become five marks to count. */
const fenceBase: Oklch = { l: 0.78, c: 0.035, h: 88 };
/** Straw scattered along the walking line. Thin enough that its area never adds
 *  up to a mass — the failure that inverted the first canopy. */
const strawBase: Oklch = { l: 0.72, c: 0.09, h: 92 };
/**
 * The churned clay in the two bottom corners — the repoussoir, and the strongest
 * "you are standing in a yard" cue the scene has.
 *
 * It wants to be much darker, around 0.42, which is what makes a foreground mass
 * read as being IN FRONT rather than as one more layer of the same wall. The ink
 * rule refuses it and the refusal is right: the bottom corners are where a hand
 * rests and where a Critter is set down.
 */
const foreClayBase: Oklch = { l: 0.6, c: 0.07, h: 62 };

/* ------------------------------------------------------------------ *
 * The mud — cast-class, and the only thing allowed below the cast
 * ------------------------------------------------------------------ */

/**
 * The mud caked over a Critter, and the mud blobs the Wipe lifts.
 *
 * Darker than the cast on purpose: it is what HIDES the cast, so it has to win
 * against every one of the five bodies at once. At L 0.36 it clears the field by
 * 0.48 (a muddy Critter is unmistakably one dark mass on a light yard) and every
 * animal by 0.14 — small, and carried the rest of the way by hue, by the
 * contour, and by the face that appears with the reveal.
 */
const mudBase: Oklch = { l: 0.36, c: 0.055, h: 58 };

/* ------------------------------------------------------------------ *
 * The cast — one hue each, everything else shared
 * ------------------------------------------------------------------ */

/**
 * Hues only. Lightness and chroma come from the house style, which is what makes
 * five different SPECIES read as one family rather than as five drawings that
 * happen to share a screen — the thing the old palette, with a 0.93 lamb beside
 * a 0.58 calf, could not do.
 *
 * Every hue is on an arc that holds the cast's chroma inside sRGB at the cast's
 * lightness; see the header for why that rules out a tan calf and a lemon duck.
 */
const BODY_HUE = {
  piglet: 345,
  chick: 15,
  duckling: 44,
  lamb: 140,
  calf: 265,
} as const;

export type CritterName = keyof typeof BODY_HUE;

/** The five, in the order `cast.ts` declares them. */
export const CRITTERS: readonly CritterName[] = ['piglet', 'duckling', 'lamb', 'chick', 'calf'];

/**
 * The OKLCH values the palette is derived FROM, exported so the rules can be
 * asserted directly rather than round-tripped back out of hex. Consumers paint
 * with `palette`; only tests and future derivations need these.
 */
export const source = {
  paper: housePaper,
  ink: houseInk,
  /** The regions a Critter is trotted across or splashed into. Clear the CAST. */
  corridor: [skyBase, skyHighBase, fieldFarBase, fieldBase, puddleBase, puddleSheenBase] as const,
  /** Small objects a Critter passes or stands among. These must clear the INK. */
  objects: [barnBase, fenceBase, strawBase, foreClayBase] as const,
  skyBase,
  skyHighBase,
  fieldFarBase,
  fieldBase,
  puddleBase,
  puddleSheenBase,
  barnBase,
  fenceBase,
  strawBase,
  foreClayBase,
  mudBase,
  body: BODY_HUE,
  cast,
} as const;

const body = (h: number): Oklch => ({ l: cast.lightness, c: cast.chroma, h });

/**
 * The cropped parts — a muzzle's underside, an ear's inner, a leg. The same
 * animal in a different nap, so it is the body one step down its own ramp rather
 * than an unrelated brown.
 */
const crop = (b: Oklch) =>
  shade(b, {
    dl: shading.occlusionDl * 1.15,
    hueRotate: shading.occlusionHueRotate * 0.6,
    dc: 0,
  });

/**
 * The signature feature — the piglet's snout, the duckling's bill, the chick's
 * beak, the calf's muzzle, the lamb's face. A TINT of the body rather than a
 * fourth invented colour, so a feature can never drift out of its own animal's
 * family; the hue rotation is what stops it reading as a lit patch of the body.
 */
const feature = (b: Oklch) => tint(b, { dl: 0.16, hueRotate: -14 });

const critterTokens = (name: CritterName) => {
  const b = body(BODY_HUE[name]);
  return {
    body: hex(b),
    crop: hex(crop(b)),
    feature: hex(feature(b)),
    shade: hex(
      shade(b, {
        dl: shading.occlusionDl,
        hueRotate: shading.occlusionHueRotate,
        dc: shading.occlusionDc,
      }),
    ),
  };
};

const piglet = critterTokens('piglet');
const duckling = critterTokens('duckling');
const lamb = critterTokens('lamb');
const chick = critterTokens('chick');
const calf = critterTokens('calf');

/* ------------------------------------------------------------------ */

export const palette = {
  /* --- scene ------------------------------------------------------- */
  /** The open barnyard sky the whole scene sits in. Also the Card's surface
   *  tint, the same contract every other Toy's `tint` uses. */
  sky: hex(skyBase),
  /** A slight deepening toward the top of the field. Same corridor. */
  skyHigh: hex(skyHighBase),
  /** The far ground plane — cropped banks entering from the side edges. */
  fieldFar: hex(fieldFarBase),
  /** The near ground plane: the one the Critters actually trot on. */
  field: hex(fieldBase),
  /**
   * The shaded rim along the field's crest — one light direction, obeyed by
   * every element in the scene.
   *
   * The house formula, unmodified in direction and only widened in degrees. It
   * looks like it wants inverting here and does not: `shade()` rotates toward
   * the AMBIENT, and from a yellow-green field a positive rotation lands cooler
   * on its own.
   */
  fieldShade: hex(
    shade(fieldBase, {
      dl: shading.occlusionDl * 0.5,
      hueRotate: shading.occlusionHueRotate * 1.6,
      dc: 0.008,
    }),
  ),
  /** The puddle — one oversized pool cropped by the bottom and one side edge. */
  puddle: hex(puddleBase),
  /** The wet sheen floated on it. */
  puddleSheen: hex(puddleSheenBase),
  /** The puddle's shaded near rim, so the pool sits IN the ground rather than
   *  on it. */
  puddleShade: hex(
    shade(puddleBase, {
      dl: shading.occlusionDl * 0.55,
      hueRotate: shading.occlusionHueRotate,
      dc: 0.006,
    }),
  ),
  /** The barn — the one oversized cropped mass. */
  barn: hex(barnBase),
  /** Its roof plane, the same red one step down its own ramp. */
  barnRoof: hex(
    shade(barnBase, {
      dl: shading.occlusionDl * 0.75,
      hueRotate: shading.occlusionHueRotate * 0.8,
      dc: 0,
    }),
  ),
  /** The shaded side of the barn's own wall, following its away edge. */
  barnShade: hex(
    shade(barnBase, {
      dl: shading.occlusionDl * 1.3,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    }),
  ),
  /** Weathered rail-and-post timber. */
  fence: hex(fenceBase),
  /** Its shaded side. */
  fenceShade: hex(
    shade(fenceBase, {
      dl: shading.occlusionDl * 0.8,
      hueRotate: shading.occlusionHueRotate,
      dc: 0,
    }),
  ),
  /** Straw scattered along the walking line, behind the Critters. */
  straw: hex(strawBase),
  /** Its shaded side, so the straw obeys the same light as everything else. */
  strawShade: hex(
    shade(strawBase, {
      dl: shading.occlusionDl * 0.6,
      hueRotate: shading.occlusionHueRotate,
      dc: 0,
    }),
  ),
  /** The churned clay in the bottom corners — the third plane. */
  foreClay: hex(foreClayBase),
  /** Its own shaded side. */
  foreClayShade: hex(
    shade(foreClayBase, {
      dl: shading.occlusionDl * 0.7,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    }),
  ),

  /* --- the mud ------------------------------------------------------ */
  /** The blanket the Wipe lifts, and the Toy's whole subject. */
  mud: hex(mudBase),
  /** Each blob's away-side rim, so a caked mass reads as lumps of earth rather
   *  than as flat dots laid on the animal. */
  mudShade: hex(
    shade(mudBase, {
      dl: shading.occlusionDl * 0.55,
      hueRotate: shading.occlusionHueRotate,
      dc: 0,
    }),
  ),
  /** A wet highlight catching the light on a fresh clod — the paper's warmth
   *  reaching down into the darkest thing on screen. */
  mudSheen: hex(tint(mudBase, { dl: 0.14, hueRotate: 10 })),
  /**
   * The clean-snap's glint. Deliberately outside the corridor: it is painted ON
   * a Critter for the length of one reveal, not a region anything is dragged
   * across, so the tracking constraint does not bind.
   */
  sparkle: hex({ l: 0.93, c: 0.07, h: 92 }),

  /* --- house-style primitives, surfaced so every fill is a token ---- */
  /** The paper the collection prints on — also the catchlight. */
  paper: hex(housePaper),
  /** The contour ink. Warm near-black, never `#000`. */
  contour: hex(houseInk),

  /* --- shared Critter colours -------------------------------------- */
  /** The pale patch every Critter shares — derived from the PAPER rather than
   *  invented, so it is the paper showing through the face. */
  critterPale: hex(tint(housePaper, { dl: -0.07, hueRotate: 12 })),
  /** The blush. Held below the body's chroma so the eye stays the most
   *  saturated thing on the face. */
  critterCheek: hex({ l: 0.74, c: Math.min(0.075, cast.chroma * 0.9), h: 20 }),
  /** The eye. The same ink as the contour — the collection's one dark. */
  critterEye: hex(houseInk),
  /** The catchlight is the PAPER showing through, not white. */
  critterEyeShine: hex(housePaper),
  /** Hooves and feet, drawn as tapered fills rather than strokes. */
  critterHoof: hex(houseInk),

  /* --- per-Critter --------------------------------------------------- */
  pigletBody: piglet.body,
  pigletCrop: piglet.crop,
  pigletFeature: piglet.feature,
  pigletShade: piglet.shade,

  ducklingBody: duckling.body,
  ducklingCrop: duckling.crop,
  ducklingFeature: duckling.feature,
  ducklingShade: duckling.shade,

  lambBody: lamb.body,
  lambCrop: lamb.crop,
  lambFeature: lamb.feature,
  lambShade: lamb.shade,

  chickBody: chick.body,
  chickCrop: chick.crop,
  chickFeature: chick.feature,
  chickShade: chick.shade,

  calfBody: calf.body,
  calfCrop: calf.crop,
  calfFeature: calf.feature,
  calfShade: calf.shade,
} as const;
