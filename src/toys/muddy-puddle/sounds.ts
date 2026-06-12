import type { Voice } from '../../shell/sound';

/**
 * Muddy Puddle's local sound recipes. Per ADR-0004 each Toy owns its own sound
 * recipes; the shared Sound engine exposes only the generic `play(voice)`
 * primitive (slice #01). The Toy reaches audio solely through the injected
 * `Sound` (ADR-0003) — never Web Audio directly. These join the Sheep's `baa`
 * and the Fish's `puff` as consumers of `play(voice)`.
 */

/**
 * The wet squelch played per contributing Wipe: a short `sawtooth` (the toy's
 * only sawtooth voice — a wet, raspy timbre vs the Fish's pure sine) with a
 * quick *downward* pitch glide over a fast attack/decay. The falling bend is
 * what reads as mud being pulled off — the inverse of the Fish's rising puff.
 *
 * Pitch jitter so a rapid run of squelches reads as playful, not a machine-gun:
 * one multiplicative factor scales `freq` and `bendTo` together, so the wet
 * downward direction (`bendTo < freq`) holds for every draw while the overall
 * pitch wobbles. The concrete frequency / bend / decay and the jitter spread are
 * on-device-tuned by ear (slice Notes), not unit-asserted. `random` is injected
 * (default `Math.random`) so the jitter is the one boundary collaborator —
 * deterministic in tests, seed-free in app code.
 */
export function squelch(random: () => number = Math.random): Voice {
  // ±~15% pitch wobble around the base, applied as a single factor so the
  // bend's direction is preserved. The spread is on-device-tuned, not asserted.
  const jitter = 0.85 + random() * 0.3;
  return {
    type: 'sawtooth',
    freq: 200 * jitter,
    bendTo: 90 * jitter,
    bendOver: 0.05,
    peak: 0.18,
    decay: 0.09,
  };
}

/**
 * The sparkle played on the clean-snap: a bright `triangle` with an *upward*
 * pitch glide (like the Fish's puff, the inverse of the squelch's downward
 * pull) over a longer-tailed decay — the lift that reads as the last of the mud
 * shimmering away to reveal the clean Critter. The `bendTo > freq` shape is
 * load-bearing; the concrete values are on-device-tuned, not unit-asserted.
 */
export const sparkle: Voice = {
  type: 'triangle',
  freq: 880,
  bendTo: 1760,
  bendOver: 0.12,
  peak: 0.2,
  decay: 0.3,
};

/**
 * One happy animal voice per cast member, keyed by the Critter's `id` so the
 * loop can look up the on-stage animal's reveal at the clean-snap (slice body:
 * oink / quack / baa / peep / moo, keyed to which Critter just snapped clean).
 * Each is a single `play(voice)` recipe sitting in the animal's own register —
 * the piglet's oink low and grunty, the chick's peep tiny and high, the calf's
 * moo low and long — distinguished here by frequency, with the concrete timbres
 * tuned by ear. None is a `sawtooth`: that timbre is reserved for the squelch,
 * so the wiping feedback stays distinct from the reveal even by ear.
 */
export const REVEAL_VOICES: Record<string, Voice> = {
  // Oink — a low, grunty square with a little downward grunt at the tail.
  piglet: { type: 'square', freq: 300, bendTo: 230, bendOver: 0.1, peak: 0.16, decay: 0.18 },
  // Quack — a bright, nasal square with a quick rise, mid register.
  duckling: { type: 'square', freq: 520, bendTo: 600, bendOver: 0.06, peak: 0.16, decay: 0.16 },
  // Baa — a warm triangle bleat that wavers down, the Sheep's register.
  lamb: { type: 'triangle', freq: 440, bendTo: 392, bendOver: 0.14, peak: 0.18, decay: 0.22 },
  // Peep — a tiny, high sine chirp that lifts, very short.
  chick: { type: 'sine', freq: 1320, bendTo: 1560, bendOver: 0.05, peak: 0.14, decay: 0.12 },
  // Moo — a low, long sine that swells down, the biggest animal's voice.
  calf: { type: 'sine', freq: 196, bendTo: 165, bendOver: 0.2, peak: 0.2, decay: 0.4 },
};
