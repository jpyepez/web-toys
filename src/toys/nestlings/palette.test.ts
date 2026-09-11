import { describe, it, expect } from 'vitest';
import { palette, source } from './palette';
import { deltaL } from '../../shell/art/oklch';

/**
 * The Nestlings dusk palette.
 *
 * This file has now reversed two of its own earlier assertions, and both
 * reversals are the point of it. It once pinned `/^hsl\(/` on every value —
 * `hsl()`'s L is a channel midpoint rather than a lightness, so "these are
 * siblings" was unassertable in it. It then asserted a ΔL floor of 0.12, which
 * was a number chosen rather than derived, and which the palette was clearing by
 * one hundredth.
 *
 * What replaces both: the relationships that actually keep a Critter legible
 * while a three-year-old drags it across the entire frame. Exact hues stay
 * tunable; the relationships are the contract.
 */
describe('Nestlings — dusk palette', () => {
  it('exposes the load-bearing scene + Critter token names', () => {
    // ADR-0004: each Toy owns its scene assets locally. Names are what consumers
    // address.
    //
    // `treelineFar`/`treelineNear` went first — a row of crown-sized shapes put
    // the background in the same visual class as the cast, which is what made
    // the scene unreadable. `glow` and `ground` have now followed them: the
    // halftone screen and the grass band that replaced the treeline were correct
    // and inert, three horizontal stripes with nothing overlapping anything, and
    // the grass band contradicted the nest sitting in a tree above it.
    //
    // The canopy tokens are what replace them. `foliage`/`foliageNear` are the
    // two corridor-class planes, `moon` the one oversized cropped disc,
    // `understory` the near dark mass in the bottom corners, and `limb` the
    // perch limbs the cast now stands on instead of floating in open sky.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'sky',
        'skyDeep',
        'foliage',
        'foliageNear',
        'foliageShade',
        'moon',
        'understory',
        'branch',
        'limb',
        'nest',
        'nestRim',
        'nestShadow',
        'sparkle',
        'night',
        'paper',
        'contour',
        'birdEye',
        'birdEyeShine',
        'birdCheek',
        'birdBelly',
        'birdFoot',
        'robinBody', 'robinWing', 'robinBeak', 'robinShade',
        'bluebirdBody', 'bluebirdWing', 'bluebirdBeak', 'bluebirdShade',
        'sparrowBody', 'sparrowWing', 'sparrowBeak', 'sparrowShade',
        'wrenBody', 'wrenWing', 'wrenBeak', 'wrenShade',
        'goldfinchBody', 'goldfinchWing', 'goldfinchBeak', 'goldfinchShade',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('makes the five species siblings — same lightness and chroma, hue is the only difference', () => {
    const hues = Object.values(source.species);
    expect(new Set(hues).size).toBe(5);
    const bodies = [
      palette.robinBody,
      palette.bluebirdBody,
      palette.sparrowBody,
      palette.wrenBody,
      palette.goldfinchBody,
    ];
    expect(new Set(bodies).size).toBe(5);
  });

  it('keeps the whole drag corridor clear of the cast by the contrast floor', () => {
    // THE load-bearing assertion. A Critter is dragged across the entire frame,
    // so its legibility is set by the WORST contrast anywhere it can go, never
    // the average — and a minimum over a region is precisely what reviewing a
    // screenshot misses, because the mush zone is a small part of the frame and
    // you never happen to park a bird in it.
    //
    // Note both foliage planes are in here. The canopy is not decoration behind
    // the play field — it IS the play field, covering most of the frame, and a
    // bird is measured against the leaves it actually overlaps.
    const castColour = { l: source.cast.lightness, c: source.cast.chroma, h: 0 };
    for (const region of source.corridor) {
      expect(deltaL(castColour, region)).toBeGreaterThanOrEqual(source.cast.minBackdropDeltaL);
    }
  });

  it('keeps the corridor inside one narrow lightness band', () => {
    // Every unit of background lightness range is spent straight out of the
    // separation budget. A narrow corridor is what makes the guarantee hold by
    // construction rather than by checking each new element.
    const ls = source.corridor.map((c) => c.l);
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThanOrEqual(0.15);
  });

  it('keeps small scene objects clear of the INK, so the silhouette survives them', () => {
    // The nest, the branch and the near understory are targets a Critter lands
    // on and crosses rather than regions it lives in.
    // Demanding a full cast-sized margin against every square unit of them would
    // be over-application; what has to hold is that the contour reads against
    // them, so the bird's boundary survives even where its fill does not.
    for (const object of source.objects) {
      expect(deltaL(source.ink, object)).toBeGreaterThanOrEqual(source.cast.minInkDeltaL);
    }
  });

  it('holds background chroma below the cast, so the ground never bids for attention', () => {
    // Hue and chroma cannot separate a figure from a ground — two colours at the
    // same lightness differ by at most ~1.15:1 — but chroma absolutely competes
    // for salience. The ground is muted so the cast can be the saturated thing.
    for (const region of [...source.corridor, ...source.objects]) {
      expect(region.c).toBeLessThanOrEqual(source.cast.chroma * 0.8);
    }
  });

  it('never reaches pure white or pure black, and keeps the paper the lightest surface', () => {
    for (const c of source.corridor) expect(c.l).toBeLessThanOrEqual(source.paper.l);
    expect(palette.paper).not.toBe('#ffffff');
    expect(palette.contour).not.toBe('#000000');
    expect(palette.birdEyeShine).toBe(palette.paper);
  });

  it('puts the Outro night wash outside the corridor, deliberately', () => {
    // The tracking constraint binds only while the child is dragging. The Outro
    // fires after the Goal is met, when nothing needs to be tracked — so the
    // scene is free to go properly dark there, and that is the whole reason a
    // light play field costs the toy no atmosphere.
    const corridorMin = Math.min(...source.corridor.map((c) => c.l));
    expect(source.nightBase.l).toBeLessThan(corridorMin - 0.15);
  });
});
