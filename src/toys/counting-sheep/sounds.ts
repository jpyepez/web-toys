import type { Voice } from '../../shell/sound';

/**
 * Counting Sheep's local sound recipes. Per ADR-0004 each Toy owns its own
 * sound recipes; the shared Sound engine exposes only the generic `play(voice)`
 * primitive. The Toy reaches audio solely through the injected `Sound`
 * (ADR-0003) — never Web Audio directly.
 */

/**
 * The Sheep's bleat: a sawtooth with a downward pitch bend over a quick
 * attack/decay. The exact recipe the shared engine's old `baa()` played,
 * moved here verbatim when `baa()` was promoted to the generic primitive.
 */
export const baa: Voice = {
  type: 'sawtooth',
  freq: 380,
  bendTo: 300,
  bendOver: 0.18,
  peak: 0.3,
  decay: 0.25,
};
