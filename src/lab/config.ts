/**
 * The config IS the deliverable. The lab UI is scaffolding around it; what gets
 * promoted into the real Toys is a saved JSON of this shape plus the render
 * function that reads it.
 *
 * Every number here is a taste decision nobody has made yet. Anything that is
 * NOT in here is a rule — the things that make this idea *this* idea, hardcoded
 * on purpose in `Critter.tsx`. The split is deliberate: knobs are for tuning,
 * rules are not up for tuning.
 */

import { deltaL, hex, inkOverPaper, outOfGamut, shade, type Oklch } from '../shell/art/oklch';
import { type CanopyConfig } from '../toys/nestlings/canopy';
import { type MeadowConfig } from '../toys/counting-sheep/meadow';
import { type SkyConfig } from '../toys/balloons/sky';
import { type ReefConfig } from '../toys/puffer-fish/reef';
import { type BarnyardConfig } from '../toys/muddy-puddle/barnyard';
import { CANOPY } from '../toys/nestlings/canopy-config';
import { MEADOW } from '../toys/counting-sheep/meadow-config';
import { SKY } from '../toys/balloons/sky-config';
import { REEF } from '../toys/puffer-fish/reef-config';
import { BARNYARD } from '../toys/muddy-puddle/barnyard-config';
import { type FloeConfig } from '../toys/penguin-slide/floe';
import { FLOE } from '../toys/penguin-slide/floe-config';

export type LineMode = 'contour' | 'none';

/**
 * The background structures worth switching between. A treeline is deliberately
 * NOT among them: rows of crown-sized closed shapes put the background in the
 * same visual class as the cast, and outnumbering five birds with twenty crowns
 * is what made the old scene unreadable. It failed four of the rules below, so
 * it is deleted rather than kept as an option.
 *
 * `canopy` is the answer to what the others could not do: BE somewhere. It is a
 * forest built only from limbs, boughs and foliage mass — every shape class a
 * tree has EXCEPT the crown — so it is a place with no bird-shaped object in it.
 * See `toys/nestlings/canopy.ts` for why that sorting is the whole idea.
 */
export type BackgroundMode =
  | 'glow'
  | 'paper'
  | 'motif'
  | 'split'
  | 'canopy'
  | 'meadow'
  | 'reef'
  | 'barnyard'
  | 'sky'
  | 'floe';

/**
 * THE FORK. A dark ground and a dark-ink cast cannot both work — the ink stops
 * separating the moment the ground approaches it, so the silhouette dissolves
 * exactly where the fills still read. `light` keeps the contour functional and
 * matches the four daylight Toys; `dark` keeps a night mood but needs the
 * contour replaced by a light rim, which makes every Critter a cutout.
 */
export type GroundMode = 'light' | 'dark';
export type Species = 'robin' | 'bluebird' | 'sparrow' | 'wren' | 'goldfinch';

/** The three frames worth composing against. `w/h` is the viewport aspect. */
export const ASPECTS = {
  phone: { label: 'phone 9:19.5', w: 390, h: 844 },
  square: { label: 'square', w: 600, h: 600 },
  desktop: { label: 'desktop 16:10', w: 1440, h: 900 },
} as const;
export type AspectName = keyof typeof ASPECTS;

export const SPECIES: readonly Species[] = ['robin', 'bluebird', 'sparrow', 'wren', 'goldfinch'];

export type Config = {
  seed: number;

  /** Discrete sub-directions — the things you switch between, not slide. */
  mode: {
    /**
     * The one genuinely forked decision. `contour` is Bruna: a single
     * hand-painted variable-width dark contour, the tradition built for
     * pre-literate readers and small sizes. `none` is Harper: no outlines at
     * all, separation carried entirely by colour-against-colour value contrast.
     * They are mutually exclusive — mixing them is what reads as unresolved.
     */
    line: LineMode;
    /** Riso drums. Fewer inks, more overlap doing the work. */
    inks: 2 | 3;
    species: Species;
    /** RULE 4's gate, as a switch: does it survive as a solid black shape? */
    silhouetteTest: boolean;
    showBackdrop: boolean;
    /** Hide the cast to judge the scene on its own, and vice versa. */
    showCritter: boolean;
    /**
     * Whether the SCENERY carries a contour, asked independently of the cast.
     * That independence is the point: "do the nest and the bird share a line
     * language" is the open question, and forcing them to move together would
     * answer it by fiat.
     */
    sceneryLine: LineMode;
    background: BackgroundMode;
    ground: GroundMode;
    /**
     * The frame the scene is composed INTO. Composition is the thing that was
     * broken, and it cannot be judged on a square canvas — the old scene read
     * as acceptable on a phone and fell apart at 16:10, which is exactly the
     * failure a single-aspect preview hides.
     */
    aspect: AspectName;
  };

  /** RULE 1 — the ground every ink multiplies onto. Never white. */
  paper: Oklch;
  /** The contour ink. Near-black and warm, never `#000`. */
  ink: Oklch;

  scene: {
    sky: Oklch;
    /** Ground is derived from sky rather than hand-picked — RULE 2, colours recur. */
    groundDl: number;
    groundHueRotate: number;
  };

  critter: {
    /** RULE 3 — siblings share L and C, and differ ONLY in hue. */
    hueAnchor: number;
    hueSpread: number;
    l: number;
    c: number;
    /** RULE 6 — ≥1.5 or ≤0.7. The band between is the snowman. */
    headBodyRatio: number;
    bodyWidth: number;
    eyeRadius: number;
    /** RULE 6 — distance BELOW the head's midline. Never negative. */
    eyeBelowMidline: number;
    eyeSpread: number;
    /** RULE 6 — strictly less than 1, so the eye outranks the blush. */
    cheekScale: number;
    cheekChroma: number;
    beakLength: number;
    bellyRise: number;
    /** Crown plateau for flat-crowned species. 1 = domed, lower = flatter. */
    crownFlatten: number;
  };

  line: {
    width: number;
    /** How much heavier the contour gets on the underside. */
    taper: number;
    /** The hand. Bruna kept his brush's wobble on purpose and called it that. */
    wobble: number;
    /** RULE 9 — three tiers, each owning one meaning. This is tier 1 → tier 3. */
    detailWidth: number;
  };

  shading: {
    /** RULE 8 — shadows are a formula, not a picked colour. */
    occlusionDl: number;
    occlusionHueRotate: number;
    occlusionDc: number;
    contactStrength: number;
  };

  /**
   * The scene. Everything that decides how the ground relates to the cast is
   * expressed as a RATIO rather than an absolute, so the hierarchy between them
   * survives any retune of either one.
   */
  scenery: {
    /** Scenery contour ÷ critter contour. At 1 the nest is as assertive as a bird. */
    contourRatio: number;
    /** Scenery chroma ÷ cast chroma. Above ~0.8 the ground starts competing. */
    chromaRatio: number;
    /** The single number the whole separation guarantee hangs off. */
    fieldLightness: number;
    horizon: number;
    handCutFrequency: number;
    handCutScale: number;
    /**
     * The halftone glow. A dot screen whose dot AREA ramps toward the horizon —
     * the middle of the frame gets filled by the printing process rather than by
     * objects, so it has something to look at and nothing to count.
     */
    halftone: {
      /** Cell size in viewBox units. Below ~3 it fuses to flat tone; above ~10 the
       *  dots become countable objects. 5-8 is the printed-but-not-pattern band. */
      cell: number;
      /** Screen angle. 45 is the classic, and it avoids beating with the pixel grid. */
      angle: number;
      /** How far up the frame the glow reaches, as a fraction of the horizon. */
      extent: number;
      bands: number;
      /** How far the dot ink sits from the field. Keep small — the bird's contrast
       *  is measured against the DOTS it overlaps, not the field's average. */
      inkDl: number;
    };
    /** One oversized element. Must be far larger than a Critter or it becomes one. */
    motif: { show: boolean; size: number; x: number; y: number };
    /** The canopy — see `toys/nestlings/canopy.ts`. */
    canopy: CanopyConfig;
    /**
     * The meadow — see `toys/counting-sheep/meadow.ts`.
     *
     * It carries no colour knobs, unlike the canopy above, and that difference
     * is deliberate rather than an omission: the Counting Sheep palette is
     * already derived and asserted, so the lab renders it verbatim. What is left
     * unsettled there is the composition, which is what these numbers are.
     */
    meadow: MeadowConfig;
    /**
     * The reef — see `toys/puffer-fish/reef.ts`. Colourless for the same reason
     * the meadow is: the Puffer Fish palette is already derived and asserted, so
     * the lab renders it verbatim and tunes only the composition.
     */
    /**
     * The floe — see `toys/penguin-slide/floe.ts`. Colourless for the same
     * reason as the reef: the Penguin Slide palette is already derived and
     * asserted, so the lab renders it verbatim and tunes only the composition.
     */
    floe: FloeConfig;
    reef: ReefConfig;
    /**
     * The barnyard — see `toys/muddy-puddle/barnyard.ts`. Colourless for the
     * same reason as the reef and the meadow: the Toy's palette is already
     * derived and asserted, so what is tuned here is composition alone.
     */
    barnyard: BarnyardConfig;
    /**
     * The sky — see `toys/balloons/sky.ts`. Colourless for the same reason as
     * the others: the Up & Away palette is already derived and asserted, so what
     * is tuned here is composition alone.
     */
    sky: SkyConfig;
    /**
     * Foliage separation, bought with CHROMA rather than lightness. Both foliage
     * planes live in the corridor (0.80-0.90) because the cast is dragged across
     * them, so lightness has almost nothing left to spend — and three light
     * greens separated by lightness alone is precisely the washed-out failure
     * the corridor rule was corrected for once already.
     */
    foliage: { hue: number; chroma: number; depthDc: number; depthDl: number };
    branch: { thickness: number; sag: number; drop: number };
    nest: {
      x: number;
      width: number;
      height: number;
      weaveCount: number;
      weaveWeight: number;
      twigCount: number;
      twigLength: number;
      twigWeight: number;
    };
  };

  /** RULE 5 — Molnár's 1% disorder. */
  disorder: {
    blobAmp: number;
    instanceRotate: number;
    instanceScale: number;
    instanceHue: number;
    /** RULE 7 — how far paired elements are pushed off the mirror line. */
    asymmetry: number;
  };

  print: {
    grainFrequency: number;
    grainOpacity: number;
    /** Per-plate registration drift, in scene units. */
    misregistration: number;
    plateOpacity: number;
  };
};

export const DEFAULT_CONFIG: Config = {
  seed: 4271,
  mode: {
    line: 'contour',
    inks: 3,
    species: 'robin',
    silhouetteTest: false,
    showBackdrop: true,
    showCritter: true,
    sceneryLine: 'contour',
    background: 'canopy',
    ground: 'light',
    aspect: 'phone',
  },
  // A warm cream. Every ink lands on this, so it must be the lightest surface.
  paper: { l: 0.94, c: 0.018, h: 85 },
  // Warm near-black. RULE 3 puts ink at L ≤ 0.35.
  ink: { l: 0.24, c: 0.03, h: 40 },
  scene: {
    sky: { l: 0.84, c: 0.045, h: 250 },
    groundDl: 0.14,
    groundHueRotate: -110,
  },
  critter: {
    hueAnchor: 40,
    hueSpread: 165,
    // Down from 0.68. On a light ground the binding constraint is not the field
    // but the GLOW DOTS, which sit inkDl below it — a bird is measured against
    // the dots it actually overlaps, not the field's average. 0.50 clears the
    // dots by the 0.30 floor and the field by 0.40.
    l: 0.5,
    c: 0.135,
    headBodyRatio: 1.55,
    bodyWidth: 25,
    eyeRadius: 6.2,
    eyeBelowMidline: 3.5,
    eyeSpread: 8.5,
    cheekScale: 0.62,
    cheekChroma: 0.075,
    beakLength: 9,
    bellyRise: 0.55,
    crownFlatten: 0.78,
  },
  line: {
    width: 2.6,
    taper: 0.42,
    wobble: 0.14,
    detailWidth: 1.05,
  },
  shading: {
    occlusionDl: 0.12,
    occlusionHueRotate: 24,
    occlusionDc: 0.02,
    contactStrength: 0.5,
  },
  disorder: {
    blobAmp: 0.035,
    instanceRotate: 3,
    instanceScale: 0.05,
    instanceHue: 5,
    asymmetry: 1,
  },
  scenery: {
    // Deliberately below 1: the cast has to stay the figure.
    contourRatio: 0.62,
    chromaRatio: 0.7,
    // Light ground: the ink contour separates everywhere, and it matches the
    // four daylight Toys. `dark` is reachable as a mode.
    fieldLightness: 0.9,
    horizon: 96,
    handCutFrequency: 0.05,
    handCutScale: 1.1,
    halftone: { cell: 1.9, angle: 45, extent: 0.62, bands: 10, inkDl: 0.09 },
    motif: { show: false, size: 26, x: 74, y: 26 },
    /*
     * THE SHIPPED configs, not the generators' own defaults — and the
     * difference is not cosmetic.
     *
     * The lab used to open on `CANOPY_DEFAULTS`/`MEADOW_DEFAULTS`, which are the
     * generator's starting numbers, NOT the ones the Toy actually paints. The
     * canopy had already been harvested away from its defaults (`lobeRatio`
     * 0.095 vs 0.075, `moonX` 58 vs 76, `understoryDepth` 0.13 vs 0.2), so the
     * lab was showing a scene the app does not have. That is bad as a preview
     * and much worse as a SAVE: a config saved without touching anything came
     * out carrying the pre-harvest canopy, and harvesting that block back would
     * have silently reverted three tuned values in a Toy nobody was working on.
     *
     * Opening on what ships makes the round trip honest — the lab shows the
     * current picture, a save is a truthful snapshot of it, and a harvest can
     * only ever move numbers the user actually moved.
     */
    canopy: CANOPY,
    meadow: MEADOW,
    reef: REEF,
    floe: FLOE,
    barnyard: BARNYARD,
    sky: SKY,
    foliage: { hue: 152, chroma: 0.06, depthDc: 0.028, depthDl: 0.035 },
    branch: { thickness: 4.4, sag: 2.6, drop: 8 },
    nest: {
      x: 74,
      width: 34,
      height: 21,
      weaveCount: 4,
      weaveWeight: 1.9,
      twigCount: 7,
      twigLength: 9,
      twigWeight: 0.85,
    },
  },
  print: {
    grainFrequency: 0.72,
    grainOpacity: 0.14,
    misregistration: 0.55,
    plateOpacity: 0.93,
  },
};

/* ------------------------------------------------------------------ *
 * Derivation — where the rules get enforced and reported
 * ------------------------------------------------------------------ */

export type Warning = { rule: string; message: string };

export type Derived = {
  paper: string;
  ink: string;
  sky: Oklch;
  ground: Oklch;
  skyInk: string;
  groundInk: string;
  /** One entry per species, sharing L and C, differing only in hue. */
  cast: Record<Species, { base: Oklch; fill: string; solid: string; occlusion: string; occlusionSolid: string; contour: string }>;
  warnings: Warning[];
};

export function derive(cfg: Config): Derived {
  const warnings: Warning[] = [];
  const { paper, ink, scene, critter, shading } = cfg;

  const ground: Oklch = {
    l: Math.max(0, scene.sky.l - scene.groundDl),
    c: scene.sky.c,
    h: (scene.sky.h + scene.groundHueRotate + 360) % 360,
  };

  const cast = {} as Derived['cast'];
  SPECIES.forEach((sp, i) => {
    // RULE 3: hue is the ONLY axis the siblings vary on.
    const step = SPECIES.length > 1 ? i / (SPECIES.length - 1) - 0.5 : 0;
    const base: Oklch = {
      l: critter.l,
      c: critter.c,
      h: (critter.hueAnchor + step * critter.hueSpread + 360) % 360,
    };
    const occ = shade(base, {
      dl: shading.occlusionDl,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    });

    if (outOfGamut(base)) {
      warnings.push({
        rule: 'RULE 3',
        message: `${sp} at L ${base.l.toFixed(2)} C ${base.c.toFixed(3)} is outside sRGB — lower chroma or lightness.`,
      });
    }
    if (deltaL(base, scene.sky) < 0.12) {
      warnings.push({
        rule: 'RULE 3',
        message: `${sp} is ΔL ${deltaL(base, scene.sky).toFixed(3)} from the sky — needs ≥ 0.12 or it vanishes in greyscale.`,
      });
    }

    const fill = inkOverPaper(base, paper);
    if (fill.clipped) {
      warnings.push({
        rule: 'RULE 1',
        message: `${sp} is lighter than the paper in at least one channel — multiply can only darken. Darken it, or lift the paper.`,
      });
    }

    cast[sp] = {
      base,
      // `fill` is the INK — what you would put on a plate to land on `base`
      // after multiplying with the paper. `solid` is the landed colour itself.
      // Scenery multiplies onto paper and wants the ink; a Critter is drawn
      // OPAQUELY over the scene and wants the result, because a figure that
      // multiplies with its own background stops being a figure — the treeline
      // showed straight through the bird the first time the scene went in.
      fill: fill.hex,
      solid: hex(base),
      occlusion: inkOverPaper(occ, paper).hex,
      occlusionSolid: hex(occ),
      contour: inkOverPaper(ink, paper).hex,
    };
  });

  if (scene.sky.l > paper.l) {
    warnings.push({
      rule: 'RULE 1',
      message: 'The sky is lighter than the paper. Paper must be the lightest surface in the app.',
    });
  }
  if (critter.cheekScale >= 1) {
    warnings.push({
      rule: 'RULE 6',
      message: 'The blush is not smaller than the eye — the saturation hierarchy is inverted.',
    });
  }
  if (critter.headBodyRatio > 0.7 && critter.headBodyRatio < 1.5) {
    warnings.push({
      rule: 'RULE 6',
      message: `Head/body ratio ${critter.headBodyRatio.toFixed(2)} is in the snowman band — commit to ≥ 1.5 or ≤ 0.7.`,
    });
  }
  if (critter.eyeBelowMidline < 0) {
    warnings.push({
      rule: 'RULE 6',
      message: 'Eyes are above the head midline — that is an adult skull, not a baby.',
    });
  }

  return {
    paper: hex(paper),
    ink: hex(ink),
    sky: scene.sky,
    ground,
    skyInk: inkOverPaper(scene.sky, paper).hex,
    groundInk: inkOverPaper(ground, paper).hex,
    cast,
    warnings,
  };
}
