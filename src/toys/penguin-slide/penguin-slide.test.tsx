import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MIN_STROKE_PX, OUTRO_MS, PENGUIN_COUNT, PenguinSlide } from './PenguinSlide';

/**
 * Penguin Slide — Swipe gesture + loop behind placeholder penguins. Asserts the
 * observable contract through `data-penguin-state` / `data-phase`; sizes, speeds
 * and choreography are tuned later and not pinned here.
 */

const penguins = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-penguin]')];
const states = (c: HTMLElement) => penguins(c).map((p) => p.getAttribute('data-penguin-state'));
const settle = () => act(() => void vi.advanceTimersByTime(10_000));
const FAR = MIN_STROKE_PX * 5;

function swipe(el: HTMLElement, dx = FAR, dy = 0, stamps: [number, number] = [0, 50]) {
  fireEvent.pointerDown(el, { clientX: 100, clientY: 100, timeStamp: stamps[0] });
  fireEvent.pointerMove(el, { clientX: 100 + dx, clientY: 100 + dy, timeStamp: stamps[1] });
  fireEvent.pointerUp(el, { clientX: 100 + dx, clientY: 100 + dy, timeStamp: stamps[1] });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('PenguinSlide', () => {
  it('mounts five standing penguins in the playing phase', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    expect(PENGUIN_COUNT).toBe(5);
    expect(states(container)).toEqual(Array(5).fill('standing'));
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'playing');
  });

  it('a stroke past the minimum distance launches, then lands in the water', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    swipe(penguins(container)[0]);
    expect(states(container)[0]).toBe('launched');
    settle();
    expect(states(container)[0]).toBe('in-water');
  });

  it('a tap does not launch', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    const p = penguins(container)[0];
    fireEvent.pointerDown(p, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(p, { clientX: 100 + MIN_STROKE_PX / 4, clientY: 100 });
    fireEvent.pointerUp(p, { clientX: 100 + MIN_STROKE_PX / 4, clientY: 100 });
    settle();
    expect(states(container)[0]).toBe('standing');
  });

  it('a slow stroke past the minimum distance still launches', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    swipe(penguins(container)[0], FAR, 0, [0, 5000]);
    expect(states(container)[0]).toBe('launched');
  });

  it('a pointercancel mid-stroke leaves the penguin standing and swipeable', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    const p = penguins(container)[0];
    fireEvent.pointerDown(p, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(p, { clientX: 100 + FAR, clientY: 100 });
    fireEvent.pointerCancel(p);
    fireEvent.pointerUp(p, { clientX: 100 + FAR, clientY: 100 });
    expect(states(container)[0]).toBe('standing');
    swipe(p);
    expect(states(container)[0]).toBe('launched');
  });

  it("swiping one penguin leaves the others untouched", () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    swipe(penguins(container)[2]);
    expect(states(container)).toEqual(['standing', 'standing', 'launched', 'standing', 'standing']);
    settle();
    expect(states(container)).toEqual(['standing', 'standing', 'in-water', 'standing', 'standing']);
  });

  it('an in-water penguin ignores further strokes', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    const p = penguins(container)[0];
    swipe(p);
    settle();
    swipe(p, -FAR);
    expect(states(container)[0]).toBe('in-water');
  });

  it('fires onComplete once, only after all five land, and enters the Outro', () => {
    const onComplete = vi.fn();
    const { container } = render(<PenguinSlide onComplete={onComplete} />);
    penguins(container).slice(0, 4).forEach((p) => {
      swipe(p);
      settle();
    });
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'playing');
    swipe(penguins(container)[4]);
    expect(onComplete).not.toHaveBeenCalled();
    settle();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'outro');
    expect(states(container)).toEqual(Array(5).fill('in-water'));
    swipe(penguins(container)[0]);
    settle();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('takes a press only on the painted penguin, never on its rectangle', () => {
    // The staggered rows overlap, so a wrapper rectangle would steal taps aimed
    // at the penguin behind it. Every wrapper is transparent to the pointer and
    // only a STANDING penguin's painted shape opts back in.
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    for (const p of penguins(container)) {
      expect(p.style.pointerEvents).toBe('none');
      expect((p.firstElementChild as HTMLElement).style.pointerEvents).toBe('none');
      const painted = p.querySelector('[data-penguin-part="penguin"]') as SVGElement;
      expect(painted.style.pointerEvents.toLowerCase()).toBe('visiblepainted');
    }
    swipe(penguins(container)[0]);
    settle();
    const swum = penguins(container)[0].querySelector('[data-penguin-part="penguin"]') as SVGElement;
    expect(swum.style.pointerEvents).toBe('');
  });

  it('stands a different kind of penguin in every spot', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    const kinds = penguins(container).map((p) => p.getAttribute('data-penguin-kind'));
    expect(new Set(kinds).size).toBe(5);
  });

  it('pops the row up and splashes once the Outro gathers', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    penguins(container).forEach((p) => {
      swipe(p);
      settle();
    });
    expect(container.querySelectorAll('[data-penguin-splash]').length).toBe(5);
  });

  it('exports a positive Outro duration for winDelayMs', () => {
    expect(OUTRO_MS).toBeGreaterThan(0);
  });
});
