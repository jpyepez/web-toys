import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SoupPot } from './SoupPot';
import { DEAD_ZONE_PX, GOAL_ANGLE, MAX_SAMPLE_ANGLE } from './stir';

/** jsdom's rect is all zeros, so the pot's centre is (0, 0). */
const R = 100;
const pt = (a: number, r = R) => ({ clientX: r * Math.cos(a), clientY: r * Math.sin(a) });
const STEP = 0.2;

const setup = () => {
  const onComplete = vi.fn();
  render(<SoupPot onComplete={onComplete} />);
  const el = screen.getByRole('main');
  const progress = () => Number(el.getAttribute('data-progress'));
  const stage = () => Number(el.getAttribute('data-stage'));
  /** Circle from angle `from` for `total` radians (negative = other way), as a fresh pointer-down. */
  const stir = (total: number, from = 0, up = true) => {
    fireEvent.pointerDown(el, { pointerId: 1, ...pt(from) });
    const n = Math.ceil(Math.abs(total) / STEP);
    for (let i = 1; i <= n; i++) {
      fireEvent.pointerMove(el, { pointerId: 1, ...pt(from + (Math.sign(total) * Math.min(i * STEP, Math.abs(total)))) });
    }
    if (up) fireEvent.pointerUp(el, { pointerId: 1 });
  };
  return { el, onComplete, progress, stage, stir };
};

describe('SoupPot', () => {
  it('completes exactly once past the Goal and enters the Outro', () => {
    const { el, onComplete, stir } = setup();
    stir(GOAL_ANGLE + 3);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(el).toHaveAttribute('data-phase', 'outro');
  });

  it('does not complete short of the Goal', () => {
    const { el, onComplete, stir } = setup();
    stir(GOAL_ANGLE * 0.9);
    expect(onComplete).not.toHaveBeenCalled();
    expect(el).toHaveAttribute('data-phase', 'stirring');
  });

  it('adds both directions after a reversal', () => {
    const { progress, stir } = setup();
    stir(2, 0, false);
    const one = progress();
    stir(-2, 2, false);
    expect(one).toBeCloseTo(2);
    expect(progress()).toBeCloseTo(4);
  });

  it('keeps progress across pointerup and pointercancel, and continues', () => {
    const { el, progress, stir } = setup();
    stir(1);
    expect(progress()).toBeCloseTo(1);
    stir(1, 0, false);
    fireEvent.pointerCancel(el, { pointerId: 1 });
    expect(progress()).toBeCloseTo(2);
    fireEvent.pointerMove(el, { pointerId: 1, ...pt(1) });
    expect(progress()).toBeCloseTo(2);
    stir(1);
    expect(progress()).toBeCloseTo(3);
  });

  it('keeps progress when capture is lost', () => {
    const { el, progress, stir } = setup();
    stir(1, 0, false);
    fireEvent.lostPointerCapture(el, { pointerId: 1 });
    fireEvent.pointerMove(el, { pointerId: 1, ...pt(2) });
    expect(progress()).toBeCloseTo(1);
  });

  it('adds nothing for moves inside the dead zone', () => {
    const { el, progress } = setup();
    fireEvent.pointerDown(el, { pointerId: 1, ...pt(0, DEAD_ZONE_PX - 2) });
    for (let i = 1; i < 20; i++) fireEvent.pointerMove(el, { pointerId: 1, ...pt(i * 0.3, DEAD_ZONE_PX - 2) });
    expect(progress()).toBe(0);
  });

  it('adds no more than the jump cap for a jump across the centre', () => {
    const { el, progress } = setup();
    fireEvent.pointerDown(el, { pointerId: 1, ...pt(0) });
    fireEvent.pointerMove(el, { pointerId: 1, ...pt(Math.PI) });
    expect(progress()).toBeGreaterThan(0);
    expect(progress()).toBeLessThanOrEqual(MAX_SAMPLE_ANGLE);
  });

  it('adds nothing for a tap or a still finger', () => {
    const { el, progress } = setup();
    fireEvent.pointerDown(el, { pointerId: 1, ...pt(0) });
    fireEvent.pointerMove(el, { pointerId: 1, ...pt(0) });
    fireEvent.pointerUp(el, { pointerId: 1 });
    expect(progress()).toBe(0);
  });

  it('moves the stage forward once each at ¼, ½ and ¾', () => {
    const { stage, stir } = setup();
    const seen: number[] = [];
    fireEvent.pointerDown(screen.getByRole('main'), { pointerId: 1, ...pt(0) });
    for (let a = STEP; a < GOAL_ANGLE * 0.95; a += STEP) {
      fireEvent.pointerMove(screen.getByRole('main'), { pointerId: 1, ...pt(a) });
      if (seen[seen.length - 1] !== stage()) seen.push(stage());
    }
    expect(seen).toEqual([0, 1, 2, 3]);
    void stir;
  });

  it('ignores pointer input after the Goal', () => {
    const { onComplete, progress, stir } = setup();
    stir(GOAL_ANGLE + 3);
    const done = progress();
    stir(3);
    expect(progress()).toBe(done);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('points the ladle at the finger while stirring', () => {
    const { el } = setup();
    fireEvent.pointerDown(el, { pointerId: 1, ...pt(0) });
    fireEvent.pointerMove(el, { pointerId: 1, ...pt(0.5) });
    const ladle = el.querySelector('[data-ladle]')!;
    expect(Number(ladle.getAttribute('data-ladle-angle'))).toBeCloseTo(0.5);
  });
});
