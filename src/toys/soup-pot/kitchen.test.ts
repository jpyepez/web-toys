import { describe, it, expect } from 'vitest';
import { buildKitchen, check, BUBBLE_MAX_D, MOUSE_HEAD_R, MOUSE_REACH, type Frame } from './kitchen';
import { KITCHEN, KITCHEN_SEED } from './kitchen-config';
import { mousePx } from './MouseDrawing';
import { lineViolations } from '../../shell/art/rules';

/**
 * The kitchen's rules, as assertions rather than prose, evaluated at every frame
 * the Toy ships into. A phone is ~4.5 mice wide and a 16:10 desktop ~11, so
 * sizes legal on one silently change class on the other — this file is what
 * catches that.
 */

// Mouse widths come from the same function the Toy sizes its mice with.
const at = (name: string, w: number, h: number) => ({
  name,
  frame: { w: 100, h: (h / w) * 100 } as Frame,
  mw: (mousePx(w, h) / w) * 100,
});
const FRAMES = [
  at('phone 9:19.5', 390, 844),
  at('small phone', 320, 568),
  at('square', 600, 600),
  at('phone landscape', 844, 390),
  at('desktop 16:10', 1440, 900),
  at('laptop 1280x800', 1280, 800),
];

const build = (f: (typeof FRAMES)[number]) => buildKitchen(KITCHEN, f.frame, f.mw, KITCHEN_SEED);

describe('Soup Pot — the kitchen', () => {
  it('passes its own shape-class rules at every shipped frame', () => {
    for (const f of FRAMES) expect(check(KITCHEN, f.mw, f.frame), f.name).toEqual([]);
  });

  it('puts the pot at the frame centre, where the Stir measures its angle', () => {
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.centre[0], f.name).toBeCloseTo(f.frame.w / 2);
      expect(art.centre[1], f.name).toBeCloseTo(f.frame.h / 2);
    }
  });

  it('keeps the uncropped pot far outside the cast size band', () => {
    // The pot is the one mass the house style lets stand clear of the frame
    // edges, because the whole rim is the circle being stirred. What licenses
    // that is size: at 2.5 mice or more it cannot be read as another Critter.
    for (const f of FRAMES) expect((build(f).potR * 2) / f.mw, f.name).toBeGreaterThanOrEqual(2.5);
  });

  it('keeps the whole pot inside the frame vertically, so the rim being stirred is all on screen', () => {
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.centre[1] - art.potR, f.name).toBeGreaterThan(0);
      expect(art.centre[1] + art.potR, f.name).toBeLessThan(f.frame.h);
    }
  });

  it('stands every mouse on the rim with its face over the counter, inside the frame', () => {
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.mice, f.name).toHaveLength(3);
      for (const m of art.mice) {
        const fromCentre = Math.hypot(m.at[0] - art.centre[0], m.at[1] - art.centre[1]);
        // Paws on the rim band.
        expect(fromCentre, f.name).toBeGreaterThan(art.innerR);
        expect(fromCentre, f.name).toBeLessThanOrEqual(art.potR);
        // The head's centre is outside the pot: the face is seen against the
        // counter (corridor class), where the cast-contrast floor is asserted.
        expect(Math.hypot(m.head[0] - art.centre[0], m.head[1] - art.centre[1]), f.name).toBeGreaterThan(art.potR * 0.98);
        // Not cropped.
        expect(m.at[1] - MOUSE_REACH * f.mw, f.name).toBeGreaterThanOrEqual(0);
        expect(m.at[0] - f.mw / 2, f.name).toBeGreaterThanOrEqual(0);
        expect(m.at[0] + f.mw / 2, f.name).toBeLessThanOrEqual(f.frame.w);
      }
    }
  });

  it('never lets two mice overlap', () => {
    for (const f of FRAMES) {
      const heads = build(f).mice.map((m) => m.head);
      for (let i = 1; i < heads.length; i++) {
        const d = Math.hypot(heads[i][0] - heads[i - 1][0], heads[i][1] - heads[i - 1][1]);
        expect(d / f.mw, f.name).toBeGreaterThan(MOUSE_HEAD_R * 2);
      }
    }
  });

  it('keeps every bubble under 1/8 of a mouse, a mark in a mass and never an object', () => {
    for (const f of FRAMES) {
      for (const b of build(f).soup.bubbles) expect((b.r * 2) / f.mw, f.name).toBeLessThanOrEqual(BUBBLE_MAX_D + 1e-9);
    }
  });

  it('keeps the bubbles inside the soup', () => {
    for (const f of FRAMES) {
      const art = build(f);
      for (const b of art.soup.bubbles) expect(Math.hypot(b.x, b.y) + b.r, f.name).toBeLessThan(art.soupR);
    }
  });

  it('crops the towel at a frame corner, so it is scenery and never a whole object', () => {
    for (const f of FRAMES) {
      const pts = build(f).towel.pts;
      expect(pts.some(([x, y]) => x > f.frame.w || y > f.frame.h), f.name).toBe(true);
      const xs = pts.map((p) => p[0]);
      expect((Math.max(...xs) - Math.min(...xs)) / f.mw, f.name).toBeGreaterThanOrEqual(2.5);
    }
  });

  it('reaches the ladle from inside the soup out past the rim, toward the finger', () => {
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.ladle.length, f.name).toBeGreaterThan(art.potR);
    }
  });

  it('gives every scenery line less ink than the cast — the contour belongs to the figure', () => {
    for (const f of FRAMES) {
      const { cast, ladle, ...scenery } = build(f).lines;
      // The ladle is an object held near the cast, so it may approach the cast's
      // weight; plain scenery stays well under it.
      expect(lineViolations(cast, { ladle }), f.name).toEqual([]);
      expect(lineViolations(cast, scenery, 0.75), f.name).toEqual([]);
    }
  });

  it('is deterministic for a seed — the saved config reproduces its picture', () => {
    const f = FRAMES[0];
    expect(buildKitchen(KITCHEN, f.frame, f.mw, KITCHEN_SEED)).toEqual(build(f));
  });
});
