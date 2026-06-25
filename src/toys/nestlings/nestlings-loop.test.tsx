import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Nestlings } from './Nestlings';

/**
 * Nestlings — the free-order cast loop + onComplete (nestlings PRD, slice #04).
 *
 * Scales slice #3's single `CarriableBird` (the Drag: `loose ↔ carried → placed`)
 * to the full CONCURRENT, FREE-ORDER cast and wires the Goal. Like Balloons (and
 * unlike the tap toys' arriving→waiting→dismissing conveyor), every bird is
 * present from the start, each owning its OWN lifecycle, tuckable in ANY order.
 * The Goal is to tuck every bird into the nest; when the last one is placed the
 * Shell's Completion runs. This Toy owns its loop logic — NOT a shared hook
 * (`../../out-of-scope/shared-toy-loop-abstraction.md`).
 *
 * Posture mirrors `balloons-loop.test.tsx`: assert the OBSERVABLE contract, never
 * the choreography. Per-bird state via slice-#3's `data-carriable-bird` /
 * `data-bird-state` hooks; the placed count is DERIVED by counting `placed` birds
 * (never the hardcoded 5 — the count is the on-device-tuned duration lever, slice
 * Notes); the loop's terminal state via `<main data-toy-state>`; and once-only
 * ref-guarded `onComplete`.
 *
 * The Drag is event-driven, not duration-driven (no fill/leak ramp), so there is
 * NO time boundary to fake — synthetic `fireEvent` pointer events drive it whole.
 * In jsdom every `getBoundingClientRect` is all-zero, so the measured nest centre
 * is `{0,0}`: a release at `{0,0}` lands inside any sane snap-radius (PLACE), a
 * release far across the screen rests the bird loose. CarriableBird / DuskBackdrop
 * / Motion stay REAL — the Toy is exercised through its public `<Nestlings />`
 * boundary, never with mocked-out components. The cast size, scatter, nestle
 * positions and snap-radius are on-device-tuned and deliberately NOT asserted.
 */

/** Every bird surface in the cast (slice #3's `data-carriable-bird`). */
const birds = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-carriable-bird]')];

/** The birds currently snapped into the nest — the derived placed count. */
const placedBirds = (container: HTMLElement) =>
  birds(container).filter((b) => b.getAttribute('data-bird-state') === 'placed');

/**
 * Carry one bird and drop it ON the nest — a full Drag that PLACES it. The
 * measured nest centre is `{0,0}` in jsdom (all-zero rects), so a release at
 * `{0,0}` lands inside any sane snap-radius. Generous coordinates, never pinning
 * the on-device-tuned radius.
 */
function placeBird(surface: HTMLElement) {
  fireEvent.pointerDown(surface, { clientX: 300, clientY: 300 });
  fireEvent.pointerMove(surface, { clientX: 0, clientY: 0 });
  fireEvent.pointerUp(surface, { clientX: 0, clientY: 0 });
}

/**
 * Carry one bird and drop it FAR from the nest — a release well outside any sane
 * snap-radius, so it rests `loose` where it was left (ADR-0001 forgiveness), never
 * placed. The nest centre is `{0,0}` in jsdom, so a release at the far corner is
 * unambiguously out of range without pinning the on-device-tuned radius.
 */
function dropBirdAway(surface: HTMLElement) {
  fireEvent.pointerDown(surface, { clientX: 300, clientY: 300 });
  fireEvent.pointerMove(surface, { clientX: 900, clientY: 900 });
  fireEvent.pointerUp(surface, { clientX: 900, clientY: 900 });
}

describe('Nestlings — free-order cast loop + onComplete', () => {
  it('mounts the full cast of loose birds, in the playing state', () => {
    // The cast is present from the start — more than one bird, each `loose`
    // (none pre-placed). The loop is `playing` (not yet terminal). The COUNT is
    // not asserted (the on-device-tuned duration lever, slice Notes) — only that
    // a cast exists and every member starts loose.
    const { container } = render(<Nestlings onComplete={vi.fn()} />);

    const cast = birds(container);
    expect(cast.length).toBeGreaterThan(1);
    for (const b of cast) {
      expect(b.getAttribute('data-bird-state')).toBe('loose');
    }
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'playing');
  });

  it('places only the bird carried to the nest, regardless of order — the rest stay loose', () => {
    // AC #1 / #5 — free order. Each bird owns its OWN lifecycle, so tucking one in
    // the MIDDLE of the cast (not the first) places exactly THAT one and leaves
    // every other bird `loose`. The placed count (derived by counting `placed`
    // birds) increments by exactly one. This pins order-independence and per-bird
    // independence — there is no conveyor forcing a particular bird to be next.
    const onComplete = vi.fn();
    const { container } = render(<Nestlings onComplete={onComplete} />);

    const cast = birds(container);
    const target = cast[Math.floor(cast.length / 2)];

    placeBird(target);

    // Exactly the carried bird is placed; every other bird is untouched and still
    // `loose`. The derived placed count is precisely that one bird.
    expect(target.getAttribute('data-bird-state')).toBe('placed');
    expect(placedBirds(container)).toEqual([target]);
    // Goal not met on a single placement — no premature Completion.
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('does not advance the Goal when a bird is dropped outside the nest — it rests loose, still pickup-able', () => {
    // AC #2 (second half) — forgiveness/no-fail (ADR-0001). A release OUTSIDE the
    // snap-radius does not place: the bird stays `loose` (not counted toward the
    // Goal) and remains pickup-able to try again, so a fumbled carry never reads as
    // progress nor as a penalty. We drop a bird far from the nest and assert the
    // placed pile is still empty and the loop is still `playing`; then a fresh
    // pickup re-attaches it (`carried`) — it was never locked.
    const onComplete = vi.fn();
    const { container } = render(<Nestlings onComplete={onComplete} />);

    const cast = birds(container);
    const target = cast[0];

    dropBirdAway(target);

    expect(target.getAttribute('data-bird-state')).toBe('loose');
    expect(placedBirds(container)).toHaveLength(0);
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'playing');
    expect(onComplete).not.toHaveBeenCalled();

    // Still pickup-able — a second Drag begins where it was left.
    fireEvent.pointerDown(target, { clientX: 900, clientY: 900 });
    expect(target.getAttribute('data-bird-state')).toBe('carried');
  });

  it('fires onComplete exactly once when the whole cast is placed, surviving a fresh reference', () => {
    // AC #3 — the Goal is "tuck every bird into the nest"; placing the LAST one
    // meets it. The cast SIZE is derived from the rendered birds, never the
    // hardcoded 5 (slice Notes). Placing all-but-one must NOT fire onComplete; the
    // final placement fires it exactly once. Then the re-render with a brand-new
    // onComplete reference (which the Shell does the moment Completion starts)
    // must NOT re-fire — the ref-guard pins it to a single call.
    const onComplete = vi.fn();
    const { container, rerender } = render(<Nestlings onComplete={onComplete} />);

    const cast = birds(container);

    // Place all but the last — the Goal isn't met yet, so onComplete stays silent.
    for (const b of cast.slice(0, -1)) {
      placeBird(b);
    }
    expect(onComplete).not.toHaveBeenCalled();

    // The last placement meets the Goal — onComplete fires exactly once.
    placeBird(cast[cast.length - 1]);
    expect(onComplete).toHaveBeenCalledTimes(1);

    // The Shell hands the Toy a fresh onComplete reference on re-render at
    // Completion (a new function identity → the goal-effect's dep changes). The
    // ref-guard must short-circuit so the FRESH reference is never called — that
    // fresh fn staying silent is what proves the guard, not the original's count
    // (the original wouldn't be re-called by a re-render that swapped it out).
    const fresh = vi.fn();
    rerender(<Nestlings onComplete={fresh} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(fresh).not.toHaveBeenCalled();
  });

  it('is terminal once the whole cast is placed — nothing re-arrives, placed birds are no-ops', () => {
    // AC #4 — the Goal-met state is terminal. Once every bird is tucked in the
    // loop is `completed`; the cast size is unchanged (no extra bird mounts under
    // the Shell's celebration overlay) and every member is `placed`, none reverts
    // to `loose`. And a full down→move→up on an already-placed bird is a no-op: it
    // stays `placed`, the placed pile doesn't grow, and onComplete is not re-fired
    // — the sleepy pile can't be undone or double-counted (slice #3's placed-lock).
    const onComplete = vi.fn();
    const { container } = render(<Nestlings onComplete={onComplete} />);

    const cast = birds(container);
    for (const b of cast) {
      placeBird(b);
    }

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'completed');
    expect(birds(container)).toHaveLength(cast.length);
    expect(placedBirds(container)).toHaveLength(cast.length);
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Press, drag, and release on a bird that's already asleep in the nest —
    // nothing changes. A second drop far across the screen must not lift it back
    // out (placed is locked), and must not re-count toward the Goal.
    const settled = cast[0];
    fireEvent.pointerDown(settled, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(settled, { clientX: 900, clientY: 900 });
    fireEvent.pointerUp(settled, { clientX: 900, clientY: 900 });

    expect(settled.getAttribute('data-bird-state')).toBe('placed');
    expect(placedBirds(container)).toHaveLength(cast.length);
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'completed');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('reaches the same terminal Goal when the cast is placed out of order', () => {
    // AC #5 — free order all the way to the end. The cast has no conveyor forcing
    // a sequence, so tucking the birds in REVERSE order (last-to-first) must reach
    // the identical terminal Goal as any other order: every bird `placed`, the loop
    // `completed`, onComplete fired exactly once. Reversing isolates order as the
    // only difference from the in-order terminal test, proving convergence is
    // order-independent.
    const onComplete = vi.fn();
    const { container } = render(<Nestlings onComplete={onComplete} />);

    const cast = birds(container);
    for (const b of [...cast].reverse()) {
      placeBird(b);
    }

    expect(placedBirds(container)).toHaveLength(cast.length);
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'completed');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
