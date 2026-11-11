import { motion } from 'motion/react';

/** One demo stroke: how long it takes (s) and how far the finger travels (px). */
export const DEMO_STROKE_S = 1.6;
export const DEMO_STROKE_PX = 110;

/**
 * Wordless Swipe demo: a translucent fingertip presses on a standing penguin,
 * draws a plain stroke and fades. Purely visual — it is `pointer-events: none`,
 * `aria-hidden`, and never touches a penguin's state. Its own copy, per
 * `docs/out-of-scope/shared-toy-loop-abstraction.md`; the look is the art ticket's.
 */
export function GhostSwipeFinger({ left, top }: { left: string; top: string }) {
  return (
    <div
      data-ghost-swipe-finger=""
      aria-hidden="true"
      style={{ position: 'absolute', left, top, pointerEvents: 'none', overflow: 'visible' }}
    >
      <motion.div
        initial={{ x: 0, opacity: 0 }}
        animate={{ x: [0, 0, DEMO_STROKE_PX, DEMO_STROKE_PX], opacity: [0, 0.6, 0.6, 0] }}
        transition={{ duration: DEMO_STROKE_S, times: [0, 0.2, 0.8, 1], ease: 'easeOut', repeat: Infinity, repeatDelay: 0.6 }}
        style={{
          width: 36,
          height: 36,
          marginLeft: -18,
          marginTop: -18,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 0 0 3px rgba(255,255,255,0.5)',
        }}
      />
    </div>
  );
}
