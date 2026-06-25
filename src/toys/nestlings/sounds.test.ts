import { describe, it, expect, vi } from 'vitest';
import { chirp, coo, flutter, plip } from './sounds';
import { createSound } from '../../shell/sound';
import { fakeStorage } from '../../test/fakes';

/**
 * Nestlings — local sound recipes (slice #07).
 *
 * Per ADR-0004 each Toy owns its own sound recipes; the shared Sound engine
 * exposes only the generic `play(voice)` primitive (slice #01). As with the
 * Fish's `puff`, the Muddy Puddle's squelch and the Balloons' pip/pop/raspberry,
 * we assert the load-bearing *shape* of each recipe — the rise/fall direction
 * that makes it read as its event — and deliberately NOT the concrete frequency /
 * bend / decay numbers, which are on-device-tuned per the slice Notes.
 */
describe('Nestlings — pickup chirp sound recipe', () => {
  it('is a rising pitch-bend (bendTo above freq) — the bright chirp as a fledgling is picked up', () => {
    // AC #1: lifting a bird voices a rising chirp — the load-bearing shape is the
    // upward bend (`bendTo > freq`), the inverse of the nestle coo's settling fall.
    // The concrete pitch / bend / decay are tuned by ear, not asserted.
    expect(chirp.bendTo).toBeDefined();
    expect(chirp.bendTo!).toBeGreaterThan(chirp.freq);
  });
});

describe('Nestlings — nestle coo sound recipe', () => {
  it('is a descending pitch-bend (bendTo below freq) — the cozy settle as a bird is tucked into the nest', () => {
    // AC #1: dropping a bird into the nest voices a cozy descending coo — the
    // settling fall (`bendTo < freq`) is the load-bearing shape and the inverse
    // of the pickup chirp's rising lift. The concrete pitch / bend / decay are
    // tuned by ear, not asserted.
    expect(coo.bendTo).toBeDefined();
    expect(coo.bendTo!).toBeLessThan(coo.freq);
  });
});

describe('Nestlings — carry flutter & loose-drop plip recipes', () => {
  it('are real enveloped voices — a soft wing-flutter while carried, a gentle plip on a loose drop', () => {
    // AC #1: the carry flutter and the loose-drop plip are softer textures than
    // the chirp/coo's pitched bends — no load-bearing rise/fall to pin (their
    // shape is on-device-tuned), so we assert only that each is a real `play(voice)`
    // input: a valid attack/decay envelope (peak/decay above zero). Crucially the
    // plip is its OWN gentle voice, never a re-skinned harsh/error tone — ADR-0001
    // forbids any failure cue, so a loose drop must read as neutral, not "wrong".
    expect(flutter.peak).toBeGreaterThan(0);
    expect(flutter.decay).toBeGreaterThan(0);
    expect(plip.peak).toBeGreaterThan(0);
    expect(plip.decay).toBeGreaterThan(0);
  });
});

/**
 * AC #4 — the recipes at the Web Audio boundary, tested the way the tap toys test
 * `baa`/`puff` and the Balloons their pip/pop/raspberry: shim ONLY Web Audio (a
 * fake `AudioContext` injected through the engine's `contextFactory`) and observe
 * `oscillator.start` — the only proxy for "a sound played" (ADR-0003). This proves
 * the Nestlings recipes are valid `play(voice)` inputs that reach the boundary,
 * plus the inert contract (no-op when muted / when no context exists) the engine
 * guarantees every Toy.
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

describe('Nestlings — recipes at the Web Audio boundary (AC #4)', () => {
  it('starts an oscillator for the chirp, flutter, coo and plip through the injected context', () => {
    const ctx = fakeContext();
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.play(chirp);
    sound.play(flutter);
    sound.play(coo);
    sound.play(plip);

    // Four recipes played → four enveloped tones started at the boundary; the same
    // observable the engine's own baa/puff tests pin, now for the Nestlings.
    expect(ctx.oscillators).toHaveLength(4);
    for (const osc of ctx.oscillators) {
      expect(osc.start).toHaveBeenCalled();
    }
  });

  it('no-ops when muted — no oscillator starts for a Nestlings recipe', () => {
    const ctx = fakeContext();
    // Inject fake storage so muting here does not bleed into jsdom's shared
    // localStorage and silence other default-storage tests.
    const sound = createSound({
      contextFactory: () => ctx as unknown as AudioContext,
      storage: fakeStorage(),
    });

    sound.setMuted(true);
    sound.play(chirp);
    sound.play(flutter);
    sound.play(coo);
    sound.play(plip);

    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('no-ops where Web Audio is unavailable (jsdom) — playing a recipe never throws', () => {
    // The default factory yields no context in jsdom, so the recipes must degrade
    // to silence rather than throw — the inert contract ADR-0003 gives every Toy.
    // A bare `createSound()` exercises the real default factory.
    const sound = createSound();

    expect(() => {
      sound.play(chirp);
      sound.play(flutter);
      sound.play(coo);
      sound.play(plip);
    }).not.toThrow();
  });
});
