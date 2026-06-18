import { describe, it, expect, vi } from 'vitest';
import { pip, pop, raspberry } from './sounds';
import { createSound } from '../../shell/sound';
import { fakeStorage } from '../../test/fakes';

/**
 * Balloons — local sound recipes (slice #07).
 *
 * Per ADR-0004 each Toy owns its own sound recipes; the shared Sound engine
 * exposes only the generic `play(voice)` primitive (slice #01). As with the
 * Fish's `puff` and the Muddy Puddle's squelch, we assert the load-bearing
 * *shape* of each recipe and deliberately NOT the concrete frequency / bend /
 * decay numbers, nor the pitch jitter — those are on-device-tuned per the slice
 * Notes.
 */
describe('Balloons — fill pip sound recipe', () => {
  it('rises in pitch as the fill climbs — a fuller balloon pips higher', () => {
    // AC #1 / the slice's one genuinely new shape: the pip's pitch is a function
    // of the current fill %, so a rapid run of throttled pips reads as a rising
    // tone (the balloon "filling up"). The structural invariant pinned here is
    // monotonic: a near-full balloon pips at a HIGHER frequency than a nearly
    // empty one. The concrete mapping, base pitch and per-play jitter are tuned
    // by ear on a real device, not asserted.
    expect(pip(0.8).freq).toBeGreaterThan(pip(0.2).freq);
  });
});

describe('Balloons — early-lift raspberry sound recipe', () => {
  it('is a descending pitch-bend (bendTo below freq) — the funny deflate of an early lift', () => {
    // AC #1: lifting the finger before the balloon caps leaks it back down, and
    // the feedback is a descending raspberry — the comic "pbbbt" of air escaping.
    // `bendTo < freq` is the one structural invariant (the inverse of the pip's
    // rising ladder); the concrete pitch / bend / decay are tuned by ear.
    expect(raspberry.bendTo).toBeDefined();
    expect(raspberry.bendTo!).toBeLessThan(raspberry.freq);
  });
});

describe('Balloons — detach pop sound recipe', () => {
  it('is a real enveloped voice with a timbre distinct from the pip and the raspberry', () => {
    // AC #1: the balloon's self-cap detach plays a pop/"boing". The pinned
    // contract is structural: it is a valid `play(voice)` (a real attack/decay
    // envelope), and its timbre is DISTINCT from the other two recipes so the
    // three feedbacks never blur into one by ear — pip (fill), pop (detach) and
    // raspberry (early lift) each read as their own event. The concrete pop
    // shape (bend, pitch, decay) is tuned by ear, not asserted.
    expect(pop.peak).toBeGreaterThan(0);
    expect(pop.decay).toBeGreaterThan(0);

    const types = new Set([pip(0.5).type, pop.type, raspberry.type]);
    expect(types.size).toBe(3);
  });
});

/**
 * AC #4 — the recipes at the Web Audio boundary, tested the way the tap toys
 * test `baa`/`puff` (and the Muddy Puddle its squelch): shim ONLY Web Audio (a
 * fake `AudioContext` injected through the engine's `contextFactory`) and observe
 * `oscillator.start` — the only proxy for "a sound played" (ADR-0003). This
 * proves the balloon recipes are valid `play(voice)` inputs that reach the
 * boundary, plus the inert contract (no-op when muted / when no context exists)
 * the engine guarantees every Toy.
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

describe('Balloons — recipes at the Web Audio boundary (AC #4)', () => {
  it('starts an oscillator for the pip, the pop and the raspberry through the injected context', () => {
    const ctx = fakeContext();
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.play(pip(0.5));
    sound.play(pop);
    sound.play(raspberry);

    // Three recipes played → three enveloped tones started at the boundary; the
    // same observable the engine's own baa/puff tests pin, now for the balloons.
    expect(ctx.oscillators).toHaveLength(3);
    for (const osc of ctx.oscillators) {
      expect(osc.start).toHaveBeenCalled();
    }
  });

  it('no-ops when muted — no oscillator starts for a balloon recipe', () => {
    const ctx = fakeContext();
    // Inject fake storage so muting here does not bleed into jsdom's shared
    // localStorage and silence other default-storage tests.
    const sound = createSound({
      contextFactory: () => ctx as unknown as AudioContext,
      storage: fakeStorage(),
    });

    sound.setMuted(true);
    sound.play(pip(0.5));
    sound.play(pop);
    sound.play(raspberry);

    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('no-ops where Web Audio is unavailable (jsdom) — playing a recipe never throws', () => {
    // The default factory yields no context in jsdom, so the recipes must degrade
    // to silence rather than throw — the inert contract ADR-0003 gives every Toy.
    // A bare `createSound()` exercises the real default factory.
    const sound = createSound();

    expect(() => {
      sound.play(pip(0.5));
      sound.play(pop);
      sound.play(raspberry);
    }).not.toThrow();
  });
});
