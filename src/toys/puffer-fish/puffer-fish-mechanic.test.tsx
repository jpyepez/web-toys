import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PufferFish } from './PufferFish';
import { puff } from './sounds';

/**
 * Puffer Fish — sequential loop mechanic (puffer-fish PRD, slice #07).
 *
 * The playable Toy owns its OWN copy of the five-state machine (duplicated
 * from Counting Sheep, not shared — the deliberate cost of Toy independence
 * per the out-of-scope shared-loop rejection): `arriving → waiting →
 * dismissing → idle → arriving …` for the first four fish, with the 5th tap
 * transitioning into `dismissing` and firing `onComplete` (the ADR-0001
 * layered-concurrent amendment — the Shell celebration overlay layers above
 * the 5th fish's float-away).
 *
 * Time-driven transitions use `vi.useFakeTimers()`; time is a process-boundary
 * collaborator per the mocking policy. Motion internals stay unmocked — tests
 * render through the public `<PufferFish />` boundary and observe state through
 * the rendered DOM (the role-named Fish button + `data-toy-state`, mirroring
 * the Sheep contract). The puff scale, float-up path, swim-in offsets and
 * timing tuples are on-device-tuned and deliberately NOT unit-asserted.
 */
describe('Puffer Fish — sequential loop mechanic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mounts with a single Fish on stage in the arriving phase', () => {
    // The state machine bootstraps to `arriving` at mount: one fish is on
    // stage immediately (swimming in under Motion's control), queryable as a
    // single button. This pins both the single-fish invariant at t=0 and the
    // load-bearing role-name shape the rest of the AC's queries reuse —
    // `getAllByRole('button', { name: /Fish/ })`.
    render(<PufferFish onComplete={vi.fn()} />);

    const fish = screen.getAllByRole('button', { name: /Fish/ });
    expect(fish).toHaveLength(1);
  });

  it('transitions arriving → waiting once the swim-in beat completes', async () => {
    // The first time-driven transition. `arriving` is the entry state (fish
    // swimming in from the side); `waiting` is the centred-fish-awaiting-tap
    // state. The transition fires when the swim-in beat completes —
    // `vi.runOnlyPendingTimersAsync` drains the currently-queued transition
    // timer (and only that one), so the assertion lands at exactly the
    // waiting beat. State is observed via `data-toy-state` on the root
    // `<main>` (the structural state-query the slice spec authorises).
    render(<PufferFish onComplete={vi.fn()} />);

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');

    await act(async () => { await vi.runOnlyPendingTimersAsync(); });

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'waiting');
  });

  it('transitions waiting → dismissing when the current fish is tapped', async () => {
    // The only user-driven transition in the machine — the kid's tap drives
    // the rhythm of the loop. `fireEvent.click` (synchronous) rather than
    // `userEvent.click`, whose internal pointer sequencing hangs under
    // `vi.useFakeTimers()` in Vitest 4. The tap-as-click semantic is what the
    // machine reacts to.
    render(<PufferFish onComplete={vi.fn()} />);

    // Drive the loop to `waiting` — the only state in which a tap advances.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'waiting');

    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
  });

  it('transitions dismissing → idle after the float-away beat, removing the fish from the stage', async () => {
    // The dismiss beat is the fish's choreographed exit — it puffs, balloons,
    // and floats up off the top of the screen with a fade. At its end the fish
    // leaves the DOM and the loop is `idle` — the intermission gap before the
    // next fish swims in. Both facets of "the float-away finished" are
    // observable through the public surface: `data-toy-state` and the absence
    // of the role-named button.
    render(<PufferFish onComplete={vi.fn()} />);

    // Drive to `dismissing`.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // arriving → waiting (swim-in)
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');

    // Drain the float-away timer.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');
    expect(screen.queryByRole('button', { name: 'Fish' })).toBeNull();
  });

  it('advances to a fresh arriving fish after the intermission beat', async () => {
    // Closing the loop: after the kid's tap floats the current fish away and
    // the intermission gap plays out, the next fish swims in on its own. This
    // is the kid-paced rhythm — the kid drives the tap, the loop drives the
    // swim-in / float-away / intermission beats.
    render(<PufferFish onComplete={vi.fn()} />);

    // Drive through the first iteration: arriving → waiting → dismissing → idle.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // swim-in → waiting
    fireEvent.click(screen.getByRole('button', { name: 'Fish' })); // → dismissing
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // float-away → idle
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');

    // Drain the intermission timer.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    expect(screen.getByRole('button', { name: 'Fish' })).toBeInTheDocument();
  });

  it('ignores taps during arriving and dismissing — only waiting accepts the tap', async () => {
    // AC #3 — re-tap safety. The fish is mid-animation in `arriving` (swimming
    // in) and `dismissing` (floating away) and a kid mashing the screen
    // shouldn't punch through the choreography. The single logical assertion:
    // taps outside `waiting` are no-ops. The waiting-tap is interleaved as the
    // positive control so the test demonstrates both that the guard holds AND
    // that the valid tap path still works.
    render(<PufferFish onComplete={vi.fn()} />);

    // Mid-`arriving`: re-taps must not advance the loop.
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');

    // After the swim-in beat, `waiting` accepts the tap.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'waiting');
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');

    // Mid-`dismissing`: re-taps must not re-fire or advance the loop early.
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
  });

  /**
   * Walk the machine through one full fish-cycle: arriving → waiting → tap →
   * dismissing → idle. A following `runOnlyPendingTimersAsync` then moves
   * idle → arriving for the next fish. Lifted into a helper because the
   * 5-fish tests below repeat the pattern.
   */
  async function dismissOneFish() {
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // arriving → waiting (swim-in)
    fireEvent.click(screen.getByRole('button', { name: 'Fish' })); // → dismissing
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // → idle (float-away beat)
  }

  it('fires onComplete exactly once after the 5th tap, holding through a long settle', async () => {
    // AC #5. The Goal is "pop five fish"; the 5th tap is the moment the Goal
    // is met and the Shell's celebration overlay layers on top (ADR-0001
    // amendment — layered-concurrent). `onComplete` fires at the start of the
    // 5th `waiting → dismissing` transition (not at the end of the float-away)
    // so the Shell overlay begins simultaneously with the last fish's exit.
    //
    // The long-settle assertion guards against any spurious second call from a
    // stale timer or an onComplete-reference drift (the Shell re-renders a new
    // `onComplete` at Completion — the ref pins it to one call).
    const onComplete = vi.fn();
    render(<PufferFish onComplete={onComplete} />);

    // Four full loops — kid pops fish 1..4. Goal isn't met yet.
    for (let i = 0; i < 4; i += 1) {
      await dismissOneFish();
      await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // idle → arriving (next fish)
    }
    expect(onComplete).not.toHaveBeenCalled();

    // 5th fish swims in, kid taps — Goal met.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // arriving → waiting
    fireEvent.click(screen.getByRole('button', { name: 'Fish' })); // → dismissing + onComplete

    expect(onComplete).toHaveBeenCalledTimes(1);

    // A generously long settle (covers the 5th fish's float-away beat plus
    // several intermissions' worth of stale-timer risk). No spurious 2nd call.
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('terminates the loop after onComplete — no further fish arrives', async () => {
    // AC #4. The loop's `completed` state is terminal: once `onComplete`
    // fires, no 6th (or 7th, …) fish mounts no matter how far time advances.
    // This guards against a regression where the dismissing → idle → arriving
    // cycle keeps mounting fish underneath the Shell's celebration overlay.
    render(<PufferFish onComplete={vi.fn()} />);

    // Drive 4 full loops, then the 5th tap.
    for (let i = 0; i < 4; i += 1) {
      await dismissOneFish();
      await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // idle → arriving
    }
    await act(async () => { await vi.runOnlyPendingTimersAsync(); }); // arriving → waiting
    fireEvent.click(screen.getByRole('button', { name: 'Fish' })); // 5th tap

    // Drain everything time could possibly fire — many cycles' worth.
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });

    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'completed');
    expect(screen.queryByRole('button', { name: 'Fish' })).toBeNull();
  });

  it('never has more than one fish on stage across arriving / waiting / dismissing / idle', async () => {
    // AC #1's headline invariant. Walks the loop through every state once and
    // sweeps the role-query at each beat, asserting `length ≤ 1` (and = 0 at
    // `idle`). The state-specific tests above pin individual transitions; this
    // one is the single-glance guard against any future change that renders
    // two fish at once (e.g. mounting the next fish before the previous one's
    // float-away completes).
    render(<PufferFish onComplete={vi.fn()} />);

    const assertAtMostOneFish = () => {
      // `queryAllByRole` (not `getAll`) so the count is valid at `idle` where
      // zero fish is the right answer; `getAll` throws on 0 matches.
      expect(screen.queryAllByRole('button', { name: /Fish/ }).length).toBeLessThanOrEqual(1);
    };

    // arriving — one fish mid-swim-in.
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'arriving');
    assertAtMostOneFish();

    // waiting — same fish, centred.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'waiting');
    assertAtMostOneFish();

    // dismissing — same fish, floating away.
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
    assertAtMostOneFish();

    // idle — no fish on stage, intermission gap.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'idle');
    assertAtMostOneFish();
  });

  it('flips the fish to the puffed art during dismissing — the signature balloon beat', async () => {
    // The slice's signature beat: on tap the fish flips to the puffed art
    // (slice #05's `puffed` prop) for the balloon-and-float-away. "Puffed"
    // lives in the `dismissing` state, not on the fish — during arriving /
    // waiting the fish shows its resting art (large round `eye`s), and only in
    // dismissing does the happy `^w^` squint (`eye-squint`) appear. The puff
    // scale, wobble and float-up path are on-device-tuned and not asserted
    // here; the structural rest ↔ puffed art swap is what's pinned (mirrors
    // the Sheep's done-glow-in-dismissing test).
    render(<PufferFish onComplete={vi.fn()} />);

    // Arriving / waiting — resting art: round eyes, no squint.
    expect(document.querySelector('[data-fish-part="eye-squint"]')).toBeNull();
    expect(document.querySelector('[data-fish-part="eye"]')).not.toBeNull();
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    expect(document.querySelector('[data-fish-part="eye-squint"]')).toBeNull();

    // Tap → dismissing — the fish puffs: the happy squint replaces the round
    // eyes.
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));

    const fish = screen.getByRole('button', { name: 'Fish' });
    expect(fish.querySelector('[data-fish-part="eye-squint"]')).not.toBeNull();
    expect(fish.querySelector('[data-fish-part="eye"]')).toBeNull();
  });

  it('plays the puff and a haptic tick on every tap, even no-op re-taps mid-animation', async () => {
    // AC #2: the fish gives the counting tap its voice and buzz. Per the Sheep
    // posture (slice #08 notes), the playful feedback fires on *every* tap
    // while only the `waiting` tap advances the loop — a kid mashing the
    // screen mid-swim still gets the puff, no penalty. Asserted through fakes
    // injected via the contract (`sound` / `haptics`), never by mocking our
    // own components — the boundary the Toy commits through is `sound.play`,
    // invoked with the fish-local `puff` recipe (ADR-0004), plus `haptics.tick`.
    const sound = {
      unlock: vi.fn(),
      play: vi.fn(),
      celebrate: vi.fn(),
      isMuted: vi.fn(() => false),
      setMuted: vi.fn(),
    };
    const haptics = { tick: vi.fn() };
    render(<PufferFish onComplete={vi.fn()} sound={sound} haptics={haptics} />);

    // Mid-arriving — a re-tap still gets the playful feedback even though the
    // `waiting`-only guard blocks the state advance.
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    expect(sound.play).toHaveBeenCalledTimes(1);
    expect(sound.play).toHaveBeenLastCalledWith(puff);
    expect(haptics.tick).toHaveBeenCalledTimes(1);

    // After the swim-in beat, the load-bearing `waiting` tap plays it too.
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    expect(sound.play).toHaveBeenCalledTimes(2);
    expect(sound.play).toHaveBeenLastCalledWith(puff);
    expect(haptics.tick).toHaveBeenCalledTimes(2);
  });

  it('taps safely under a bare mount — no sound / haptics, no throw', async () => {
    // AC #3: `sound` / `haptics` are optional on the contract (ADR-0003), so a
    // bare-mounted fish degrades to silence rather than throwing. The `play(...)`
    // no-op-when-muted / no-AudioContext behaviour is the slice #01 primitive's
    // job and is tested there; here we pin only that the *fish path* survives a
    // tap with neither utility wired — the waiting tap still advances the loop,
    // proving execution ran past the (absent) feedback calls.
    render(<PufferFish onComplete={vi.fn()} />);

    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'waiting');

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Fish' }))).not.toThrow();
    expect(screen.getByRole('main')).toHaveAttribute('data-toy-state', 'dismissing');
  });
});
