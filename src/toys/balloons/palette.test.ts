import { describe, it, expect } from 'vitest';
import { palette } from './palette';

describe('Balloons — sky palette', () => {
  it('exposes the sky scene + balloon body/face colours as HSL strings, named for what they paint', () => {
    // ADR-0004: shared Shell modules expose only cross-Toy primitives; each Toy
    // owns its scene assets locally. This is the Balloons' own sky palette — the
    // load-bearing token names every consumer (the `SkyBackdrop` scene here, the
    // faced balloon Critters in slice #2, the registry `tint` in slice #8, the
    // preview) will reach for, sourced from the Toy folder rather than the shared
    // `tokens.ts`. The shared tokens module gains no balloon keys (AC #3) — these
    // live here by construction.
    //
    // Names are load-bearing: `sky`/`cloud`/`grass`/`peg`/`string`/`sparkle`
    // paint the bottom-anchored sky scene (the tall sky above, the grassy rise,
    // the low peg the balloons are tied to); `balloon1`…`balloon5` are the five
    // distinct balloon BODY colours (no hidden identity per the PRD — they differ
    // only by body colour, so they're indexed rather than named for a hue);
    // `faceInk`/`faceShine`/`cheek` are the shared face colours every balloon's
    // sad→happy face is drawn from (slice #2 may add to these additively, the
    // Muddy Puddle cast precedent). The Card `tint` (slice #8) is `palette.sky` —
    // declared by the `sky` token existing here, not a separate export.
    //
    // The *values* are HSL strings, on-device-tuned per the slice DoD, so we pin
    // the key set + the HSL shape, not the exact tuples — mirrors the Muddy
    // Puddle barnyard palette test.
    expect(Object.keys(palette).sort()).toEqual(
      [
        'sky',
        'cloud',
        'grass',
        'peg',
        'string',
        'sparkle',
        'balloon1',
        'balloon2',
        'balloon3',
        'balloon4',
        'balloon5',
        'faceInk',
        'faceShine',
        'cheek',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^hsl\(/);
    }
  });
});
