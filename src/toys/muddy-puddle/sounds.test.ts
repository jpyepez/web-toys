import { describe, it, expect } from 'vitest';
import { squelch, sparkle, REVEAL_VOICES } from './sounds';
import { CAST } from './cast';

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

describe('Muddy Puddle — per-animal reveal voices', () => {
  it('keys a distinct reveal voice to every cast member by id (oink / quack / baa / peep / moo)', () => {
    // The clean-snap plays a happy animal voice keyed to whichever Critter just
    // snapped clean (slice body). The contract pinned here is structural: the
    // map covers the WHOLE cast by `id` (so the loop can always look one up for
    // the on-stage animal), each entry is a real `play(voice)` recipe, and the
    // five voices are DISTINCT — an oink must not be a quack. The concrete
    // timbres are tuned by ear, not asserted; we discriminate by freq, the one
    // field that separates the animals' registers without pinning the recipe.
    for (const critter of CAST) {
      const voice = REVEAL_VOICES[critter.id];
      expect(voice, `missing reveal voice for ${critter.id}`).toBeDefined();
      expect(voice.peak).toBeGreaterThan(0);
      expect(voice.decay).toBeGreaterThan(0);
    }

    const freqs = CAST.map((c) => REVEAL_VOICES[c.id].freq);
    expect(new Set(freqs).size).toBe(CAST.length);
  });
});
