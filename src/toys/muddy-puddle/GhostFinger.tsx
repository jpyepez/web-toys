import { motion } from 'motion/react';
import { palette } from './palette';

/**
 * The wordless ghost-finger demo's visual (muddy-puddle PRD, slice #06). When a
 * child stalls on a settled Critter, `MuddyPuddle` mounts this over the mud to
 * SHOW them the Wipe: a translucent finger sweeps back and forth across the
 * Critter while one or two mud puffs lift and reform under its tip — teaching
 * the cause-and-effect WITHOUT touching the real blob state (the demo is honest;
 * it never advances progress — that invariant is pinned in the loop tests, this
 * file only paints the hint).
 *
 * Code-drawn SVG + synthesised motion only — no image assets (ADR-0002). It is
 * `pointer-events: none` so it never intercepts the real Wipe underneath, and
 * `aria-hidden` (it's a visual nudge, not content). Reduced motion is honoured
 * app-wide by the root `MotionConfig reducedMotion="user"` (as Sheep/Fish rely
 * on): under it Motion suppresses the transform sweep + puff lift, so a
 * motion-sensitive child sees a static finger rather than a moving one — the
 * hint still reads, the motion doesn't. Offsets, timing and the finger shape are
 * on-device-tuned per the slice DoD and deliberately NOT unit-asserted (slice
 * Notes); the structural contract is "a ghost finger appears while `demoActive`".
 */
export function GhostFinger() {
  return (
    <div
      data-ghost-finger=""
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      {/* The sweeping cluster — a 0×0 anchor at the contact point (centre of the
       * Critter box); the finger + puffs hang off it by transform. The sweep
       * drags it left↔right with a soft bob, looping until the child Wipes. */}
      <motion.div
        style={{ position: 'absolute', left: '50%', top: '52%' }}
        animate={{ x: [-46, 46, -46], y: [0, -3, 0] }}
        transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
      >
        {/* Two mud puffs that lift-and-reform under the tip — the honest
         * demonstration (they rise + fade, then return; no real blob is lifted).
         * Coloured with the scene's `mud` so they read as lifted muck. */}
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 14,
              height: 14,
              marginTop: -7,
              marginLeft: -7 + (i === 0 ? -10 : 10),
              borderRadius: '50%',
              background: palette.mud,
            }}
            animate={{ y: [2, -16, 2], opacity: [0, 0.65, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, ease: 'easeOut', repeat: Infinity, delay: i * 0.35 }}
          />
        ))}

        {/* The translucent ghost finger, its tip resting on the contact point. */}
        <svg
          width="56"
          height="80"
          viewBox="0 0 56 80"
          style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-46%, -86%)' }}
        >
          {/* soft contact halo where the tip meets the mud */}
          <ellipse cx="28" cy="74" rx="15" ry="5" fill="white" opacity="0.22" />
          {/* the finger — a soft translucent capsule */}
          <path
            d="M18 10 Q28 2 38 10 L37 52 Q36 70 28 72 Q20 70 19 52 Z"
            fill="white"
            fillOpacity="0.55"
            stroke="white"
            strokeOpacity="0.7"
            strokeWidth="1.5"
          />
          {/* nail highlight, for a touch of dimension */}
          <ellipse cx="28" cy="18" rx="6.5" ry="8.5" fill="white" opacity="0.45" />
        </svg>
      </motion.div>
    </div>
  );
}
