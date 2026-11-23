import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SoupPot } from './SoupPot';
import { DEMO_DURATION_MS, IDLE_DEMO_DELAY_MS } from './demo';

const ghost = () => document.querySelector('[data-ghost-stir-finger]');
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

describe('Soup Pot — idle ghost-finger Stir demo', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('uses its own 2500ms idle delay', () => {
    expect(IDLE_DEMO_DELAY_MS).toBe(2500);
  });

  it('shows the ghost finger after the idle delay with no progress', async () => {
    render(<SoupPot onComplete={vi.fn()} />);
    const el = screen.getByRole('main');
    expect(ghost()).toBeNull();
    expect(el).toHaveAttribute('data-demo-active', 'false');
    await advance(IDLE_DEMO_DELAY_MS + 100);
    expect(ghost()).not.toBeNull();
    expect(el).toHaveAttribute('data-demo-active', 'true');
  });

  it('leaves progress and the ladle untouched and fades away', async () => {
    const onComplete = vi.fn();
    render(<SoupPot onComplete={onComplete} />);
    const el = screen.getByRole('main');
    const ladle = el.querySelector('[data-ladle]')!;
    await advance(IDLE_DEMO_DELAY_MS + 100);
    expect(ghost()).not.toBeNull();
    expect(el).toHaveAttribute('data-progress', '0');
    expect(ladle).toHaveAttribute('data-ladle-angle', '0');
    await advance(DEMO_DURATION_MS + 100);
    expect(ghost()).toBeNull();
    expect(el).toHaveAttribute('data-progress', '0');
    expect(ladle).toHaveAttribute('data-ladle-angle', '0');
    expect(onComplete).not.toHaveBeenCalled();
    await advance(IDLE_DEMO_DELAY_MS * 3);
    expect(ghost()).toBeNull();
  });

  it('disappears on Stir progress and never comes back', async () => {
    render(<SoupPot onComplete={vi.fn()} />);
    const el = screen.getByRole('main');
    await advance(IDLE_DEMO_DELAY_MS + 100);
    expect(ghost()).not.toBeNull();
    fireEvent.pointerDown(el, { pointerId: 1, clientX: 100, clientY: 0 });
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 98, clientY: 20 });
    fireEvent.pointerUp(el, { pointerId: 1 });
    expect(Number(el.getAttribute('data-progress'))).toBeGreaterThan(0);
    expect(ghost()).toBeNull();
    await advance(IDLE_DEMO_DELAY_MS * 4);
    expect(ghost()).toBeNull();
  });

  it('does not appear if progress is made before the delay', async () => {
    render(<SoupPot onComplete={vi.fn()} />);
    const el = screen.getByRole('main');
    fireEvent.pointerDown(el, { pointerId: 1, clientX: 100, clientY: 0 });
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 98, clientY: 20 });
    await advance(IDLE_DEMO_DELAY_MS * 2);
    expect(ghost()).toBeNull();
  });
});
