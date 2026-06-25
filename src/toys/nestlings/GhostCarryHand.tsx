import { motion } from 'motion/react';
import { BirdDrawing } from './BirdDrawing';

/**
 * The wordless ghost-hand CARRY demo's visual (nestlings PRD, slice #06). When a
 * child stalls without picking a bird up, `Nestlings` mounts this to SHOW them the
 * gesture: a translucent hand presses a faint demo bird, CARRIES it along a path
 * across the dusk scene to the nest, releases, and the loop reforms back at the
 * start. It teaches the pick-up-AND-carry — a travelling gesture, not a tap and
 * not a stationary dwell.
 *
 * This is a deliberate COPY, not a shared primitive lifted from Balloons'
 * `GhostHoldFinger` or Muddy Puddle's `GhostFinger` (slice Notes; the
 * `shared-toy-loop-abstraction` precedent — don't pre-abstract a wordless-teaching
 * helper on its third appearance). It shares the *idea* but teaches a different
 * gesture: a carry along a path, not a dwell-in-place and not a sweep.
 *
 * Honest, like its cousins: it draws its OWN faint demo bird and never touches a
 * real `CarriableBird`'s state — the zero-net-progress invariant is pinned in
 * `idle-drag-demo.test.tsx`; this file only paints the hint. Code-drawn SVG +
 * synthesised motion only (ADR-0002). It is `pointer-events: none` so it never
 * intercepts a real carry underneath, and `aria-hidden` (a visual nudge, not
 * content). Reduced motion is honoured app-wide by the root `MotionConfig
 * reducedMotion="user"` (as the other Toys rely on): under it Motion suppresses
 * the carry travel, so a motion-sensitive child sees a static hand-on-bird hint
 * rather than a moving one. Position, path and timing are on-device-tuned per the
 * slice DoD and deliberately NOT unit-asserted (slice Notes); the structural
 * contract is "a ghost hand appears while `demoActive`".
 */

// The carry cycle: pick the bird up at rest (a), carry it along to the nest (b),
// release and let the hand lift away (c), then fade and reform back at the start.
// The shared `times` keep the hand's grip, the bird's travel and the fade locked
// together as one gesture. All on-device-tuned, not asserted.
const CYCLE_S = 3.4;
const CYCLE_TIMES = [0, 0.12, 0.7, 0.85, 1];
// The one shared transition for the whole demo: it locks the hand, the carried
// bird and the fade on a single looping clock, so they travel and reform together
// rather than drifting out of phase.
const cycle = { duration: CYCLE_S, ease: 'easeInOut', times: CYCLE_TIMES, repeat: Infinity } as const;

// The carry path (DOM px, relative to the demo's start anchor): the bird lifts off
// its rest spot up top and travels DOWN (and slightly toward centre) to the nest
// in the lower band, then the keyframe holds at the nest through the release before
// reforming. The long downward travel mirrors the real gesture now that the birds
// wait up in the sky and the nest sits at the bottom. On-device-tuned offsets,
// tuned on a 390×844 phone; approximate on other sizes (a decorative hint, not a
// snap), and dropped entirely under reduced motion (root MotionConfig).
const PATH_X = [0, 6, 60, 64, 0];
const PATH_Y = [0, -14, 470, 474, 0];

export function GhostCarryHand() {
  return (
    <div
      data-ghost-carry-hand=""
      aria-hidden="true"
      // Sits over a bird's rest spot up in the UPPER band (near the robin's
      // start), pinned so the demo lifts from where a real fledgling waits and
      // carries down to the nest in the lower band. Offsets on-device-tuned.
      style={{
        position: 'absolute',
        left: '26%',
        top: '15%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {/* The faint demo bird carried along the path — its OWN art (slice #2's
       * `BirdDrawing`), never a real lifecycle. The shared `x`/`y` keyframes carry
       * it to the nest and back; the opacity pulse keeps it reading as a
       * translucent hint, not a sixth fledgling. */}
      <motion.div
        style={{ opacity: 0.5, transformOrigin: '50% 60%' }}
        animate={{
          x: PATH_X,
          y: PATH_Y,
          opacity: [0, 0.5, 0.5, 0.4, 0],
          scale: [0.9, 1.04, 1.04, 1, 0.9],
        }}
        transition={cycle}
      >
        <BirdDrawing species="robin" carried />
      </motion.div>

      {/* The translucent ghost hand gripping the bird's back and carrying it along
       * the same path, looping in sync so the grip and the travel move as one
       * gesture. Anchored just above the demo bird's contact point. */}
      <motion.div
        style={{ position: 'absolute', left: '50%', top: '6%' }}
        animate={{ x: PATH_X, y: PATH_Y }}
        transition={cycle}
      >
        <svg
          width="72"
          height="68"
          viewBox="0 0 72 68"
          style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-46%, -70%)' }}
        >
          {/* soft contact halo where the hand cups the bird */}
          <ellipse cx="36" cy="58" rx="20" ry="7" fill="white" opacity="0.22" />
          {/* the cupped hand — a soft translucent mitt that picks the bird up */}
          <path
            d="M14 30 Q12 14 22 14 Q24 6 32 8 Q34 2 42 6 Q50 4 52 14 Q64 16 62 32 Q60 52 36 58 Q16 54 14 30 Z"
            fill="white"
            fillOpacity="0.5"
            stroke="white"
            strokeOpacity="0.7"
            strokeWidth="1.5"
          />
          {/* knuckle highlight, for a touch of dimension */}
          <ellipse cx="38" cy="22" rx="9" ry="7" fill="white" opacity="0.4" />
        </svg>
      </motion.div>
    </div>
  );
}
