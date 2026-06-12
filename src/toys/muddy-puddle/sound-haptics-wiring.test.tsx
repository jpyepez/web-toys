import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MuddyPuddle } from './MuddyPuddle';
import { sparkle, REVEAL_VOICES } from './sounds';

/**
 * Muddy Puddle — sound + haptics wiring (slice #07).
 *
 * The Toy makes the Wipe feel and sound alive through the injected `sound` /
 * `haptics` utilities (ADR-0003) — it never imports Web Audio directly. We
 * inject FAKE `Sound` / `Haptics` through the public contract and observe the
 * calls the Toy makes (`sound.play(voice)`, `haptics.tick()`); the recipes'
 * audibility is validated at the Web Audio boundary in `sounds.test.ts` and by
 * hand on a device. Per the mocking policy we shim only those boundaries and
 * never mock our own components — the wipe runs through the real
 * `WipeableCritter` / loop, driven via the slice-#3 `data-mud-blob` nodes
 * (never pixels, ADR-0006). Time is the other boundary: `vi.useFakeTimers()`
 * drives the loop's trot-in beat AND the squelch throttle's clock (`Date.now`).
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
 * The squelch is the Toy's ONLY `sawtooth` voice (sounds.ts) — so we count
 * squelches by that timbre, robust against the per-play pitch jitter that
 * varies its frequency. The sparkle and the reveal voices use other waveforms.
 */
const squelchCalls = (sound: ReturnType<typeof fakeSound>) =>
  sound.play.mock.calls.filter(([voice]) => voice.type === 'sawtooth');

/** Cross one still-caked blob — a single contributing Wipe, far below the snap. */
function wipeOneBlob(container: HTMLElement) {
  fireEvent.pointerOver(container.querySelector('[data-mud-blob]')!);
}

/**
 * Cross `n` DISTINCT still-caked blobs in turn — each crossing unmounts its blob
 * so the next `querySelector` finds a fresh one. Kept well under the ~80% snap
 * threshold (animals carry ~17–20 blobs) so this stays a run of plain wipes.
 */
function wipeNBlobs(container: HTMLElement, n: number) {
  for (let i = 0; i < n; i += 1) {
    const blob = container.querySelector('[data-mud-blob]');
    if (!blob) break;
    fireEvent.pointerOver(blob);
  }
}

/** Cross every remaining blob in turn, driving the Critter to the clean-snap. */
function wipeUntilClean(container: HTMLElement) {
  let blob = container.querySelector('[data-mud-blob]');
  while (blob) {
    fireEvent.pointerOver(blob);
    blob = container.querySelector('[data-mud-blob]');
  }
}

describe('Muddy Puddle — sound + haptics wiring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays the squelch on a contributing wipe', async () => {
    // AC #1: a finger crossing a still-caked blob (a contributing Wipe) plays
    // the wet squelch through the injected Sound. Driven to `wiping` first so a
    // single sub-threshold crossing is a plain wipe, not the clean-snap — the
    // one call we expect is the squelch (the Toy's sole sawtooth voice).
    const sound = fakeSound();
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} sound={sound} />);

    await vi.runOnlyPendingTimersAsync(); // arriving → wiping
    wipeOneBlob(container);

    expect(squelchCalls(sound)).toHaveLength(1);
  });

  it('fires a haptic tick on a contributing wipe — the tactile beat under the finger', async () => {
    // AC #3: the Wipe buzzes under the finger like the tap toys, riding the same
    // beat as the squelch. A fake Haptics injected through the contract records
    // the tick; a single sub-threshold crossing fires exactly one.
    const haptics = { tick: vi.fn() };
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} haptics={haptics} />);

    await vi.runOnlyPendingTimersAsync(); // arriving → wiping
    wipeOneBlob(container);

    expect(haptics.tick).toHaveBeenCalledTimes(1);
  });

  it('throttles rapid wipes — a burst of crossings is rate-limited, not one squelch per blob', async () => {
    // AC #2: a fast drag crosses many blobs in an instant; squelches must be
    // rate-limited so they read as playful, not a machine-gun. We assert the
    // rate limit, NOT the interval (on-device-tuned): a synchronous BURST of
    // five distinct crossings — all at the same instant on the (fake) clock —
    // yields just ONE squelch, not five. Then we let the clock move well past
    // any sane throttle window and a further wipe squelches again, proving the
    // gate releases over time rather than swallowing everything after the first.
    const sound = fakeSound();
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} sound={sound} />);

    await vi.runOnlyPendingTimersAsync(); // arriving → wiping

    wipeNBlobs(container, 5);
    expect(squelchCalls(sound)).toHaveLength(1);

    // Advance the clock past the throttle window (1s dwarfs the ~60–80ms gate,
    // and stays under the ~2.5s idle-demo timer so nothing else stirs).
    await vi.advanceTimersByTimeAsync(1000);
    wipeOneBlob(container);
    expect(squelchCalls(sound)).toHaveLength(2);
  });

  it('plays the sparkle and the on-stage animal’s reveal voice on the clean-snap', async () => {
    // AC #1: the clean-snap is the reward beat — a sparkle shimmer PLUS the
    // happy voice of whichever animal just snapped clean (oink / quack / …). The
    // cast is shuffled per play, so we read the on-stage Critter's id off its
    // `data-critter` hook (the loop's public identity attribute) and assert the
    // matching reveal voice fired — never coupling to the non-deterministic
    // shuffle order. Both are identity assertions (sparkle and the reveal voices
    // are un-jittered consts), distinct from the sawtooth squelch.
    const sound = fakeSound();
    const { container } = render(<MuddyPuddle onComplete={vi.fn()} sound={sound} />);

    await vi.runOnlyPendingTimersAsync(); // arriving → wiping
    const id = container.querySelector('[data-critter]')!.getAttribute('data-critter')!;

    wipeUntilClean(container);

    expect(sound.play).toHaveBeenCalledWith(sparkle);
    expect(sound.play).toHaveBeenCalledWith(REVEAL_VOICES[id]);
  });
});
