/**
 * The Up & Away sky palette — this Toy's own scene + Critter colours, owned
 * locally per ADR-0004.
 *
 * WHAT CHANGED, AND WHY. Every value used to be a hand-picked `hsl()` tuple, and
 * this Toy is the one the OKLCH module's own header cites as the reason it
 * exists: `hsl(205 80% 78%)` (the sky) and `hsl(48 85% 64%)` (the yellow
 * balloon) claim to be 14 points of lightness apart and are perceptually 0.19
 * apart the OTHER WAY — the sky was LIGHTER than the balloon in front of it only
 * in the notation, and darker than it on screen. Converted, the shipped palette
 * came out like this:
 *
 *   - The five balloons sat between L 0.60 (`balloon2`) and L 0.83 (`balloon3`),
 *     so they were not siblings at all: two of them cleared the sky by less than
 *     0.10 against a floor of 0.30, and the yellow one cleared the CLOUDS by
 *     0.06. A yellow balloon crossing a cloud vanished into it.
 *   - `faceShine` was `hsl(0 0% 100%)` — pure white, in a collection whose
 *     lightest surface is the paper at 0.94. A catchlight is the paper showing
 *     through, never `#fff`.
 *   - `grass` carried chroma 0.16 against a cast budget of 0.135, so the thin
 *     band at the bottom of the frame was the most saturated thing on screen.
 *
 * So the five balloons come to the house cast lightness and chroma and differ
 * ONLY in hue, and the scene goes up into the corridor above them.
 *
 * THE REGISTER IS A WARM LOW SUN, and that is a composition decision rather than
 * a taste one. Four of the five Cards on Home already tint from a blue sky
 * (meadow 230, barnyard 232, ocean 238, dusk 250) because four of the five Toys
 * genuinely sit under one — a fifth blue Card is a Home that reads as one Toy
 * five times. Here the horizon is warm and the top of the frame stays cool,
 * which is a real late-afternoon sky, gives the Card (`tint` IS `palette.sky`) a
 * colour nothing else on the row has, and suits a Toy whose whole ending is
 * letting something go into a big sky.
 *
 * HUES ARE GAMUT-CHOSEN, NOT SWEPT. sRGB's chroma ceiling collapses on the
 * yellow-green side and again on the blue side as lightness drops: at L 0.50 the
 * cast's 0.135 chroma is unreachable between roughly hue 50 and hue 128, and
 * again between 150 and 250. A sibling set has to share chroma to BE a sibling
 * set, so the five hues are picked from the arcs that can actually hold 0.135 —
 * which is why the blue balloon is at 258 and not at the 245 a blue reaches for,
 * and why there is no orange one at 62.
 */

import { hex, shade, tint, type Oklch } from '../../shell/art/oklch';
import { cast, ink as houseInk, paper as housePaper, shading } from '../../shell/art/house';

/* ------------------------------------------------------------------ *
 * Scene — a designed FIELD, not a depicted place
 * ------------------------------------------------------------------ */

/*
 * Everything a balloon is carried across lives in one narrow LIGHT band,
 * 0.850–0.925, and the cast sits at 0.50 below it. That partition is the whole
 * design: minimum contrast holds by construction and cannot be broken by adding
 * a background element, only by moving a band.
 */

/**
 * The low, warm sky at the horizon — and the Card's surface tint, the same
 * contract every other Toy's `tint` uses.
 */
const skyBase: Oklch = { l: 0.9, c: 0.052, h: 58 };
/**
 * The pale rose halfway up, and it exists because of how gradients interpolate
 * rather than because a sky needs three colours.
 *
 * A browser blends gradient stops in sRGB, along the straight line between them.
 * The first version of this sky ran a blue top (hue 235) straight into a peach
 * horizon (hue 58) — nearly opposite hues — and the straight line between two
 * opposite hues passes through GREY. The middle third of the frame came out
 * dead, which is precisely the band the whole bunch hangs in.
 *
 * A third stop bends the path the short way round, through rose, so the sky
 * holds chroma all the way down instead of draining and refilling. The top stop
 * moves with it: a lilac-blue rather than a sky-blue, because 272 → 20 → 58 is
 * one continuous arc and 235 → 20 is not.
 */
const skyMidBase: Oklch = { l: 0.885, c: 0.042, h: 20 };
/** The cool top of the frame. The gradient across the three IS the sky. */
const skyHighBase: Oklch = { l: 0.85, c: 0.055, h: 272 };

/*
 * THE CLOUD BANK. Corridor-class, and emphatically so: the Goal of this Toy is
 * to send every balloon UP, so a balloon passes through the clouds on its way
 * off the top of the screen. They are the lightest thing in the scene and still
 * below the paper, which stays the lightest surface in the app.
 */
const cloudBase: Oklch = { l: 0.925, c: 0.016, h: 268 };
/**
 * The cloud's shaded underside. A real value rather than an opacity wash,
 * because it is a large area a balloon rises straight through — the corridor
 * rule binds on it and an opacity over the sky would leave its true lightness
 * unassertable.
 */
const cloudShadeBase: Oklch = { l: 0.875, c: 0.028, h: 292 };

/*
 * THE TWO GROUND PLANES. Corridor-class as well: the bunch is tied down at the
 * bottom of the frame, so a limp balloon sits against the grass and the idle
 * demo plays out there. Depth between them is bought with CHROMA and hue rather
 * than lightness — the far plane sits closer to the sky and lower in chroma,
 * which is atmospheric perspective as arithmetic rather than as taste. Reaching
 * for lightness here is what produced the washed-out scenes the corridor rule
 * was corrected for.
 */
const groundBase: Oklch = { l: 0.855, c: 0.075, h: 132 };
const groundFarBase: Oklch = { l: 0.885, c: 0.042, h: 160 };

/*
 * The objects are governed by the INK rather than by the corridor. A balloon
 * passes an object briefly; its contour is what keeps it legible there, so what
 * must hold is that the ink clears it — not that it clears the cast.
 */
/**
 * The peg the whole bunch is tied to. Hue 74, not the 52 a brown reaches for: at
 * L 0.55 a hue of 52 is warm bark, and lifted to 0.68 the same hue is SALMON —
 * high-lightness low-chroma orange reads pink, not wood. Yellowing it is what
 * keeps it a stake.
 */
const pegBase: Oklch = { l: 0.68, c: 0.062, h: 74 };
/** Grass tufts standing along the ground line, BEHIND the bunch. */
const tuftBase: Oklch = { l: 0.7, c: 0.088, h: 132 };
/**
 * The foreground grass in the two bottom corners — the repoussoir, and the
 * strongest "this is a place" cue the scene has.
 *
 * It wants to be much darker than this, which is what makes a near mass read as
 * being IN FRONT rather than as one more layer of the same wall. It was at 0.60,
 * which clears the ink comfortably and still failed — not on any per-colour rule
 * but on the SQUINT TEST, which is the only check that catches an area failure.
 * Greyscaled and blurred, two corner masses at 0.60 read as dark as the balloons
 * themselves, so the frame had seven dark shapes in it and five of them were the
 * cast. Value is a budget and AREA is the bill; the fix is to spend less of both,
 * so this came up and `foreDepth` came down.
 */
const foreGrassBase: Oklch = { l: 0.68, c: 0.078, h: 142 };

/**
 * The string tying a balloon down to the peg. It belongs to the FIGURE, not to
 * the scenery — it is the thing being held down — so it is derived from the ink
 * rather than held to the object rule, and drawn as a hairline. Lifted off the
 * ink because five of them converge on one peg: value is a budget and AREA is
 * the bill, and five contour-weight lines meeting at a point is a dark mass in
 * the exact spot the bunch is tied.
 */
const stringBase: Oklch = tint(houseInk, { dl: 0.24, hueRotate: 14 });

/* ------------------------------------------------------------------ *
 * The cast — one hue each, everything else shared
 * ------------------------------------------------------------------ */

/**
 * The five balloon hues. Indexed rather than named for a colour, because there
 * is no hidden identity to reveal (PRD) — the five differ only so the bunch has
 * variety, and naming them would imply a meaning the Toy does not have.
 *
 * Lightness and chroma come from the house style, which is what makes the five a
 * family instead of five independently-picked colours. Every one is on an arc
 * that holds the cast's chroma inside sRGB at the cast's lightness — see the
 * header on why that rules out an orange and moves the blue to 258.
 */
const BALLOON_HUE = [25, 48, 150, 258, 320] as const;

/**
 * The OKLCH values the palette is derived FROM, exported so the rules can be
 * asserted directly rather than round-tripped back out of hex. Consumers paint
 * with `palette`; only tests and future derivations need these.
 */
export const source = {
  paper: housePaper,
  ink: houseInk,
  /** The regions a balloon is carried or floated across. These clear the CAST. */
  corridor: [skyBase, skyMidBase, skyHighBase, cloudBase, cloudShadeBase, groundBase, groundFarBase] as const,
  /** Small objects a balloon passes or is tied to. These clear the INK. */
  objects: [pegBase, tuftBase, foreGrassBase] as const,
  skyBase,
  skyMidBase,
  skyHighBase,
  cloudBase,
  cloudShadeBase,
  groundBase,
  groundFarBase,
  pegBase,
  tuftBase,
  foreGrassBase,
  stringBase,
  balloon: BALLOON_HUE,
  cast,
} as const;

const body = (h: number): Oklch => ({ l: cast.lightness, c: cast.chroma, h });

/** The house shadow formula, applied — never a picked value, never black. */
const bodyShade = (b: Oklch) =>
  shade(b, {
    dl: shading.occlusionDl,
    hueRotate: shading.occlusionHueRotate,
    dc: shading.occlusionDc,
  });

const bodies = BALLOON_HUE.map((h) => hex(body(h)));
const shades = BALLOON_HUE.map((h) => hex(bodyShade(body(h))));

/* ------------------------------------------------------------------ */

export const palette = {
  /* --- scene ------------------------------------------------------- */
  /** The warm low sky the bunch is tied under — also the Card's surface tint. */
  sky: hex(skyBase),
  /** The rose halfway up — the stop that keeps the gradient out of grey. */
  skyMid: hex(skyMidBase),
  /** The cool top of the frame, where the balloons are headed. */
  skyHigh: hex(skyHighBase),
  /** The cropped cloud bank hanging from the top edge. */
  cloud: hex(cloudBase),
  /** Its shaded underside — one light direction, obeyed by every element. */
  cloudShade: hex(cloudShadeBase),
  /**
   * The near ground plane the peg is driven into.
   *
   * This is `grass` renamed, and the rename has a reason rather than being
   * churn: the layer changed from a stretched CSS band with its own `dvh` height
   * into the generator's sampled ground line, and a token still called `grass`
   * would have kept painting a layer that no longer exists in the form the name
   * implies.
   */
  ground: hex(groundBase),
  /** The lit crest along the ground line, as a band following it. */
  groundShade: hex(
    shade(groundBase, {
      dl: shading.occlusionDl * 0.5,
      hueRotate: shading.occlusionHueRotate * 1.6,
      dc: 0.008,
    }),
  ),
  /** The far ground plane — cropped banks entering from the side edges. */
  groundFar: hex(groundFarBase),
  /** The peg the whole bunch is tied to. */
  peg: hex(pegBase),
  /** Its shaded side, so the peg obeys the same light as everything else. */
  pegShade: hex(
    shade(pegBase, {
      dl: shading.occlusionDl * 0.8,
      hueRotate: shading.occlusionHueRotate,
      dc: 0,
    }),
  ),
  /** Grass tufts standing along the ground line, behind the bunch. */
  tuft: hex(tuftBase),
  tuftShade: hex(
    shade(tuftBase, {
      dl: shading.occlusionDl * 0.6,
      hueRotate: shading.occlusionHueRotate,
      dc: 0,
    }),
  ),
  /** The cropped foreground grass in the bottom corners — the third plane. */
  foreGrass: hex(foreGrassBase),
  foreGrassShade: hex(
    shade(foreGrassBase, {
      dl: shading.occlusionDl * 0.7,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    }),
  ),
  /**
   * The "this is the one you're holding" glow, and the drifting motes.
   *
   * Deliberately outside the corridor: it is painted ON a balloon for the length
   * of one press, not a region anything is carried across, so the tracking
   * constraint does not bind on it.
   */
  sparkle: hex({ l: 0.93, c: 0.075, h: 88 }),

  /* --- house-style primitives, surfaced so every fill is a token ---- */
  /** The paper the collection prints on — also the catchlight. */
  paper: hex(housePaper),
  /** The contour ink. Warm near-black, never `#000`. */
  contour: hex(houseInk),

  /* --- shared Critter colours -------------------------------------- */
  /** The string tying a balloon down to the peg — see `stringBase`. */
  string: hex(stringBase),
  /** The eyes and the mouth. The same ink as the contour — the one dark. */
  faceInk: hex(houseInk),
  /** The catchlight is the PAPER showing through, never `#fff`. */
  faceShine: hex(housePaper),
  /** The blush. Held below the body's chroma so the eye stays the most
   *  saturated thing on the face. */
  cheek: hex({ l: 0.74, c: Math.min(0.075, cast.chroma * 0.9), h: 20 }),

  /* --- the five balloons -------------------------------------------- */
  balloon1: bodies[0],
  balloon2: bodies[1],
  balloon3: bodies[2],
  balloon4: bodies[3],
  balloon5: bodies[4],
  balloon1Shade: shades[0],
  balloon2Shade: shades[1],
  balloon3Shade: shades[2],
  balloon4Shade: shades[3],
  balloon5Shade: shades[4],
} as const;

/** The five body colours, in the order the bunch lays them out. */
export const BALLOONS: readonly string[] = bodies;

const SHADE_OF = new Map(bodies.map((b, i) => [b, shades[i]]));

/**
 * The shaded companion of a balloon body colour.
 *
 * A lookup rather than a second prop, because the drawing takes its colour as a
 * plain string (the bunch hands it one of `balloon1`…`balloon5`) and the
 * occlusion inside that balloon has to be `shade()` of THAT body — never a
 * picked grey, and never black, which kills chroma and makes mud. An unknown
 * colour falls back to itself, so a decorative mount that passes something
 * off-palette degrades to a flat balloon rather than throwing.
 */
export function shadeOf(bodyColour: string): string {
  return SHADE_OF.get(bodyColour) ?? bodyColour;
}
