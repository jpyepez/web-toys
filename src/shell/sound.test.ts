import { describe, it, expect, vi } from 'vitest';
import { createSound } from './sound';

/** A fake audio param supporting the envelope-scheduling methods we use. */
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

/** A light Web Audio harness shim: a fake context observable in tests. */
function fakeContext(state: AudioContextState = 'suspended') {
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
    /** Test-only handle on every oscillator the engine started. */
    oscillators,
  };
}

describe('sound utility', () => {
  it('is inert and never throws where Web Audio is unavailable (e.g. jsdom)', () => {
    // No window.AudioContext in jsdom — the engine must degrade to silence.
    const sound = createSound();

    expect(() => {
      sound.unlock();
      sound.baa();
      sound.celebrate();
    }).not.toThrow();
  });

  it('resumes a suspended audio context on unlock (the mobile gesture unlock)', () => {
    const ctx = fakeContext('suspended');
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.unlock();

    expect(ctx.resume).toHaveBeenCalled();
  });

  it('plays a baa by starting a tone on the audio context', () => {
    const ctx = fakeContext('running');
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.baa();

    // Sound quality is validated by ear (manual); here we pin that a tone was
    // actually triggered on the Web Audio boundary.
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.oscillators[0].start).toHaveBeenCalled();
  });

  it('plays a celebratory flourish of several tones on the audio context', () => {
    const ctx = fakeContext('running');
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.celebrate();

    // A flourish is more than one note — that is what makes it celebratory
    // rather than the single tone of a baa. Every note is actually started.
    expect(ctx.oscillators.length).toBeGreaterThan(1);
    for (const osc of ctx.oscillators) {
      expect(osc.start).toHaveBeenCalled();
    }
  });

  it('is silenced when muted — a baa starts no tone on the audio context', () => {
    const ctx = fakeContext('running');
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.setMuted(true);
    sound.baa();

    // The observable proxy for "no sound": no oscillator was ever started.
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });
});
