import { describe, it, expect } from 'vitest';
import { squelch } from './sounds';

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
