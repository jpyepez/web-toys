import { describe, it, expect, vi } from 'vitest';
import { createSound } from './sound';
import { fakeStorage } from '../test/fakes';

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

  it('layers a sustained low pad note under the celebratory arpeggio (warm bloom)', () => {
    // Slice #06 — restyled celebrate. The arpeggio (4 notes) keeps its register,
    // and a single low sustained pad note is added underneath for warmth. The
    // pad's audible quality is on-device; here we pin the *structural* change:
    // one additional voice, distinguishable as the pad because its frequency
    // sits well below the arpeggio (whose lowest note is C5, 523.25Hz). The
    // discriminator is the frequency the engine asks the oscillator to hold,
    // observed at the Web Audio boundary the engine already commits through.
    const ctx = fakeContext('running');
    const sound = createSound({ contextFactory: () => ctx as unknown as AudioContext });

    sound.celebrate();

    // Five voices: 4 arpeggio + 1 pad. The arpeggio's voice count is the
    // shape of "ta-da" the original test pinned; the +1 is the new bloom.
    expect(ctx.oscillators).toHaveLength(5);

    // At least one of those voices sits in the pad register — under 250Hz,
    // a comfortable gap below the lowest arpeggio note (C5 = 523Hz).
    const padFrequencies = ctx.oscillators
      .flatMap((o) => o.frequency.setValueAtTime.mock.calls.map((c) => c[0] as number))
      .filter((f) => f < 250);
    expect(padFrequencies.length).toBeGreaterThan(0);
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

  it('persists the mute preference so a fresh createSound sees it', () => {
    // Round-trip through the *same* storage: the contract is "what one Sound writes,
    // the next Sound reads" — i.e. survives a reload — not "we wrote string X".
    const storage = fakeStorage();
    const ctx = fakeContext('running');

    const first = createSound({ contextFactory: () => ctx as unknown as AudioContext, storage });
    first.setMuted(true);

    const second = createSound({ contextFactory: () => ctx as unknown as AudioContext, storage });
    expect(second.isMuted()).toBe(true);
  });

  it('un-persists the preference when toggled back off (no stale stored mute)', () => {
    // Start with a stored muted preference (a prior session). Toggling off in
    // this session must clear it, so the *next* session starts unmuted.
    const storage = fakeStorage(new Map([['web-toys:muted', '1']]));
    const ctx = fakeContext('running');

    const first = createSound({ contextFactory: () => ctx as unknown as AudioContext, storage });
    first.setMuted(false);

    const second = createSound({ contextFactory: () => ctx as unknown as AudioContext, storage });
    expect(second.isMuted()).toBe(false);
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
