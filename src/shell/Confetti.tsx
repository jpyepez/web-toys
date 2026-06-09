import { motion } from 'motion/react';
import { completion } from './tokens';

/**
 * The Shell-owned celebration spark family — peachy horizon, golden bloom,
 * cream. Cycled through the particles so the burst reads as a coherent
 * warm-family wash rather than a single-colour shower. Sourced from the
 * Shell's `completion` tokens (a cross-Toy Completion primitive, ADR-0004) per
 * the slice's "no hardcoded colours" rule — not from any one Toy's palette.
 */
const PARTICLE_FILLS = completion.spark;

/** Particle count — tuned for "soft warm bloom" rather than "party-popper burst". */
const PIECES = 8;

/**
 * The Shell's celebratory burst — code-drawn SVG, no image assets (ADR-0002).
 * Slice #06 restyle: ~8 soft warm-light particles drifting upward over a
 * generous beat, fills sourced from the Shell `completion.spark` tokens, soft blur glow
 * via an SVG filter. Decorative (`aria-hidden`); shared across every Toy's
 * Completion so every future Toy inherits the same aesthetic family.
 *
 * Tuning notes (on-device-validated):
 * - Vertical drift > outward radial — reads as "warm light rising" not "pop".
 * - The blur filter softens the particles into halos rather than hard shapes.
 * - Per-particle horizontal jitter is deterministic via the index so renders
 *   are stable across React's reconciliation passes.
 */
export function Confetti() {
  const pieces = Array.from({ length: PIECES }, (_, i) => i);
  return (
    <div
      data-testid="confetti"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute' }}
        aria-hidden="true"
      >
        <defs>
          {/* Soft blur halo — wide stdDeviation gives the particles their
           * warm-bloom edge rather than hard SVG silhouettes. */}
          <filter id="celebration-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
      </svg>
      {pieces.map((i) => {
        // Deterministic horizontal spread across the burst origin, ±~120px.
        const dx = ((i / (PIECES - 1)) - 0.5) * 240;
        const fill = PARTICLE_FILLS[i % PARTICLE_FILLS.length];
        return (
          <motion.svg
            key={i}
            width="22"
            height="22"
            viewBox="0 0 22 22"
            style={{ position: 'absolute', left: '50%', top: '55%', filter: 'url(#celebration-glow)' }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: dx,
              y: -180 - (i % 3) * 40,
              opacity: [0, 0.95, 0],
            }}
            transition={{ duration: 2.6, ease: 'easeOut', times: [0, 0.25, 1] }}
          >
            <circle cx="11" cy="11" r="7" fill={fill} />
          </motion.svg>
        );
      })}
    </div>
  );
}
