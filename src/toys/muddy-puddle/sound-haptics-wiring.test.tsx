import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MuddyPuddle } from './MuddyPuddle';

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
});
