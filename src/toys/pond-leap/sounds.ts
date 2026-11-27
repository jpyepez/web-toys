import type { Voice } from '../../shell/sound';

/**
 * Pond Leap's Toy-local sound recipes (ADR-0004), reached only through the
 * injected `Sound` (ADR-0003). Pitches are tuned by ear on a device; only "the
 * pull tone rises with the stretch" is asserted.
 */

/** The spring loading: a soft tone whose pitch climbs with the stretch (0–1). */
export function pullTone(stretch: number): Voice {
  const freq = 220 * 2 ** (Math.min(1, Math.max(0, stretch)) * 1.5);
  return { type: 'triangle', freq, bendTo: freq * 1.08, bendOver: 0.1, peak: 0.06, decay: 0.14 };
}

/** The release: a springy "boing", a quick up-down glide. */
export const boing: Voice = {
  type: 'sine',
  freq: 180,
  bendTo: 520,
  bendOver: 0.12,
  peak: 0.16,
  decay: 0.32,
};

/** The landing splash, a short low plop. */
export const splash: Voice = {
  type: 'sine',
  freq: 260,
  bendTo: 120,
  bendOver: 0.14,
  peak: 0.14,
  decay: 0.2,
};

/** The landing chime, rising a step with each pad (0-based). */
export function chime(pad: number): Voice {
  const freq = 523 * 1.12 ** pad;
  return { type: 'triangle', at: 0.06, freq, peak: 0.1, decay: 0.4 };
}
