import { describe, it, expect } from 'vitest';
import { squelch, sparkle } from './sounds';

/**
 * Muddy Puddle — local sound recipes (slice #07).
 *
 * Per ADR-0004 each Toy owns its own sound recipes; the shared Sound engine
 * exposes only the generic `play(voice)` primitive (slice #01). As with the
 * Puffer Fish's `puff`, we assert the load-bearing *shape* of each recipe and
 * deliberately NOT the concrete frequency / bend / decay numbers, nor the
 * pitch-jitter range — those are on-device-tuned per the slice Notes.
 */
describe('Muddy Puddle — squelch sound recipe', () => {
  it('is a wet downward pitch-bend (bendTo below freq) — reads as a squelch, not a chirp', () => {
    // AC #1: the wet squelch lives in a quick *downward* glide (the inverse of
    // the Fish's inflating puff, whose bend rises). `bendTo < freq` is the one
    // structural invariant the slice pins; the exact values — and the pitch
    // jitter that varies them per play — are tuned by ear on a real device, not
    // here. The jitter is one multiplicative factor across both, so the downward
    // direction holds for every draw.
    const voice = squelch();

    expect(voice.bendTo).toBeDefined();
    expect(voice.bendTo!).toBeLessThan(voice.freq);
  });
});

describe('Muddy Puddle — sparkle sound recipe', () => {
  it('is a bright rising pitch-bend (bendTo above freq) — reads as the clean-snap shimmer', () => {
    // The clean-snap's shimmer lives in an *upward* glide (like the Fish's puff,
    // unlike the squelch's downward pull) — that lift is what reads as the mud
    // lifting away to a sparkle. `bendTo > freq` is the structural invariant;
    // the concrete pitch / bend / decay are tuned by ear, not asserted.
    expect(sparkle.bendTo).toBeDefined();
    expect(sparkle.bendTo!).toBeGreaterThan(sparkle.freq);
  });
});
