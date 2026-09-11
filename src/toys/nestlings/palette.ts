/**
 * The Nestlings dusk palette — this Toy's own scene + Critter colours, owned
 * locally per ADR-0004.
 *
 * WHAT CHANGED, AND WHY. Every value used to be a hand-picked `hsl()` tuple.
 * `hsl()`'s `L` is a midpoint of RGB channels, not a lightness, so tuples that
 * looked like siblings on paper were nowhere near each other perceptually — four
 * of the five fledglings sat within ΔL 0.04 of their own sky and were effectively
 * invisible in greyscale, which is how they read as flat stickers on a painted
 * scene. Colours are now AUTHORED in OKLCH and DERIVED:
 *
 *   - the five species share `cast.lightness` and `cast.chroma` from the house
 *     style and differ ONLY in hue, so they read as one family (RULE 3);
 *   - every wing, beak and shade is `shade()` of its body — no shadow is picked
 *     by hand, and none of them is black or grey (RULE 8);
 *   - the catchlight is the PAPER colour, not `#fff` (RULE 1).
 *
 * The token NAMES are unchanged and still load-bearing — `DuskBackdrop`,
 * `CarriableBird`, `Preview` and the tests all address them by name. What moved
 * is where the values come from.
 *
 * Species hues are named per bird rather than swept from an anchor. The lab's
 * even hue-spread was a device for SEEING the sibling mechanic; shipping it
 * verbatim would have given a magenta robin and a red bluebird. RULE 3 requires
 * siblings to differ only in hue — it does not require the hues to be evenly
 * spaced, and a bluebird has to be blue.
 */

import { hex, shade, tint, type Oklch } from '../../shell/art/oklch';
import { cast, ink as houseInk, paper as housePaper, shading } from '../../shell/art/house';

/* ------------------------------------------------------------------ *
 * Scene — a designed FIELD, not a depicted place
 * ------------------------------------------------------------------ */

/*
 * Everything the Critters are dragged across lives in one narrow LIGHT band,
 * 0.80–0.90, and the cast sits at 0.50 below it. That partition is the whole
 * design: minimum contrast then holds by construction and cannot be broken by
 * adding a background element, only by moving a band.
 *
 * It also means every background object is light and separated from its
 * neighbours by the ink contour rather than by its own value — which is exactly
 * Bruna's configuration, and the reason the contour was chosen in the first
 * place. A mid-tone branch or nest would sit inside the cast's own range and
 * disappear under a bird at the moment it matters most.
 *
 * Dusk survives as HUE, not as darkness: a violet field at high lightness reads
 * as evening light rather than as night. The scene still goes properly dark for
 * the settle Outro — see `night` — because by then the Goal is met and nothing
 * is being dragged, so the tracking constraint no longer applies.
 */
const fieldBase: Oklch = { l: 0.9, c: 0.032, h: 250 };
const fieldHigh: Oklch = { l: 0.86, c: 0.04, h: 258 };
/*
 * THE CANOPY. The scene is now inside a tree, and its two foliage planes are
 * corridor-class: a Critter is dragged across every square unit of them, so
 * lightness is spent on clearing the CAST and has almost nothing left over to
 * separate the planes from each other. Depth between them is therefore bought
 * with CHROMA and hue — the far plane sits closer to the sky and lower in
 * chroma, which is atmospheric perspective as arithmetic rather than as taste —
 * and where they overlap they are told apart by occlusion.
 *
 * Reaching for lightness here would reproduce, exactly, the washed-out scene the
 * corridor rule was corrected for the first time: four materials squeezed into
 * one 0.10 band, all the same weight.
 */
/*
 * The hues are warm — yellow-green, not the blue-green a "leaf" reaches for by
 * default. That is the dusk, and it is the whole reason this scene can be light
 * and still be evening. The first canopy that went in used a true green at 152
 * and the Toy stopped reading as dusk at all: bright spring midday, with an
 * Outro that deepened to night out of nowhere. Dusk survives as HUE (the palette
 * header's own rule) and the foliage has to carry it too, not just the sky.
 */
const foliageFar: Oklch = { l: 0.865, c: 0.04, h: 128 };
const foliageNear: Oklch = { l: 0.83, c: 0.068, h: 112 };
/** The moon. Corridor-class — the cast gets dragged straight over it — and warm
 *  enough to read as a moon rather than as a pale hole in the canopy. Held just
 *  under the paper, which stays the lightest surface in the app. */
const moonBase: Oklch = { l: 0.925, c: 0.06, h: 88 };
/*
 * The repoussoir: the cropped foreground foliage in the two bottom corners. It
 * is what turns two planes into three, and it is the strongest "this is a place"
 * cue the scene has.
 *
 * It wanted to be much darker than this — around L 0.42, the darkest thing after
 * the ink, which is what makes a foreground mass read as being IN FRONT rather
 * than as one more layer of the same wall. The ink rule refused it, and the
 * refusal was right: the bottom corners are where a hand rests and where birds
 * get set down, and at 0.42 the contour stops separating from the mass, so a
 * fledgling dropped there loses its own silhouette. A dark foreground and "the
 * cast stays legible anywhere" cannot both be had.
 *
 * So it is object-class, at the darkest the ink still clears — the same bargain
 * the branch already makes at 0.55, where a bird crossing it is held by its
 * contour rather than by its fill. Against a canopy at 0.83–0.87 that still
 * reads decisively as the near, dark plane, and hue keeps it clear of the
 * similarly-dark limbs.
 */
const understoryBase: Oklch = { l: 0.6, c: 0.085, h: 118 };
/*
 * The nest and branch are DARK against a light field, and that is the correction
 * to how the corridor rule was first applied.
 *
 * The corridor governs the large regions a Critter is dragged ACROSS — sky,
 * glow, ground. Applying it to objects as well squeezed air, grass, wood and
 * woven twigs into one 0.10 lightness band, so four different materials had the
 * same weight and the whole scene read as washed out. Objects are governed by
 * the ink instead: a bird crosses them briefly, and its contour is what keeps it
 * legible there. Dark objects on a light field is the configuration this house
 * style came from in the first place.
 */
/*
 * THE WOOD IS LIGHT, and it was not before. This is the correction the squint
 * test forced.
 *
 * A branch at L 0.55 was defensible when the branch was a PINSTRIPE — a
 * hairline of dark object on a light field, negligible in area. The canopy
 * replaced it with a thick bough plus three to six limbs, which multiplied the
 * scene's mid-dark area by more than an order of magnitude. Greyscaled and
 * blurred, the result was unambiguous: the limbs read as dark bars of the same
 * value as the fledglings, and the cast stopped being the darkest thing in its
 * own picture. Hierarchy by area, inverted, without a single individual colour
 * changing.
 *
 * So the wood returns to the configuration the house style actually came from
 * and the palette header already states: background objects are LIGHT and are
 * separated from each other by the ink contour rather than by their own value.
 * The one deliberate exception left is the NEST — which is now the darkest thing
 * in the scene after the cast, because it is the Goal, and the target a child is
 * aiming at should be the most findable object on the screen.
 */
const nestBase: Oklch = { l: 0.6, c: 0.105, h: 68 };
// Hue 74, not the 52 the darker branch used. At L 0.55 a hue of 52 is a warm
// brown; lifted to 0.72 the same hue is SALMON — high-lightness low-chroma
// orange reads pink, not wood. Yellowing it is what keeps it bark.
const branchBase: Oklch = { l: 0.72, c: 0.068, h: 74 };
/** The Outro's night wash. Deliberately outside the corridor: it lands after the
 *  last bird is placed, when there is nothing left to track. */
const nightBase: Oklch = { l: 0.3, c: 0.09, h: 285 };

/* ------------------------------------------------------------------ *
 * The cast — one hue each, everything else shared
 * ------------------------------------------------------------------ */

/**
 * Hues only. Lightness and chroma come from the house style, which is what makes
 * the five a family instead of five independently-picked colours. Spaced far
 * enough apart that no two read as the same bird: rufous, blue, tan, amber,
 * yellow.
 */
const SPECIES_HUE = {
  robin: 30,
  bluebird: 250,
  sparrow: 80,
  wren: 55,
  goldfinch: 105,
} as const;

export type SpeciesName = keyof typeof SPECIES_HUE;

/**
 * The OKLCH values the palette is derived FROM, exported so the rules can be
 * asserted directly rather than round-tripped back out of hex. Consumers paint
 * with `palette`; only tests and future derivations need these.
 */
export const source = {
  paper: housePaper,
  ink: houseInk,
  /** The regions a Critter is dragged across. These must clear the CAST. */
  corridor: [fieldBase, fieldHigh, foliageFar, foliageNear, moonBase] as const,
  /** Small objects a Critter lands on or passes. These must clear the INK. */
  objects: [nestBase, branchBase, understoryBase] as const,
  fieldBase,
  fieldHigh,
  foliageFar,
  foliageNear,
  moonBase,
  understoryBase,
  nestBase,
  branchBase,
  nightBase,
  species: SPECIES_HUE,
  cast,
} as const;

const body = (h: number): Oklch => ({ l: cast.lightness, c: cast.chroma, h });

/** A wing is the body in shadow — the same derivation as every other occlusion. */
const wing = (b: Oklch) =>
  shade(b, {
    dl: shading.occlusionDl * 1.15,
    hueRotate: shading.occlusionHueRotate * 0.6,
    dc: 0,
  });

/** A beak is further down the same ramp, warmed. Never an unrelated brown. */
const beak = (b: Oklch) =>
  shade(b, { dl: 0.22, hueRotate: 30, dc: 0.01 });

const speciesTokens = (name: SpeciesName) => {
  const b = body(SPECIES_HUE[name]);
  return {
    body: hex(b),
    wing: hex(wing(b)),
    beak: hex(beak(b)),
    shade: hex(
      shade(b, {
        dl: shading.occlusionDl,
        hueRotate: shading.occlusionHueRotate,
        dc: shading.occlusionDc,
      }),
    ),
  };
};

const robin = speciesTokens('robin');
const bluebird = speciesTokens('bluebird');
const sparrow = speciesTokens('sparrow');
const wren = speciesTokens('wren');
const goldfinch = speciesTokens('goldfinch');

/* ------------------------------------------------------------------ */

export const palette = {
  /* --- scene ------------------------------------------------------- */
  /** The evening field the whole scene sits in — light, so the contour works. */
  sky: hex(fieldBase),
  /** A slight deepening toward the top of the field. Same corridor. */
  skyDeep: hex(fieldHigh),
  /** The far canopy — the ceiling overhead and the hanging masses. */
  foliage: hex(foliageFar),
  /** The nearer foliage: the fringe growing along every limb and the bough. */
  foliageNear: hex(foliageNear),
  /**
   * The shaded rim along a foliage mass's underside — one light direction,
   * obeyed by every element in the scene.
   *
   * The house shadow formula, unmodified in direction and only widened in
   * degrees. That is worth stating because it looks like it should need
   * inverting here and does not: `shade()` rotates a shadow toward the AMBIENT,
   * and at dusk the ambient is the cold sky, so starting from a warm yellow-green
   * leaf a positive rotation lands cool all by itself. Rotating the other way, to
   * "make the shadow cooler", walks 112 toward 78 — which is oranger, not cooler
   * — and dropping its chroma to compensate turned the top of the canopy grey.
   * The formula was right; the intuition about which way it pointed was not.
   */
  foliageShade: hex(
    shade(foliageNear, {
      dl: shading.occlusionDl * 0.5,
      hueRotate: shading.occlusionHueRotate * 1.6,
      dc: 0.008,
    }),
  ),
  /** The moon, seen through the sky-holes and cropped by the leaves. */
  moon: hex(moonBase),
  /** The cropped foreground foliage in the bottom corners — the third plane. */
  understory: hex(understoryBase),
  /** The bough the nest is cradled in, and the perch limbs the cast waits on. */
  branch: hex(branchBase),
  /** The perch limbs — a shade lighter than the bough, which is nearer. */
  limb: hex(tint(branchBase, { dl: 0.05, hueRotate: 4 })),
  /** The woven nest. */
  nest: hex(nestBase),
  /** The lit rim of the weave. */
  nestRim: hex(tint(nestBase, { dl: 0.07, hueRotate: 5 })),
  /**
   * The bowl's interior. Deeper than the occlusion formula alone would give,
   * because the corridor rule governs what a bird is dragged ACROSS — it does
   * not require the inside of a bowl to be light. Held where the ink still
   * clears it comfortably, so the contour survives a bird sitting in the nest.
   */
  nestShadow: hex(
    shade(nestBase, {
      dl: shading.occlusionDl,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    }),
  ),
  /** Outro glints. */
  sparkle: hex({ l: 0.93, c: 0.09, h: 100 }),
  /** The Outro's night wash — outside the corridor by design. */
  night: hex(nightBase),

  /* --- house-style primitives, surfaced so every fill is a token ---- */
  /** The paper the collection prints on — also the catchlight. */
  paper: hex(housePaper),
  /** The contour ink. Warm near-black, never `#000`. */
  contour: hex(houseInk),

  /* --- shared Critter colours -------------------------------------- */
  /** The pale breast every fledgling shares — a tint of nothing in particular,
   *  so it is derived from the paper rather than invented. */
  birdBelly: hex(tint(housePaper, { dl: -0.06, hueRotate: 10 })),
  /** The blush. RULE 6 keeps it below the body's chroma so the eye stays the
   *  most saturated thing on the face. */
  birdCheek: hex({ l: 0.74, c: Math.min(0.075, cast.chroma * 0.9), h: 20 }),
  /** The eye. The same ink as the contour — RULE 9's one dark. */
  birdEye: hex(houseInk),
  /** The catchlight is the PAPER showing through, not white. */
  birdEyeShine: hex(housePaper),
  /** Feet, drawn as tapered fills rather than strokes. */
  birdFoot: hex(houseInk),

  /* --- per-species ------------------------------------------------- */
  robinBody: robin.body,
  robinWing: robin.wing,
  robinBeak: robin.beak,
  robinShade: robin.shade,

  bluebirdBody: bluebird.body,
  bluebirdWing: bluebird.wing,
  bluebirdBeak: bluebird.beak,
  bluebirdShade: bluebird.shade,

  sparrowBody: sparrow.body,
  sparrowWing: sparrow.wing,
  sparrowBeak: sparrow.beak,
  sparrowShade: sparrow.shade,

  wrenBody: wren.body,
  wrenWing: wren.wing,
  wrenBeak: wren.beak,
  wrenShade: wren.shade,

  goldfinchBody: goldfinch.body,
  goldfinchWing: goldfinch.wing,
  goldfinchBeak: goldfinch.beak,
  goldfinchShade: goldfinch.shade,
} as const;
