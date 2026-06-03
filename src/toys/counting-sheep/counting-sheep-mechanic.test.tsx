import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CountingSheep } from './CountingSheep';
import { palette } from '../../shell/tokens';

/**
 * Counting Sheep — sequential mechanic (mobile-rethink PRD, slice #01).
 *
 * The play-loop is rewritten around a five-state machine over a single
 * on-stage Sheep at a time: `arriving → waiting → dismissing → idle →
 * arriving …` for the first four Sheep, with the 5th tap transitioning into
 * `dismissing` and firing `onComplete` (per the ADR-0001 layered-concurrent
 * amendment — the Shell celebration overlay layers above the 5th Sheep's
 * exit). Time-driven transitions use `vi.useFakeTimers()`; time is a
 * process-boundary collaborator per the mocking policy. Motion internals
 * stay unmocked — tests render through the public `<CountingSheep />`
 * boundary and observe state through the rendered DOM (the role-named
 * Sheep button, mirroring `data-sheep-part` / `data-meadow-layer`).
 */
describe('Counting Sheep — sequential mechanic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mounts with a single Sheep on stage in the arriving phase', () => {
    // The state machine bootstraps to `arriving` at mount: one Sheep is on
    // stage immediately (sliding in under Motion's control), queryable as a
    // single button. This pins both the single-Sheep invariant at t=0 and
    // the load-bearing role-name shape the rest of the AC's queries reuse —
    // `getAllByRole('button', { name: /Sheep/ })`, regex per AC #1.
    render(<CountingSheep onComplete={vi.fn()} />);

    const sheep = screen.getAllByRole('button', { name: /Sheep/ });
    expect(sheep).toHaveLength(1);
  });

  it('transitions arriving → waiting once the entrance beat completes', async () => {
    // The first time-driven transition. The slice spec puts arriving as the
    // entry state (Sheep sliding in from the left) and waiting as the
    // centred-Sheep-awaiting-tap state. The transition is driven by the
    // arriving animation completing — `vi.runOnlyPendingTimers` runs the
    // currently-queued transition timer (and nothing more — re-renders that
    // schedule new timers don't get drained in the same call), so the
    // assertion lands at exactly the waiting beat.
    //
    // State is observed via `data-toy-state` on the root `<main>`, the
    // structural state-query the slice spec authorises ("via a data
    // attribute or structural state-query through the public interface").
    // Mirrors the `data-meadow-layer` / `data-sheep-part` convention used
    // elsewhere in the Toy.
    render(<CountingSheep onComplete={vi.fn()} />);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');

    await vi.runOnlyPendingTimersAsync();

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'waiting');
  });

  it('transitions waiting → dismissing when the current Sheep is tapped', async () => {
    // The only user-driven transition in the state machine — the kid's tap
    // drives the rhythm of the loop. `fireEvent.click` (synchronous) is used
    // here rather than `userEvent.click` because `userEvent`'s internal
    // pointer/click sequencing hangs under `vi.useFakeTimers()` even with
    // the `advanceTimers` hook in Vitest 4. The tap-as-click semantic
    // (button receives a click event) is what the state machine reacts to;
    // the higher-fidelity pointer simulation isn't load-bearing for this
    // assertion.
    render(<CountingSheep onComplete={vi.fn()} />);

    // Drive the loop to the `waiting` beat — the only state in which a tap
    // advances the machine.
    await vi.runOnlyPendingTimersAsync();
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'waiting');

    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
  });

  it('transitions dismissing → idle after the dismiss beat, removing the Sheep from the stage', async () => {
    // The dismiss beat is the Sheep's choreographed exit — a rise-fall hop
    // with the done-glow blooming, then a slide off-stage to the right. At
    // its end the Sheep leaves the DOM and the loop is `idle` — the
    // intermission gap before the next Sheep arrives. Both facets of "the
    // dismiss beat finished" are observable through the public surface:
    // the `data-toy-state` and the absence of the role-named button.
    render(<CountingSheep onComplete={vi.fn()} />);

    // Drive to `dismissing`.
    await vi.runOnlyPendingTimersAsync(); // arriving → waiting (entrance)
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');

    // Drain the dismiss timer.
    await vi.runOnlyPendingTimersAsync();

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');
    expect(screen.queryByRole('button', { name: 'Sheep' })).toBeNull();
  });

  it('advances to a fresh arriving Sheep after the intermission beat', async () => {
    // Closing the loop: after the kid's tap dismisses the current Sheep and
    // the intermission gap plays out, the next Sheep slides in on its own.
    // This is the "kid-paced rhythm" the slice spec pins — the kid drives
    // the tap, the loop drives the entrance / exit / intermission beats.
    render(<CountingSheep onComplete={vi.fn()} />);

    // Drive through the first iteration: arriving → waiting → dismissing →
    // idle. Each `runOnlyPendingTimersAsync` drains the currently-queued
    // transition timer (and only that one), so the test walks the machine
    // beat by beat.
    await vi.runOnlyPendingTimersAsync(); // entrance → waiting
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' })); // → dismissing
    await vi.runOnlyPendingTimersAsync(); // dismiss → idle
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');

    // Drain the intermission timer.
    await vi.runOnlyPendingTimersAsync();

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    expect(screen.getByRole('button', { name: 'Sheep' })).toBeInTheDocument();
  });

  /**
   * Walk the state machine through one full sheep-cycle: arriving → waiting →
   * tap → dismissing → idle. The next `await vi.runOnlyPendingTimersAsync()`
   * will then move idle → arriving for the next Sheep. Lifted into a helper
   * because the 5-Sheep tests below repeat the pattern.
   */
  async function dismissOneSheep() {
    await vi.runOnlyPendingTimersAsync(); // arriving → waiting (entrance)
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' })); // → dismissing
    await vi.runOnlyPendingTimersAsync(); // → idle (dismiss beat)
  }

  it('ignores taps during arriving and dismissing — only waiting accepts the tap', async () => {
    // AC #3 — re-tap safety. The Sheep is mid-animation in `arriving` and
    // `dismissing` and the kid mashing the screen shouldn't punch through
    // the choreography. The single logical assertion: taps outside `waiting`
    // are no-ops. The waiting-tap (advances to dismissing) is interleaved
    // as the positive control so the test demonstrates both that the guard
    // is in place AND that the valid tap path still works.
    render(<CountingSheep onComplete={vi.fn()} />);

    // Mid-`arriving`: re-taps must not advance the loop.
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');

    // After the entrance beat, `waiting` accepts the tap.
    await vi.runOnlyPendingTimersAsync();
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'waiting');
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');

    // Mid-`dismissing`: re-taps must not re-fire or advance the loop early.
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
  });

  it('fires onComplete exactly once after the 5th tap, holding through a long settle', async () => {
    // AC #4. The Goal is "five Sheep counted"; the 5th tap is the moment
    // the Goal is met and the Shell's celebration overlay layers on top
    // (ADR-0001 amendment — layered-concurrent). `onComplete` fires at the
    // start of the 5th `waiting → dismissing` transition (not at the end
    // of its exit choreography) so the Shell overlay begins simultaneously
    // with the 5th Sheep's exit beat — same contract as the polish PRD's
    // group-Outro layered with confetti.
    //
    // The long-settle assertion at the end is the AC's "second
    // `expect(spy).toHaveBeenCalledTimes(1)` after a long delay" guard:
    // any spurious second call from a stale timer or onComplete-reference
    // drift surfaces here.
    const onComplete = vi.fn();
    render(<CountingSheep onComplete={onComplete} />);

    // Four full loops — kid taps Sheep 1..4. Goal isn't met yet.
    for (let i = 0; i < 4; i += 1) {
      await dismissOneSheep();
      await vi.runOnlyPendingTimersAsync(); // idle → arriving (next Sheep)
    }
    expect(onComplete).not.toHaveBeenCalled();

    // 5th Sheep arrives, kid taps — Goal met.
    await vi.runOnlyPendingTimersAsync(); // arriving → waiting
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' })); // → dismissing + onComplete

    expect(onComplete).toHaveBeenCalledTimes(1);

    // A generously long settle (covers the 5th-Sheep dismiss beat + several
    // intermissions' worth of stale-timer risk). No spurious second call.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('terminates the loop after onComplete — no further Sheep arrives', async () => {
    // AC #5. The loop's `completed` state is terminal: once `onComplete`
    // fires, no 6th (or 7th, …) Sheep is mounted no matter how far time
    // advances. This guards against a regression where the
    // dismissing → idle → arriving cycle keeps mounting Sheep underneath
    // the Shell's celebration overlay.
    render(<CountingSheep onComplete={vi.fn()} />);

    // Drive 4 full loops, then the 5th tap.
    for (let i = 0; i < 4; i += 1) {
      await dismissOneSheep();
      await vi.runOnlyPendingTimersAsync(); // idle → arriving
    }
    await vi.runOnlyPendingTimersAsync(); // arriving → waiting
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' })); // 5th tap

    // Drain everything time could possibly fire — many cycles worth.
    await vi.advanceTimersByTimeAsync(10_000);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'completed');
    expect(screen.queryByRole('button', { name: 'Sheep' })).toBeNull();
  });

  it('never has more than one Sheep on stage across arriving / waiting / dismissing / idle', async () => {
    // AC #1's headline invariant. Walks the loop through every state once
    // and sweeps the role-query at each beat, asserting `length ≤ 1`. The
    // separate state-specific tests above pin individual transitions; this
    // one is the single-glance guard against any future change that
    // accidentally renders two Sheep at once (e.g. mounting the next
    // Sheep before the previous one's exit completes).
    render(<CountingSheep onComplete={vi.fn()} />);

    const assertAtMostOneSheep = () => {
      // `queryAllByRole` (not `getAll`) so the count is valid at the
      // `idle` beat where zero Sheep is the right answer; `getAll` throws
      // on 0 matches.
      expect(screen.queryAllByRole('button', { name: /Sheep/ }).length).toBeLessThanOrEqual(1);
    };

    // arriving — one Sheep mid-entrance.
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    assertAtMostOneSheep();

    // waiting — same Sheep, centred.
    await vi.runOnlyPendingTimersAsync();
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'waiting');
    assertAtMostOneSheep();

    // dismissing — same Sheep, exiting.
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
    assertAtMostOneSheep();

    // idle — no Sheep on stage, intermission gap.
    await vi.runOnlyPendingTimersAsync();
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');
    assertAtMostOneSheep();
  });

  it('plays a baa and a haptic tick on every tap, even no-op re-taps mid-animation', async () => {
    // Regression coverage for the polish PRD's slice-#03 promise — "every
    // tap gets playful feedback, whether or not it counts a new Sheep
    // (re-taps stay friendly, no penalty)." The mobile-rethink PRD doesn't
    // roll that back; locking it in here so the slice doesn't silently
    // regress it. The waiting-tap is the load-bearing case; the arriving
    // re-tap exercise asserts the friendly-mash guarantee survives the
    // new state-machine guard (the guard prevents the state advance, not
    // the audio feedback).
    const sound = {
      unlock: vi.fn(),
      baa: vi.fn(),
      celebrate: vi.fn(),
      isMuted: vi.fn(() => false),
      setMuted: vi.fn(),
    };
    const haptics = { tick: vi.fn() };
    render(<CountingSheep onComplete={vi.fn()} sound={sound} haptics={haptics} />);

    // Mid-arriving — re-tap should still play the playful feedback.
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));
    expect(sound.baa).toHaveBeenCalledTimes(1);
    expect(haptics.tick).toHaveBeenCalledTimes(1);

    // After the entrance beat, the waiting-tap also plays it.
    await vi.runOnlyPendingTimersAsync();
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));
    expect(sound.baa).toHaveBeenCalledTimes(2);
    expect(haptics.tick).toHaveBeenCalledTimes(2);
  });

  it('blooms the done-glow inside the wool during dismissing — done lives in the state, not on the Sheep', async () => {
    // The slice notes: "in the new mechanic each Sheep is mounted once and
    // dismissed after tap, so 'done' lives in the `dismissing` state, not
    // on the Sheep." Pinning the structural rule: during `arriving` /
    // `waiting` the glow overlay is absent; during `dismissing` it's
    // rendered inside the wool with the warm-gold doneGlow stop colour —
    // the rise-fall hop's "warm light caught in the fleece" beat. Bloom
    // softness and gradient curves are on-device per the polish PRD's
    // testing decisions; the structural layering is what's
    // unit-asserted, mirroring the polish-PRD-slice-#04 test we retired.
    render(<CountingSheep onComplete={vi.fn()} />);

    // Arriving / waiting — no glow.
    expect(document.querySelector('[data-sheep-part="glow"]')).toBeNull();
    await vi.runOnlyPendingTimersAsync();
    expect(document.querySelector('[data-sheep-part="glow"]')).toBeNull();

    // Tap → dismissing — glow blooms inside the wool, painted with the
    // doneGlow palette token.
    fireEvent.click(screen.getByRole('button', { name: 'Sheep' }));

    const sheep = screen.getByRole('button', { name: 'Sheep' });
    expect(sheep.querySelector('[data-sheep-part="glow"]')).not.toBeNull();
    const stopColors = Array.from(sheep.querySelectorAll('stop')).map((s) =>
      s.getAttribute('stop-color'),
    );
    expect(stopColors).toContain(palette.doneGlow);
  });
});
