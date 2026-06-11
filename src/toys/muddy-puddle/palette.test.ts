import { describe, it, expect } from 'vitest';
import { palette } from './palette';

describe('Muddy Puddle — barnyard palette', () => {
  it('exposes the barnyard scene + piglet colours as HSL strings, named for what they paint', () => {
    // ADR-0004: shared Shell modules expose only cross-Toy primitives; each Toy
    // owns its scene assets locally. This is the Muddy Puddle's own barnyard
    // palette — the load-bearing token names every consumer (the
    // `BarnyardBackdrop` scene here, the piglet Critter in slice #02, the
    // registry `tint` in slice #08, the preview) will reach for, sourced from
    // the Toy folder rather than the shared `tokens.ts`. The shared tokens
    // module gains no barnyard keys (AC #3) — these live here by construction.
    //
    // Names are load-bearing: `sky`/`barn`/`fence`/`grass`/`mud`/`puddle`/
    // `sparkle` paint the barnyard scene; `pigletBody`/`pigletSnout`/
    // `pigletCheek`/`pigletEye`/`pigletEyeShine` paint the first Critter (slice
    // #02 needs them — the other four animals land additively in slice #05).
    // The *values* are HSL strings, on-device-tuned per the slice DoD, so we pin
    // the key set + the HSL shape, not the exact tuples — mirrors the Puffer
    // Fish ocean palette test.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'sky',
        'barn',
        'fence',
        'grass',
        'mud',
        'puddle',
        'sparkle',
        'pigletBody',
        'pigletSnout',
        'pigletCheek',
        'pigletEye',
        'pigletEyeShine',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^hsl\(/);
    }
  });
});
