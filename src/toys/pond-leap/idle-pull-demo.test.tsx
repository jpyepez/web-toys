import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LEAP_MS, PondLeap } from './PondLeap';
import { DEMO_DURATION_MS, IDLE_DEMO_DELAY_MS } from './demo';
import { LAST_PAD, MAX_PULL_PX } from './pond';

/**
 * Pond Leap's idle ghost-finger Pull demo: when the frog sits waiting on a pad,
 * a ghost finger shows the Pull once. It is a hint, never a move: the frog,
 * its pad and the Goal are untouched.
 */

const ghost = () => document.querySelector('[data-ghost-pull-finger]');
const frog = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-frog]')!;
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

function leap(el: HTMLElement) {
  fireEvent.pointerDown(el, { clientX: 200, clientY: 300, pointerId: 1 });
  fireEvent.pointerMove(el, { clientX: 200, clientY: 300 + MAX_PULL_PX, pointerId: 1 });
  fireEvent.pointerUp(el, { clientX: 200, clientY: 300 + MAX_PULL_PX, pointerId: 1 });
  advance(LEAP_MS + 50);
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Pond Leap — idle ghost-finger Pull demo', () => {
  it('shows the ghost finger after the idle delay, with the arc to the next pad', () => {
    render(<PondLeap onComplete={vi.fn()} />);
    const main = screen.getByRole('main');
    expect(ghost()).toBeNull();
    expect(main).toHaveAttribute('data-demo-active', 'false');
    advance(IDLE_DEMO_DELAY_MS + 100);
    expect(ghost()).not.toBeNull();
    expect(main).toHaveAttribute('data-demo-active', 'true');
    expect(document.querySelector('[data-leap-arc]')).toHaveAttribute('data-leap-arc', '1');
  });

  it('moves nothing and fades away, and shows once per pad', () => {
    const onComplete = vi.fn();
    const { container } = render(<PondLeap onComplete={onComplete} />);
    advance(IDLE_DEMO_DELAY_MS + 100);
    expect(frog(container)).toHaveAttribute('data-frog-state', 'idle');
    expect(frog(container)).toHaveAttribute('data-frog-pad', '0');
    advance(DEMO_DURATION_MS + 100);
    expect(ghost()).toBeNull();
    expect(frog(container)).toHaveAttribute('data-frog-pad', '0');
    advance(IDLE_DEMO_DELAY_MS * 4);
    expect(ghost()).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('disappears the moment the frog is pressed', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    advance(IDLE_DEMO_DELAY_MS + 100);
    expect(ghost()).not.toBeNull();
    fireEvent.pointerDown(frog(container), { clientX: 200, clientY: 300, pointerId: 1 });
    expect(ghost()).toBeNull();
  });

  it('does not show while the child is mid-Pull', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    fireEvent.pointerDown(frog(container), { clientX: 200, clientY: 300, pointerId: 1 });
    advance(IDLE_DEMO_DELAY_MS * 2);
    expect(ghost()).toBeNull();
  });

  it('comes back when the child stalls on a later pad', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    leap(frog(container));
    expect(frog(container)).toHaveAttribute('data-frog-pad', '1');
    expect(ghost()).toBeNull();
    advance(IDLE_DEMO_DELAY_MS + 100);
    expect(ghost()).not.toBeNull();
  });

  it('never shows once the frog is on the last pad', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    for (let i = 0; i < LAST_PAD; i++) leap(frog(container));
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'outro');
    advance(IDLE_DEMO_DELAY_MS * 3);
    expect(ghost()).toBeNull();
  });
});
