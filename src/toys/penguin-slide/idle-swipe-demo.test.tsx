import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IDLE_DEMO_DELAY_MS, MIN_STROKE_PX, PenguinSlide } from './PenguinSlide';

/** Penguin Slide — idle ghost-finger Swipe demo. Asserted by observable state only. */

const penguins = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-penguin]')];
const ghost = (c: HTMLElement) => c.querySelector('[data-ghost-swipe-finger]');
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('PenguinSlide idle Swipe demo', () => {
  it('shows the ghost finger after the idle delay when nothing has been launched', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    expect(ghost(container)).toBeNull();
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');
    advance(IDLE_DEMO_DELAY_MS + 100);
    expect(ghost(container)).not.toBeNull();
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');
  });

  it('leaves every penguin standing and never completes', () => {
    const onComplete = vi.fn();
    const { container } = render(<PenguinSlide onComplete={onComplete} />);
    advance(IDLE_DEMO_DELAY_MS + 20_000);
    expect(ghost(container)).not.toBeNull();
    expect(penguins(container).map((p) => p.getAttribute('data-penguin-state'))).toEqual(Array(5).fill('standing'));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('disappears once a penguin is launched and does not come back', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    advance(IDLE_DEMO_DELAY_MS + 100);
    const p = penguins(container)[0];
    fireEvent.pointerDown(p, { clientX: 100, clientY: 100, timeStamp: 0 });
    fireEvent.pointerMove(p, { clientX: 100 + MIN_STROKE_PX * 5, clientY: 100, timeStamp: 50 });
    fireEvent.pointerUp(p, { clientX: 100 + MIN_STROKE_PX * 5, clientY: 100, timeStamp: 50 });
    expect(ghost(container)).toBeNull();
    advance(IDLE_DEMO_DELAY_MS * 4);
    expect(ghost(container)).toBeNull();
  });

  it('a launch before the idle delay keeps the demo from ever showing', () => {
    const { container } = render(<PenguinSlide onComplete={vi.fn()} />);
    const p = penguins(container)[0];
    fireEvent.pointerDown(p, { clientX: 100, clientY: 100, timeStamp: 0 });
    fireEvent.pointerUp(p, { clientX: 100 + MIN_STROKE_PX * 5, clientY: 100, timeStamp: 50 });
    advance(IDLE_DEMO_DELAY_MS * 4);
    expect(ghost(container)).toBeNull();
  });
});
