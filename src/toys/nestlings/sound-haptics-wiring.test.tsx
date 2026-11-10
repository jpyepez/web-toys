import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { Nestlings } from './Nestlings';
import { chirp, coo, flutter, plip } from './sounds';
import { fakeSound } from '../../test/fakes';

/**
 * Nestlings — sound + haptics wiring (slice #07).
 *
 * The Toy makes the Drag feel and sound alive through the injected `sound` /
 * `haptics` utilities (ADR-0003) — it never imports Web Audio directly. We inject
 * FAKE `Sound` / `Haptics` through the public contract and observe the calls the
 * Toy makes (`sound.play(voice)`, `haptics.tick()`); the recipes' audibility is
 * validated at the Web Audio boundary in `sounds.test.ts` and by hand on a
 * device. Per the mocking policy we shim only those boundaries and never mock our
 * own components — the Drag runs through the real `CarriableBird` cast (slice
 * #3/#4), driven via the slice-#3 `data-carriable-bird` nodes with synthetic
 * pointer events (never pixels; jsdom has no layout, so `nestCenter` is `{0,0}` —
 * a release at the origin places, a release far away rests loose).
 */

/** Every carriable bird in the cast (slice #3's `data-carriable-bird` surface). */
const birds = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-carriable-bird]')];

/**
 * The wing-flutters fired so far. `flutter` is an un-jittered const, so we count
 * by reference equality — robust without reasoning about timbre, and distinct
 * from the chirp/coo/plip the same gesture may fire.
 */
const flutterCalls = (sound: ReturnType<typeof fakeSound>) =>
  sound.play.mock.calls.filter(([voice]) => voice === flutter);

describe('Nestlings — sound + haptics wiring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays the pickup chirp when a bird is lifted', () => {
    // AC #1: pressing a loose bird lifts it, and that pickup is voiced as the
    // rising chirp through the injected Sound. The chirp is an un-jittered const,
    // so we assert the exact recipe fired on the grab (pointer-down).
    const sound = fakeSound();
    const { container } = render(<Nestlings onComplete={vi.fn()} sound={sound} />);

    fireEvent.pointerDown(birds(container)[0], { clientX: 50, clientY: 50 });

    expect(sound.play).toHaveBeenCalledWith(chirp);
  });

  it('plays the nestle coo when a bird is dropped into the nest', () => {
    // AC #1: carrying a bird onto the nest and releasing it there tucks it in, and
    // that nestle is voiced as the cozy descending coo. jsdom has no layout, so the
    // measured `nestCenter` is `{0,0}` — a release at the origin lands inside the
    // snap-radius and places. The coo is an un-jittered const, so we assert the
    // exact recipe fired on the nest drop.
    const sound = fakeSound();
    const { container } = render(<Nestlings onComplete={vi.fn()} sound={sound} />);

    const bird = birds(container)[0];
    fireEvent.pointerDown(bird, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(bird, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(bird, { clientX: 0, clientY: 0 });

    expect(sound.play).toHaveBeenCalledWith(coo);
  });

  it('plays the gentle plip when a bird is set down away from the nest — never the coo', () => {
    // AC #1: releasing a bird far from the nest rests it loose (ADR-0001 — no
    // penalty), and that set-down is voiced as the soft, neutral plip. We carry a
    // bird far across the screen and release there (outside any sane snap-radius
    // of the `{0,0}` nest). The plip fires; crucially the nestle coo does NOT — a
    // loose drop must read as a gentle "set down", never the tuck-in cue.
    const sound = fakeSound();
    const { container } = render(<Nestlings onComplete={vi.fn()} sound={sound} />);

    const bird = birds(container)[0];
    fireEvent.pointerDown(bird, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(bird, { clientX: 900, clientY: 900 });
    fireEvent.pointerUp(bird, { clientX: 900, clientY: 900 });

    expect(sound.play).toHaveBeenCalledWith(plip);
    expect(sound.play).not.toHaveBeenCalledWith(coo);
  });

  it('throttles the carry flutter — a fast drag is rate-limited, not one flutter per move', () => {
    // AC #2: every pointer move while carried voices a soft wing-flutter, but the
    // flutters must be rate-limited so a fast drag is a gentle beat, not a machine-
    // gun (mirrors Balloons' throttled pip). We assert the rate limit, NOT the
    // interval (on-device-tuned): a burst of moves at the SAME instant (fake-time
    // frozen between synchronous events) collapses to a single flutter — the gate
    // opens once, then closes for the window. Then we move the clock well past any
    // sane window and a further move fires again, proving the gate releases over
    // time rather than swallowing everything after the first.
    const sound = fakeSound();
    const { container } = render(<Nestlings onComplete={vi.fn()} sound={sound} />);

    const bird = birds(container)[0];
    fireEvent.pointerDown(bird, { clientX: 50, clientY: 50 });

    // A burst of moves within one frozen instant — un-throttled this would be one
    // flutter per move.
    for (let i = 1; i <= 5; i++) {
      fireEvent.pointerMove(bird, { clientX: 50 + i * 10, clientY: 50 });
    }
    expect(flutterCalls(sound)).toHaveLength(1);

    // 1s dwarfs any sane tens-of-ms throttle window, so the gate reopens and a
    // further move flutters again.
    vi.advanceTimersByTime(1000);
    fireEvent.pointerMove(bird, { clientX: 200, clientY: 80 });
    expect(flutterCalls(sound).length).toBeGreaterThan(1);
  });

  it('fires a haptic tick on pickup — the tactile beat as a bird is lifted', () => {
    // AC #3: lifting a bird buzzes under the finger like the tap toys, on the same
    // beat as the chirp. A fake Haptics injected through the contract records the
    // ticks; the grab (pointer-down) fires one.
    const haptics = { tick: vi.fn() };
    const { container } = render(<Nestlings onComplete={vi.fn()} haptics={haptics} />);

    fireEvent.pointerDown(birds(container)[0], { clientX: 50, clientY: 50 });

    expect(haptics.tick).toHaveBeenCalled();
  });

  it('fires a haptic tick on nestle — the tactile beat as a bird tucks into the nest', () => {
    // AC #3: tucking a bird into the nest pulses a haptic on the same beat as the
    // coo — the reward beat under the finger. We carry a bird onto the `{0,0}` nest
    // and release there; the nestle fires a tick. (A loose drop must NOT — that's
    // pinned by the absence of a tick path on `onRest`.)
    const haptics = { tick: vi.fn() };
    const { container } = render(<Nestlings onComplete={vi.fn()} haptics={haptics} />);

    const bird = birds(container)[0];
    fireEvent.pointerDown(bird, { clientX: 50, clientY: 50 });
    haptics.tick.mockClear(); // drop the pickup tick — isolate the nestle beat
    fireEvent.pointerMove(bird, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(bird, { clientX: 0, clientY: 0 });

    expect(haptics.tick).toHaveBeenCalled();
  });

  it('degrades to silence under a bare mount — pickup, carry, loose drop and nestle never throw and the bird still places', () => {
    // AC #6: `sound` / `haptics` are optional on the contract (ADR-0003), so a
    // bare-mounted Toy plays nothing rather than crashing. We pin that the whole
    // feedback path survives with neither utility wired: a pickup + carry + loose
    // drop (chirp/flutter/plip path) and then a pickup + carry-to-nest + release
    // (chirp/flutter/coo + ticks path) run past every (absent) call without
    // throwing, and the bird still reaches its terminal `placed` state — proving
    // execution reached the lifecycle transition after the optional
    // `sound?.`/`haptics?.` calls no-op'd.
    const { container } = render(<Nestlings onComplete={vi.fn()} />);
    const bird = birds(container)[0];

    expect(() => {
      // pickup → carry → loose drop far away (chirp / flutter / plip path)
      fireEvent.pointerDown(bird, { clientX: 50, clientY: 50 });
      fireEvent.pointerMove(bird, { clientX: 900, clientY: 900 });
      fireEvent.pointerUp(bird, { clientX: 900, clientY: 900 });
      // pickup again → carry onto the nest → release (chirp / flutter / coo + ticks)
      fireEvent.pointerDown(bird, { clientX: 900, clientY: 900 });
      fireEvent.pointerMove(bird, { clientX: 0, clientY: 0 });
      fireEvent.pointerUp(bird, { clientX: 0, clientY: 0 });
    }).not.toThrow();

    expect(bird.getAttribute('data-bird-state')).toBe('placed');
  });
});
