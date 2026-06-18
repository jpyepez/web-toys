import type { Voice } from '../../shell/sound';

/**
 * Balloons' local sound recipes. Per ADR-0004 each Toy owns its own sound
 * recipes; the shared Sound engine exposes only the generic `play(voice)`
 * primitive (slice #01). The Toy reaches audio solely through the injected
 * `Sound` (ADR-0003) — never Web Audio directly. These join the Sheep's `baa`,
 * the Fish's `puff` and the Muddy Puddle's squelch as consumers of `play(voice)`.
 */

/**
 * The fill "pip" — the slice's one genuinely NEW sound shape. A short blip whose
 * PITCH is a function of the current fill % (0→1), so a rapid run of throttled
 * pips reads as a rising tone — the balloon swelling. The rising mapping is the
 * load-bearing invariant (a fuller balloon pips higher); the base pitch, span
 * and per-play jitter are on-device-tuned by ear (slice Notes), not asserted.
 * `random` is injected (default `Math.random`) so the jitter is the one boundary
 * collaborator — deterministic in tests, seed-free in app code.
 */
export function pip(fill: number, random: () => number = Math.random): Voice {
  // ±~6% pitch wobble so a run of pips reads as playful, not a stepped machine
  // tone. On-device-tuned, not asserted.
  const jitter = 0.97 + random() * 0.06;
  // Pitch climbs across the fill so successive pips ladder upward — the rising
  // tone. Base + span are tuned by ear; only the monotonic climb is pinned.
  return {
    type: 'triangle',
    freq: (440 + fill * 660) * jitter,
    peak: 0.14,
    decay: 0.06,
  };
}

/**
 * The early-lift raspberry — a wet, raspy `sawtooth` with a quick *downward*
 * glide, the comic "pbbbt" of air escaping when the child lifts before the
 * balloon caps. The downward bend (`bendTo < freq`) is the inverse of the pip's
 * rising ladder and the load-bearing shape; the concrete pitch / bend / decay
 * are on-device-tuned, not asserted. `sawtooth` is the toy's only raspy timbre,
 * keeping the deflate distinct by ear from the pip (triangle) and the pop.
 */
export const raspberry: Voice = {
  type: 'sawtooth',
  freq: 320,
  bendTo: 120,
  bendOver: 0.22,
  peak: 0.18,
  decay: 0.26,
};

/**
 * The detach pop/"boing" — a round `square` thunk with a quick upward kick as
 * the balloon snaps off the peg and leaps free. `square` is the toy's only such
 * timbre, keeping the pop distinct by ear from the pip (triangle) and the
 * raspberry (sawtooth). The concrete pitch / bend / decay are on-device-tuned,
 * not asserted; only that it is a valid `play(voice)` and its own timbre.
 */
export const pop: Voice = {
  type: 'square',
  freq: 180,
  bendTo: 420,
  bendOver: 0.06,
  peak: 0.22,
  decay: 0.14,
};
