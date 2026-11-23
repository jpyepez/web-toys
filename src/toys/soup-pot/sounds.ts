import type { Voice } from '../../shell/sound';

/**
 * Soup Pot's local sound recipes (ADR-0004). The Toy reaches audio only through
 * the injected `Sound` (ADR-0003). Pitches are placeholders for the on-device
 * tuning ticket; only the rising direction of `blip` is pinned by tests.
 */

/**
 * A soft bubble blip. Pitch is a non-decreasing function of `fraction`, the
 * progress as a fraction of the Goal (clamped to 0–1), so the soup sounds higher
 * as it cooks.
 */
export function blip(fraction: number): Voice {
  const f = Math.min(1, Math.max(0, fraction));
  const freq = 260 + f * 340;
  return { type: 'sine', freq, bendTo: freq * 1.25, bendOver: 0.05, peak: 0.12, decay: 0.09 };
}

/** The brighter chime at each stage beat (¼, ½, ¾). The Toy's only triangle voice. */
export const chime: Voice = { type: 'triangle', freq: 880, peak: 0.16, decay: 0.35 };
