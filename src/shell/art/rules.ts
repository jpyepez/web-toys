/**
 * The house art rules as checks. Each returns the violations it finds, so a
 * test reads `expect(check(...)).toEqual([])` and a failure names every broken
 * colour or line at once. The reasons behind each number live in `house.ts`
 * and the `critter-art` skill; this file only applies them.
 *
 * `src/toys/house-rules.test.ts` runs these against every Toy, so a new Toy is
 * covered the moment its `palette.ts` exports a `source`.
 */

import { cast as houseCast, paper as housePaper, ink as houseInk } from './house';
import { deltaL, type Oklch } from './oklch';

/** The shape every Toy's `palette.ts` exports as `source`. */
export type PaletteSource = {
  /** Regions the cast is dragged across. Held to the CAST. */
  corridor: readonly Oklch[];
  /** Things landed on or passed. Held to the INK. */
  objects?: readonly Oklch[];
};

/**
 * The corridor's lightness band and its widest allowed spread. The ceiling sits
 * just under the paper (0.94): every shipped field and sky tops out at 0.925–0.93.
 */
export const CORRIDOR = { minL: 0.8, maxL: 0.93, maxSpread: 0.15 } as const;
/** Objects must stay at or above this lightness. */
export const OBJECT_MIN_L = 0.54;
/** Scene chroma may reach at most this fraction of the cast's. */
export const SCENE_CHROMA_RATIO = 0.8;
/** Scenery lines may reach at most this fraction of the cast's contour. */
export const SCENERY_LINE_RATIO = 1;

const fmt = (c: Oklch) => `{l ${c.l.toFixed(3)}, c ${c.c.toFixed(3)}, h ${c.h.toFixed(0)}}`;

/** The corridor clears the cast, sits in the light band, and spans it narrowly. */
export function corridorViolations(corridor: readonly Oklch[]): string[] {
  const out: string[] = [];
  const castColour: Oklch = { l: houseCast.lightness, c: houseCast.chroma, h: 0 };
  for (const c of corridor) {
    if (deltaL(castColour, c) < houseCast.minBackdropDeltaL) out.push(`corridor ${fmt(c)} is within ${houseCast.minBackdropDeltaL} of the cast`);
    if (c.l < CORRIDOR.minL || c.l > CORRIDOR.maxL) out.push(`corridor ${fmt(c)} is outside L ${CORRIDOR.minL}–${CORRIDOR.maxL}`);
  }
  const ls = corridor.map((c) => c.l);
  const spread = Math.max(...ls) - Math.min(...ls);
  if (spread > CORRIDOR.maxSpread + 1e-9) out.push(`corridor spans ${spread.toFixed(3)} of lightness, over ${CORRIDOR.maxSpread}`);
  return out;
}

/** Every object is light enough for the ink contour to clear it. */
export function objectViolations(objects: readonly Oklch[]): string[] {
  const out: string[] = [];
  for (const o of objects) {
    if (o.l < OBJECT_MIN_L) out.push(`object ${fmt(o)} is below L ${OBJECT_MIN_L}`);
    if (deltaL(o, houseInk) < houseCast.minInkDeltaL) out.push(`object ${fmt(o)} is within ${houseCast.minInkDeltaL} of the ink`);
  }
  return out;
}

/** No scene colour bids for attention against the cast, or outshines the paper. */
export function sceneViolations(scene: readonly Oklch[]): string[] {
  const out: string[] = [];
  for (const c of scene) {
    if (c.c > houseCast.chroma * SCENE_CHROMA_RATIO + 1e-9) out.push(`scene ${fmt(c)} has chroma over ${SCENE_CHROMA_RATIO} × the cast's`);
    if (c.l > housePaper.l) out.push(`scene ${fmt(c)} is lighter than the paper`);
  }
  return out;
}

/** All of a palette's colour rules at once. */
export function paletteViolations(source: PaletteSource): string[] {
  const objects = source.objects ?? [];
  return [...corridorViolations(source.corridor), ...objectViolations(objects), ...sceneViolations([...source.corridor, ...objects])];
}

/**
 * Scenery lines stay thinner than the cast's contour: the contour belongs to
 * the figure. `lines` maps each scenery line's name to its width, in the same
 * units as `cast`.
 */
export function lineViolations(cast: number, lines: Record<string, number>, ratio = SCENERY_LINE_RATIO): string[] {
  return Object.entries(lines)
    .filter(([, w]) => w >= cast * ratio)
    .map(([name, w]) => `line "${name}" is ${(w / cast).toFixed(2)} × the cast's, at or over ${ratio}`);
}

/**
 * Patterns banned in Toy source, with the reason each one breaks the style.
 * Checked as text by `src/toys/house-rules.test.ts`. `<ellipse>` is not here:
 * it is right for a soft contact shadow and wrong for a form, and only a
 * reviewer can tell which (see the skill's PRIMITIVES.md).
 */
export const BANNED_SOURCE = [
  { pattern: /\bstroke(Width)?=|\bstroke-width=/, why: 'a uniform stroke is a different line language from the filled contour' },
  { pattern: /\bhsl\(/, why: "author colours in OKLCH; hsl()'s L is not a lightness" },
  { pattern: /Math\.random\(/, why: 'draw randomness from a seeded stream() so a saved config reproduces its picture' },
] as const;
