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

  /** Wipe the on-stage Critter to its clean-snap (cross every caked blob). */
  function wipeCurrentCritterClean(container: HTMLElement) {
    let blob = container.querySelector('[data-mud-blob]');
    while (blob) {
      fireEvent.pointerOver(blob);
      blob = container.querySelector('[data-mud-blob]');
    }
  }

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

  it('cancels the demo the instant the child makes a real Wipe', async () => {
    // AC #2. The demo is honest teaching, not autopilot: the moment the child
    // actually Wipes, it gets out of the way. With the demo active (the child
    // stalled), a single real blob-crossing — a contributing Wipe, well below
    // the clean threshold so the Critter stays in `wiping` — flips
    // `data-demo-active` back off. Driven through the slice-#3 `data-mud-blob`
    // node (the real wipe mechanic), not a synthetic flag poke.
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} />);

    // Settle in `wiping` and stall until the demo activates.
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'wiping');

    // The child finally Wipes — one blob crossed is enough to cancel the demo.
    fireEvent.pointerOver(container.querySelector('[data-mud-blob]')!);

    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');
    // Still mid-Wipe — a sub-threshold crossing cancels the demo without
    // advancing the loop.
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'wiping');
  });

  it('reforms its blobs — the demo never advances the cleaned count or the threshold', async () => {
    // AC #3. The demo teaches HONESTLY: it shows the Wipe but does not play the
    // Toy for the child. Its blobs lift and REFORM — so after it activates, the
    // mud blanket is back to COMPLETE (the contiguous full set `0..n-1`, no
    // pre-wiped gaps), the loop is still `wiping` (the clean-snap never fired),
    // and `onComplete` has not advanced. The lift/reform animation itself is
    // on-device-tuned (not asserted); what we pin is the honesty invariant —
    // zero net progress — through the public DOM. (Asserting the contiguous
    // full set, not a raw count, keeps it animal-agnostic across the shuffled
    // cast, which carry different blob counts — slice #05.)
    const onComplete = vi.fn();
    const { container } = render(<MuddyPuddle onComplete={onComplete} />);

    await vi.runOnlyPendingTimersAsync();
    const before = [...container.querySelectorAll('[data-mud-blob]')]
      .map((b) => Number(b.getAttribute('data-blob-index')))
      .sort((a, b) => a - b);
    expect(before.length).toBeGreaterThan(1);

    // Let the demo activate (the child stalls, no Wipe).
    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');

    // The full mud blanket is intact — the demo lifted nothing for real.
    const after = [...container.querySelectorAll('[data-mud-blob]')]
      .map((b) => Number(b.getAttribute('data-blob-index')))
      .sort((a, b) => a - b);
    expect(after).toEqual(before);
    expect(after).toEqual(after.map((_, i) => i));
    // No progress advanced: still awaiting the kid's Wipe, Goal untouched.
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'wiping');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('re-arms the demo on a later Critter where the child stalls again', async () => {
    // AC #4. The teaching isn't one-and-done: the child Wipes the first Critter
    // clean (so no demo there — they didn't need it), but then stalls on the
    // NEXT Critter. The demo must re-prompt, arming afresh each time a Critter
    // settles in `wiping`. We clean Critter #1, let Critter #2 trot in and
    // settle, then stall — the demo activates again on this later Critter.
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} />);

    // Critter #1: settle, Wipe clean, trot off — no stall, so no demo.
    await vi.runOnlyPendingTimersAsync(); // arriving → wiping
    wipeCurrentCritterClean(container); //   wiping → dismissing (clean-snap)
    await vi.runOnlyPendingTimersAsync(); // dismissing → idle
    await vi.runOnlyPendingTimersAsync(); // idle → arriving (Critter #2)
    await vi.runOnlyPendingTimersAsync(); // arriving → wiping (Critter #2)
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'wiping');
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');

    // The child stalls on Critter #2 — the demo re-arms and re-prompts.
    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);

    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');
  });
});
