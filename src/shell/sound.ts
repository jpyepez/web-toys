/**
 * The Shell's synthesized-sound utility, passed to Toys. All sound is generated
 * at runtime via the Web Audio API — no audio files (ADR-0002). Silent until
 * `unlock()` runs inside a user gesture (a mobile constraint), and inert
 * (never throws) where Web Audio is unavailable, e.g. jsdom.
 */
export type Sound = {
  /** Resume the audio context. Must be called from a user gesture (the Card tap). */
  unlock(): void;
  /** A short synthesized sheep "baa". */
  baa(): void;
  /** A celebratory flourish for Completion. */
  celebrate(): void;
  /** Whether sound is currently silenced. */
  isMuted(): boolean;
  /** Silence (or restore) all sound. Persisted across sessions. */
  setMuted(muted: boolean): void;
};

/** Produces the audio context, or `undefined` where Web Audio is unavailable. */
type AudioContextFactory = () => AudioContext | undefined;

type SoundOptions = {
  /** The Web Audio boundary — injected as a light shim in tests. */
  contextFactory?: AudioContextFactory;
};

/** One synthesized note: an oscillator shaped by a quick attack/decay envelope. */
type Voice = {
  type: OscillatorType;
  /** Seconds from `context.currentTime` that the note begins. */
  at: number;
  freq: number;
  /** Optional pitch glide to `bendTo`, reached `bendOver` seconds after the start. */
  bendTo?: number;
  bendOver?: number;
  /** Peak gain at the end of the (fixed, short) attack. */
  peak: number;
  /** Seconds after the start by which the note has decayed to silence. */
  decay: number;
};

/** Attack ramp length — short enough to feel instant, long enough to avoid clicks. */
const ATTACK = 0.02;

/** Play a single enveloped tone on the context. The shared shape behind every sound. */
function playVoice(ctx: AudioContext, v: Voice): void {
  const t = ctx.currentTime + v.at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = v.type;
  osc.frequency.setValueAtTime(v.freq, t);
  if (v.bendTo !== undefined && v.bendOver !== undefined) {
    osc.frequency.linearRampToValueAtTime(v.bendTo, t + v.bendOver);
  }

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(v.peak, t + ATTACK);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + v.decay);

  osc.start(t);
  osc.stop(t + v.decay + ATTACK);
}

/** Resolve the platform AudioContext, or undefined (jsdom / unsupported). */
function defaultContextFactory(): AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  const Ctor =
    window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : undefined;
}

export function createSound({ contextFactory = defaultContextFactory }: SoundOptions = {}): Sound {
  // Created lazily on the unlocking gesture — never before (browsers warn, and
  // a pre-gesture context starts suspended anyway).
  let ctx: AudioContext | undefined;
  let created = false;
  let muted = false;

  const context = (): AudioContext | undefined => {
    if (!created) {
      ctx = contextFactory();
      created = true;
    }
    return ctx;
  };

  return {
    unlock() {
      const c = context();
      if (c && c.state === 'suspended') c.resume();
    },
    baa() {
      if (muted) return;
      const c = context();
      if (!c) return;
      // A short bleat: a downward pitch bend over a quick attack/decay.
      playVoice(c, { type: 'sawtooth', at: 0, freq: 380, bendTo: 300, bendOver: 0.18, peak: 0.3, decay: 0.25 });
    },
    celebrate() {
      const c = context();
      if (!c) return;
      // An ascending major arpeggio (C5–E5–G5–C6) — a quick "ta-da!" flourish.
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const step = 0.12;
      notes.forEach((freq, i) => {
        playVoice(c, { type: 'triangle', at: i * step, freq, peak: 0.25, decay: 0.3 });
      });
    },
    isMuted() {
      return muted;
    },
    setMuted(next: boolean) {
      muted = next;
    },
  };
}
