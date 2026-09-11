import { describe, it, expect } from 'vitest';
import { palette, source } from './palette';
import { deltaL, outOfGamut } from '../../shell/art/oklch';

/**
 * The Puffer Fish reef palette.
 *
 * This file has reversed its own earlier assertion, and the reversal is the
 * point of it. It used to pin `/^hsl\(/` on every value — and `hsl()`'s L is a
 * channel midpoint rather than a lightness, so the one thing that actually
 * mattered here was unassertable in it. Converted, the shipped palette turned
 * out to have the hierarchy INVERTED and by a wider margin than the meadow's:
 * the fish body sat at L 0.968, ABOVE the paper the collection prints on, and
 * cleared its own bubbles by 0.033 against a floor of 0.30. Every one of those
 * numbers was invisible to the old test, which checked only that the strings
 * began with "hsl(".
 *
 * What replaces it: the relationships that keep a Critter legible while a
 * three-year-old watches it cross the entire frame. Exact hues stay tunable; the
 * relationships are the contract.
 */
describe('Puffer Fish — reef palette', () => {
  it('exposes the load-bearing scene + Critter token names', () => {
    // ADR-0004: each Toy owns its scene assets locally. Names are what consumers
    // address.
    //
    // `coral` is gone first and deliberately: two convex, closed, Fish-sized
    // clumps flanking one convex, closed, Fish-sized Fish is figure-class
    // rivalry, the same error the meadow's lollipop tree made. `sand` becomes
    // `bed`, and `bubble` loses its own token — a bubble is the PAPER showing
    // through, which is what a highlight is in this style.
    //
    // What replaces them: `ridge` is the cropped far plane, `sun` the one
    // oversized cropped disc, `kelpStipe`/`kelpLeaf` the cropped limb that
    // replaced the clumps, `frond` and `foreReef` the blade masses, and `polyp`
    // the counted coral mass.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'waterSurface',
        'water',
        'lightRay',
        'ridge',
        'bed',
        'bedShade',
        'sun',
        'kelpLeaf',
        'kelpStipe',
        'frond',
        'frondShade',
        'foreReef',
        'foreReefShade',
        'polyp',
        'polypHeart',
        'paper',
        'contour',
        'fishBody',
        'fishFin',
        'fishShade',
        'fishBelly',
        'fishCheek',
        'fishEye',
        'fishEyeShine',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('keeps the Fish inside sRGB at the shared cast lightness and chroma', () => {
    /*
     * The gamut check is here because it is the constraint that PICKED this hue.
     *
     * sRGB's chroma ceiling collapses on the yellow-green side as lightness
     * drops: at L 0.50 the cast's 0.135 chroma is unreachable anywhere between
     * roughly hue 55 and hue 130. A hue chosen there does not fail loudly — it
     * gets gamut-mapped down to whatever chroma fits, so it quietly stops
     * sharing chroma with the rest of the collection, and "this Critter is one
     * of the family" becomes false. Asserting it is what keeps the hue honest
     * when someone reaches for a goldfish.
     */
    expect(outOfGamut(source.body), 'the Fish at the cast’s L and C').toBe(false);
    expect(source.body.l).toBe(source.cast.lightness);
    expect(source.body.c).toBe(source.cast.chroma);
  });

  it('keeps the whole swimming corridor clear of the cast by the contrast floor', () => {
    // THE load-bearing assertion, and the one the shipped palette failed on
    // every single region. A Fish swims in across the frame and floats out
    // through the top of it, so its legibility is set by the WORST contrast
    // anywhere it can go, never the average — and a minimum over a region is
    // precisely what reviewing a screenshot misses, because the mush zone is a
    // small part of the frame and the Fish is only in it for a few frames.
    const castColour = { l: source.cast.lightness, c: source.cast.chroma, h: source.fishHue };
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
    // The kelp, the fronds and the polyps are things a Fish passes rather than
    // regions it lives in. Demanding a full cast-sized margin against every
    // square unit of them would be over-application; what has to hold is that
    // the contour reads against them, so the Fish's boundary survives even where
    // its fill does not.
    for (const object of source.objects) {
      expect(deltaL(source.ink, object)).toBeGreaterThanOrEqual(source.cast.minInkDeltaL);
    }
  });

  it('holds background chroma below the cast, so the reef never bids for attention', () => {
    // The shipped `water` was chroma 0.146 and the shipped `fishCheek` 0.169 —
    // the sea was more saturated than the entire cast budget and the blush was
    // more saturated than the sea. Hue and chroma cannot separate a figure from
    // a ground, but chroma absolutely competes for SALIENCE, and losing that
    // competition to the water is how a Critter stops being the thing you look
    // at.
    for (const region of [...source.corridor, ...source.objects]) {
      expect(region.c).toBeLessThanOrEqual(source.cast.chroma * 0.8);
    }
  });

  it('never reaches pure white or pure black, and keeps the paper the lightest surface', () => {
    for (const c of source.corridor) expect(c.l).toBeLessThanOrEqual(source.paper.l);
    expect(palette.paper).not.toBe('#ffffff');
    expect(palette.contour).not.toBe('#000000');
    expect(palette.fishEyeShine).toBe(palette.paper);
  });

  it('puts the whole Fish BELOW the water it is swum through, belly included', () => {
    /*
     * Stated as its own assertion because it is the whole migration in one line,
     * and because the failure it guards against was not a near-miss. The body
     * was at L 0.968 and the paper is at 0.94: the Critter was LIGHTER than the
     * lightest surface in the app. Greyscale the old Toy and the fish's entire
     * body disappears, leaving two eyes and a smile on a blue field.
     *
     * The belly is checked with it, because it is the one part that is
     * deliberately lighter than the body and therefore the one that could
     * quietly re-open the hole. It is derived as a step off the body rather than
     * off the paper for exactly this reason.
     */
    const darkestRegion = Math.min(...source.corridor.map((c) => c.l));
    expect(source.cast.lightness).toBeLessThan(darkestRegion);
    expect(source.belly.l, 'the belly is still darker than the darkest region').toBeLessThan(
      darkestRegion,
    );
    expect(source.paper.l - source.cast.lightness).toBeGreaterThan(0.3);
  });
});
