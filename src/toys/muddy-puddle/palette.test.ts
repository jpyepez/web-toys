import { describe, it, expect } from 'vitest';
import { palette, source, CRITTERS } from './palette';
import { deltaL, outOfGamut } from '../../shell/art/oklch';

/**
 * The Muddy Puddle barnyard palette.
 *
 * This file has reversed its own earlier assertion, and the reversal is the
 * point of it. It used to pin `/^hsl\(/` on every value — and `hsl()`'s L is a
 * channel midpoint rather than a lightness, so the one thing that actually
 * mattered here was unassertable in it. Converted, the shipped palette turned
 * out to have the hierarchy inverted for two of the five Critters: `lambWool`
 * and `calfSpot` both sat at L 0.925, level with the paper the collection prints
 * on, clearing their own sky by 0.09 against a floor of 0.30. The barn was more
 * saturated than any animal on the screen. Every one of those numbers was
 * invisible to the old test, which checked only that the strings began "hsl(".
 *
 * What replaces it: the relationships that keep a Critter legible while a
 * three-year-old drags a finger across the entire frame. Exact hues stay
 * tunable; the relationships are the contract.
 */
describe('Muddy Puddle — barnyard palette', () => {
  it('exposes the load-bearing scene + Critter token names', () => {
    // ADR-0004: each Toy owns its scene assets locally. Names are what consumers
    // address, and the shared `tokens.ts` still gains no barnyard keys.
    //
    // Gone first and deliberately: nothing here paints a free-standing barn
    // silhouette or a row of fence posts as objects to be counted. `barn` is now
    // one mass the frame crops, and the fence is line rather than mass.
    //
    // The per-animal `<animal>Eye` / `<animal>EyeShine` sets are gone too: five
    // copies of one ink and five copies of one white, which is what a palette
    // looks like when nothing in it is derived. One `critterEye` and one
    // `critterEyeShine` replace all ten.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'sky',
        'skyHigh',
        'fieldFar',
        'field',
        'fieldShade',
        'puddle',
        'puddleSheen',
        'puddleShade',
        'barn',
        'barnRoof',
        'barnShade',
        'fence',
        'fenceShade',
        'straw',
        'strawShade',
        'foreClay',
        'foreClayShade',
        'mud',
        'mudShade',
        'mudSheen',
        'sparkle',
        'paper',
        'contour',
        'critterPale',
        'critterCheek',
        'critterEye',
        'critterEyeShine',
        'critterHoof',
        'pigletBody', 'pigletCrop', 'pigletFeature', 'pigletShade',
        'ducklingBody', 'ducklingCrop', 'ducklingFeature', 'ducklingShade',
        'lambBody', 'lambCrop', 'lambFeature', 'lambShade',
        'chickBody', 'chickCrop', 'chickFeature', 'chickShade',
        'calfBody', 'calfCrop', 'calfFeature', 'calfShade',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('makes the five Critters siblings — same lightness and chroma, hue is the only difference', () => {
    const hues = Object.values(source.body);
    expect(new Set(hues).size).toBe(5);
    expect(CRITTERS).toHaveLength(5);
    const bodies = CRITTERS.map((c) => palette[`${c}Body` as const]);
    expect(new Set(bodies).size).toBe(5);
  });

  it('keeps every Critter inside sRGB at the shared cast lightness and chroma', () => {
    /*
     * The gamut check is here because it is the constraint that PICKED these
     * hues, and because the sibling claim is void without it.
     *
     * sRGB holds the cast's 0.135 chroma at L 0.50 on only three arcs — 0..48,
     * 130..151 and 248..359 — so a naturalistic tan calf (hue ~60) and a lemon
     * duckling (~90) are not merely unfashionable here, they do not exist. A hue
     * chosen there does not fail loudly: it gets gamut-mapped down to whatever
     * chroma fits, quietly stops sharing chroma with its siblings, and "these
     * five are a family" becomes false for exactly the members nobody checked.
     */
    for (const name of CRITTERS) {
      const body = { l: source.cast.lightness, c: source.cast.chroma, h: source.body[name] };
      expect(outOfGamut(body), `${name} at the cast's L and C`).toBe(false);
    }
  });

  it('keeps the whole trotting corridor clear of the cast by the contrast floor', () => {
    // THE load-bearing assertion. A Critter trots across the entire frame on
    // arrival and on exit, and the last one of the play lands IN the puddle, so
    // legibility is set by the WORST contrast anywhere it can go, never the
    // average — and a minimum over a region is precisely what reviewing a
    // screenshot misses, because the mush zone is a small part of the frame.
    const castColour = { l: source.cast.lightness, c: source.cast.chroma, h: 0 };
    for (const region of source.corridor) {
      expect(deltaL(castColour, region)).toBeGreaterThanOrEqual(source.cast.minBackdropDeltaL);
    }
  });

  it('counts the puddle as corridor, not as an object', () => {
    /*
     * Stated on its own because it is the rule this Toy is most likely to lose.
     * A puddle looks like a prop — small, discrete, off to one side — and the
     * object rule would happily let it sit at L 0.55. But the last Critter of
     * every play SPLASHES INTO IT, and a region the cast is dragged into is a
     * corridor however small it looks. Held to the object rule instead, the
     * Toy's final beat would play out on the one patch of ground the cast
     * cannot be seen against.
     */
    expect(source.corridor).toContain(source.puddleBase);
    expect(source.objects).not.toContain(source.puddleBase);
  });

  it('keeps the corridor inside one narrow lightness band', () => {
    // Every unit of background lightness range is spent straight out of the
    // separation budget. A narrow corridor is what makes the guarantee hold by
    // construction rather than by re-checking each time an element is added.
    const ls = source.corridor.map((c) => c.l);
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThanOrEqual(0.15);
  });

  it('keeps small scene objects clear of the INK, so the silhouette survives them', () => {
    // The barn, the fence, the straw and the corner clay are things a Critter
    // passes rather than regions it lives in. Demanding a full cast-sized margin
    // against every square unit of them would be over-application; what has to
    // hold is that the contour reads against them.
    for (const object of source.objects) {
      expect(deltaL(source.ink, object)).toBeGreaterThanOrEqual(source.cast.minInkDeltaL);
    }
  });

  it('keeps every scene object above the floor a contour can survive', () => {
    // The refusal that shapes half this palette: a real barn red is around L
    // 0.42 and a churned-clay foreground wants 0.42 too, and neither is
    // available. Below 0.54 the ink stops separating and a Critter loses its own
    // outline exactly where it stands.
    for (const object of source.objects) {
      expect(object.l).toBeGreaterThanOrEqual(0.54);
    }
  });

  it('holds background chroma below the cast, so the yard never bids for attention', () => {
    // The shipped `barn` was chroma 0.16 — 1.19x the cast's whole budget, which
    // made a building nobody can touch the most saturated thing on the screen.
    // Hue and chroma cannot separate a figure from a ground, but chroma absolutely
    // competes for SALIENCE, and losing that competition to the barn is how a
    // Critter stops being the thing a child looks at.
    for (const region of [...source.corridor, ...source.objects]) {
      expect(region.c).toBeLessThanOrEqual(source.cast.chroma * 0.8);
    }
  });

  it('puts the mud BELOW every Critter it hides, and every Critter below the yard', () => {
    /*
     * The Toy's whole mechanic, as two inequalities.
     *
     * The mud has to win against all five bodies at once or the reveal is not a
     * reveal, and it is the one thing in this palette allowed to sit below the
     * cast — because it is caked ON the cast rather than behind it, so while a
     * Critter is muddy the mud IS the figure. Below the ink it would stop being
     * a substance and start being a hole.
     */
    for (const name of CRITTERS) {
      const body = { l: source.cast.lightness, c: source.cast.chroma, h: source.body[name] };
      expect(source.mudBase.l, `mud vs ${name}`).toBeLessThan(body.l);
    }
    expect(source.mudBase.l).toBeGreaterThan(source.ink.l);
    // And the muddy Critter still reads as one dark mass against the yard — by a
    // wider margin than a clean one, which is what makes "who's under there?"
    // legible from across a room.
    for (const region of source.corridor) {
      expect(deltaL(source.mudBase, region)).toBeGreaterThan(source.cast.minBackdropDeltaL);
    }
  });

  it('never leaves a reveal to lightness alone', () => {
    /*
     * The mud sat at hue 50 first, which is two degrees off the duckling's body:
     * that one animal's reveal would have been a lightness step with no colour
     * change in it at all, on a Toy whose entire reward beat is the change. Every
     * body now differs from the mud in hue as well as in value.
     */
    for (const name of CRITTERS) {
      const dh = Math.abs(source.body[name] - source.mudBase.h) % 360;
      expect(Math.min(dh, 360 - dh), `${name} vs mud hue`).toBeGreaterThan(10);
    }
  });

  it('never reaches pure white or pure black, and keeps the paper the lightest surface', () => {
    for (const c of source.corridor) expect(c.l).toBeLessThanOrEqual(source.paper.l);
    expect(palette.paper).not.toBe('#ffffff');
    expect(palette.contour).not.toBe('#000000');
    expect(palette.critterEyeShine).toBe(palette.paper);
  });

  it('puts the cast BELOW the field it is trotted across, not level with the paper', () => {
    /*
     * The migration in one line. `lambWool` was at L 0.925 and the paper is at
     * 0.94: two of the five Critters were, to within fifteen thousandths, the
     * paper itself. Greyscale the old Toy and the lamb's entire body disappears
     * into the sky behind it.
     */
    expect(source.cast.lightness).toBeLessThan(Math.min(...source.corridor.map((c) => c.l)));
    expect(source.paper.l - source.cast.lightness).toBeGreaterThan(0.3);
  });
});
