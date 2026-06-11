import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MuddyPuddle } from './MuddyPuddle';

/**
 * Muddy Puddle — idle-triggered ghost-finger demo (muddy-puddle PRD, slice #06).
 *
 * Wordless discoverability: when a Critter settles in `wiping` and the child
 * stalls (~2–3s, on-device-tuned), a demo activates to SHOW them how to Wipe; a
 * real Wipe cancels it, and it re-arms on any later Critter where they stall.
 *
 * Per the slice Notes we test by OBSERVABLE EFFECT, not visuals: the public
 * `data-demo-active` flag on the root `<main>`, that a Wipe cancels it, and that
 * the demo reforms its blobs WITHOUT advancing progress (the cleaned count /
 * threshold never move). The ghost-finger sweep + blob lift/reform animation is
 * on-device-tuned and deliberately NOT unit-asserted. Reduced motion is honoured
 * app-wide by the root `MotionConfig reducedMotion="user"` (as Sheep/Fish rely
 * on), so it needs no per-component assertion here.
 *
 * Time is the only mocked collaborator (`vi.useFakeTimers`, the loop tests'
 * convention) — it's a process boundary. The idle delay is on-device-tuned, so
 * tests advance a generous margin PAST it rather than coupling to the exact ms.
 * Everything else renders real through the public `<MuddyPuddle />` boundary.
 */
describe('Muddy Puddle — idle ghost-finger demo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Comfortably past the ~2–3s idle delay — robust to on-device tuning. */
  const PAST_IDLE_DELAY_MS = 4000;

  it('activates the demo after the idle delay when a settled Critter goes un-wiped', async () => {
    // AC #1. Once a Critter is settled in `wiping` with no contributing Wipe,
    // the idle timer arms; after the delay with still no Wipe the demo becomes
    // active — observed through the public `data-demo-active` flag on `<main>`.
    // Before the delay elapses the demo is dormant; only the stall flips it on.
    render(<MuddyPuddle onComplete={vi.fn()} />);

    // Drive to `wiping` — the settled beat where the idle timer arms.
    await vi.runOnlyPendingTimersAsync();
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'wiping');
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');

    // Stall past the idle delay with no Wipe.
    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);

    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');
  });
});
