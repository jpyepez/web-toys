import type { Voice } from '../../shell/sound';

/**
 * Nestlings' local sound recipes (per ADR-0004 each Toy owns its own recipes;
 * the shared Sound engine exposes only the generic `play(voice)` primitive,
 * slice #01). The Toy reaches audio solely through the injected `Sound`
 * (ADR-0003) — never Web Audio directly. These join the Sheep's `baa`, the
 * Fish's `puff`, the Muddy Puddle's squelch and the Balloons' pip/pop/raspberry
 * as consumers of `play(voice)`.
 *
 * The concrete pitches / bends / decays are on-device-tuned by ear (slice
 * Notes); only the rise/fall direction that makes each read as its own event is
 * load-bearing and unit-asserted.
 */

/**
 * The pickup chirp — a bright `triangle` with a quick *upward* glide, the rising
 * cheep of a fledgling being lifted. The upward bend (`bendTo > freq`) is the
 * load-bearing shape and the inverse of the nestle coo's settling fall.
 */
export const chirp: Voice = {
  type: 'triangle',
  freq: 520,
  bendTo: 760,
  bendOver: 0.08,
  peak: 0.16,
  decay: 0.12,
};

/**
 * The nestle coo — a soft `sine` with a gentle *downward* glide, the cozy settle
 * as a bird is tucked into the nest. The downward bend (`bendTo < freq`) is the
 * load-bearing shape and the inverse of the pickup chirp's rising lift; a longer,
 * rounder decay than the chirp so it reads as a contented sigh, not a blip. The
 * concrete pitch / bend / decay are on-device-tuned, not asserted.
 */
export const coo: Voice = {
  type: 'sine',
  freq: 340,
  bendTo: 220,
  bendOver: 0.18,
  peak: 0.14,
  decay: 0.32,
};

/**
 * The wing-flutter — a soft, short `sine` blip voiced while a bird is carried,
 * rate-limited by the Toy (slice #07) so a fast drag is a gentle beat, not a
 * machine-gun stream (mirrors Balloons' throttled pip). A plain const (no pitch
 * ramp): its texture is on-device-tuned, so only its real attack/decay envelope
 * is asserted — the throttle, not the pitch, is the load-bearing behaviour.
 */
export const flutter: Voice = {
  type: 'sine',
  freq: 600,
  peak: 0.08,
  decay: 0.07,
};

/**
 * The loose-drop plip — a soft, neutral `triangle` blip when a bird is set down
 * away from the nest. Deliberately NOT a failure/error tone (ADR-0001 — no
 * lose-state): a loose drop is forgiving, so this reads as a gentle "set down",
 * never "wrong". A plain const; the concrete shape is on-device-tuned, only its
 * real attack/decay envelope is asserted.
 */
export const plip: Voice = {
  type: 'triangle',
  freq: 300,
  peak: 0.1,
  decay: 0.1,
};
