import { motion } from 'motion/react';
import { vogelSpiral } from './art/rng';
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
 * Golden-angle placement. The particles used to spread on a linear ramp
 * (`(i / (PIECES - 1) - 0.5) * 240`), which puts them at even horizontal
 * intervals — so the burst read as a FAN rather than a bloom. A Vogel spiral is
 * the most even radial packing there is, and the arrangement phyllotaxis uses;
 * it is deterministic by index, so renders stay stable across React's
 * reconciliation passes exactly as the linear ramp did.
 */
const SPREAD = vogelSpiral(PIECES, 118);

/**
 * The Shell's celebratory burst — code-drawn SVG, no image assets (ADR-0002).
 * ~8 soft warm-light particles drifting upward over a generous beat, fills
 * sourced from the Shell `completion.spark` tokens. Decorative (`aria-hidden`);
 * shared across every Toy's Completion so every Toy inherits the same family.
 *
 * PERFORMANCE — the reason this looks the way it does. The halo used to be a
 * live `feGaussianBlur` applied via `filter: url(#celebration-glow)` on each
 * `motion.svg`. A filter on an element whose geometry moves is re-rasterised
 * EVERY FRAME, and there were eight of them animating at once — the single most
 * expensive shape an SVG animation can take on a phone. The halo is now a
 * `<radialGradient>` fill: an actually soft-edged circle, computed once, which
 * the compositor then moves around for free. Same look, no per-frame raster.
 *
 * Tuning notes (on-device-validated):
 * - Vertical drift > outward radial — reads as "warm light rising", not "pop".
 * - The gradient's mid-stop is what gives the particle its bloom; without it the
 *   falloff is linear and the particle reads as a hard disc with a fuzzy rim.
 */
export function Confetti() {
  return (
    <div
      data-testid="confetti"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          {PARTICLE_FILLS.map((fill, i) => (
            <radialGradient key={i} id={`celebration-spark-${i}`}>
              {/* A solid core with the falloff pushed to the outer third. A
                  gradient that starts fading at the centre spreads the same
                  colour over more area at lower alpha than the old blurred disc
                  did, and the particle goes weak. */}
              <stop offset="0%" stopColor={fill} stopOpacity={1} />
              <stop offset="42%" stopColor={fill} stopOpacity={0.96} />
              <stop offset="72%" stopColor={fill} stopOpacity={0.45} />
              <stop offset="100%" stopColor={fill} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
      </svg>
      {SPREAD.map(([sx, sy], i) => (
        <motion.svg
          key={i}
          width="34"
          height="34"
          viewBox="0 0 34 34"
          style={{
            position: 'absolute',
            left: '50%',
            top: '55%',
            // Promote the layer up front rather than mid-burst. Safe here because
            // the count is fixed and small; never blanket-apply it.
            willChange: 'transform, opacity',
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: sx,
            // The spiral's second axis becomes vertical variance, so particles
            // do not arrive in a rank. Every value stays negative — the bloom
            // rises, it does not scatter.
            y: -170 + sy * 0.5,
            opacity: [0, 0.95, 0],
          }}
          transition={{ duration: 2.6, ease: 'easeOut', times: [0, 0.25, 1] }}
        >
          <circle cx="17" cy="17" r="17" fill={`url(#celebration-spark-${i % PARTICLE_FILLS.length})`} />
        </motion.svg>
      ))}
    </div>
  );
}
