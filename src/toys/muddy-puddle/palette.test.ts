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
    // `sparkle` paint the barnyard scene; the `<animal>…` keys paint each
    // Critter of the surprise cast — piglet (slice #02) plus the four animals
    // that land ADDITIVELY here in slice #05 (duckling, lamb, chick, calf), one
    // colour set each, mirroring the piglet's body/feature/cheek/eye/eyeShine
    // shape. The *values* are HSL strings, on-device-tuned per the slice DoD, so
    // we pin the key set + the HSL shape, not the exact tuples — mirrors the
    // Puffer Fish ocean palette test.
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
        'ducklingBody',
        'ducklingBeak',
        'ducklingWing',
        'ducklingCheek',
        'ducklingEye',
        'ducklingEyeShine',
        'lambWool',
        'lambFace',
        'lambEar',
        'lambCheek',
        'lambEye',
        'lambEyeShine',
        'chickBody',
        'chickBeak',
        'chickWing',
        'chickCheek',
        'chickEye',
        'chickEyeShine',
        'calfBody',
        'calfMuzzle',
        'calfSpot',
        'calfCheek',
        'calfEye',
        'calfEyeShine',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^hsl\(/);
    }
  });
});
