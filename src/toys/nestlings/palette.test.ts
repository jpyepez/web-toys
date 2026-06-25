import { describe, it, expect } from 'vitest';
import { palette } from './palette';

describe('Nestlings — dusk palette', () => {
  it('exposes the dusk scene + per-bird body/wing/beak colours as HSL strings, named for what they paint', () => {
    // ADR-0004: shared Shell modules expose only cross-Toy primitives; each Toy
    // owns its scene assets locally. This is the Nestlings' own dusk palette —
    // the load-bearing token names every consumer (the `DuskBackdrop` scene
    // here, the five fledgling Critters in slice #2, the registry `tint` in
    // slice #8, the preview) reaches for, sourced from the Toy folder rather
    // than the shared `tokens.ts`. The shared tokens module gains no nestlings
    // keys (AC #4) — these live here by construction.
    //
    // Names are load-bearing: `sky`/`skyDeep` are the two stops of the deepening
    // dusk-sky gradient the whole scene sits in (and `sky` IS the Card `tint`,
    // slice #8 — declared by the token existing here, not a separate export);
    // `ground`/`branch`/`nest` paint the bottom-anchored lower band (the ground,
    // the tree/branch, and the single empty nest drop-zone); `sparkle` is the
    // star/sparkle glint the slice #5 Outro twinkles in. The five species each
    // carry their own `*Body`/`*Wing`/`*Beak` so slice #2 can draw five visually
    // distinct fledglings (robin, bluebird, sparrow, wren, goldfinch) — there is
    // no hidden identity (PRD), the species just give the cast variety.
    //
    // The *values* are HSL strings, on-device-tuned per the slice DoD, so we pin
    // the key set + the HSL shape, not the exact tuples — mirrors the Balloons /
    // Muddy Puddle palette tests.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'sky',
        'skyDeep',
        'ground',
        'branch',
        'nest',
        'sparkle',
        // Woven-nest depth (slice-#1 nest glow-up).
        'nestShadow',
        'nestRim',
        // Shared Critter face vocabulary (slice-#2 sanctioned face/blush adds).
        'birdEye',
        'birdEyeShine',
        'birdCheek',
        'birdBelly',
        'birdFoot',
        'robinBody',
        'robinWing',
        'robinBeak',
        'bluebirdBody',
        'bluebirdWing',
        'bluebirdBeak',
        'sparrowBody',
        'sparrowWing',
        'sparrowBeak',
        'wrenBody',
        'wrenWing',
        'wrenBeak',
        'goldfinchBody',
        'goldfinchWing',
        'goldfinchBeak',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^hsl\(/);
    }
  });
});
