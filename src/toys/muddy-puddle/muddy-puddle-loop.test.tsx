import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MuddyPuddle } from './MuddyPuddle';

/**
 * Drive the on-stage piglet's Wipe to the clean-snap: cross every blob the
 * surface still shows, in turn, until the mud is gone. A finger "crossing" a
 * blob is simulated by firing `pointerOver` on that blob node (the assertable
 * boundary, ADR-0006) — no layout/geometry from jsdom needed. Mirrors the
 * slice-#3 wipe test's `wipeUntilClean`.
 */
function wipeCurrentPigletClean(container: HTMLElement) {
  let blob = container.querySelector('[data-mud-blob]');
  while (blob) {
    fireEvent.pointerOver(blob);
    blob = container.querySelector('[data-mud-blob]');
  }
}

/**
 * Muddy Puddle — sequential loop mechanic (muddy-puddle PRD, slice #04).
 *
 * The playable Toy owns its OWN copy of the five-state machine (duplicated from
 * the tap toys, NOT shared — the deliberate cost of Toy independence per the
 * out-of-scope shared-loop rejection): `arriving → wiping → dismissing → idle →
 * arriving …` for the first four piglets, with the 5th clean-snap transitioning
 * into `dismissing` and firing `onComplete` (the ADR-0001 layered-concurrent
 * amendment — the Shell celebration overlay layers above the 5th piglet's
 * splash Outro). The only user-driven transition is `wiping → dismissing`,
 * consuming slice #3's "clean reached" signal; the rest are time-driven beats.
 *
 * Time-driven transitions use `vi.useFakeTimers()`; time is a process-boundary
 * collaborator per the mocking policy. Motion + WipeableCritter internals stay
 * unmocked — tests render through the public `<MuddyPuddle />` boundary and
 * observe state through the rendered DOM (the on-stage Piglet via its accessible
 * `img` role + `data-toy-state`, mirroring the Fish contract). Wipe-progress is
 * driven through slice #3's `data-mud-blob` nodes (never pixels, ADR-0006). The
 * trot-in / splash paths, snap scale, and timing tuples are on-device-tuned and
 * deliberately NOT unit-asserted (slice Notes).
 */
describe('Muddy Puddle — sequential loop mechanic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mounts with a single Piglet on stage in the arriving phase', () => {
    // The state machine bootstraps to `arriving` at mount: one muddy piglet is
    // on stage immediately (trotting in under Motion's control), queryable as a
    // single accessible element. This pins both the single-Critter invariant at
    // t=0 and the load-bearing role-name shape the rest of the AC's queries
    // reuse — `getAllByRole('img', { name: /Piglet/ })`.
    render(<MuddyPuddle onComplete={vi.fn()} />);

    const piglets = screen.getAllByRole('img', { name: /Piglet/ });
    expect(piglets).toHaveLength(1);
  });

  it('transitions arriving → wiping once the trot-in beat completes', async () => {
    // The first time-driven transition. `arriving` is the entry state (piglet
    // trotting in muddy from the side); `wiping` is the centred-piglet-awaiting-
    // Wipe state (this Toy's user-driven beat, named `wiping` vs the tap toys'
    // `waiting`). The transition fires when the trot-in beat completes —
    // `vi.runOnlyPendingTimersAsync` drains the currently-queued transition
    // timer (and only that one), so the assertion lands at exactly the wiping
    // beat. State is observed via `data-toy-state` on the root `<main>` (the
    // structural state-query the slice spec authorises).
    render(<MuddyPuddle onComplete={vi.fn()} />);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');

    await vi.runOnlyPendingTimersAsync();

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'wiping');
  });

  it('transitions wiping → dismissing when the Wipe crosses the clean threshold, snapping the mud away', async () => {
    // AC #2 — the only user-driven transition. The kid's Wipe crossing the
    // threshold is the rhythm of the loop: it consumes slice #3's "clean
    // reached" signal (`WipeableCritter`'s `onClean`) to advance the machine.
    // Driven through the slice-#3 `data-mud-blob` nodes (never pixels, ADR-0006)
    // rather than a synthetic event, so the real wipe mechanic is exercised
    // end-to-end. The clean-snap is observable two ways through the public
    // surface: `data-toy-state` flips to `dismissing`, and every remaining blob
    // vanishes at once (the child never has to wipe the final bit).
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} />);

    // Drive to `wiping` — the only state in which a Wipe advances the loop.
    await vi.runOnlyPendingTimersAsync();
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'wiping');

    wipeCurrentPigletClean(container);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
    expect(container.querySelectorAll('[data-mud-blob]')).toHaveLength(0);
  });
});
