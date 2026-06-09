import { describe, it, expect } from 'vitest';
import { palette } from './palette';

describe('Puffer Fish — ocean palette', () => {
  it('exposes the ocean palette colours as HSL strings, named for what they paint', () => {
    // ADR-0004: shared Shell modules expose only cross-Toy primitives; each
    // Toy owns its scene assets locally. This is the Puffer Fish's own ocean
    // palette — the load-bearing token names every fish consumer (the scene
    // backdrop in slice #06, the `FishDrawing` Critter here, the registry
    // `tint`, the `Preview`) will reach for, sourced from the Toy folder
    // rather than the shared `tokens.ts` grab-bag. The shared tokens module
    // gains no fish keys (AC #1) — these live here by construction.
    //
    // Names are load-bearing: `water`/`waterSurface`/`lightRay`/`coral`/`sand`/
    // `bubble` paint the underwater scene; `fishBody`/`fishFin`/`fishCheek`/
    // `fishEye` paint the Critter (white body, pink fins/tail/cheeks, dark ink
    // eyes + smile). `waterSurface` is the lighter top-lit shade the backdrop's
    // water layer grades toward the surface — added in slice #06 under the
    // slice's explicit "extend it with any scene tokens still missing" sanction
    // (the deeper `water` already existed; the surface shade was the one
    // missing scene token). The *values* are HSL strings, on-device-tuned per
    // the slice DoD, so we pin the key set + the HSL shape, not the exact
    // tuples — mirrors the sheep meadow palette test.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'water',
        'waterSurface',
        'lightRay',
        'coral',
        'sand',
        'bubble',
        'fishBody',
        'fishFin',
        'fishCheek',
        'fishEye',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^hsl\(/);
    }
  });
});
