import type { Voice } from '../../shell/sound';

/**
 * Puffer Fish's local sound recipes. Per ADR-0004 each Toy owns its own sound
 * recipes; the shared Sound engine exposes only the generic `play(voice)`
 * primitive (slice #01). The Toy reaches audio solely through the injected
 * `Sound` (ADR-0003) — never Web Audio directly. The `puff` is the second
 * consumer of `play(voice)`; the Sheep's `baa` was the first.
 */

/**
 * The fish's inflate: a sine with an upward pitch bend over a quick
 * attack/decay — the rising glide is what reads as a little balloon puffing up.
 * The `bendTo > freq` shape is load-bearing; the concrete frequency / bend /
 * decay are on-device-tuned by ear (PRD Testing Decisions), not unit-asserted.
 */
export const puff: Voice = {
  type: 'sine',
  freq: 220,
  bendTo: 660,
  bendOver: 0.16,
  peak: 0.28,
  decay: 0.22,
};
