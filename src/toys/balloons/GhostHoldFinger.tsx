import { motion } from 'motion/react';
import { BalloonDrawing } from './BalloonDrawing';
import { palette } from './palette';

/**
 * The wordless ghost-finger HOLD demo's visual (balloons PRD, slice #06). When a
 * child stalls without Holding, `Balloons` mounts this to SHOW them the gesture:
 * a translucent finger presses a faint demo balloon and DWELLS — staying put —
 * while the balloon visibly swells partway, then lifts and lets it sag back; the
 * swell REFORMS and the cycle loops. It teaches DURATION (a sustained press), not
 * a tap.
 *
 * This is a deliberate COPY, not a shared primitive lifted from Muddy Puddle's
 * `GhostFinger` (slice Notes; the `shared-toy-loop-abstraction` precedent — don't
 * pre-abstract a wordless-teaching helper on its second appearance). It shares
 * the *idea* but teaches a different gesture: a stationary dwell, not a sweep.
 *
 * Honest, like its Muddy Puddle cousin: it draws its OWN faint demo balloon and
 * never touches a real `HoldableBalloon`'s state — the zero-net-progress
 * invariant is pinned in `idle-hold-demo.test.tsx`; this file only paints the
 * hint. Code-drawn SVG + synthesised motion only (ADR-0002). It is
 * `pointer-events: none` so it never intercepts a real Hold underneath, and
 * `aria-hidden` (a visual nudge, not content). Reduced motion is honoured app-
 * wide by the root `MotionConfig reducedMotion="user"` (as Sheep/Fish rely on):
 * under it Motion suppresses the dwell bob + swell, so a motion-sensitive child
 * sees a static finger-on-balloon hint rather than a moving one. Position, timing
 * and the swell/dwell curve are on-device-tuned per the slice DoD and
 * deliberately NOT unit-asserted (slice Notes); the structural contract is "a
 * ghost finger appears while `demoActive`".
 */

// The dwell cycle: swell up (the Hold lands), DWELL at the top, then sag back and
// reform. The shared `times` keep the finger's press, the balloon's swell and the
// fade locked together. All on-device-tuned, not asserted.
const CYCLE_S = 2.8;
const CYCLE_TIMES = [0, 0.45, 0.7, 1];
// The one shared transition for the whole demo: it locks the finger's press, the
// balloon's swell and the fade together on a single looping clock, so they rise
// and reform as one gesture rather than drifting out of phase.
const cycle = { duration: CYCLE_S, ease: 'easeInOut', times: CYCLE_TIMES, repeat: Infinity } as const;

export function GhostHoldFinger() {
  return (
    <div
      data-ghost-hold-finger=""
      aria-hidden="true"
      // Sits over the bunch's mid-zone (matching the balloons' fan), pinned so the
      // demo presses where a real balloon waits. Offsets on-device-tuned.
      style={{
        position: 'absolute',
        left: '48%',
        top: '34%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {/* The faint demo balloon — its OWN art (slice #1/#3's `BalloonDrawing`),
       * never a real lifecycle. A `scale` keyframe mimes the fill swelling partway
       * (short of the self-cap, so it never reads as "done") and reforming; the
       * opacity pulse keeps it reading as a translucent hint, not a sixth balloon.
       * Drawn at a mid, happy fill so the swell shows a plumping, smiling balloon —
       * the reward the Hold earns. */}
      <motion.div
        style={{ opacity: 0.5, transformOrigin: '50% 90%' }}
        animate={{ scale: [0.82, 1, 1, 0.82], opacity: [0.35, 0.55, 0.55, 0.35] }}
        transition={cycle}
      >
        <BalloonDrawing fill={0.55} color={palette.balloon3} />
      </motion.div>

      {/* The translucent ghost finger pressing the balloon's crown and DWELLING —
       * a small in-place push/settle (not a sweep), looping in sync with the swell
       * so the press and the plumping rise together. Anchored at the contact
       * point near the top of the demo balloon. */}
      <motion.div
        style={{ position: 'absolute', left: '50%', top: '8%' }}
        animate={{ y: [0, 7, 7, 0] }}
        transition={cycle}
      >
        <svg
          width="56"
          height="80"
          viewBox="0 0 56 80"
          style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-46%, -86%)' }}
        >
          {/* soft contact halo where the tip meets the balloon */}
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
