import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BalloonDrawing } from './BalloonDrawing';
import { palette } from './palette';

/**
 * The Hold — the second non-tap core interaction in the collection (CONTEXT;
 * balloons PRD / slice #03). A single balloon the child fills with a sustained,
 * stationary finger-press: while held its fill rises; it self-caps at full and
 * detaches + floats up; an early lift leaks it slowly back down — forgiving,
 * never a reset. End-to-end on ONE balloon; the bunch/loop/`onComplete` is slice
 * #04, so this component owns no callbacks yet.
 *
 * Fill lives here as a continuous 0→1 value driving the stateless
 * `BalloonDrawing`'s `fill` prop (swell + sad→happy face). Time is the boundary:
 * a frame-tick ramps the value while held. Fill and the per-balloon state are
 * exposed on the surface as `data-balloon-fill` / `data-balloon-state` so tests
 * assert at the value boundary, never via pixels or wall-clock (slice AC #5).
 */

// Frame cadence and the on-device-tuned ramp. Like the blob count / clean
// threshold of the Wipe, these are tuned by feel and deliberately NOT asserted
// (slice Notes); tests advance time generously to cross the cap, never pinning
// the rate. FILL fast (~2.5s to full); LEAK slower (the load-bearing asymmetry —
// lifting is forgiving, not a reset), so a released balloon sags back gently.
const TICK_MS = 16;
const FILL_PER_MS = 1 / 2500;
const LEAK_PER_MS = 1 / 4000;

// The float-away (the ending — on-device revision of slice #5's gather Outro).
// A self-capped balloon rises up and OFF the top of the screen and is gone —
// no gathering, no lingering, no cluster bob. `FLOAT_AWAY_Y` is well past the
// top edge so the balloon leaves view at every aspect ratio, and it fades as it
// goes so it never lurks just off-screen. The Shell's Completion celebrates once
// the LAST balloon has left (the bunch fires `onComplete` on the final detach,
// independent of this art). The rise height/duration are on-device-tuned and
// deliberately NOT asserted — the tested contract is the terminal `floating`
// state. Large positional motion is auto-dropped under prefers-reduced-motion by
// the app-root MotionConfig (main.tsx), so this needs no per-Toy reduced-motion
// gate; the state is set on self-cap regardless, so the ending never strands.
const FLOAT_AWAY_Y = '-120vh';
const FLOAT_AWAY_MS = 2200;

// The "this is the one you're holding" cue (slice #03 on-device polish). With the
// balloons overlapping in a bunch it was unclear which one a press had grabbed,
// so while held the active balloon LIFTS out of the cluster, swells a touch
// EXTRA (on top of the fill swell), and gains a soft glow ring — and stacks above
// its neighbours so it's unmistakably the active one. `HOLD_Z` is the only piece
// the test pins (an elevation appears while held); the lift / scale / glow tuples
// are on-device-tuned and deliberately NOT asserted, like the fill rate and the
// gather choreography. The lift/scale ride Motion's `animate` (so they ease in
// and back out); the glow is an instant style toggle.
const HOLD_Z = 30;
const HOLD_LIFT_Y = -10;
const HOLD_SCALE = 1.12;

// The dwell that marks a press as a real Hold rather than a tap (slice #06): the
// fill must climb past this fraction WHILE held before `onHold` fires. A flick or
// tap barely moves the fill and so never trips it — that asymmetry is the whole
// point, since the idle demo exists to teach DURATION, not a tap (slice intro).
// On-device-tuned (like the fill rate / leak), deliberately NOT asserted; tests
// dwell generously past it. ~0.12 ≈ a third of a second of continuous holding.
const HOLD_DWELL_FILL = 0.12;

export function HoldableBalloon({
  color = palette.balloon1,
  onFloat,
  onHold,
  onFillProgress,
  onLeak,
}: {
  /** Balloon body colour, from slice #1's palette (`palette.balloon1`…`5`). */
  color?: string;
  /**
   * Fired ONCE at the `limp → floating` self-cap transition — how the bunch
   * (slice #4) learns this balloon has detached, so it can count floats toward
   * the Goal. Internal to the Toy, not a Shell↔Toy surface; optional, so a bare
   * single-balloon mount (slice #3's tests) degrades to a self-contained Hold
   * with no callback. The transition is terminal (`floating` never reverts), so
   * this never fires twice for one balloon.
   */
  onFloat?: () => void;
  /**
   * Fired ONCE the first time this balloon is held long enough to count as a
   * real, sustained Hold — the fill climbing past `HOLD_DWELL_FILL` while pressed
   * (slice #06). How the bunch learns the child is Holding for real, so it can
   * cancel + suppress the idle teaching demo. A bare tap never trips it (the fill
   * barely moves), so tapping doesn't suppress the very teaching a tapper needs.
   * Optional, like the others, so a bare single-balloon mount still works.
   */
  onHold?: () => void;
  /**
   * Fired on each fill step WHILE the balloon is actively being inflated (held,
   * still `limp`, fill climbing), carrying the current fill 0→1 — how the bunch
   * (slice #07) voices the inflate as rising-pitch pips + a haptic beat. The
   * parent rate-limits these one-shots into the rising tone; this component just
   * reports the progress and owns no audio (ADR-0003). Optional, like the others,
   * so a bare single-balloon mount still works.
   */
  onFillProgress?: (fill: number) => void;
  /**
   * Fired when the press is released EARLY — while still `limp` with a partly
   * inflated balloon (fill above zero, short of the cap) — so the bunch can voice
   * the descending raspberry of an early lift (slice #07). A bare tap that never
   * moved the fill, or a release after the self-cap (already `floating`), does
   * not trip it. Optional, like the others, so a bare single-balloon mount works.
   */
  onLeak?: () => void;
}) {
  const [fill, setFill] = useState(0);
  const [held, setHeld] = useState(false);
  // The balloon's own state through its full lifecycle:
  //  - `limp`     — attached to the peg (any fill < 1), fillable.
  //  - `floating` — self-capped and detached; rising up and off the screen.
  //                 TERMINAL — the balloon is gone; it never re-attaches or
  //                 leaks back (the on-device ending: balloons leave the screen
  //                 rather than gathering at the top).
  const [phase, setPhase] = useState<'limp' | 'floating'>('limp');

  // The fill ramp: while held it steps up (clamped at the cap); on release it
  // leaks slowly back down until empty. The frame-tick runs while attached and
  // there's motion — held, or still draining — and stops at rest (released and
  // empty) or once detached (floating freezes the fill at full).
  const active = phase === 'limp' && (held || fill > 0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setFill((prev) =>
        held
          ? Math.min(1, prev + FILL_PER_MS * TICK_MS)
          : Math.max(0, prev - LEAK_PER_MS * TICK_MS),
      );
    }, TICK_MS);
    return () => clearInterval(id);
  }, [active, held]);

  // Report each fill step while actively inflating (slice #07) so the bunch can
  // voice the rising-pitch pips + haptic beat. Fires only while held and still
  // `limp` with a non-zero fill — never during the leak-back (not held) or after
  // detach. The parent throttles these into the rising tone; this component owns
  // no audio (ADR-0003).
  useEffect(() => {
    if (held && phase === 'limp' && fill > 0) onFillProgress?.(fill);
  }, [held, phase, fill, onFillProgress]);

  // Detect a real, sustained Hold (slice #06): once the fill has climbed past
  // the dwell threshold while pressed, notify the bunch ONCE so it can cancel +
  // suppress the idle teaching demo. A one-shot ref latches it — a tap whose fill
  // never reaches the threshold (and then leaks back) never fires it, which is
  // the load-bearing distinction (teach duration, not a tap).
  const heldDwellRef = useRef(false);
  useEffect(() => {
    if (held && phase === 'limp' && fill >= HOLD_DWELL_FILL && !heldDwellRef.current) {
      heldDwellRef.current = true;
      onHold?.();
    }
  }, [held, phase, fill, onHold]);

  // Self-cap: the instant fill reaches full, the balloon detaches and floats,
  // notifying the bunch (slice #4) of the detach. Holding past full is therefore
  // a no-op — the ramp has already stopped and `floating` is terminal, so the
  // transition (and `onFloat`) happen exactly once.
  useEffect(() => {
    if (fill >= 1 && phase === 'limp') {
      setPhase('floating');
      onFloat?.();
    }
  }, [fill, phase, onFloat]);

  // Any end of the press releases the hold. If it ends EARLY — while still
  // attached and partly inflated — that is an early lift, so notify the bunch to
  // voice the deflate raspberry (slice #07) before the leak-back begins. Guarded
  // on `held` so a stray release event without an active press never fires it,
  // and on `phase === 'limp'` so a release after the self-cap (already floating)
  // is a no-op, not a phantom leak.
  const release = () => {
    if (held && phase === 'limp' && fill > 0) onLeak?.();
    setHeld(false);
  };

  return (
    <div
      data-holdable-balloon=""
      data-balloon-fill={fill}
      data-balloon-state={phase}
      // `touch-action: none` so the browser doesn't hijack the press for
      // scroll/zoom — the Hold gets every pointer move (slice spec). While held
      // the balloon stacks ABOVE its neighbours (`position: relative` + a raised
      // `z-index`) so the one being inflated lifts clear of the overlapping bunch
      // — the on-device "which balloon?" fix. The elevation clears on release.
      //
      // `pointer-events: none` makes this wrapper's large RECTANGLE transparent
      // to taps so it can't steal a press meant for an overlapping neighbour;
      // only the painted balloon shape re-enables the press (BalloonDrawing's
      // `interactive`). The press still fires this div's handlers — it bubbles up
      // from the shape through this pointer-transparent ancestor. (`fireEvent` in
      // the tests dispatches directly, so the unit tests are unaffected.)
      style={{
        touchAction: 'none',
        position: 'relative',
        zIndex: held ? HOLD_Z : undefined,
        pointerEvents: 'none',
      }}
      // A detached balloon ignores further pointers — no over-inflate, no reset.
      onPointerDown={() => phase === 'limp' && setHeld(true)}
      // Any end of the press releases the hold — a lifted, cancelled, or lost
      // pointer all stop the fill, so a balloon can never get stuck inflating
      // after the finger is gone (on-device robustness; pointer-capture/cancel
      // aren't observable in jsdom, like the Wipe's capture release).
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      {/* The float-away. On detach (`floating`) the balloon rises up and OFF the
       * top of the screen, swaying as it goes and fading out — it is gone, not
       * gathered. The rise/sway/fade tuples are on-device-tuned and deliberately
       * not asserted — the tested contract is the terminal `floating` STATE. */}
      <motion.div
        // Scale from the knot at the bottom so the lift/swell grows the crown
        // upward while the string stays anchored. The glow ring is an instant
        // toggle (decorative, on-device-tuned) layered under the eased lift/scale,
        // shown only while actively held (not once it has detached and floats off).
        style={{
          transformOrigin: 'center bottom',
          filter: held && phase === 'limp' ? `drop-shadow(0 0 9px ${palette.sparkle})` : undefined,
        }}
        animate={
          phase === 'limp'
            ? // While held: lift + extra swell so the active balloon pops clear of
              // the bunch (on-device "which balloon?" cue). `scale` resets to 1 and
              // `opacity` to 1 in the floating phase below so a re-render mid-float
              // doesn't strand either value.
              { y: held ? HOLD_LIFT_Y : 0, x: 0, scale: held ? HOLD_SCALE : 1, opacity: 1 }
            : // floating: rise up and off the top, sway a little, and fade out.
              { y: FLOAT_AWAY_Y, x: [0, -14, 10, 0], scale: 1, opacity: 0 }
        }
        transition={
          phase === 'floating'
            ? { duration: FLOAT_AWAY_MS / 1000, ease: 'easeIn' }
            : { duration: 0.2, ease: 'easeOut' }
        }
      >
        <BalloonDrawing fill={fill} color={color} interactive />
      </motion.div>
    </div>
  );
}
