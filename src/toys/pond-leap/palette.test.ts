import { describe, expect, it } from 'vitest';
import { palette, source } from './palette';
import { paletteViolations } from '../../shell/art/rules';
import { deltaL, outOfGamut } from '../../shell/art/oklch';

/**
 * The pond palette. Exact hues stay tunable by a later art ticket; the rules
 * that keep the frog the figure and the pond the ground are the contract.
 */
describe('Pond Leap — pond palette', () => {
  it('paints every token as a concrete hex colour', () => {
    for (const value of Object.values(palette)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('follows the house colour rules: corridor, objects and scene chroma', () => {
    expect(paletteViolations(source)).toEqual([]);
  });

  it('keeps the water — the whole corridor — clear of the frog by the contrast floor', () => {
    const frog = { l: source.cast.lightness, c: source.cast.chroma, h: source.frogHue };
    for (const water of source.corridor) expect(deltaL(frog, water)).toBeGreaterThanOrEqual(source.cast.minBackdropDeltaL);
  });

  it('keeps the frog hue inside sRGB, so it is as saturated on screen as the cast rule says', () => {
    expect(outOfGamut(source.frogBody)).toBe(false);
  });

  it('keeps the frog green and the water teal, so they are told apart by hue', () => {
    expect(source.frogHue).toBeGreaterThanOrEqual(120);
    expect(source.frogHue).toBeLessThanOrEqual(160);
    for (const water of source.corridor) expect(Math.abs(water.h - source.frogHue)).toBeGreaterThan(30);
  });

  it('draws lily pads as objects: light enough for the ink contour to clear them', () => {
    for (const o of source.objects) expect(deltaL(o, { l: 0.24, c: 0.03, h: 40 })).toBeGreaterThanOrEqual(0.3);
  });
});
