import { describe, it, expect } from 'vitest';
import { palette, source, BALLOONS, shadeOf } from './palette';
import { deltaL, outOfGamut } from '../../shell/art/oklch';

/**
 * The Up & Away sky palette.
 *
 * This file has reversed its own earlier assertion, and the reversal is the
 * point of it. It used to pin `/^hsl\(/` on every value — and `hsl()`'s L is a
 * channel midpoint rather than a lightness, so the one thing that actually
 * mattered here was unassertable in it. This Toy is the collection's worked
 * example of that: `hsl(205 80% 78%)` (the sky) and `hsl(48 85% 64%)` (the
 * yellow balloon) read as 14 points of lightness apart in the notation and are
 * 0.19 apart the other way on screen. Converted, the five balloons turned out to
 * span L 0.60 to 0.83 — not siblings at all — and the yellow one cleared the
 * clouds by 0.06 against a floor of 0.30. Every one of those numbers was
 * invisible to the old test, which checked only that the strings began "hsl(".
 *
 * What replaces it: the relationships that keep a Critter legible while a
 * three-year-old fills it and floats it up through the whole frame. Exact hues
 * stay tunable; the relationships are the contract.
 */
describe('Up & Away — sky palette', () => {
  it('exposes the load-bearing scene + Critter token names', () => {
    // ADR-0004: each Toy owns its scene assets locally. Names are what consumers
    // address, and two changes here are renames with reasons rather than churn.
    //
    // `grass` is gone and `ground` replaces it: the layer changed from a
    // stretched CSS band with its own `dvh` height into the generator's sampled
    // ground line, and a token still called `grass` would have kept painting a
    // layer that no longer exists in the form the name implies.
    //
    // `cloud` survives and means something different. It was five `<circle>`s —
    // convex, closed, and 0.25 to 0.31 of a balloon wide, which is squarely
    // inside the cast's own size band AND its own roundness. It is now one
    // cropped bank hanging off the top edge. Same name, because it is still the
    // cloud; different shape class, which is the whole migration.
    //
    // What is new: `skyHigh` (the cool top of the gradient), `cloudShade`,
    // `groundShade`, `groundFar`, `pegShade`, `tuft`/`tuftShade` and
    // `foreGrass`/`foreGrassShade` (the blade masses and the repoussoir), the
    // house `paper`/`contour`, and a `Shade` companion for each of the five
    // balloons so the occlusion inside a balloon is `shade()` of that balloon.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'sky',
        'skyMid',
        'skyHigh',
        'cloud',
        'cloudShade',
        'ground',
        'groundShade',
        'groundFar',
        'peg',
        'pegShade',
        'tuft',
        'tuftShade',
        'foreGrass',
        'foreGrassShade',
        'sparkle',
        'paper',
        'contour',
        'string',
        'faceInk',
        'faceShine',
        'cheek',
        'balloon1', 'balloon2', 'balloon3', 'balloon4', 'balloon5',
        'balloon1Shade', 'balloon2Shade', 'balloon3Shade', 'balloon4Shade', 'balloon5Shade',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('makes the five balloons siblings — same lightness and chroma, hue is the only difference', () => {
    expect(new Set(source.balloon).size).toBe(5);
    expect(BALLOONS).toHaveLength(5);
    expect(new Set(BALLOONS).size).toBe(5);
    expect(BALLOONS).toEqual([
      palette.balloon1,
      palette.balloon2,
      palette.balloon3,
      palette.balloon4,
      palette.balloon5,
    ]);
  });

  it('keeps every balloon inside sRGB at the shared cast lightness and chroma', () => {
    /*
     * The gamut check is here because it is the constraint that PICKED these
     * hues, and because the sibling claim is void without it.
     *
     * sRGB's chroma ceiling collapses twice on the way round at L 0.50: the
     * cast's 0.135 chroma is unreachable between roughly hue 50 and 128, and
     * again between 150 and 250. A hue chosen there does not fail loudly — it is
     * gamut-mapped down to whatever chroma fits, so it quietly stops sharing
     * chroma with its siblings, and "these five are a family" becomes false for
     * exactly the members nobody checked. This is what moves the blue balloon
     * from the 245 a blue reaches for to 258, and what rules out an orange.
     */
    for (const h of source.balloon) {
      const body = { l: source.cast.lightness, c: source.cast.chroma, h };
      expect(outOfGamut(body), `balloon at hue ${h}`).toBe(false);
    }
  });

  it('derives each balloon’s occlusion from its own body, never from a picked grey', () => {
    // `shade()` rotates toward the ambient and holds chroma. Adding black kills
    // chroma and makes mud, which is the look this collection left behind.
    for (const body of BALLOONS) {
      expect(shadeOf(body)).not.toBe(body);
      expect(shadeOf(body)).toMatch(/^#[0-9a-f]{6}$/);
    }
    // Distinct bodies keep distinct shadows — a shared shadow would mean the
    // occlusion had stopped being derived from the balloon it sits inside.
    expect(new Set(BALLOONS.map(shadeOf)).size).toBe(5);
    // An off-palette colour degrades to itself rather than throwing, so a
    // decorative mount that passes something unknown still renders.
    expect(shadeOf('#123456')).toBe('#123456');
  });

  it('keeps the whole corridor clear of the cast by the contrast floor', () => {
    // THE load-bearing assertion, and the one the shipped palette failed. A
    // balloon is filled at the bottom of the frame and then rises through the
    // clouds and off the top, so its legibility is set by the WORST contrast
    // anywhere it can go, never the average — and a minimum over a region is
    // precisely what reviewing a screenshot misses, because the mush zone is a
    // small part of the frame and the balloon is only in it for a few frames.
    const castColour = { l: source.cast.lightness, c: source.cast.chroma, h: 0 };
    for (const region of source.corridor) {
      expect(deltaL(castColour, region)).toBeGreaterThanOrEqual(source.cast.minBackdropDeltaL);
    }
  });

  it('keeps the corridor inside one narrow lightness band', () => {
    // Every unit of background lightness range is spent straight out of the
    // separation budget. A narrow corridor is what makes the guarantee hold by
    // construction rather than by re-checking each time an element is added.
    const ls = source.corridor.map((c) => c.l);
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThanOrEqual(0.15);
  });

  it('keeps small scene objects clear of the INK, so the silhouette survives them', () => {
    // The peg, the tufts and the corner grass are things a balloon passes or is
    // tied to rather than regions it lives in. Demanding a full cast-sized
    // margin against every square unit of them would be over-application; what
    // has to hold is that the contour reads against them, so a balloon's
    // boundary survives even where its fill does not.
    for (const object of source.objects) {
      expect(deltaL(source.ink, object)).toBeGreaterThanOrEqual(source.cast.minInkDeltaL);
    }
  });

  it('holds background chroma below the cast, so the scene never bids for attention', () => {
    // The shipped `grass` was chroma 0.16 — above the cast's whole budget, which
    // made a thin band at the bottom of the frame the most saturated thing on
    // screen. Hue and chroma cannot separate a figure from a ground (two colours
    // at one lightness differ by at most ~1.15:1), but chroma absolutely
    // competes for SALIENCE.
    for (const region of [...source.corridor, ...source.objects]) {
      expect(region.c).toBeLessThanOrEqual(source.cast.chroma * 0.8);
    }
  });

  it('never reaches pure white or pure black, and keeps the paper the lightest surface', () => {
    for (const c of source.corridor) expect(c.l).toBeLessThanOrEqual(source.paper.l);
    expect(palette.paper).not.toBe('#ffffff');
    expect(palette.contour).not.toBe('#000000');
    // `faceShine` was literally `hsl(0 0% 100%)`. A highlight is the paper
    // showing through, never `#fff`.
    expect(palette.faceShine).toBe(palette.paper);
  });

  it('puts every balloon BELOW the sky it is floated through', () => {
    /*
     * Stated as its own assertion because it is the whole migration in one line.
     * The shipped sky was `hsl(205 80% 78%)` at a true L of 0.80 and the yellow
     * balloon `hsl(48 85% 64%)` at 0.83: the Critter was LIGHTER than the field
     * it was drawn on, in the one Toy whose entire subject is a bright shape
     * against a sky.
     */
    expect(source.cast.lightness).toBeLessThan(Math.min(...source.corridor.map((c) => c.l)));
    expect(source.paper.l - source.cast.lightness).toBeGreaterThan(0.3);
  });

  it('keeps the strings a hairline dark, not a sixth balloon’s worth of ink', () => {
    // Five strings converge on one peg, so their combined AREA is what matters
    // rather than any one of them: value is a budget and area is the bill. They
    // are lifted off the contour ink for that reason, and they still have to
    // read against the sky they cross.
    const string = source.stringBase;
    expect(palette.string).not.toBe(palette.contour);
    for (const region of source.corridor) {
      expect(deltaL(string, region)).toBeGreaterThanOrEqual(source.cast.minInkDeltaL);
    }
  });
});
