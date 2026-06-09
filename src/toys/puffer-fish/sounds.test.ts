import { describe, it, expect } from 'vitest';
import { puff } from './sounds';

/**
 * Puffer Fish — local `puff` sound recipe (slice #08).
 *
 * Per ADR-0004 each Toy owns its own sound recipes; the shared Sound engine
 * exposes only the generic `play(voice)` primitive (slice #01). We assert the
 * load-bearing *shape* of the recipe — a rising pitch-bend that reads as
 * inflating — and deliberately NOT the concrete frequency / bend / decay
 * numbers, which are on-device-tuned per the PRD Testing Decisions.
 */
describe('Puffer Fish — puff sound recipe', () => {
  it('is a rising pitch-bend (bendTo above freq) — reads as inflating', () => {
    // AC #1: the inflate gesture lives in the upward glide. `bendTo > freq`
    // is the one structural invariant the slice pins; the exact values are
    // tuned by ear on a real device, not here.
    expect(puff.bendTo).toBeGreaterThan(puff.freq);
  });
});
