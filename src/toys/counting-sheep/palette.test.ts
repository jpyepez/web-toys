import { describe, it, expect } from 'vitest';
import { palette, source, FLEECES } from './palette';
import { deltaL, outOfGamut } from '../../shell/art/oklch';

/**
 * The Counting Sheep meadow palette.
 *
 * This file has reversed its own earlier assertion, and the reversal is the
 * point of it. It used to pin `/^hsl\(/` on every value — and `hsl()`'s L is a
 * channel midpoint rather than a lightness, so the one thing that actually
 * mattered here was unassertable in it. Converted, the shipped palette turned
 * out to have the hierarchy INVERTED: the wool sat at L 0.933, level with the
 * paper, and cleared its own clouds by 0.045 and its own sky by 0.148 against a
 * floor of 0.30. Every one of those numbers was invisible to the old test,
 * which checked only that the strings began with "hsl(".
 *
 * What replaces it: the relationships that keep a Critter legible while a
 * three-year-old walks it across the entire frame. Exact hues stay tunable; the
 * relationships are the contract.
 */
describe('Counting Sheep — meadow palette', () => {
  it('exposes the load-bearing scene + Critter token names', () => {
    // ADR-0004: each Toy owns its scene assets locally. Names are what consumers
    // address.
    //
    // `clouds` is gone first and deliberately: four convex, closed, white,
    // Sheep-sized clusters behind one convex, closed, white, Sheep-sized Sheep
    // is figure-class rivalry in both the size band AND the colour class.
    // `scenery` (the lollipop tree's trunk) and `hillNear` (its canopy) follow
    // it. `grassSilhouette` and `horizonGlow` were already retired-but-kept
    // tokens paid for by nothing.
    //
    // What replaces them: `bankFar`/`bankNear` are the two corridor-class ground
    // planes, `sun` the one oversized cropped disc, `bough`/`boughLeaf` the
    // cropped limb that replaced the tree, `tuft` and `foreGrass` the blade
    // masses, and `flower` the counted bloom mass.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'sky',
        'skyHigh',
        'bankFar',
        'bankNear',
        'bankShade',
        'sun',
        'boughLeaf',
        'bough',
        'tuft',
        'tuftShade',
        'foreGrass',
        'foreGrassShade',
        'flower',
        'flowerHeart',
        'doneGlow',
        'paper',
        'contour',
        'sheepMuzzle',
        'sheepCheek',
        'sheepEye',
        'sheepEyeShine',
        'sheepHoof',
        'terracottaBody', 'terracottaCrop', 'terracottaShade',
        'amberBody', 'amberCrop', 'amberShade',
        'mossBody', 'mossCrop', 'mossShade',
        'slateBody', 'slateCrop', 'slateShade',
        'roseBody', 'roseCrop', 'roseShade',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('makes the five Sheep siblings — same lightness and chroma, hue is the only difference', () => {
    const hues = Object.values(source.fleece);
    expect(new Set(hues).size).toBe(5);
    expect(FLEECES).toHaveLength(5);
    const bodies = FLEECES.map((f) => palette[`${f}Body` as const]);
    expect(new Set(bodies).size).toBe(5);
  });

  it('keeps every Sheep inside sRGB at the shared cast lightness and chroma', () => {
    /*
     * The gamut check is here because it is the constraint that PICKED these
     * hues, and because the sibling claim is void without it.
     *
     * sRGB's chroma ceiling collapses on the yellow-green side as lightness
     * drops: at L 0.50 the cast's 0.135 chroma is unreachable anywhere between
     * roughly hue 55 and hue 130. A hue chosen there does not fail loudly — it
     * gets gamut-mapped down to whatever chroma fits, so it quietly stops
     * sharing chroma with its siblings, and "these five are a family" becomes
     * false for exactly the members nobody checked. Asserting it is what keeps
     * the hue list honest when someone reaches for a caramel sheep.
     */
    for (const name of FLEECES) {
      const body = { l: source.cast.lightness, c: source.cast.chroma, h: source.fleece[name] };
      expect(outOfGamut(body), `${name} at the cast's L and C`).toBe(false);
    }
  });

  it('keeps the whole walking corridor clear of the cast by the contrast floor', () => {
    // THE load-bearing assertion, and the one the shipped palette failed on
    // every single region. A Sheep crosses the entire frame during its arrival
    // and its exit, so its legibility is set by the WORST contrast anywhere it
    // can go, never the average — and a minimum over a region is precisely what
    // reviewing a screenshot misses, because the mush zone is a small part of
    // the frame and the Sheep is only in it for a few frames of a slide.
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
    // The bough, the grass and the blooms are things a Sheep passes rather than
    // regions it lives in. Demanding a full cast-sized margin against every
    // square unit of them would be over-application; what has to hold is that
    // the contour reads against them, so the Sheep's boundary survives even
    // where its fill does not.
    for (const object of source.objects) {
      expect(deltaL(source.ink, object)).toBeGreaterThanOrEqual(source.cast.minInkDeltaL);
    }
  });

  it('holds background chroma below the cast, so the ground never bids for attention', () => {
    // The shipped `hillNear` was chroma 0.197 — 1.46x the cast's whole budget,
    // which made the ground the most saturated thing on the screen. Hue and
    // chroma cannot separate a figure from a ground (two colours at one
    // lightness differ by at most ~1.15:1), but chroma absolutely competes for
    // SALIENCE, and losing that competition to the grass is how a Critter stops
    // being the thing you look at.
    for (const region of [...source.corridor, ...source.objects]) {
      expect(region.c).toBeLessThanOrEqual(source.cast.chroma * 0.8);
    }
  });

  it('never reaches pure white or pure black, and keeps the paper the lightest surface', () => {
    for (const c of source.corridor) expect(c.l).toBeLessThanOrEqual(source.paper.l);
    expect(palette.paper).not.toBe('#ffffff');
    expect(palette.contour).not.toBe('#000000');
    expect(palette.sheepEyeShine).toBe(palette.paper);
  });

  it('puts the fleece BELOW the field it is walked across, not level with the paper', () => {
    /*
     * Stated as its own assertion because it is the whole migration in one line,
     * and because the failure it guards against was not a near-miss. The wool
     * was at L 0.933 and the paper is at 0.94: the Critter was, to within seven
     * thousandths, the paper itself — the lightest surface in the app, wearing a
     * dark head. Greyscale the old Toy and the Sheep's entire body disappears.
     */
    expect(source.cast.lightness).toBeLessThan(Math.min(...source.corridor.map((c) => c.l)));
    expect(source.paper.l - source.cast.lightness).toBeGreaterThan(0.3);
  });
});
