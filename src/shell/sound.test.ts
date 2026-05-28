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

/** A minimal Storage shim backed by a Map — the persistence boundary in tests. */
function fakeStorage(backing: Map<string, string> = new Map()): Storage {
  return {
    get length() {
      return backing.size;
    },
    key: (i: number) => Array.from(backing.keys())[i] ?? null,
    getItem: (k: string) => backing.get(k) ?? null,
    setItem: (k: string, v: string) => {
      backing.set(k, v);
    },
    removeItem: (k: string) => {
      backing.delete(k);
    },
    clear: () => {
      backing.clear();
    },
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

  it('is silenced when muted — celebrate plays no flourish', () => {
    const ctx = fakeContext('running');
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.setMuted(true);
    sound.celebrate();

    // Completion's celebratory sound must be muted just like a baa.
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('starts unmuted on first load with no stored preference', () => {
    // Empty storage = first launch on this device. Sound must be on.
    const ctx = fakeContext('running');
    const sound = createSound({
      contextFactory: () => ctx as unknown as AudioContext,
      storage: fakeStorage(),
    });

    expect(sound.isMuted()).toBe(false);
    sound.baa();
    expect(ctx.createOscillator).toHaveBeenCalled();
  });

  it('restores a stored muted preference on creation (across reloads)', () => {
    // Simulate a reload where the user previously muted: localStorage has the flag set.
    const storage = new Map<string, string>([['web-toys:muted', '1']]);
    const ctx = fakeContext('running');
    const sound = createSound({
      contextFactory: () => ctx as unknown as AudioContext,
      storage: fakeStorage(storage),
    });

    // No setMuted call here — the preference came back from storage.
    expect(sound.isMuted()).toBe(true);
    sound.baa();
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('restores sound when mute is toggled back off', () => {
    const ctx = fakeContext('running');
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.setMuted(true);
    sound.setMuted(false);
    sound.baa();

    // After un-muting, the next baa plays normally — a tone is started.
    expect(ctx.createOscillator).toHaveBeenCalled();
  });
});
