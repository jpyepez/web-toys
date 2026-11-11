import { describe, it, expect } from 'vitest';
import { palette, source, PENGUIN_KINDS } from './palette';
import { deltaL, outOfGamut } from '../../shell/art/oklch';

/**
 * The Penguin Slide palette. Exact hues stay tunable; the relationships that
 * keep a penguin legible while a three-year-old swipes it across the ice and
 * watches it bob in the sea are the contract.
 */
describe('Penguin Slide — ice palette', () => {
  it('paints every token as a concrete hex colour', () => {
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('makes the five penguins siblings — same lightness and chroma, hue is the only difference', () => {
    const hues = Object.values(source.kinds);
    expect(PENGUIN_KINDS).toHaveLength(5);
    expect(new Set(hues).size).toBe(5);
    const bodies = PENGUIN_KINDS.map((k) => palette[`${k}Body`]);
    expect(new Set(bodies).size).toBe(5);
  });

  it('keeps every body hue inside sRGB, so the sibling rule holds on screen', () => {
    // A hue outside the gamut is mapped by lowering its chroma, which would make
    // that penguin quietly less saturated than its siblings.
    for (const h of Object.values(source.kinds)) {
      expect(outOfGamut({ l: source.cast.lightness, c: source.cast.chroma, h }), `hue ${h}`).toBe(false);
    }
  });

  it('keeps the whole corridor — ice AND water — clear of the cast by the contrast floor', () => {
    // THE load-bearing assertion. A penguin is swiped across the floe and then
    // lives in the water, so both are regions it is measured against, and its
    // legibility is set by the WORST of them, never the average.
    const castColour = { l: source.cast.lightness, c: source.cast.chroma, h: 0 };
    for (const region of source.corridor) {
      expect(deltaL(castColour, region)).toBeGreaterThanOrEqual(source.cast.minBackdropDeltaL);
    }
  });

  it('keeps the corridor inside one narrow lightness band', () => {
    const ls = source.corridor.map((c) => c.l);
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThanOrEqual(0.15);
  });

  it('separates ice from water by hue and chroma, not by lightness alone', () => {
    // Corridor members cannot afford to spend lightness on each other, so the
    // floe has to read as a different MATERIAL from the sea around it.
    expect(Math.abs(source.iceBase.h - source.waterBase.h)).toBeGreaterThanOrEqual(10);
    expect(source.waterBase.c - source.iceBase.c).toBeGreaterThanOrEqual(0.03);
  });

  it('holds scene chroma below the cast, so the ground never bids for attention', () => {
    for (const region of source.corridor) {
      expect(region.c).toBeLessThanOrEqual(source.cast.chroma * 0.8);
    }
  });

  it('never reaches pure white or pure black, and keeps the paper the lightest surface', () => {
    for (const c of source.corridor) expect(c.l).toBeLessThanOrEqual(source.paper.l);
    expect(palette.paper).not.toBe('#ffffff');
    expect(palette.contour).not.toBe('#000000');
    expect(palette.penguinEyeShine).toBe(palette.paper);
  });

  it('keeps the beak warm and lighter than the body, so the face reads', () => {
    // The one warm note in a cold picture, and it has to separate from the body
    // it sits on by more than hue alone.
    expect(source.beakBase.l - source.cast.lightness).toBeGreaterThanOrEqual(0.15);
    expect(source.beakBase.h).toBeLessThan(110);
  });
});
