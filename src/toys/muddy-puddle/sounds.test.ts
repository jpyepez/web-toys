import { describe, it, expect, vi } from 'vitest';
import { squelch, sparkle, REVEAL_VOICES } from './sounds';
import { CAST } from './cast';
import { createSound } from '../../shell/sound';
import { fakeStorage } from '../../test/fakes';

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

/**
 * AC #4 — the recipes at the Web Audio boundary, tested the way the tap toys
 * test `baa`/`puff`: shim ONLY Web Audio (a fake `AudioContext` injected through
 * the engine's `contextFactory`) and observe `oscillator.start` — the only
 * proxy for "a sound played" (ADR-0003). This proves the muddy recipes are
 * valid `play(voice)` inputs that reach the boundary, plus the inert contract
 * (no-op when muted / when no context exists) the engine guarantees every Toy.
 */
function fakeParam() {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}
function fakeOscillator() {
  return {
    type: 'sine' as OscillatorType,
    frequency: fakeParam(),
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}
function fakeContext(state: AudioContextState = 'running') {
  const oscillators: ReturnType<typeof fakeOscillator>[] = [];
  return {
    state,
    currentTime: 0,
    destination: {},
    resume: vi.fn(),
    createOscillator: vi.fn(() => {
      const osc = fakeOscillator();
      oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => ({ gain: fakeParam(), connect: vi.fn() })),
    oscillators,
  };
}

describe('Muddy Puddle — recipes at the Web Audio boundary (AC #4)', () => {
  it('starts an oscillator for the squelch and the sparkle through the injected context', () => {
    const ctx = fakeContext();
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.play(squelch());
    sound.play(sparkle);

    // Two recipes played → two enveloped tones started at the boundary; this is
    // the same observable the engine's own baa/puff tests pin, now for the
    // muddy recipes.
    expect(ctx.oscillators).toHaveLength(2);
    for (const osc of ctx.oscillators) {
      expect(osc.start).toHaveBeenCalled();
    }
  });

  it('no-ops when muted — no oscillator starts for a muddy recipe', () => {
    const ctx = fakeContext();
    // Inject fake storage so muting here does not bleed into jsdom's shared
    // localStorage and silence other default-storage tests.
    const sound = createSound({
      contextFactory: () => ctx as unknown as AudioContext,
      storage: fakeStorage(),
    });

    sound.setMuted(true);
    sound.play(squelch());
    sound.play(sparkle);

    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('no-ops where Web Audio is unavailable (jsdom) — playing a recipe never throws', () => {
    // The default factory yields no context in jsdom, so the recipes must
    // degrade to silence rather than throw — the inert contract ADR-0003 gives
    // every Toy. A bare `createSound()` exercises the real default factory.
    const sound = createSound();

    expect(() => {
      sound.play(squelch());
      sound.play(sparkle);
    }).not.toThrow();
  });
});
