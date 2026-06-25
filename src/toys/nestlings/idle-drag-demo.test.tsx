import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Nestlings } from './Nestlings';

/**
 * Nestlings — idle-triggered DRAG demo, ghost-hand carry (nestlings PRD, slice
 * #06).
 *
 * Wordless, LOAD-BEARING teaching: the gesture is a pick-up-AND-carry, so a child
 * who only *taps* a bird never carries it anywhere and makes no progress — the
 * demo must teach the CARRY, not a tap. When the child stalls (~2–3s, on-device-
 * tuned) with no real carry, a translucent ghost hand presses a faint demo bird,
 * carries it along a path to the nest, and releases. A real carry cancels and
 * SUPPRESSES it.
 *
 * Per the slice Notes we test by OBSERVABLE EFFECT, not visuals: the public
 * `data-demo-active` flag on the root `<main>`, that a real carry flips it off and
 * keeps it off, that a mere tap does NOT (the carry-not-tap invariant the demo
 * exists to teach), and that the demo advances no real bird's lifecycle. The
 * ghost-hand carry animation is on-device-tuned and deliberately NOT unit-asserted
 * (mirrors `balloons`' `idle-hold-demo.test.tsx`). Reduced motion is honoured app-
 * wide by the root `MotionConfig reducedMotion="user"`, so it needs no per-
 * component assertion here.
 *
 * Time is the only mocked collaborator (`vi.useFakeTimers`) — it's a process
 * boundary. The idle delay is on-device-tuned, so tests advance a generous margin
 * PAST it rather than coupling to the exact ms. Everything else renders real
 * through the public `<Nestlings />` boundary; CarriableBird / DuskBackdrop /
 * Motion stay REAL.
 */
describe('Nestlings — idle DRAG demo (ghost-hand carry)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Comfortably past the ~2–3s idle delay — robust to on-device tuning. */
  const PAST_IDLE_DELAY_MS = 4000;

  /** Every bird surface in the cast (slice #3's `data-carriable-bird`). */
  const birds = (container: HTMLElement) =>
    [...container.querySelectorAll<HTMLElement>('[data-carriable-bird]')];

  /** The real birds currently snapped into the nest — the derived placed count. */
  const placedBirds = (container: HTMLElement) =>
    birds(container).filter((b) => b.getAttribute('data-bird-state') === 'placed');

  /**
   * Pick a bird up and CARRY it — a press, a move, then a release away from the
   * nest, so it rests `loose` again (no placement, no progress). This is the real
   * pick-up-and-carry the demo teaches, distinct from a bare tap.
   */
  function carryBird(surface: HTMLElement) {
    fireEvent.pointerDown(surface, { clientX: 300, clientY: 300 });
    fireEvent.pointerMove(surface, { clientX: 600, clientY: 600 });
    fireEvent.pointerUp(surface, { clientX: 900, clientY: 900 });
  }

  it('activates the demo after the idle delay when no bird is picked up', async () => {
    // AC #1. From mount the idle timer arms; with no real carry, after the delay
    // the demo becomes active — observed through the public `data-demo-active`
    // flag on `<main>`, never by inspecting the ghost-hand animation. Before the
    // delay elapses the demo is dormant; only the stall flips it on.
    render(<Nestlings onComplete={vi.fn()} />);

    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');

    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);

    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');
  });

  it('cancels and suppresses the demo the instant the child carries a bird for real', async () => {
    // AC #2. The demo is honest teaching, not autopilot: once the child actually
    // carries a bird, it gets out of the way and STAYS away. With the demo active
    // (the child stalled), a real carry — picking a bird up and moving it — flips
    // `data-demo-active` off. And it is SUPPRESSED, not merely paused: a fresh
    // stall afterwards does not re-prompt. Driven through the slice-#3
    // `data-carriable-bird` node (the real Drag mechanic), not a synthetic flag
    // poke.
    const { container } = render(<Nestlings onComplete={vi.fn()} />);

    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');

    // The child finally carries a bird for real — pick up, move, release. Released
    // away from the nest so it rests loose without placing (a carry, not a goal).
    carryBird(birds(container)[0]);

    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');
    // Still mid-play — a loose-resting carry suppresses the demo without advancing
    // the loop.
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'playing');

    // SUPPRESSED: a fresh stall does not bring the demo back — the child has shown
    // they can carry, so it never re-teaches.
    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');
  });

  it('GUARD: a mere tap does NOT suppress the demo — it teaches the carry, not a tap', async () => {
    // The load-bearing distinction (slice intro): the gesture is a pick-up-AND-
    // carry, so a child who only TAPS a bird never carries it anywhere and makes
    // no progress — the demo must still fire to teach them the carry. A tap —
    // press then release with NO move between — must NOT count as a real carry: it
    // leaves the demo un-suppressed, and the later idle stall still activates it. A
    // regression that treated bare pointer-down as a carry would suppress the
    // teaching exactly when the tapper needs it most.
    const { container } = render(<Nestlings onComplete={vi.fn()} />);

    // A quick tap well before the idle delay: down then up on the SAME point, with
    // no carry move in between, so the bird is never carried anywhere.
    const bird = birds(container)[0];
    fireEvent.pointerDown(bird, { clientX: 300, clientY: 300 });
    fireEvent.pointerUp(bird, { clientX: 300, clientY: 300 });

    // The stall still teaches — the tap didn't suppress it.
    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');
  });

  it('gives no real progress — it advances no real bird, the placed count, or onComplete', async () => {
    // AC #3. The demo teaches HONESTLY: it SHOWS the carry on its OWN faint demo
    // bird but does not play the Toy for the child. So however long it runs, every
    // REAL bird stays `loose` (none placed), the cast size is unchanged (the demo
    // bird is not a sixth member of the carriable cast), the loop is still
    // `playing`, and `onComplete` has not fired. The ghost-hand carry animation
    // itself is on-device-tuned (not asserted); what we pin is the honesty
    // invariant — zero net progress — through the public per-bird `data-bird-state`
    // and the `onComplete` boundary. Letting the demo run a long while rules out
    // any drift that would creep the real cast toward the Goal.
    const onComplete = vi.fn();
    const { container } = render(<Nestlings onComplete={onComplete} />);

    const castSize = birds(container).length;
    expect(castSize).toBeGreaterThan(1);

    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');

    // Let the demo run on — its ghost-hand carries a faint demo bird, placing no
    // real one.
    await vi.advanceTimersByTimeAsync(10_000);

    expect(birds(container)).toHaveLength(castSize);
    expect(placedBirds(container)).toHaveLength(0);
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'playing');
    expect(onComplete).not.toHaveBeenCalled();
  });
});
