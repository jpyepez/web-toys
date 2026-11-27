import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LEAP_MS, PondLeap } from './PondLeap';
import { LAST_PAD, MAX_PULL_PX, MIN_PULL_PX } from './pond';
import type { Sound } from '../../shell/sound';
import type { Haptics } from '../../shell/haptics';

/**
 * Pond Leap — the Pull gesture and the whole loop, observed through the DOM
 * state (`data-frog-state`, `data-frog-pad`, `data-pull-stretch`, `data-phase`).
 * Leap distances, spring feel and timing are tuned on a device, not pinned here.
 */

const frog = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-frog]')!;
const state = (c: HTMLElement) => frog(c).getAttribute('data-frog-state');
const padOf = (c: HTMLElement) => Number(frog(c).getAttribute('data-frog-pad'));
const stretch = (c: HTMLElement) => Number(frog(c).getAttribute('data-pull-stretch'));
const settle = () => act(() => void vi.advanceTimersByTime(LEAP_MS + 50));

/** Press the frog, pull the finger DOWN by `dist` px (the frog goes UP), release. */
function pull(el: HTMLElement, dist: number, dx = 0) {
  fireEvent.pointerDown(el, { clientX: 200, clientY: 300, pointerId: 1 });
  fireEvent.pointerMove(el, { clientX: 200 + dx, clientY: 300 + dist, pointerId: 1 });
  fireEvent.pointerUp(el, { clientX: 200 + dx, clientY: 300 + dist, pointerId: 1 });
}

const SHORT = MIN_PULL_PX + 20;
const LONG = MAX_PULL_PX + 20;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('PondLeap', () => {
  it('mounts an idle frog on the first pad, in the playing phase', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    expect(state(container)).toBe('idle');
    expect(padOf(container)).toBe(0);
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'playing');
    expect(container.querySelectorAll('[data-pad]')).toHaveLength(6);
  });

  it('a Pull past the minimum distance leaps, then lands on a later pad', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    pull(frog(container), SHORT);
    expect(state(container)).toBe('leaping');
    expect(Number(frog(container).getAttribute('data-frog-target'))).toBeGreaterThan(0);
    settle();
    expect(state(container)).toBe('landed');
    expect(padOf(container)).toBeGreaterThan(0);
  });

  it('a long Pull leaps exactly one pad, like a short one', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    pull(frog(container), LONG);
    expect(Number(frog(container).getAttribute('data-frog-target'))).toBe(1);
    settle();
    expect(padOf(container)).toBe(1);
  });

  it('the frog stretches along one rail, straight back from the next pad, whichever way the finger goes', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    const el = frog(container);
    const angle = () => frog(container).getAttribute('data-pull-angle');
    fireEvent.pointerDown(el, { clientX: 200, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 200, clientY: 380, pointerId: 1 });
    const down = angle();
    fireEvent.pointerMove(el, { clientX: 290, clientY: 310, pointerId: 1 });
    const sideways = angle();
    fireEvent.pointerMove(el, { clientX: 140, clientY: 240, pointerId: 1 });
    expect(down).not.toBeNull();
    expect(sideways).toBe(down);
    expect(angle()).toBe(down);
  });

  it('shows a dotted arc to the next pad once the Pull counts, and hides it on release', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    const el = frog(container);
    const arc = () => container.querySelector('[data-leap-arc]');
    fireEvent.pointerDown(el, { clientX: 200, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 200, clientY: 300 + MIN_PULL_PX - 5, pointerId: 1 });
    expect(arc()).toBeNull();
    fireEvent.pointerMove(el, { clientX: 200, clientY: 300 + MIN_PULL_PX + 5, pointerId: 1 });
    expect(arc()).toHaveAttribute('data-leap-arc', '1');
    fireEvent.pointerUp(el, { clientX: 200, clientY: 300 + MIN_PULL_PX + 5, pointerId: 1 });
    expect(arc()).toBeNull();
  });

  it('the Pull direction need not be exact: a sideways pull still leaps forward', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    pull(frog(container), SHORT, 90);
    settle();
    expect(padOf(container)).toBeGreaterThan(0);
  });

  it('a tap or a tiny pull does not leap, and the frog stays on its pad', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    fireEvent.pointerDown(frog(container), { clientX: 200, clientY: 300, pointerId: 1 });
    fireEvent.pointerUp(frog(container), { clientX: 200, clientY: 300, pointerId: 1 });
    expect(state(container)).toBe('idle');
    pull(frog(container), MIN_PULL_PX - 8);
    settle();
    expect(state(container)).toBe('idle');
    expect(padOf(container)).toBe(0);
    pull(frog(container), SHORT);
    expect(state(container)).toBe('leaping');
  });

  it('a cancelled pointer mid-Pull does not leap, and the frog can be pulled again', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    const el = frog(container);
    fireEvent.pointerDown(el, { clientX: 200, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 200, clientY: 300 + LONG, pointerId: 1 });
    expect(state(container)).toBe('pulling');
    fireEvent.pointerCancel(el);
    fireEvent.pointerUp(el, { clientX: 200, clientY: 300 + LONG, pointerId: 1 });
    settle();
    expect(state(container)).toBe('idle');
    expect(padOf(container)).toBe(0);
    expect(stretch(container)).toBe(0);
    pull(el, SHORT);
    expect(state(container)).toBe('leaping');
  });

  it('a lost pointer capture mid-Pull cancels it the same way', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    const el = frog(container);
    fireEvent.pointerDown(el, { clientX: 200, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 200, clientY: 300 + LONG, pointerId: 1 });
    fireEvent.lostPointerCapture(el);
    settle();
    expect(state(container)).toBe('idle');
    expect(padOf(container)).toBe(0);
  });

  it('a cancelled Pull on a later pad keeps the frog on that pad', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    pull(frog(container), SHORT);
    settle();
    const at = padOf(container);
    fireEvent.pointerDown(frog(container), { clientX: 200, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(frog(container), { clientX: 200, clientY: 300 + LONG, pointerId: 1 });
    fireEvent.pointerCancel(frog(container));
    expect(state(container)).toBe('landed');
    expect(padOf(container)).toBe(at);
  });

  it('follows the Pull: idle, then stretched under the finger, capped, then released', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    const el = frog(container);
    expect(stretch(container)).toBe(0);
    fireEvent.pointerDown(el, { clientX: 200, clientY: 300, pointerId: 1 });
    expect(state(container)).toBe('pulling');
    fireEvent.pointerMove(el, { clientX: 200, clientY: 300 + MAX_PULL_PX / 2, pointerId: 1 });
    const half = stretch(container);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(1);
    expect(container.querySelector('[data-pull-band]')).not.toBeNull();
    fireEvent.pointerMove(el, { clientX: 200, clientY: 300 + MAX_PULL_PX * 3, pointerId: 1 });
    expect(stretch(container)).toBe(1);
    fireEvent.pointerUp(el, { clientX: 200, clientY: 300 + MAX_PULL_PX * 3, pointerId: 1 });
    expect(stretch(container)).toBe(0);
    expect(container.querySelector('[data-pull-band]')).toBeNull();
  });

  it('leaves the frog with a valid, unstretched pose after release (no stale pull transform)', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    const pose = () => (frog(container).firstElementChild as HTMLElement).style.transform;
    fireEvent.pointerDown(frog(container), { clientX: 200, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(frog(container), { clientX: 200, clientY: 300 + 80, pointerId: 1 });
    expect(pose()).toContain('translate(');
    fireEvent.pointerUp(frog(container), { clientX: 200, clientY: 300 + 80, pointerId: 1 });
    expect(pose()).toBe('none');
  });

  it('ignores a second press while the frog is in the air', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    pull(frog(container), SHORT);
    pull(frog(container), LONG);
    expect(state(container)).toBe('leaping');
    settle();
    expect(padOf(container)).toBe(1);
  });

  it('plays a boing and a haptic tick on release, a splash and chime on landing, and a rising tone while pulling', () => {
    const play = vi.fn();
    const tick = vi.fn();
    const sound = { play, unlock: vi.fn(), celebrate: vi.fn(), isMuted: () => false, setMuted: vi.fn() } as unknown as Sound;
    const { container } = render(<PondLeap onComplete={vi.fn()} sound={sound} haptics={{ tick } as Haptics} />);
    const el = frog(container);
    fireEvent.pointerDown(el, { clientX: 200, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 200, clientY: 300 + MAX_PULL_PX * 0.4, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 200, clientY: 300 + MAX_PULL_PX, pointerId: 1 });
    const tones = play.mock.calls.map((c) => c[0].freq);
    expect(tones.length).toBeGreaterThanOrEqual(2);
    expect(tones[tones.length - 1]).toBeGreaterThan(tones[0]);
    expect(tick).not.toHaveBeenCalled();
    fireEvent.pointerUp(el, { clientX: 200, clientY: 300 + MAX_PULL_PX, pointerId: 1 });
    expect(tick).toHaveBeenCalledTimes(1);
    const afterRelease = play.mock.calls.length;
    settle();
    expect(play.mock.calls.length).toBeGreaterThan(afterRelease);
  });
});

describe('PondLeap — Goal and Completion', () => {
  it('plays from the first touch to onComplete, firing it once, only on the last pad', () => {
    const onComplete = vi.fn();
    const { container } = render(<PondLeap onComplete={onComplete} />);
    let leaps = 0;
    while (padOf(container) < LAST_PAD && leaps < 20) {
      expect(onComplete).not.toHaveBeenCalled();
      pull(frog(container), leaps % 2 ? LONG : SHORT);
      expect(onComplete).not.toHaveBeenCalled();
      settle();
      leaps++;
    }
    expect(padOf(container)).toBe(LAST_PAD);
    expect(leaps).toBeGreaterThanOrEqual(3);
    expect(leaps).toBeLessThanOrEqual(5);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('main')).toHaveAttribute('data-phase', 'outro');
    expect(container.querySelector('[data-pond-ripples]')).not.toBeNull();

    // Nothing more to pull, and no second completion.
    pull(frog(container), LONG);
    settle();
    expect(padOf(container)).toBe(LAST_PAD);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('reaches the last pad in five short pulls, and does not complete on the fourth', () => {
    const onComplete = vi.fn();
    const { container } = render(<PondLeap onComplete={onComplete} />);
    for (let i = 0; i < 4; i++) {
      pull(frog(container), SHORT);
      settle();
    }
    expect(padOf(container)).toBe(4);
    expect(onComplete).not.toHaveBeenCalled();
    pull(frog(container), SHORT);
    settle();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('a long pull from the second-to-last pad lands on the last pad, not past it', () => {
    const onComplete = vi.fn();
    const { container } = render(<PondLeap onComplete={onComplete} />);
    for (let i = 0; i < 4; i++) {
      pull(frog(container), SHORT);
      settle();
    }
    pull(frog(container), LONG);
    settle();
    expect(padOf(container)).toBe(LAST_PAD);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('PondLeap — drawing', () => {
  it('sets touch-action: none on the pond and the frog, so a Pull never scrolls or navigates', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    expect(screen.getByRole('main').style.touchAction).toBe('none');
    expect(container.querySelector<HTMLElement>('[data-pond-stage]')!.style.touchAction).toBe('none');
    expect(frog(container).style.touchAction).toBe('none');
  });

  it('draws with SVG primitives, no stroke and no ellipse', () => {
    const { container } = render(<PondLeap onComplete={vi.fn()} />);
    expect(container.querySelector('[data-frog-drawing]')).not.toBeNull();
    expect(container.querySelectorAll('[stroke], [stroke-width], ellipse, img, image')).toHaveLength(0);
  });
});
