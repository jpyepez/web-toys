import { describe, it, expect } from 'vitest';
import { buildFloe, check, landingFor, SWIM_HALF_W, type Frame } from './floe';
import { FLOE, FLOE_SEED } from './floe-config';
import { PENGUIN_COUNT } from './PenguinSlide';
import { penguinPx } from './PenguinDrawing';

/**
 * The floe's rules, as assertions rather than prose, evaluated at every frame
 * the Toy ships into. A phone is ~4.5 penguins wide and a 16:10 desktop ~11, so
 * sizes that are legal on one silently change class on the other — this file is
 * what catches that.
 */

// Penguin widths come from the same function the Toy sizes its penguins with.
const at = (name: string, w: number, h: number) => ({
  name,
  frame: { w: 100, h: (h / w) * 100 } as Frame,
  pw: (penguinPx(w, h) / w) * 100,
});
const FRAMES = [
  at('phone 9:19.5', 390, 844),
  at('small phone', 320, 568),
  at('square', 600, 600),
  at('phone landscape', 844, 390),
  at('desktop 16:10', 1440, 900),
  at('laptop 1280x800', 1280, 800),
];

const build = (f: (typeof FRAMES)[number]) => buildFloe(FLOE, f.frame, f.pw, FLOE_SEED, PENGUIN_COUNT);

function inside(p: [number, number], poly: readonly [number, number][]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

describe('Penguin Slide — the floe', () => {
  it('passes its own shape-class rules at every shipped frame', () => {
    for (const f of FRAMES) expect(check(FLOE, f.pw, f.frame), f.name).toEqual([]);
  });

  it('keeps the uncropped floe far outside the cast size band', () => {
    // The floe is the one mass the house style lets stand clear of the frame
    // edges, because the spec needs water on every side. What licenses that is
    // size: at 2.5 penguins or more it cannot be read as another Critter.
    for (const f of FRAMES) {
      const xs = build(f).floe.pts.map((p) => p[0]);
      const width = (Math.max(...xs) - Math.min(...xs)) / f.pw;
      expect(width, f.name).toBeGreaterThanOrEqual(2.5);
    }
  });

  it('puts water on every side of the floe, inside the frame', () => {
    for (const f of FRAMES) {
      const ys = build(f).floe.facePts.map((p) => p[1]);
      const xs = build(f).floe.pts.map((p) => p[0]);
      expect(Math.min(...xs), f.name).toBeGreaterThan(f.pw * FLOE.sideWater * 0.8);
      expect(Math.max(...xs), f.name).toBeLessThan(100 - f.pw * FLOE.sideWater * 0.8);
      expect(Math.min(...ys), f.name).toBeGreaterThan(f.pw);
      expect(Math.max(...ys), f.name).toBeLessThan(f.frame.h - f.pw);
    }
  });

  it('stands every penguin ON the floe, away from the browser edge-swipe zone', () => {
    for (const f of FRAMES) {
      const { rests, floe } = build(f);
      expect(rests, f.name).toHaveLength(PENGUIN_COUNT);
      for (const r of rests) {
        expect(inside(r, floe.pts), `${f.name}: rest ${r} off the ice`).toBe(true);
        // A body half a penguin wide, plus a clear gutter to the screen edge.
        expect(r[0] - f.pw * 0.5, f.name).toBeGreaterThan(f.pw * 0.6);
        expect(r[0] + f.pw * 0.5, f.name).toBeLessThan(100 - f.pw * 0.6);
      }
    }
  });

  it('keeps the standing penguins distinct from one another', () => {
    // Staggered rows overlap a little, and that reads as a huddle. One core
    // inside another does not.
    for (const f of FRAMES) {
      const { rests } = build(f);
      for (let i = 0; i < rests.length; i++) {
        for (let j = i + 1; j < rests.length; j++) {
          const dx = Math.abs(rests[i][0] - rests[j][0]);
          const dy = Math.abs(rests[i][1] - rests[j][1]);
          expect(dx > f.pw * 0.45 || dy > f.pw * 0.7, `${f.name}: ${i} and ${j}`).toBe(true);
        }
      }
    }
  });

  it('offers more water slots than penguins, all clear of the ice and on screen', () => {
    for (const f of FRAMES) {
      const { slots, floe } = build(f);
      expect(slots.length, f.name).toBeGreaterThanOrEqual(PENGUIN_COUNT + 2);
      for (const s of slots) {
        expect(inside(s, floe.pts) || inside(s, floe.facePts), `${f.name}: slot on ice`).toBe(false);
        expect(s[0] - SWIM_HALF_W * f.pw, f.name).toBeGreaterThan(0);
        expect(s[0] + SWIM_HALF_W * f.pw, f.name).toBeLessThan(100);
        expect(s[1], f.name).toBeLessThan(f.frame.h);
      }
    }
  });

  it('lands a swipe in EVERY direction in the water, a different slot each time', () => {
    // Every direction is a good direction. Sweep eight directions from every
    // penguin, as if each were the last one left, and each must find water.
    for (const f of FRAMES) {
      const art = build(f);
      for (const from of art.rests) {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          const slot = landingFor(art, from, [Math.cos(a), Math.sin(a)], 0.5, new Set());
          expect(slot, `${f.name}: direction ${k}`).toBeGreaterThanOrEqual(0);
        }
      }
      // Five swipes in one direction still give five separate swimmers.
      const taken = new Set<number>();
      for (const from of art.rests) {
        const slot = landingFor(art, from, [1, 0], 1, taken);
        expect(slot).toBeGreaterThanOrEqual(0);
        expect(taken.has(slot)).toBe(false);
        taken.add(slot);
      }
    }
  });

  it('sends a penguin the way it was swiped', () => {
    for (const f of FRAMES) {
      const art = build(f);
      const from = art.rests[0];
      for (const dir of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
        const [x, y] = art.slots[landingFor(art, from, dir, 0.5, new Set())];
        const dot = (x - from[0]) * dir[0] + (y - from[1]) * dir[1];
        expect(dot, `${f.name}: swiped ${dir}`).toBeGreaterThan(0);
      }
    }
  });

  it('lines the Outro up in the water, on screen', () => {
    for (const f of FRAMES) {
      const { row, floe } = build(f);
      expect(row).toHaveLength(PENGUIN_COUNT);
      for (const p of row) {
        expect(inside(p, floe.pts), f.name).toBe(false);
        expect(p[0] - SWIM_HALF_W * f.pw, f.name).toBeGreaterThan(-f.pw * 0.05);
        expect(p[0] + SWIM_HALF_W * f.pw, f.name).toBeLessThan(100 + f.pw * 0.05);
        expect(p[1], f.name).toBeGreaterThan(f.pw * 0.72);
      }
    }
  });

  it('keeps the Outro row above the centred Completion card', () => {
    // The Shell centres a card about 300px tall over the Toy (measured at 302px
    // on a 390x844 phone), so its top edge sits ~150px above the middle. The row
    // pops and splashes UNDER that overlay; the waterline is the bottom of what
    // shows of a swimmer, so it may touch the card's edge but not sink behind it.
    for (const [w, h] of [[390, 844], [320, 568], [1440, 900], [1280, 800], [600, 600]]) {
      const f = at('', w, h);
      const { row } = build(f);
      for (const [, y] of row) {
        expect((y / 100) * w, `${w}x${h}`).toBeLessThanOrEqual(h / 2 - 130);
      }
    }
  });

  it('lets no shelf span the frame, and crops every shelf at the top edge', () => {
    for (const f of FRAMES) {
      for (const s of build(f).shelves) {
        const xs = [...s.top.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((m) => Number(m[1]));
        const ys = [...s.top.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((m) => Number(m[2]));
        const inFrame = xs.filter((x) => x >= 0 && x <= 100);
        expect(Math.max(...inFrame) - Math.min(...inFrame), f.name).toBeLessThan(90);
        expect(Math.min(...ys), f.name).toBeLessThan(0);
      }
    }
  });

  it('scales the scene with the PENGUIN and the counts with the frame', () => {
    const phone = build(FRAMES[0]);
    const desktop = build(FRAMES[4]);
    expect(desktop.shelves.length).toBeGreaterThan(phone.shelves.length);
    expect(desktop.ripples.length).toBeGreaterThanOrEqual(phone.ripples.length * 0.5);
    // A phone stacks the cast; a wide frame stands it in one line.
    const rowsOf = (rests: [number, number][], pw: number) =>
      new Set(rests.map((r) => Math.round(r[1] / (pw * 0.5)))).size;
    expect(rowsOf(phone.rests, FRAMES[0].pw)).toBeGreaterThan(1);
    expect(rowsOf(desktop.rests, FRAMES[4].pw)).toBeLessThanOrEqual(2);
  });

  it('is a pure function of its config, frame and seed', () => {
    for (const f of FRAMES) expect(JSON.stringify(build(f))).toBe(JSON.stringify(build(f)));
    expect(JSON.stringify(build(FRAMES[0]))).not.toBe(
      JSON.stringify(buildFloe(FLOE, FRAMES[0].frame, FRAMES[0].pw, FLOE_SEED + 1, PENGUIN_COUNT)),
    );
  });
});
