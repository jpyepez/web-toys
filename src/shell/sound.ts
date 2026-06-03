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
  /** The persistence boundary for the mute preference — defaults to `localStorage`. */
  storage?: Storage;
};

/** localStorage key holding the mute preference. Value `'1'` = muted; absent = unmuted. */
const MUTED_KEY = 'web-toys:muted';

/** The platform localStorage when present (defended for jsdom/SSR), else `undefined`. */
function defaultStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

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

export function createSound({
  contextFactory = defaultContextFactory,
  storage = defaultStorage(),
}: SoundOptions = {}): Sound {
  // Created lazily on the unlocking gesture — never before (browsers warn, and
  // a pre-gesture context starts suspended anyway).
  let ctx: AudioContext | undefined;
  let created = false;
  // Restore the mute preference at construction so a reload picks up where we
  // left off — the slice's "persists across reloads" criterion.
  let muted = storage?.getItem(MUTED_KEY) === '1';

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
      if (muted) return;
      const c = context();
      if (!c) return;
      // Ascending major arpeggio (C5–E5–G5–C6) — the "ta-da" the original
      // celebrate shipped. Per-note decay grows to ~0.6s so each note blooms
      // and overlaps the next instead of clipping (slice #06 — restyle).
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const step = 0.12;
      notes.forEach((freq, i) => {
        playVoice(c, { type: 'triangle', at: i * step, freq, peak: 0.22, decay: 0.6 });
      });
      // One low sustained pad note (C3 = 130.81Hz) underneath — gives the
      // arpeggio a warm harmonic bed rather than landing dry. Sine voice,
      // low peak, long decay covers the full arpeggio window.
      playVoice(c, { type: 'sine', at: 0, freq: 130.81, peak: 0.12, decay: 1.4 });
    },
    isMuted() {
      return muted;
    },
    setMuted(next: boolean) {
      muted = next;
      // Persist so a reload picks up where we left off. The PRD calls this out
      // as the *only* persisted client-side state — keep the shape minimal.
      if (next) storage?.setItem(MUTED_KEY, '1');
      else storage?.removeItem(MUTED_KEY);
    },
  };
}
