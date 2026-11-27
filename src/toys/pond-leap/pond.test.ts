import { describe, expect, it } from 'vitest';
import { LAST_PAD, MAX_PULL_PX, MIN_PULL_PX, PADS, landingPad, padsForPull, railAngle, railReach, stretchOf } from './pond';

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

  it('every real pull leaps exactly one pad, however long', () => {
    // A child can't pick the right pad by pull length, so length never picks it.
    expect(padsForPull(MIN_PULL_PX)).toBe(1);
    expect(padsForPull(MAX_PULL_PX)).toBe(1);
    expect(padsForPull(10_000)).toBe(1);
  });

  it('lands on the very next pad', () => {
    for (let from = 0; from < LAST_PAD; from++) expect(landingPad(from, MAX_PULL_PX)).toBe(from + 1);
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

describe('Pond Leap — the rail a Pull runs along', () => {
  it('points straight back, away from the next pad, at a phone and at the widest stage', () => {
    for (const [w, h] of [[390, 844], [540, 800]]) {
      for (let from = 0; from < LAST_PAD; from++) {
        const a = (railAngle(from, w, h) * Math.PI) / 180;
        const toNext = [(PADS[from + 1][0] - PADS[from][0]) * w, (PADS[from + 1][1] - PADS[from][1]) * h];
        const len = Math.hypot(toNext[0], toNext[1]);
        // the rail's unit vector is exactly opposite the leap
        expect(Math.cos(a) * toNext[0] + Math.sin(a) * toNext[1], `${w}x${h} pad ${from}`).toBeCloseTo(-len, 6);
      }
    }
  });

  it('never draws the frog off the stage, and follows short pulls exactly', () => {
    const margin = 50;
    for (const [w, h] of [[360, 640], [390, 844], [540, 800]]) {
      for (let from = 0; from < LAST_PAD; from++) {
        const r = railReach(from, w, h, MAX_PULL_PX * 3, margin);
        expect(r).toBeLessThanOrEqual(MAX_PULL_PX);
        const a = (railAngle(from, w, h) * Math.PI) / 180;
        const x = PADS[from][0] * w + Math.cos(a) * r;
        const y = PADS[from][1] * h + Math.sin(a) * r;
        expect(x, `${w}x${h} pad ${from}`).toBeGreaterThanOrEqual(margin - 1e-6);
        expect(x).toBeLessThanOrEqual(w - margin + 1e-6);
        expect(y).toBeGreaterThanOrEqual(margin - 1e-6);
        expect(y).toBeLessThanOrEqual(h - margin + 1e-6);
        expect(railReach(from, w, h, 10, margin)).toBe(10);
      }
    }
  });
});
