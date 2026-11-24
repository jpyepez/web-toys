import { describe, it, expect } from 'vitest';
import { palette, source, MOUSE_KINDS } from './palette';
import { deltaL, outOfGamut } from '../../shell/art/oklch';

/**
 * The Soup Pot palette. Exact hues stay tunable; the relationships that keep
 * three mice the figure while the biggest thing on screen is a pot are the
 * contract.
 */
describe('Soup Pot — kitchen palette', () => {
  it('paints every token as a concrete hex colour', () => {
    for (const value of Object.values(palette)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('makes the three mice siblings — same lightness and chroma, hue is the only difference', () => {
    expect(MOUSE_KINDS).toHaveLength(3);
    expect(new Set(Object.values(source.kinds)).size).toBe(3);
    expect(new Set(MOUSE_KINDS.map((k) => palette[`${k}Body`])).size).toBe(3);
  });

  it('keeps every mouse hue inside sRGB, so the sibling rule holds on screen', () => {
    for (const h of Object.values(source.kinds)) {
      expect(outOfGamut({ l: source.cast.lightness, c: source.cast.chroma, h }), `hue ${h}`).toBe(false);
    }
  });

  it('keeps the whole corridor clear of the cast by the contrast floor', () => {
    const castColour = { l: source.cast.lightness, c: source.cast.chroma, h: 0 };
    for (const region of source.corridor) {
      expect(deltaL(castColour, region)).toBeGreaterThanOrEqual(source.cast.minBackdropDeltaL);
    }
  });

  it('keeps the corridor inside one narrow lightness band', () => {
    const ls = source.corridor.map((c) => c.l);
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThanOrEqual(0.15);
    for (const l of ls) {
      expect(l).toBeGreaterThanOrEqual(0.8);
      expect(l).toBeLessThanOrEqual(0.92);
    }
  });

  it('holds every object — pot, ladle and soup at every stage — clear of the ink', () => {
    // The pot is the largest mass on the screen; a dark pot would out-weigh the
    // mice by area. Objects are carried by the contour, so the ink must clear them.
    for (const obj of source.objects) {
      expect(obj.l).toBeGreaterThanOrEqual(0.54);
      expect(deltaL(obj, source.ink)).toBeGreaterThanOrEqual(source.cast.minInkDeltaL);
    }
  });

  it('cooks the soup by hue and chroma, never down toward the cast', () => {
    const soup = source.soup;
    expect(soup).toHaveLength(4);
    for (const s of soup) expect(s.l).toBeGreaterThanOrEqual(source.soupFloorL);
    // It does visibly change: warmer hue and more chroma at every stage.
    for (let i = 1; i < soup.length; i++) {
      expect(soup[i].h).toBeLessThan(soup[i - 1].h);
      expect(soup[i].c).toBeGreaterThanOrEqual(soup[i - 1].c);
    }
    // The ready soup, the worst case, still sits well above the cast.
    expect(deltaL(soup[3], { l: source.cast.lightness, c: 0, h: 0 })).toBeGreaterThanOrEqual(0.2);
  });

  it('holds scene chroma below the cast, so nothing in the kitchen bids for attention', () => {
    for (const c of [...source.corridor, ...source.objects]) {
      expect(c.c).toBeLessThanOrEqual(source.cast.chroma * 0.8);
    }
  });

  it('never reaches pure white or pure black, and keeps the paper the lightest surface', () => {
    for (const c of [...source.corridor, ...source.objects]) expect(c.l).toBeLessThanOrEqual(source.paper.l);
    expect(palette.paper).not.toBe('#ffffff');
    expect(palette.contour).not.toBe('#000000');
    expect(palette.mouseEyeShine).toBe(palette.paper);
  });

  it('keeps the pink lighter than the body, so the nose and ears read on it', () => {
    expect(source.pinkBase.l - source.cast.lightness).toBeGreaterThanOrEqual(0.15);
  });
});
