/**
 * The Puffer Fish reef palette — this Toy's own scene + Critter colours, owned
 * locally per ADR-0004.
 *
 * WHAT CHANGED, AND WHY. Every value used to be a hand-picked `hsl()` tuple, and
 * converting them exposed the same inverted hierarchy the meadow had, one notch
 * worse:
 *
 *   - The FISH BODY sat at L 0.968 — ABOVE the paper the whole collection prints
 *     on (0.94), so the Critter was literally the lightest surface in the app.
 *     Against the regions it is swum across it cleared 0.128 (`waterSurface`),
 *     0.077 (`lightRay`), 0.115 (`sand`) and 0.033 (`bubble`) — every one of them
 *     under the 0.30 floor, and the bubbles were within a rounding error of the
 *     fish itself. Greyscaled, the Toy was two dark eyes and a smile floating on
 *     a blue field; the whole body dissolved.
 *   - `fishCheek` carried chroma 0.169 and `fishFin` 0.135 — the blush was more
 *     saturated than the entire cast budget, and it was drawn LARGER than the eye.
 *   - `water` at chroma 0.146 made the background more saturated than the cast.
 *
 * So the body comes DOWN to the house cast lightness and the reef goes up into
 * the corridor. What is given up is the white puffer — the same trade the meadow
 * made with its storybook-white sheep, and refused for the same reason: a white
 * body cannot be the darkest thing in its own picture, and no amount of contour
 * rescues a figure that shares a lightness with its ground. A pufferfish is a
 * warm sandy coral animal anyway; white was the aquarium-plastic version of it.
 *
 * Colours are AUTHORED in OKLCH and DERIVED: the body is `cast.lightness` and
 * `cast.chroma` from the house style with a single hue picked here, the fins,
 * spots and belly are all steps off that one colour, every shadow is `shade()`,
 * and the catchlight is the PAPER, not `#fff`.
 */

import { hex, shade, tint, type Oklch } from '../../shell/art/oklch';
import { cast, ink as houseInk, paper as housePaper, shading } from '../../shell/art/house';

/* ------------------------------------------------------------------ *
 * Scene — a designed FIELD, not a depicted place
 * ------------------------------------------------------------------ */

/*
 * Everything the Fish is swum across lives in one narrow LIGHT band,
 * 0.850–0.930, and the cast sits at 0.50 below it. That partition is the whole
 * design: minimum contrast holds by construction and cannot be broken by adding
 * a background element, only by moving a band.
 *
 * The register is a bright, shallow, sunlit lagoon — deliberately NOT the deep
 * blue an underwater scene reaches for first. Deep water is dark water, and a
 * dark ground under a dark-ink cast kills the contour outright (the light-rim
 * alternative turns every Critter into a cutout). It also keeps this Toy's time
 * of day distinct from the meadow's daylight and Nestlings' dusk: what separates
 * the three is HUE and register, never lightness, because lightness is spent.
 */
const waterSurfaceBase: Oklch = { l: 0.905, c: 0.048, h: 205 };
const waterBase: Oklch = { l: 0.85, c: 0.068, h: 238 };
/** The god-ray shafts. Corridor-class — the Fish swims straight through them —
 *  and held just under the paper, which stays the lightest surface in the app. */
const lightRayBase: Oklch = { l: 0.925, c: 0.042, h: 196 };
/*
 * THE TWO SEABED PLANES. Both are corridor-class — the Fish's swim-in crosses
 * the frame at rest height and its float-away crosses everything above it — so
 * lightness is spent on clearing the CAST and has almost nothing left to
 * separate the planes from each other. Depth between them is bought with CHROMA
 * and HUE instead: the far ridge sits close to the water in hue and lower in
 * chroma, which is atmospheric perspective as arithmetic rather than as taste,
 * and where they overlap they are told apart by occlusion.
 *
 * The hue gap between the bed and the water is 150 degrees on purpose. Sand and
 * water at one lightness can only be told apart by hue and chroma; giving them a
 * near hue would produce the washed-out single wall the corridor rule was
 * corrected for once already.
 */
const ridgeBase: Oklch = { l: 0.885, c: 0.045, h: 200 };
const bedBase: Oklch = { l: 0.875, c: 0.055, h: 88 };
/** The sun, seen through the surface. Corridor-class — the Fish floats up across
 *  it on the way out — and the lightest region in the scene. */
const sunBase: Oklch = { l: 0.93, c: 0.05, h: 96 };
/** The blade mass on the kelp cropped by the top edge. Corridor-class because
 *  the swim-in carries the Fish under the kelp's reach at a wide aspect. */
const kelpLeafBase: Oklch = { l: 0.86, c: 0.072, h: 152 };

/*
 * The objects are governed by the INK rather than by the corridor. A Fish passes
 * an object briefly, and its contour is what keeps it legible there; requiring a
 * full cast-sized margin against every square unit of a stipe or a frond is
 * over-application, and applying it anyway is what squeezed water, sand, weed
 * and rock into one 0.10 band and made the whole scene read washed out.
 */
/** The kelp stipe — the stem the blades run along. */
const kelpStipeBase: Oklch = { l: 0.63, c: 0.075, h: 128 };
/** Sea-fan fronds standing on the bed, behind the Fish. Lighter than the
 *  foreground because they are further away, and thin enough that their area
 *  never adds up to a mass — the failure mode that inverted the canopy. */
const frondBase: Oklch = { l: 0.705, c: 0.085, h: 162 };
/*
 * THE FOREGROUND REEF — the repoussoir in the two bottom corners, and the
 * strongest "this is a place" cue the scene has. Cool rock rather than the rose
 * coral it started as: at a warm hue it was the second-warmest mass in the frame
 * after the Fish itself, and a foreground stripe competing with the cast for
 * warmth is a foreground stripe you look at. It wanted to be much darker
 * than this, around L 0.42, which is what makes a foreground mass read as being
 * IN FRONT rather than as one more layer of the same wall. The ink rule refused
 * it and the refusal was right: the bottom corners are where a hand rests on a
 * phone, and at 0.42 the contour stops separating from the mass.
 */
const foreReefBase: Oklch = { l: 0.595, c: 0.062, h: 214 };
/** Coral polyps. Object-class, and only ever drawn as a counted MASS of lobes
 *  under an eighth of a Fish — a single polyp at cast scale would be a second
 *  character, which is exactly what the two coral clumps were. */
const polypBase: Oklch = { l: 0.685, c: 0.095, h: 22 };

/* ------------------------------------------------------------------ *
 * The cast — one hue, everything else shared with the collection
 * ------------------------------------------------------------------ */

/**
 * The Fish's hue. Lightness and chroma come from the house style, which is what
 * makes this Critter a member of the same family as the Sheep and the
 * fledglings rather than an independently-picked colour.
 *
 * 38 is a warm coral-orange, chosen against the water's 238: complementary hues
 * cannot separate figure from ground on their own (two colours at one lightness
 * differ by at most ~1.15:1 in contrast), but with the lightness partition
 * already doing that work, the hue gap is what makes the Fish read as a
 * different KIND of thing from the sea it is in rather than as a darker patch of
 * it. It is also on an arc that holds the cast's chroma inside sRGB at the
 * cast's lightness — the yellow-greens from roughly 55 to 130 cannot, so a
 * "goldfish" hue is not available at this lightness however much it is wanted.
 */
const FISH_HUE = 38;

const bodyBase: Oklch = { l: cast.lightness, c: cast.chroma, h: FISH_HUE };

/**
 * The fins, tail and dorsal — the body one step down the same ramp, never an
 * unrelated pink. A fin is the same animal in thinner tissue, and the old
 * palette's `hsl(340 75% 80%)` was a second colour with its own hue family
 * stuck onto a white body.
 */
const finBase = shade(bodyBase, {
  dl: shading.occlusionDl * 1.15,
  hueRotate: shading.occlusionHueRotate * 0.6,
  dc: 0,
});

/**
 * The pale underside. Derived from the BODY rather than from the paper — a
 * belly is a large area on a round fish, and taking it up to paper lightness the
 * way the Sheep's small muzzle does would put a bright hole in the middle of the
 * cast and undo the partition the rest of this file buys. At L 0.70 it is still
 * well below the darkest region in the scene, so the whole Critter stays the
 * darkest mass in the frame under the squint test.
 */
const bellyBase = tint(bodyBase, { dl: 0.2, hueRotate: 12 });

/**
 * The OKLCH values the palette is derived FROM, exported so the rules can be
 * asserted directly rather than round-tripped back out of hex. Consumers paint
 * with `palette`; only tests and future derivations need these.
 */
export const source = {
  paper: housePaper,
  ink: houseInk,
  /** The regions a Fish is swum across. These must clear the CAST. */
  corridor: [waterSurfaceBase, waterBase, lightRayBase, ridgeBase, bedBase, sunBase, kelpLeafBase] as const,
  /** Small objects a Fish passes. These must clear the INK. */
  objects: [kelpStipeBase, frondBase, foreReefBase, polypBase] as const,
  waterSurfaceBase,
  waterBase,
  lightRayBase,
  ridgeBase,
  bedBase,
  sunBase,
  kelpLeafBase,
  kelpStipeBase,
  frondBase,
  foreReefBase,
  polypBase,
  fishHue: FISH_HUE,
  body: bodyBase,
  belly: bellyBase,
  cast,
} as const;

/* ------------------------------------------------------------------ */

export const palette = {
  /* --- scene ------------------------------------------------------- */
  /** The lit water near the surface — the top of the field's grade. */
  waterSurface: hex(waterSurfaceBase),
  /**
   * The water at depth, and the field the whole scene sits in. Also the Card's
   * surface tint, the same contract every other Toy's `tint` uses.
   */
  water: hex(waterBase),
  /** The god-ray shafts slanting down from the surface. */
  lightRay: hex(lightRayBase),
  /** The far reef ridges — cropped masses entering from the side edges. */
  ridge: hex(ridgeBase),
  /** The seabed: the one plane allowed to cross the frame horizontally. */
  bed: hex(bedBase),
  /**
   * The shaded trough along the bed's own relief — one light direction, obeyed
   * by every element in the scene.
   *
   * The house shadow formula, unmodified in direction and only widened in
   * degrees. Worth stating because it looks like it needs inverting here and
   * does not: `shade()` rotates toward the AMBIENT, and from a warm sand hue a
   * positive rotation lands cooler on its own, which is what a shadow underwater
   * actually does.
   */
  bedShade: hex(
    shade(bedBase, {
      dl: shading.occlusionDl * 0.5,
      hueRotate: shading.occlusionHueRotate * 1.6,
      dc: 0.008,
    }),
  ),
  /** The sun through the surface — one oversized disc, cropped by the frame. */
  sun: hex(sunBase),
  /** The blade fringe on the kelp that crops into the top edge. */
  kelpLeaf: hex(kelpLeafBase),
  /** The kelp stipe itself — what replaces the two coral clumps. */
  kelpStipe: hex(kelpStipeBase),
  /** Sea-fan fronds standing on the bed, behind the Fish. */
  frond: hex(frondBase),
  /** Their shaded side, so the fronds obey the same light as everything else. */
  frondShade: hex(
    shade(frondBase, {
      dl: shading.occlusionDl * 0.6,
      hueRotate: shading.occlusionHueRotate,
      dc: 0,
    }),
  ),
  /** The cropped foreground reef in the bottom corners — the third plane. */
  foreReef: hex(foreReefBase),
  /** Its own shaded side. */
  foreReefShade: hex(
    shade(foreReefBase, {
      dl: shading.occlusionDl * 0.7,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    }),
  ),
  /** Coral polyps, only ever drawn as a counted mass of tiny lobes. */
  polyp: hex(polypBase),
  /** A polyp's centre — the same warm ramp, one step down. */
  polypHeart: hex(
    shade(polypBase, {
      dl: shading.occlusionDl * 1.4,
      hueRotate: shading.occlusionHueRotate,
      dc: 0,
    }),
  ),

  /* --- house-style primitives, surfaced so every fill is a token ---- */
  /** The paper the collection prints on — also the catchlight and the bubbles. */
  paper: hex(housePaper),
  /** The contour ink. Warm near-black, never `#000`. */
  contour: hex(houseInk),

  /* --- the Critter -------------------------------------------------- */
  /** The puffer's body, at the house cast lightness and chroma. */
  fishBody: hex(bodyBase),
  /** Fins, tail and dorsal — the body one step down the same ramp. */
  fishFin: hex(finBase),
  /** The form shadow inside the body, and the spot mass on its back. */
  fishShade: hex(
    shade(bodyBase, {
      dl: shading.occlusionDl,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    }),
  ),
  /** The pale underside — a lighter step of the body, not the paper. */
  fishBelly: hex(bellyBase),
  /** The blush. Held below the body's chroma so the eye stays the most
   *  saturated thing on the face — the old cheek was BOTH larger than the eye
   *  and half again as saturated as the entire cast budget. */
  fishCheek: hex({ l: 0.74, c: Math.min(0.075, cast.chroma * 0.9), h: 18 }),
  /** The eye. The same ink as the contour — the collection's one dark. */
  fishEye: hex(houseInk),
  /** The catchlight is the PAPER showing through, not white. */
  fishEyeShine: hex(housePaper),
} as const;
