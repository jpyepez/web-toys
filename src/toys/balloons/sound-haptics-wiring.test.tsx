import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { Balloons } from './Balloons';
import { pop, raspberry } from './sounds';

/**
 * Balloons — sound + haptics wiring (slice #07).
 *
 * The Toy makes the Hold feel and sound alive through the injected `sound` /
 * `haptics` utilities (ADR-0003) — it never imports Web Audio directly. We inject
 * FAKE `Sound` / `Haptics` through the public contract and observe the calls the
 * Toy makes (`sound.play(voice)`, `haptics.tick()`); the recipes' audibility is
 * validated at the Web Audio boundary in `sounds.test.ts` and by hand on a
 * device. Per the mocking policy we shim only those boundaries and never mock our
 * own components — the Hold runs through the real `HoldableBalloon` / bunch loop,
 * driven via the slice-#3 `data-holdable-balloon` nodes (never pixels). Time is
 * the other boundary: `vi.useFakeTimers()` drives the fill ramp AND the pip
 * throttle's clock (`Date.now`).
 */

/** A fake `Sound` recording every `play(voice)` the Toy makes. */
function fakeSound() {
  return {
    unlock: vi.fn(),
    play: vi.fn(),
    celebrate: vi.fn(),
    isMuted: vi.fn(() => false),
    setMuted: vi.fn(),
  };
}

/**
 * The fill pip is the Toy's ONLY `triangle` voice (sounds.ts) — so we count pips
 * by that timbre, robust against the per-pip pitch climb + jitter that vary its
 * frequency. The pop is a `square`, the raspberry a `sawtooth`.
 */
const pipCalls = (sound: ReturnType<typeof fakeSound>) =>
  sound.play.mock.calls.filter(([voice]) => voice.type === 'triangle');

/** Every balloon surface in the bunch (slice #3's `data-holdable-balloon`). */
const balloons = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-holdable-balloon]')];

/**
 * Hold a balloon to its self-cap by pressing it, then advancing time generously
 * (far past any tuned ramp, like the loop tests' fast-forward) so the assertion
 * never encodes the fill rate. The balloon self-caps and detaches on its own.
 */
async function floatBalloon(surface: HTMLElement) {
  fireEvent.pointerDown(surface);
  await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
}

describe('Balloons — sound + haptics wiring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays a fill pip while a balloon is held', async () => {
    // AC #1: pressing and holding a balloon inflates it, and that fill is voiced
    // as pips through the injected Sound. A short dwell while held fires at least
    // one pip (the Toy's sole triangle voice) — the rising-tone feedback.
    const sound = fakeSound();
    const { container } = render(<Balloons onComplete={vi.fn()} sound={sound} />);

    fireEvent.pointerDown(balloons(container)[0]);
    await act(async () => { await vi.advanceTimersByTimeAsync(120); });

    expect(pipCalls(sound).length).toBeGreaterThan(0);
  });

  it('throttles the fill pips — a held balloon laddering up is rate-limited, not one pip per frame', async () => {
    // AC #2: the fill ramp ticks every animation frame, but the pips must be
    // rate-limited so the rising tone reads as playful, not a machine-gun. We
    // assert the rate limit, NOT the interval (on-device-tuned): a short dwell
    // spanning SEVERAL fill frames at the very start collapses to a single pip
    // (the gate opens once, then closes for the window). Then we let the clock
    // move well past any sane throttle window and further pips fire, proving the
    // gate releases over time rather than swallowing everything after the first.
    const sound = fakeSound();
    const { container } = render(<Balloons onComplete={vi.fn()} sound={sound} />);

    fireEvent.pointerDown(balloons(container)[0]);

    // A 50ms dwell is several 16ms-ish fill frames but well inside one throttle
    // window — un-throttled this would be one pip per frame.
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    expect(pipCalls(sound)).toHaveLength(1);

    // 1s dwarfs the ~tens-of-ms gate (and keeps the balloon mid-fill, short of
    // the ~2.5s cap), so the gate reopens and pips resume.
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(pipCalls(sound).length).toBeGreaterThan(1);
  });

  it('fires a haptic tick while filling — the tactile beat under the holding finger', async () => {
    // AC #3: the Hold buzzes under the finger like the tap toys, riding the same
    // throttled beat as the pips. A fake Haptics injected through the contract
    // records the ticks; a short dwell while held fires at least one.
    const haptics = { tick: vi.fn() };
    const { container } = render(<Balloons onComplete={vi.fn()} haptics={haptics} />);

    fireEvent.pointerDown(balloons(container)[0]);
    await act(async () => { await vi.advanceTimersByTimeAsync(120); });

    expect(haptics.tick).toHaveBeenCalled();
  });

  it('plays the pop and pulses a haptic when a balloon self-caps and detaches', async () => {
    // AC #1 / #3: holding a balloon to full detaches it, and that float is the
    // reward beat — a pop/"boing" through the injected Sound plus a haptic pulse.
    // The pop is an un-jittered const, so we assert the exact recipe fired (the
    // distinct detach event), and that a tick landed on the same beat.
    const sound = fakeSound();
    const haptics = { tick: vi.fn() };
    const { container } = render(
      <Balloons onComplete={vi.fn()} sound={sound} haptics={haptics} />,
    );

    await floatBalloon(balloons(container)[0]);

    expect(sound.play).toHaveBeenCalledWith(pop);
    expect(haptics.tick).toHaveBeenCalled();
  });

  it('plays the raspberry on an early lift — letting go before the cap deflates with a pbbbt', async () => {
    // AC #1: lifting the finger before a balloon caps leaks it back down, and
    // that early lift is voiced as the descending raspberry (the funny deflate).
    // We press, inflate part-way (well short of the ~2.5s cap so it never floats),
    // then release — the raspberry, an un-jittered const, must fire.
    const sound = fakeSound();
    const { container } = render(<Balloons onComplete={vi.fn()} sound={sound} />);

    const target = balloons(container)[0];
    fireEvent.pointerDown(target);
    await act(async () => { await vi.advanceTimersByTimeAsync(200); }); // part-filled, far below the cap
    fireEvent.pointerUp(target);

    expect(sound.play).toHaveBeenCalledWith(raspberry);
  });

  it('degrades to silence under a bare mount — filling, lifting and floating never throw and the balloon still detaches', async () => {
    // AC #6: `sound` / `haptics` are optional on the contract (ADR-0003), so a
    // bare-mounted Toy plays nothing rather than crashing. We pin that the whole
    // feedback path survives with neither utility wired: an early lift (the
    // raspberry path) and then a full hold-to-cap (the pip + pop path) run past
    // every (absent) call without throwing, and the balloon still reaches its
    // terminal floated state — proving execution reached the lifecycle transition
    // after the optional `sound?.`/`haptics?.` calls no-op'd.
    const { container } = render(<Balloons onComplete={vi.fn()} />);
    const target = balloons(container)[0];

    expect(() => {
      fireEvent.pointerDown(target);
      vi.advanceTimersByTime(200); // part-fill, then an early lift (raspberry path)
      fireEvent.pointerUp(target);
    }).not.toThrow();

    await floatBalloon(target); // hold to the cap (pip + pop path)
    expect(target.getAttribute('data-balloon-state')).not.toBe('limp');
  });
});
