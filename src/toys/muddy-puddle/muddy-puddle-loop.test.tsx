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

  it('transitions dismissing → idle after the trot-off beat, removing the piglet from the stage', async () => {
    // The dismiss beat is the piglet's choreographed exit — revealed clean, it
    // trots off happy. At its end the piglet leaves the DOM and the loop is
    // `idle` — the intermission gap before the next piglet trots in (AC #1's
    // "zero Critters during idle"). Both facets of "the trot-off finished" are
    // observable through the public surface: `data-toy-state` and the absence of
    // the accessible Piglet element.
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} />);

    // Drive to `dismissing`.
    await vi.runOnlyPendingTimersAsync(); // arriving → wiping (trot-in)
    wipeCurrentPigletClean(container); // wiping → dismissing (clean-snap)
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');

    // Drain the trot-off timer.
    await vi.runOnlyPendingTimersAsync();

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');
    expect(screen.queryByRole('img', { name: /Piglet/ })).toBeNull();
  });

  it('advances to a fresh muddy piglet after the intermission beat', async () => {
    // Closing the loop: after the kid Wipes the current piglet clean and it
    // trots off, the intermission gap plays out and the next piglet trots in on
    // its own. This is the kid-paced rhythm — the kid drives the Wipe, the loop
    // drives the trot-in / trot-off / intermission beats. The "fresh" piglet
    // must arrive fully muddy again: the next mount has the full blob set, not
    // the cleaned-out remnants of the previous one (the `idle` unmount makes
    // each arrival a genuinely fresh `WipeableCritter`).
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} />);
    const fullMud = container.querySelectorAll('[data-mud-blob]').length;

    // One full iteration: arriving → wiping → dismissing → idle.
    await vi.runOnlyPendingTimersAsync(); // trot-in → wiping
    wipeCurrentPigletClean(container); // clean-snap → dismissing
    await vi.runOnlyPendingTimersAsync(); // trot-off → idle
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');

    // Drain the intermission timer.
    await vi.runOnlyPendingTimersAsync();

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    expect(screen.getByRole('img', { name: /Piglet/ })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-mud-blob]')).toHaveLength(fullMud);
  });

  it('ignores a Wipe during arriving — the trot-in is not interruptible into an early advance', async () => {
    // AC #3 — Wipe safety during the trot-in. The piglet is mid-`arriving`
    // (trotting in muddy) and an eager kid wiping at it must not punch through
    // the choreography: no count advance, no early arrival of the next piglet,
    // no `onComplete`. The only state that accepts the clean-snap is `wiping`.
    // We wipe the piglet right through the threshold while still `arriving`; the
    // machine must stay put on `arriving` (NOT jump to `dismissing`).
    const onComplete = vi.fn();
    const { container } = render(<MuddyPuddle onComplete={onComplete} />);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');

    wipeCurrentPigletClean(container);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('ignores a Wipe during dismissing — the trot-off is not interruptible into an early advance', async () => {
    // AC #3, the trot-off half. Once the clean-snap fires the piglet is revealed
    // and trotting off in `dismissing`; a kid still dragging at it must not
    // advance the loop early or re-fire the Goal. The snapped `WipeableCritter`
    // has no mud left to cross AND the loop's `wiping`-only guard rejects a fresh
    // clean-snap — together a no-op. Firing more pointer events on the on-stage
    // piglet must leave the machine on `dismissing` with no `onComplete`.
    const onComplete = vi.fn();
    const { container } = render(<MuddyPuddle onComplete={onComplete} />);

    // Drive to `dismissing` via a legitimate Wipe.
    await vi.runOnlyPendingTimersAsync(); // trot-in → wiping
    wipeCurrentPigletClean(container); // clean-snap → dismissing
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');

    // Keep dragging at the (now-clean) piglet — the trot-off must not advance.
    const surface = container.querySelector('[data-wipe-surface]')!;
    fireEvent.pointerDown(surface);
    fireEvent.pointerOver(surface);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
    expect(onComplete).not.toHaveBeenCalled();
  });
});
