import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Balloons } from './Balloons';

/**
 * Balloons — idle-triggered HOLD demo, ghost-finger dwell (balloons PRD, slice
 * #06).
 *
 * Wordless, LOAD-BEARING teaching: with the slow-leak rule (slice #3) a child who
 * only *taps* gets a sip of fill that leaks straight back and never floats a
 * balloon — so the demo must teach DURATION (a sustained Hold), not a tap. When
 * the child stalls (~2–3s, on-device-tuned) with no real Hold, a translucent
 * ghost finger presses a balloon and DWELLS while it visibly fills partway, then
 * lifts. A real Hold cancels and SUPPRESSES it.
 *
 * Per the slice Notes we test by OBSERVABLE EFFECT, not visuals: the public
 * `data-demo-active` flag on the root `<main>`, that a real Hold flips it off,
 * that a mere tap does NOT (the duration-not-tap invariant the demo exists to
 * teach), and that the demo's fill REFORMS without advancing the floated count or
 * detaching a balloon. The ghost-finger dwell + fill animation is on-device-tuned
 * and deliberately NOT unit-asserted (mirrors `muddy-puddle`'s
 * `idle-ghost-finger-demo.test.tsx`). Reduced motion is honoured app-wide by the
 * root `MotionConfig reducedMotion="user"`, so it needs no per-component
 * assertion here.
 *
 * Time is the only mocked collaborator (`vi.useFakeTimers`, the loop tests'
 * convention) — it's a process boundary. The idle delay and the hold/leak ramp
 * are on-device-tuned, so tests advance a generous margin PAST them rather than
 * coupling to the exact ms. Everything else renders real through the public
 * `<Balloons />` boundary; HoldableBalloon / SkyBackdrop / Motion stay REAL.
 */
describe('Balloons — idle HOLD demo (ghost-finger dwell)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Comfortably past the ~2–3s idle delay — robust to on-device tuning. */
  const PAST_IDLE_DELAY_MS = 4000;

  const balloons = (container: HTMLElement) =>
    [...container.querySelectorAll<HTMLElement>('[data-holdable-balloon]')];

  it('activates the demo after the idle delay when the bunch goes un-held', async () => {
    // AC #1. From mount the idle timer arms; with no real Hold, after the delay
    // the demo becomes active — observed through the public `data-demo-active`
    // flag on `<main>`, never by inspecting the ghost-finger animation. Before
    // the delay elapses the demo is dormant; only the stall flips it on.
    render(<Balloons onComplete={vi.fn()} />);

    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');

    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);

    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');
  });

  it('cancels and suppresses the demo the instant the child makes a real, sustained Hold', async () => {
    // AC #2. The demo is honest teaching, not autopilot: once the child actually
    // Holds, it gets out of the way and STAYS away. With the demo active (the
    // child stalled), a real Hold — pressing a balloon and DWELLING long enough
    // for its fill to climb (a sustained press, well short of the self-cap so it
    // doesn't float) — flips `data-demo-active` off. And it is SUPPRESSED, not
    // merely paused: a fresh stall afterwards does not re-prompt. Driven through
    // the slice-#3 `data-holdable-balloon` node (the real Hold mechanic), not a
    // synthetic flag poke.
    const { container } = render(<Balloons onComplete={vi.fn()} />);

    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');

    // The child finally Holds for real — press and dwell so the fill climbs past
    // a flick. A sub-cap dwell (far short of the ~2.5s self-cap) cancels the demo
    // without floating the balloon.
    const balloon = balloons(container)[0];
    fireEvent.pointerDown(balloon);
    await vi.advanceTimersByTimeAsync(800);
    fireEvent.pointerUp(balloon);

    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');
    // Still mid-play, and the balloon hasn't floated — a sub-cap Hold suppresses
    // the demo without advancing the loop.
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'playing');
    expect(balloon.getAttribute('data-balloon-state')).toBe('limp');

    // SUPPRESSED: a fresh stall does not bring the demo back — the child has
    // shown they can Hold, so it never re-teaches.
    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'false');
  });

  it('GUARD: a mere tap does NOT suppress the demo — it teaches duration, not a tap', async () => {
    // The load-bearing distinction (slice intro): with the slow-leak rule a child
    // who only TAPS never floats a balloon, so the demo must still fire to teach
    // them the sustained press. A tap — press then release with no dwell — barely
    // moves the fill and so must NOT count as a real Hold: it leaves the demo
    // un-suppressed, and the later idle stall still activates it. A regression
    // that treated bare pointer-down as a Hold would suppress the teaching exactly
    // when the tapper needs it most.
    const { container } = render(<Balloons onComplete={vi.fn()} />);

    // A quick tap well before the idle delay: no time dwells under the press, so
    // the fill never climbs to the Hold threshold.
    const balloon = balloons(container)[0];
    fireEvent.pointerDown(balloon);
    fireEvent.pointerUp(balloon);

    // The stall still teaches — the tap didn't suppress it.
    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');
  });

  it('reforms its fill — the demo never advances the floated count or detaches a balloon', async () => {
    // AC #3. The demo teaches HONESTLY: it SHOWS the Hold but does not play the
    // Toy for the child. Its ghost-finger fill swells partway and REFORMS — so
    // however long it runs, every REAL balloon stays attached and `limp` (none
    // floated or gathered), the loop is still `playing`, and `onComplete` has not
    // fired. The dwell/fill/reform animation itself is on-device-tuned (not
    // asserted); what we pin is the honesty invariant — zero net progress —
    // through the public per-balloon `data-balloon-state` and the `onComplete`
    // boundary. Letting the demo run a long while rules out any drift that would
    // creep the real bunch toward the Goal.
    const onComplete = vi.fn();
    const { container } = render(<Balloons onComplete={onComplete} />);

    const bunch = balloons(container);
    expect(bunch.length).toBeGreaterThan(1);

    await vi.advanceTimersByTimeAsync(PAST_IDLE_DELAY_MS);
    expect(screen.getByRole('main')).toHaveAttribute('data-demo-active', 'true');

    // Let the demo run on — its fill reforms, lifting no real balloon.
    await vi.advanceTimersByTimeAsync(10_000);

    expect(bunch.every((b) => b.getAttribute('data-balloon-state') === 'limp')).toBe(true);
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'playing');
    expect(onComplete).not.toHaveBeenCalled();
  });
});
