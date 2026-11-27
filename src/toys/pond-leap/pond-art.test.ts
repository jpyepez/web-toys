import { describe, expect, it } from 'vitest';
import { lineViolations } from '../../shell/art/rules';
import { line as houseLine } from '../../shell/art/house';
import { buildPond, check, MARK_MAX, padPx, SCENERY_CONTOUR_RATIO, sceneryContour } from './pond-scene';
import { POND, POND_SEED } from './pond-config';
import { frogPx } from './FrogDrawing';
import { BLOSSOMS, BLOSSOM_MAX_R, PAD_CONTOUR } from './PadDrawing';

/**
 * The pond's shape rules, as assertions rather than prose, evaluated at every
 * frame the Toy ships into. A phone is ~5.9 frogs wide and a 16:10 desktop ~16,
 * so sizes legal on one silently change class on the other — this file is what
 * catches that.
 */
const FRAMES: Array<[string, number, number]> = [
  ['phone 9:19.5', 390, 844],
  ['small phone', 320, 568],
  ['square', 600, 600],
  ['tablet portrait', 820, 1180],
  ['desktop 16:10', 1440, 900],
  ['laptop 1280x800', 1280, 800],
];

describe('Pond Leap — the pond scene', () => {
  it('passes its own shape-class rules at every shipped frame', () => {
    for (const [name, w, h] of FRAMES) expect(check(buildPond(POND, w, h, POND_SEED), POND), name).toEqual([]);
  });

  it('keeps open water around every pad: no bank reaches a pad', () => {
    for (const [name, w, h] of FRAMES) {
      const art = buildPond(POND, w, h, POND_SEED);
      for (const b of art.banks) {
        for (const [x, y] of b.edge) {
          for (const [px, py] of art.pads) expect(Math.hypot(px - x, py - y), name).toBeGreaterThan(art.padR);
        }
      }
    }
  });

  it('crops both banks by the side edges, for the full height', () => {
    for (const [name, w, h] of FRAMES) {
      const art = buildPond(POND, w, h, POND_SEED);
      for (const b of art.banks) {
        const ys = b.edge.map((p) => p[1]);
        expect(Math.min(...ys), name).toBeLessThan(0);
        expect(Math.max(...ys), name).toBeGreaterThan(art.frame.h);
      }
    }
  });

  it('gives a wide screen more pond beside the pads, not one bank stretched across', () => {
    const phone = buildPond(POND, 390, 844, POND_SEED);
    const desk = buildPond(POND, 1440, 900, POND_SEED);
    const water = (a: typeof phone) => {
      const left = Math.max(...a.banks[0].edge.map((p) => p[0]));
      return a.stage.x0 - left;
    };
    expect(water(desk) / desk.fw).toBeGreaterThan(water(phone) / phone.fw + 1);
  });

  it('keeps marks under 1/8 of a frog', () => {
    for (const [name, w, h] of FRAMES) {
      const art = buildPond(POND, w, h, POND_SEED);
      for (const s of art.duckweed) expect((s.r * 2) / art.fw, name).toBeLessThanOrEqual(MARK_MAX);
      expect(POND.mossLobe * 2, name).toBeLessThanOrEqual(MARK_MAX);
    }
  });
});

describe('Pond Leap — line weights in rendered pixels', () => {
  it('holds every scenery and pad contour to half the frog’s, at every viewport width', () => {
    for (const w of [320, 360, 390, 430, 540, 820, 1280, 1440]) {
      const frog = (houseLine.contour * frogPx(w)) / 100;
      const pad = (PAD_CONTOUR * padPx(w)) / 100;
      const bank = (sceneryContour((frogPx(w) / w) * 100) * w) / 100;
      expect(lineViolations(frog, { pad, bank }, SCENERY_CONTOUR_RATIO + 1e-9), `width ${w}`).toEqual([]);
    }
  });

  it('keeps each blossom on the last pad under 1/8 of a frog', () => {
    for (const b of BLOSSOMS) expect(b.r).toBeLessThanOrEqual(BLOSSOM_MAX_R);
    for (const w of [320, 390, 540, 1440]) {
      const blossomPx = (BLOSSOM_MAX_R * 2 * padPx(w)) / 100;
      expect(blossomPx / frogPx(w), `width ${w}`).toBeLessThanOrEqual(MARK_MAX);
    }
  });
});
