/**
 * The Soup Pot palette — this Toy's own kitchen and cast colours, owned locally
 * per ADR-0004. Authored in OKLCH and DERIVED, never picked as `hsl()` tuples:
 * `hsl()`'s L is a channel midpoint, not a lightness, so "these are siblings" is
 * unassertable in it.
 *
 * TWO CLASSES, SORTED BEFORE ANY COLOUR WAS CHOSEN.
 *
 *  - CORRIDOR — the regions the cast is seen against: the counter the mice peek
 *    up from, its grain, the pot's shadow on it, the tea towel. One light band,
 *    0.80–0.92, at least `cast.minBackdropDeltaL` clear of the cast, told apart
 *    by hue and chroma rather than lightness.
 *  - OBJECT — things that are landed on or looked into, never lived in: the
 *    pot's rim and inner wall, the soup at every stage, the ladle. Held to the
 *    INK rule instead (L ≥ 0.54, so the contour clears them by 0.30) and carried
 *    by their contour, not their value.
 *
 * THE POT IS LIGHT ON PURPOSE. It is the largest mass on the screen, and value
 * is a budget whose bill is AREA: a cast-iron pot would be the darkest thing in
 * the picture by an order of magnitude and the mice would stop being the figure.
 * So it is pale sage enamel with a cream inside — still unmistakably a pot,
 * because the rim and the contour say so.
 *
 * THE SOUP COOKS BY HUE AND CHROMA, NOT BY DARKNESS. "The colour deepens" was
 * the spec's phrase; read literally it would walk the soup down toward the cast.
 * Every stage is a scene colour, so chroma stays ≤ 0.8 × the cast's and
 * lightness never goes below `soupFloorL`. Broth to tomato is mostly a hue walk
 * from straw to red-orange with chroma rising — that reads as "cooking" to a
 * child well before it reads as darker.
 *
 * THE CAST. Three mice, siblings at the house `cast.lightness`/`cast.chroma`,
 * differing only in hue. Hues come from where sRGB actually has 0.135 chroma at
 * L 0.50 (0–45, 130–150, 250–355). A real mouse is grey-brown, which at cast
 * chroma does not exist; what keeps them mice is the outline — ears, whiskers,
 * the pink nose — not a realistic coat.
 */

import { hex, shade, tint, type Oklch } from '../../shell/art/oklch';
import { cast, ink as houseInk, paper as housePaper, shading } from '../../shell/art/house';

/* ------------------------------------------------------------------ *
 * Scene — corridor class
 * ------------------------------------------------------------------ */

/** The counter: pale, warm wood seen from above. The field everything sits on. */
const counterBase: Oklch = { l: 0.87, c: 0.042, h: 75 };
/** Grain lines on the counter — open marks, a step down and a little warmer. */
const grainBase: Oklch = { l: 0.82, c: 0.05, h: 68 };
/** The tea towel cropped at a corner: a cool rose, so it isn't more wood. */
const towelBase: Oklch = { l: 0.86, c: 0.045, h: 15 };
/** Its stripes — told from the towel by chroma, not by lightness. */
const towelStripeBase: Oklch = { l: 0.81, c: 0.075, h: 20 };

/** The pot's shadow on the counter — the counter's own occlusion, never grey. */
const counterShadow = shade(counterBase, {
  dl: 0.06,
  hueRotate: shading.occlusionHueRotate,
  dc: shading.occlusionDc,
});

/* ------------------------------------------------------------------ *
 * Objects — held to the ink rule
 * ------------------------------------------------------------------ */

/** The enamel rim and outside of the pot — pale sage, a cool foil to the soup. */
const potBase: Oklch = { l: 0.79, c: 0.055, h: 150 };
/** The rim's shaded side (light is from the upper left). */
const potShadeBase = shade(potBase, { dl: shading.occlusionDl, hueRotate: shading.occlusionHueRotate, dc: 0 });
/** The cream enamel inside wall, where it shows above the soup. */
const potInnerBase: Oklch = { l: 0.9, c: 0.025, h: 95 };
/** The inner wall in the rim's shadow, on the side nearest the light. */
const potInnerShadeBase = shade(potInnerBase, { dl: 0.1, hueRotate: shading.occlusionHueRotate, dc: 0.01 });

/**
 * The soup at its four stages: plain broth, warming, bubbling, ready. A walk in
 * hue and chroma with only a gentle lightness step — see the header.
 */
const SOUP: readonly Oklch[] = [
  { l: 0.88, c: 0.05, h: 98 },
  { l: 0.84, c: 0.08, h: 82 },
  { l: 0.8, c: 0.1, h: 62 },
  { l: 0.76, c: 0.105, h: 45 },
];
/** The lowest lightness any soup stage may reach. */
const soupFloorL = 0.72;

/** The wooden ladle — honey wood, lighter than the cast, carried by its contour. */
const ladleBase: Oklch = { l: 0.7, c: 0.08, h: 62 };

/** Steam: paper showing through, slightly warm. Never `#fff`. */
const steamBase = tint(housePaper, { dl: -0.005, hueRotate: 0 });

/* ------------------------------------------------------------------ *
 * The cast
 * ------------------------------------------------------------------ */

/**
 * Hues only. Names are the silhouette each mouse is drawn with (see
 * `MouseDrawing`): big round ears, a top tuft, one floppy ear.
 */
const MOUSE_HUE = {
  roundEars: 35,
  tuft: 300,
  floppy: 255,
} as const;

export type MouseKind = keyof typeof MOUSE_HUE;
export const MOUSE_KINDS = Object.keys(MOUSE_HUE) as MouseKind[];

/** The inner ear, nose and paws: a warm pink, lighter than the body so it reads on it. */
const pinkBase: Oklch = { l: 0.74, c: 0.1, h: 10 };

export const source = {
  paper: housePaper,
  ink: houseInk,
  /** Every region the cast is seen against. These must clear the CAST. */
  corridor: [counterBase, grainBase, towelBase, towelStripeBase, counterShadow] as const,
  /** Every object. These must clear the INK. */
  objects: [potBase, potShadeBase, potInnerBase, potInnerShadeBase, ladleBase, ...SOUP] as const,
  soup: SOUP,
  soupFloorL,
  counterBase,
  towelBase,
  towelStripeBase,
  potBase,
  pinkBase,
  kinds: MOUSE_HUE,
  cast,
} as const;

const body = (h: number): Oklch => ({ l: cast.lightness, c: cast.chroma, h });

const kindTokens = (kind: MouseKind) => {
  const b = body(MOUSE_HUE[kind]);
  return {
    body: hex(b),
    shade: hex(
      shade(b, {
        dl: shading.occlusionDl,
        hueRotate: shading.occlusionHueRotate,
        dc: shading.occlusionDc,
      }),
    ),
  };
};

const roundEars = kindTokens('roundEars');
const tuft = kindTokens('tuft');
const floppy = kindTokens('floppy');

/** A soup stage's colours: the surface and its swirl marks. */
const soupTokens = (s: Oklch) => ({
  surface: hex(s),
  swirl: hex(tint(s, { dl: 0.05, hueRotate: 6 })),
});

export const soupStage = SOUP.map(soupTokens);

export const palette = {
  /* --- scene ------------------------------------------------------- */
  counter: hex(counterBase),
  grain: hex(grainBase),
  counterShadow: hex(counterShadow),
  towel: hex(towelBase),
  towelStripe: hex(towelStripeBase),

  pot: hex(potBase),
  potShade: hex(potShadeBase),
  potInner: hex(potInnerBase),
  potInnerShade: hex(potInnerShadeBase),
  ladle: hex(ladleBase),
  steam: hex(steamBase),

  soup0: soupStage[0].surface,
  soup1: soupStage[1].surface,
  soup2: soupStage[2].surface,
  soup3: soupStage[3].surface,
  swirl0: soupStage[0].swirl,
  swirl1: soupStage[1].swirl,
  swirl2: soupStage[2].swirl,
  swirl3: soupStage[3].swirl,

  /* --- house-style primitives, surfaced so every fill is a token ---- */
  paper: hex(housePaper),
  contour: hex(houseInk),

  /* --- shared Critter colours -------------------------------------- */
  mousePink: hex(pinkBase),
  mousePinkShade: hex(shade(pinkBase, { dl: 0.08, hueRotate: shading.occlusionHueRotate, dc: 0 })),
  mouseEye: hex(houseInk),
  mouseEyeShine: hex(housePaper),
  /** The muzzle patch — paper-derived, so never `#fff`. */
  mouseMuzzle: hex(tint(housePaper, { dl: -0.04, hueRotate: -40 })),

  /* --- per-kind ---------------------------------------------------- */
  roundEarsBody: roundEars.body,
  roundEarsShade: roundEars.shade,
  tuftBody: tuft.body,
  tuftShade: tuft.shade,
  floppyBody: floppy.body,
  floppyShade: floppy.shade,
} as const;
