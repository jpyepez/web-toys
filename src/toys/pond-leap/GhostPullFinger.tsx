import { motion } from 'motion/react';
import { DEMO_PULL_MS, DEMO_PULLS, DEMO_TIMES } from './demo';
import { palette } from './palette';

/**
 * The idle Pull demo's ghost: a soft fingertip that presses the frog, draws it
 * back along the rail (`back` px, already pointing away from the next pad) and
 * lets go. Purely visual: it never touches the real Pull state.
 */
export function GhostPullFinger({
  at,
  back,
}: {
  at: { left: string; top: string };
  back: { x: number; y: number };
}) {
  return (
    <div
      data-ghost-pull-finger=""
      aria-hidden="true"
      style={{ position: 'absolute', ...at, width: 0, height: 0, pointerEvents: 'none', zIndex: 3 }}
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
        initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
        animate={{
          x: [0, 0, back.x, back.x, back.x],
          y: [0, 0, back.y, back.y, back.y],
          // presses in, holds through the draw, lifts off on the let-go
          scale: [1, 0.85, 0.85, 1, 1],
          opacity: [0, 0.8, 0.8, 0.3, 0],
        }}
        transition={{
          duration: DEMO_PULL_MS / 1000,
          times: DEMO_TIMES,
          ease: 'easeInOut',
          repeat: DEMO_PULLS - 1,
        }}
      />
    </div>
  );
}

/** How many dots trace the leap arc. */
const ARC_DOTS = 7;
/** How high the arc bows above the straight line between the pads, in stage %. */
const ARC_LIFT = 8;

/**
 * The dotted arc from the frog's pad to the next one: where the frog will fly.
 * Small paper dots on the water, well under 1/8 of the frog, so they read as a
 * trail and never as something to grab.
 */
export function LeapArc({
  from,
  to,
  toIndex,
}: {
  from: readonly [number, number];
  to: readonly [number, number];
  toIndex: number;
}) {
  const [x0, y0] = [from[0] * 100, from[1] * 100];
  const [x2, y2] = [to[0] * 100, to[1] * 100];
  const [x1, y1] = [(x0 + x2) / 2, Math.min(y0, y2) - ARC_LIFT];
  const dots = Array.from({ length: ARC_DOTS }, (_, k) => {
    // skip the two ends: they sit under the frog and the pad
    const t = (k + 1) / (ARC_DOTS + 1);
    const u = 1 - t;
    return { x: u * u * x0 + 2 * u * t * x1 + t * t * x2, y: u * u * y0 + 2 * u * t * y1 + t * t * y2 };
  });
  return (
    <div data-leap-arc={toIndex} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      {dots.map((d, k) => (
        <motion.div
          key={k}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.2, delay: k * 0.03 }}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
            borderRadius: '50%',
            background: palette.paper,
            // a thin contour ring, so the trail reads on pale water and on a pad
            boxShadow: `0 0 0 2px ${palette.contour}59`,
          }}
        />
      ))}
    </div>
  );
}
