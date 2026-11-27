import { describe, expect, it } from 'vitest';
import { LAST_PAD, LONG_PULL_PX, MAX_PULL_PX, MIN_PULL_PX, PADS, landingPad, padsForPull, stretchOf } from './pond';

describe('Pond Leap — the pond', () => {
  it('has six pads climbing from the bottom edge to the top', () => {
    expect(PADS).toHaveLength(6);
    for (let i = 1; i < PADS.length; i++) expect(PADS[i][1]).toBeLessThan(PADS[i - 1][1]);
  });

  it('winds from side to side, inside the stage', () => {
    for (let i = 0; i < PADS.length; i++) {
      expect(PADS[i][0]).toBeGreaterThanOrEqual(0.25);
      expect(PADS[i][0]).toBeLessThanOrEqual(0.75);
      if (i > 0 && i < LAST_PAD) expect(Math.sign(PADS[i][0] - PADS[i - 1][0])).not.toBe(Math.sign(PADS[i + 1][0] - PADS[i][0]));
    }
  });

  it('never overlaps one pad with the next, at a phone and at the widest stage', () => {
    // pad width is clamp(96px, 28vw, 150px); the stage is the viewport up to 540px wide.
    for (const [w, h] of [[360, 640], [390, 844], [540, 800], [540, 1200]]) {
      const padW = Math.min(150, Math.max(96, 0.28 * w));
      for (let i = 1; i < PADS.length; i++) {
        const d = Math.hypot((PADS[i][0] - PADS[i - 1][0]) * w, (PADS[i][1] - PADS[i - 1][1]) * h);
        expect(d, `${w}x${h} pad ${i}`).toBeGreaterThan(padW * 1.05);
      }
    }
  });
});

describe('Pond Leap — how far a Pull leaps', () => {
  it('a tap or a tiny pull leaps nothing', () => {
    expect(padsForPull(0)).toBe(0);
    expect(padsForPull(MIN_PULL_PX - 1)).toBe(0);
  });

  it('a short pull leaps one pad, a long one two', () => {
    expect(padsForPull(MIN_PULL_PX)).toBe(1);
    expect(padsForPull(LONG_PULL_PX - 1)).toBe(1);
    expect(padsForPull(LONG_PULL_PX)).toBe(2);
    expect(padsForPull(10_000)).toBe(2);
  });

  it('a longer pull never lands earlier than a shorter one', () => {
    for (let from = 0; from <= LAST_PAD; from++) {
      let prev = from;
      for (let d = 0; d <= 400; d += 5) {
        const to = landingPad(from, d);
        expect(to).toBeGreaterThanOrEqual(prev);
        prev = to;
      }
    }
  });

  it('always lands on a real pad, never behind the frog, never past the last', () => {
    for (let from = 0; from <= LAST_PAD; from++) {
      for (const d of [0, 10, 28, 60, 110, 500, Number.POSITIVE_INFINITY]) {
        const to = landingPad(from, d);
        expect(Number.isInteger(to)).toBe(true);
        expect(to).toBeGreaterThanOrEqual(from);
        expect(to).toBeLessThanOrEqual(LAST_PAD);
      }
    }
  });

  it('caps the stretch at 1', () => {
    expect(stretchOf(0)).toBe(0);
    expect(stretchOf(MAX_PULL_PX / 2)).toBeCloseTo(0.5);
    expect(stretchOf(MAX_PULL_PX * 10)).toBe(1);
  });
});
