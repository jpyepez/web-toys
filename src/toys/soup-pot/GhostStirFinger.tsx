import { motion } from 'motion/react';
import { DEMO_CIRCLE_MS, DEMO_CIRCLES } from './demo';
import { palette } from './palette';

const STEPS = 16;
const ring = Array.from({ length: STEPS + 1 }, (_, i) => -Math.PI / 2 + (i / STEPS) * Math.PI * 2);

/**
 * The idle Stir demo's ghost: a soft fingertip circling the soup around the
 * pot's centre (the viewport's centre, where the scene puts the pot). Purely
 * visual — it never touches the real Stir state.
 *
 * `radius` is in frame units, and the frame is 100 units across the viewport,
 * so it is also a radius in `vw`: the circle stays inside the soup at every
 * aspect without measuring anything.
 */
export function GhostStirFinger({ radius = 25 }: { radius?: number }) {
  const at = (f: (a: number) => number) => ring.map((a) => `${(f(a) * radius).toFixed(2)}vw`);
  return (
    <div
      data-ghost-stir-finger=""
      aria-hidden="true"
      style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <motion.div
        style={{
          position: 'absolute',
          width: 'clamp(30px, 8vw, 46px)',
          aspectRatio: '1',
          translate: '-50% -50%',
          borderRadius: '50%',
          background: palette.paper,
          boxShadow: `0 0 0 3px ${palette.contour}33, 0 4px 12px ${palette.contour}26`,
        }}
        initial={{ x: at(Math.cos)[0], y: at(Math.sin)[0], opacity: 0 }}
        animate={{ x: at(Math.cos), y: at(Math.sin), opacity: 0.75 }}
        transition={{
          x: { duration: DEMO_CIRCLE_MS / 1000, ease: 'linear', repeat: DEMO_CIRCLES - 1 },
          y: { duration: DEMO_CIRCLE_MS / 1000, ease: 'linear', repeat: DEMO_CIRCLES - 1 },
          opacity: { duration: 0.4 },
        }}
      />
    </div>
  );
}
