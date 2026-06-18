import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { Balloons } from './Balloons';

/**
 * Balloons — free-order bunch loop + onComplete (balloons PRD, slice #04).
 *
 * The first Toy to break the sequential one-at-a-time conveyor: a bunch of
 * balloons present from the start, each owning its OWN independent lifecycle
 * (`limp → filling/leaking → floating`), fillable in ANY order. The Goal is to
 * float every balloon; when the last one detaches the Shell's Completion runs.
 * This Toy owns its loop logic — NOT a shared hook
 * (`../../out-of-scope/shared-toy-loop-abstraction.md`); its shape is
 * deliberately different from the tap toys' conveyor.
 *
 * Posture mirrors `muddy-puddle-loop.test.tsx`: assert the OBSERVABLE contract,
 * never the choreography. Per-balloon state via slice-#3's
 * `data-holdable-balloon` / `data-balloon-state` hooks; the floated count is
 * DERIVED by counting `floating` balloons (never the hardcoded 5 — the count is
 * the on-device-tuned duration lever, slice Notes); the loop's terminal state via
 * `<main data-toy-state>`; and once-only ref-guarded `onComplete`.
 *
 * Time is the one boundary collaborator: `vi.useFakeTimers()` advances the
 * fill/leak ramp the same way slice #3's hold test drives it. HoldableBalloon /
 * SkyBackdrop / Motion stay REAL — the Toy is exercised through its public
 * `<Balloons />` boundary, never with mocked-out components. Exact fill-rate and
 * balloon count are on-device-tuned and deliberately NOT asserted: we advance
 * generously to cross the cap, deriving the goal from the rendered bunch.
 */

/** Every balloon surface in the bunch (slice #3's `data-holdable-balloon`). */
const balloons = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-holdable-balloon]')];

/**
 * Fill one balloon to its self-cap by holding past the tuned fill duration —
 * pressing it, then advancing time generously (far past any tuned ramp, like the
 * loop tests' 10s fast-forward) so the assertion never encodes the rate. The
 * balloon self-caps and detaches to `floating` on its own (slice #3).
 */
async function floatBalloon(surface: HTMLElement) {
  fireEvent.pointerDown(surface);
  await vi.advanceTimersByTimeAsync(10_000);
}

/**
 * Hold a balloon only until it DETACHES — the instant its state crosses to
 * `floating` (the terminal state where it floats up and off the screen).
 * Advancing in small slices (never the tuned fill rate) stops the moment of
 * detach, so a caller can assert what is true at the `limp → floating` edge.
 * Guards against the rate leaking into the assertion.
 */
async function holdUntilDetached(surface: HTMLElement) {
  fireEvent.pointerDown(surface);
  for (let i = 0; i < 400 && surface.getAttribute('data-balloon-state') !== 'floating'; i++) {
    await vi.advanceTimersByTimeAsync(50);
  }
}

describe('Balloons — free-order bunch loop + onComplete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mounts a bunch of limp balloons, in the playing state', () => {
    // The bunch is present from the start — more than one balloon, each attached
    // and `limp` (none pre-floated). The loop is `playing` (not yet terminal).
    // The COUNT is not asserted (the on-device-tuned duration lever, slice
    // Notes) — only that a bunch exists and every member starts limp.
    const { container } = render(<Balloons onComplete={vi.fn()} />);

    const bunch = balloons(container);
    expect(bunch.length).toBeGreaterThan(1);
    for (const b of bunch) {
      expect(b.getAttribute('data-balloon-state')).toBe('limp');
    }
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'playing');
  });

  it("makes every balloon slot pointer-transparent so overlapping balloons never steal each other's taps", () => {
    // On-device the WRONG balloon inflated. Each balloon sits in an absolutely-
    // positioned SLOT whose rectangle is far larger than the round balloon, and
    // the slots OVERLAP in the bunch — so a tap on one balloon's crown landed on a
    // neighbour's overlapping slot rectangle instead. Slice #3 already made the
    // inner hold surface pointer-transparent and the painted shape the hit-target,
    // but the OUTER slot (owned here by the bunch) was still an opaque rectangle.
    // Every slot must be pointer-transparent so the only hit-targets in the whole
    // bunch are the balloon shapes themselves — a press then always routes to the
    // balloon actually under the finger. jsdom has no hit-testing, so we pin the
    // mechanism across every slot, mirroring slice #3's `touch-action`/pointer
    // contracts.
    const { container } = render(<Balloons onComplete={vi.fn()} />);

    const slots = container.querySelectorAll<HTMLElement>('[data-balloon-slot]');
    expect(slots.length).toBeGreaterThan(1);
    for (const slot of slots) {
      expect(slot.style.pointerEvents).toBe('none');
    }
  });

  it('fires onComplete exactly once when the whole bunch has floated, holding through a long settle and a fresh reference', async () => {
    // AC #4 — the Goal is "float every balloon"; floating the LAST one meets it.
    // The bunch SIZE is derived from the rendered balloons, never the hardcoded 5
    // (slice Notes). Floating all-but-one must NOT fire onComplete; the final
    // detach fires it exactly once. Two guards in one test (mirroring the muddy-
    // puddle loop test): the long settle rules out a spurious 2nd call from a
    // stale leak/cap timer, and the re-render with a brand-new onComplete
    // reference (which the Shell does the moment Completion starts) rules out a
    // re-fire — the ref-guard pins it to a single call.
    const onComplete = vi.fn();
    const { container, rerender } = render(<Balloons onComplete={onComplete} />);

    const bunch = balloons(container);

    // Float all but the last — the Goal isn't met yet, so onComplete stays silent.
    for (const b of bunch.slice(0, -1)) {
      await floatBalloon(b);
    }
    expect(onComplete).not.toHaveBeenCalled();

    // The last detach meets the Goal.
    await floatBalloon(bunch[bunch.length - 1]);
    expect(onComplete).toHaveBeenCalledTimes(1);

    // A generously long settle — no spurious 2nd call from any stale timer.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(onComplete).toHaveBeenCalledTimes(1);

    // The Shell hands the Toy a fresh onComplete reference on re-render at
    // Completion — the ref-guard must not re-fire it.
    rerender(<Balloons onComplete={vi.fn()} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('fires onComplete the instant the last balloon detaches — not after its float-away finishes', async () => {
    // AC #3 (guard) — `onComplete` fires on the fifth DETACH (the `limp →
    // floating` edge from slice #4), the instant the last balloon leaves the peg,
    // NOT after its float-away animation completes. We float all but the last
    // fully, then hold the last only until it crosses to `floating`. At that
    // detach edge onComplete must have already fired exactly once (so the Shell's
    // Completion layers over the final balloon's float-off, per ADR-0001). A
    // regression that delayed Completion until the float-away finished — or never
    // fired it — would leave onComplete silent here.
    const onComplete = vi.fn();
    const { container } = render(<Balloons onComplete={onComplete} />);

    const bunch = balloons(container);
    for (const b of bunch.slice(0, -1)) {
      await floatBalloon(b);
    }
    expect(onComplete).not.toHaveBeenCalled();

    const last = bunch[bunch.length - 1];
    await holdUntilDetached(last);

    expect(last.getAttribute('data-balloon-state')).toBe('floating');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('floats only the balloon held to the cap, regardless of order — the rest stay limp', async () => {
    // AC #1 — free order. Each balloon owns its OWN lifecycle, so filling one in
    // the MIDDLE of the bunch (not the first) floats exactly THAT one and leaves
    // every other balloon attached and `limp`. The floated count (derived by
    // counting `floating` balloons) increments by exactly one. This pins
    // order-independence and per-balloon independence — there is no conveyor
    // forcing a particular balloon to be next.
    const onComplete = vi.fn();
    const { container } = render(<Balloons onComplete={onComplete} />);

    const bunch = balloons(container);
    const target = bunch[Math.floor(bunch.length / 2)];

    await floatBalloon(target);

    // The held balloon detaches and floats away — its terminal state is
    // `floating` (it has left the screen); exactly THAT one left the peg, every
    // other balloon is untouched and still `limp`. Asserting "detached set" as the
    // non-limp balloons keeps the order-independence contract robust to the
    // lifecycle's resting state.
    expect(target.getAttribute('data-balloon-state')).toBe('floating');
    const detached = bunch.filter((b) => b.getAttribute('data-balloon-state') !== 'limp');
    expect(detached).toEqual([target]);
    // Goal not met on a single float — no premature Completion.
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('fills two balloons at once when both are held — incidental multi-touch is harmless', async () => {
    // AC #5 — resting fingers on two balloons fills BOTH. Each balloon tracks its
    // own held-state, so concurrent holds are independent and additive, never
    // mutually exclusive. This is forgiving (harmless, never required): pressing
    // two at once just inflates two. Read at the value boundary
    // (`data-balloon-fill`), advancing a sub-cap slice so both are mid-fill.
    const { container } = render(<Balloons onComplete={vi.fn()} />);

    const bunch = balloons(container);
    const [first, second] = bunch;
    const fillOf = (b: HTMLElement) => Number(b.getAttribute('data-balloon-fill'));

    fireEvent.pointerDown(first);
    fireEvent.pointerDown(second);
    await vi.advanceTimersByTimeAsync(300);

    expect(fillOf(first)).toBeGreaterThan(0);
    expect(fillOf(second)).toBeGreaterThan(0);
  });

  it('treats a hold on an already-floated balloon as a no-op', async () => {
    // AC #2 — once a balloon has detached it is terminal: pressing it again does
    // nothing. The detached balloon has floated away (terminal state `floating`);
    // re-pressing it must not over-inflate (fill stays pinned at the cap),
    // re-attach (state stays `floating`), or double-count toward the Goal —
    // re-pressing a gone balloon must not inch the bunch closer to Completion.
    const onComplete = vi.fn();
    const { container } = render(<Balloons onComplete={onComplete} />);

    const bunch = balloons(container);
    const target = bunch[0];

    await floatBalloon(target);
    expect(target.getAttribute('data-balloon-state')).toBe('floating');

    // Press the gone balloon again and hold — nothing changes.
    fireEvent.pointerDown(target);
    await vi.advanceTimersByTimeAsync(10_000);

    expect(target.getAttribute('data-balloon-state')).toBe('floating');
    expect(Number(target.getAttribute('data-balloon-fill'))).toBe(1);
    const detached = bunch.filter((b) => b.getAttribute('data-balloon-state') !== 'limp');
    expect(detached).toEqual([target]);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('still floats the whole bunch away and completes under prefers-reduced-motion', async () => {
    // AC #4 (guard) — reduced motion is honoured the way the app-root
    // MotionConfig honours it for every Toy's Outro: the large positional float-
    // away is dropped, but the ENDING STILL RESOLVES. With Motion forced to
    // reduced (`reducedMotion="always"`, the test stand-in for the app-root
    // `reducedMotion="user"` gate that isn't mounted here), floating the whole
    // bunch must still drive every balloon to the terminal `floating` state and
    // land the loop in `completed` — the detach is set on self-cap, not by
    // Motion's dropped animation, so the ending is never stranded for someone who
    // opts out of motion.
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <Balloons onComplete={vi.fn()} />
      </MotionConfig>,
    );

    const bunch = balloons(container);
    for (const b of bunch) {
      await floatBalloon(b);
    }

    expect(bunch.every((b) => b.getAttribute('data-balloon-state') === 'floating')).toBe(true);
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'completed');
  });

  it('reaches a terminal completed state once the whole bunch has floated — nothing re-arrives', async () => {
    // AC #3 — the Goal-met state is terminal. Once every balloon has detached the
    // loop is `completed`, and no amount of further time re-arrives a balloon:
    // every member floats away to the terminal `floating` state, none reverts to
    // `limp`, and the bunch size is unchanged (no 6th balloon mounts underneath
    // the Shell's celebration overlay). Guards against a regression where some
    // idle/leak beat could un-float a balloon and re-open the Goal.
    const { container } = render(<Balloons onComplete={vi.fn()} />);

    const bunch = balloons(container);
    for (const b of bunch) {
      await floatBalloon(b);
    }

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'completed');

    // Drain everything time could possibly fire — many ramps' worth.
    await vi.advanceTimersByTimeAsync(30_000);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'completed');
    const after = balloons(container);
    expect(after).toHaveLength(bunch.length);
    expect(after.every((b) => b.getAttribute('data-balloon-state') === 'floating')).toBe(true);
  });
});
