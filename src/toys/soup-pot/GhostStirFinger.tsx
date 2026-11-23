import { motion } from 'motion/react';
import { DEMO_CIRCLE_MS, DEMO_CIRCLES } from './demo';

const RADIUS = 60;
const STEPS = 12;
const ring = Array.from({ length: STEPS + 1 }, (_, i) => (i / STEPS) * Math.PI * 2);

/**
 * The idle Stir demo's ghost: a plain translucent circle that circles the pot's
 * centre. Purely visual — it never touches the real Stir state.
 */
export function GhostStirFinger() {
  return (
    <div
      data-ghost-stir-finger=""
      aria-hidden="true"
      style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <motion.div
        style={{ position: 'absolute', width: 28, height: 28, marginLeft: -14, marginTop: -14, borderRadius: '50%', background: 'white', opacity: 0.6 }}
        initial={{ x: RADIUS, y: 0, opacity: 0 }}
        animate={{
          x: ring.map((a) => Math.cos(a) * RADIUS),
          y: ring.map((a) => Math.sin(a) * RADIUS),
          opacity: 0.6,
        }}
        transition={{
          x: { duration: DEMO_CIRCLE_MS / 1000, ease: 'linear', repeat: DEMO_CIRCLES - 1 },
          y: { duration: DEMO_CIRCLE_MS / 1000, ease: 'linear', repeat: DEMO_CIRCLES - 1 },
          opacity: { duration: 0.4 },
        }}
      />
    </div>
  );
}
