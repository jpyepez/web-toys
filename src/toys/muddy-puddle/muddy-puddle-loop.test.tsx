import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MuddyPuddle } from './MuddyPuddle';

/**
 * Drive the on-stage piglet's Wipe to the clean-snap: cross every blob the
 * surface still shows, in turn, until the mud is gone. A finger "crossing" a
 * blob is simulated by firing `pointerOver` on that blob node (the assertable
 * boundary, ADR-0006) — no layout/geometry from jsdom needed. Mirrors the
 * slice-#3 wipe test's `wipeUntilClean`.
 */
function wipeCurrentCritterClean(container: HTMLElement) {
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

  it('mounts with a single Critter on stage in the arriving phase', () => {
    // The state machine bootstraps to `arriving` at mount: one muddy Critter is
    // on stage immediately (trotting in under Motion's control), queryable as a
    // single accessible element. Since slice #05 the on-stage animal is a
    // shuffled cast member (no longer always the piglet), so we query it
    // animal-agnostically by its `img` role — the single-Critter invariant at
    // t=0 holds whichever animal arrives first.
    render(<MuddyPuddle onComplete={vi.fn()} />);

    const critters = screen.getAllByRole('img');
    expect(critters).toHaveLength(1);
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

    await act(async () => { await vi.runOnlyPendingTimersAsync(); });

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
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'wiping');

    wipeCurrentCritterClean(container);

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
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // arriving → wiping (trot-in)
    wipeCurrentCritterClean(container); // wiping → dismissing (clean-snap)
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');

    // Drain the trot-off timer.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('advances to a fresh muddy Critter after the intermission beat', async () => {
    // Closing the loop: after the kid Wipes the current Critter clean and it
    // trots off, the intermission gap plays out and the NEXT cast member trots
    // in on its own. This is the kid-paced rhythm — the kid drives the Wipe, the
    // loop drives the trot-in / trot-off / intermission beats. The "fresh"
    // Critter must arrive fully muddy again, not carrying the cleaned-out
    // remnants of the previous one (the `idle` unmount makes each arrival a
    // genuinely fresh `WipeableCritter`). Since slice #05 the next animal differs
    // from the first AND can carry a different blob count, so "fully muddy" can't
    // be a cross-animal count equality — instead we assert the arrival shows its
    // COMPLETE blanket: the rendered blob indices are the contiguous full set
    // `0..n-1` with no pre-wiped gaps. That holds for whichever animal arrives.
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} />);

    // One full iteration: arriving → wiping → dismissing → idle.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // trot-in → wiping
    wipeCurrentCritterClean(container); // clean-snap → dismissing
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // trot-off → idle
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');

    // Drain the intermission timer.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    expect(screen.getByRole('img')).toBeInTheDocument();
    const indices = [...container.querySelectorAll('[data-mud-blob]')]
      .map((b) => Number(b.getAttribute('data-blob-index')))
      .sort((a, b) => a - b);
    expect(indices.length).toBeGreaterThan(1);
    expect(indices).toEqual(indices.map((_, i) => i));
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

    wipeCurrentCritterClean(container);

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
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // trot-in → wiping
    wipeCurrentCritterClean(container); // clean-snap → dismissing
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');

    // Keep dragging at the (now-clean) piglet — the trot-off must not advance.
    const surface = container.querySelector('[data-wipe-surface]')!;
    fireEvent.pointerDown(surface);
    fireEvent.pointerOver(surface);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
    expect(onComplete).not.toHaveBeenCalled();
  });

  /**
   * Walk the machine through one full piglet-cycle: arriving → wiping → Wipe →
   * dismissing → (idle | completed). A following `runOnlyPendingTimersAsync`
   * then moves idle → arriving for the next piglet. Lifted into a helper
   * because the 5-piglet tests below repeat the pattern.
   */
  async function cleanOneCritter(container: HTMLElement) {
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // arriving → wiping (trot-in)
    wipeCurrentCritterClean(container); // → dismissing (clean-snap)
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // → idle | completed (trot-off beat)
  }

  it('terminates the loop after the fifth clean — state is completed and no further Critter mounts', async () => {
    // AC #5. The Goal is "clean the whole cast" (five Critters); the 5th
    // clean-snap meets it. The loop's `completed` state is terminal: once the
    // Goal is met, no 6th (or 7th, …) Critter mounts no matter how far time
    // advances. This guards against a regression where the dismissing → idle →
    // arriving cycle keeps trotting animals in underneath the Shell's
    // celebration overlay.
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} />);

    // Clean 4 piglets, returning to a fresh arriving piglet each time.
    for (let i = 0; i < 4; i += 1) {
      await cleanOneCritter(container);
      await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // idle → arriving (next piglet)
    }
    // The 5th piglet — clean it; this meets the Goal.
    await cleanOneCritter(container);

    // Drain everything time could possibly fire — many cycles' worth.
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'completed');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('fires onComplete exactly once at the fifth clean-snap, holding through a long settle and a fresh reference', async () => {
    // AC #5. The Goal is "clean five piglets"; the 5th clean-snap is the moment
    // the Goal is met and the Shell's celebration overlay layers on top
    // (ADR-0001 amendment — layered-concurrent). `onComplete` fires at the
    // clean-snap (the `wiping → dismissing` transition), NOT at the end of the
    // trot-off, so the Shell overlay begins simultaneously with the last
    // piglet's splash Outro.
    //
    // Two guards in one test: the long-settle rules out a spurious 2nd call from
    // a stale timer; the re-render with a brand-new `onComplete` reference (which
    // the Shell does the moment Completion starts) rules out a re-fire — the ref
    // pins it to a single call.
    const onComplete = vi.fn();
    const { container, rerender } = render(<MuddyPuddle onComplete={onComplete} />);

    // Clean 4 piglets — Goal isn't met yet.
    for (let i = 0; i < 4; i += 1) {
      await cleanOneCritter(container);
      await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // idle → arriving (next piglet)
    }
    expect(onComplete).not.toHaveBeenCalled();

    // 5th piglet trots in, kid Wipes it clean — Goal met at the clean-snap.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // arriving → wiping
    wipeCurrentCritterClean(container); // → dismissing + onComplete

    expect(onComplete).toHaveBeenCalledTimes(1);

    // A generously long settle (covers the 5th piglet's trot-off plus several
    // intermissions' worth of stale-timer risk). No spurious 2nd call.
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(onComplete).toHaveBeenCalledTimes(1);

    // The Shell hands the Toy a fresh `onComplete` reference on re-render at
    // Completion — the ref-guard must not re-fire it.
    rerender(<MuddyPuddle onComplete={vi.fn()} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('never has more than one Critter on stage across arriving / wiping / dismissing / idle', async () => {
    // AC #1's headline invariant. Walks the loop through every state once and
    // sweeps the role-query at each beat, asserting `length ≤ 1` (and = 0 at
    // `idle`). The state-specific tests above pin individual transitions; this
    // one is the single-glance guard against any future change that mounts two
    // Critters at once (e.g. trotting the next animal in before the previous
    // one's trot-off completes).
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} />);

    const assertAtMostOneCritter = () => {
      // `queryAllByRole` (not `getAll`) so the count is valid at `idle` where
      // zero Critters is the right answer; `getAll` throws on 0 matches. Queried
      // animal-agnostically by `img` role (the cast is shuffled, slice #05).
      expect(screen.queryAllByRole('img').length).toBeLessThanOrEqual(1);
    };

    // arriving — one Critter mid-trot-in.
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    assertAtMostOneCritter();

    // wiping — same Critter, centred awaiting the Wipe.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'wiping');
    assertAtMostOneCritter();

    // dismissing — same Critter, revealed clean and trotting off.
    wipeCurrentCritterClean(container);
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
    assertAtMostOneCritter();

    // idle — no Critter on stage, intermission gap.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
