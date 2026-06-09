import { describe, it, expect } from 'vitest';
import { palette } from './palette';

describe('Counting Sheep — meadow palette', () => {
  it('exposes the meadow palette colours as HSL strings, named for what they paint', () => {
    // ADR-0004: shared Shell modules expose only cross-Toy primitives; each
    // Toy owns its scene assets locally. This is the meadow palette's home
    // after slice #04 moved it out of the shared `tokens.ts` — the same
    // load-bearing names every Sheep consumer (`MeadowBackdrop`, the Sheep
    // drawing, the outro glow, the `Preview`, and the registry `tint`) reaches
    // for, now sourced from the Toy folder rather than a shared grab-bag.
    // Names are load-bearing through the dusk → daytime pivot recorded in the
    // tokens history; the *values* are HSL strings, on-device-tuned per the
    // slice DoD, so we pin the key set + the HSL shape, not the exact tuples.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'clouds',
        'doneGlow',
        'eyePupil',
        'eyeShine',
        'eyeWhite',
        'grassSilhouette',
        'hillDistant',
        'hillNear',
        'horizonGlow',
        'muzzle',
        'noseTip',
        'scenery',
        'sheepSilhouette',
        'sheepWool',
        'skyUpper',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^hsl\(/);
    }
  });
});
