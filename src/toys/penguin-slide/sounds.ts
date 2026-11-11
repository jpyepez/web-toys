import type { Voice } from '../../shell/sound';

/**
 * Penguin Slide's Toy-local sound recipes (ADR-0004), reached only through the
 * injected `Sound` (ADR-0003). Concrete pitches and decays are tuned by ear on a
 * device; only the rising plop ladder and the swish/peep contrast are asserted.
 */

/** The launch swish — a short downward-gliding `sawtooth` whoosh. */
export const swish: Voice = {
  type: 'sawtooth',
  freq: 700,
  bendTo: 250,
  bendOver: 0.25,
  peak: 0.07,
  decay: 0.3,
};

/** A short, quiet tap peep — a soft `sine` blip, well under the swish's level. */
export const peep: Voice = {
  type: 'sine',
  freq: 880,
  bendTo: 980,
  bendOver: 0.05,
  peak: 0.05,
  decay: 0.08,
};

const PLOP_BASE_HZ = 180;
/** Frequency ratio per landed penguin. */
const PLOP_STEP = 1.15;

/**
 * The splash plop for the Nth penguin to land (0-based). Pitch rises strictly
 * with `landed`, so the last penguin's plop is the highest.
 */
export function plop(landed: number): Voice {
  const freq = PLOP_BASE_HZ * PLOP_STEP ** landed;
  return {
    type: 'sine',
    freq,
    bendTo: freq * 1.6,
    bendOver: 0.08,
    peak: 0.18,
    decay: 0.18,
  };
}
