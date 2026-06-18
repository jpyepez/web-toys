import { useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import type { ToyProps } from '../../shell/registry';
import { timing } from '../../shell/tokens';
import { FishDrawing } from './FishDrawing';
import { UnderwaterBackdrop } from './UnderwaterBackdrop';
import { puff } from './sounds';

/** How many fish make up the Goal. Sized for ~15–30s of kid-paced loops. */
const FISH_COUNT = 5;

/**
 * Per-fish beat durations (ms). The state machine drains its current timer
 * when each beat completes; transitions are time-driven except `waiting →
 * dismissing` (the kid's tap). Exact ms is on-device-tuned per the slice DoD
 * — the structural rule is the named beats. Own copies, duplicated from the
 * Sheep's machine rather than shared.
 */
const TIMING_ARRIVAL_MS = 500;
// Exported so the registry holds the Shell's Completion for this final-Fish
// puff-then-float exit beat before the dialogue lands.
export const TIMING_DISMISS_MS = 1100;
const TIMING_INTERMISSION_MS = 250;

/**
 * The five states of the per-fish loop — its OWN copy, duplicated from the
 * Counting Sheep machine rather than shared (the deliberate cost of Toy
 * independence; a shared/extracted Toy-loop hook is explicitly rejected, see
 * `../../out-of-scope/shared-toy-loop-abstraction.md`).
 *
 *  - `arriving`   — current fish swimming in from the side
 *  - `waiting`    — current fish centred, awaiting the kid's tap
 *  - `dismissing` — current fish puffed + ballooning + floating up off the top
 *  - `idle`       — no fish on stage; intermission beat between fish
 *  - `completed`  — N fish popped; loop terminal, `onComplete` fired
 */
type LoopState = 'arriving' | 'waiting' | 'dismissing' | 'idle' | 'completed';

/**
 * Motion variants for the fish's per-state choreography (slice spec body):
 * the fish swims in from the side, waits centred, then on tap balloons up in
 * place (~1.6×) with a wobble and translates upward off the top of the screen
 * with a fade — buoyant, not a sideways slide, not a pop/destroy. The
 * choreography consumes the shared `timing.entrance` ease; tuples and offsets
 * are on-device-tuned per the slice testing decisions and deliberately NOT
 * unit-asserted — the structural rule is the three named beats sourcing their
 * ease from `timing`.
 *
 * Transform-ownership gotcha (user-memory `motion-transform-ownership`, caught
 * on the Sheep): the centring `translateX(-50%)` lives on a static non-Motion
 * wrapper; this Motion element carries only its `x`/`y`/`scale` deltas, which
 * Motion fully owns. The upward float is a `y` translate (off the top) — a
 * negative offset large enough to clear a 390×844 phone from the resting
 * position. The balloon is a `scale` keyframe wobbling up before the float
 * carries the fish away; the puff art swap (`puffed` prop) is keyed to the
 * same `dismissing` state.
 */
const fishVariants: Variants = {
  arriving: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    transition: { duration: TIMING_ARRIVAL_MS / 1000, ease: timing.entrance },
  },
  waiting: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    transition: { duration: 0 },
  },
  dismissing: {
    x: 0,
    // Three sub-beats, in order, so the puff is savoured before the exit:
    //   1. balloon — scale wobbles up to ~1.7× then settles at 1.6× while the
    //      fish stays put (y:0) and fully opaque (puff is clearly seen).
    //   2. hold    — a brief beat at full puff, still and opaque.
    //   3. float   — the `y` carries the puffed fish up and off the top
    //      (-900 clears a tall phone from the resting position).
    // The fade is deliberately held until the float is nearly done (opacity
    // stays 1 until 0.88) so the fish never dissolves before the kid registers
    // the puff — by the time it fades it's already most of the way off the top
    // edge, leaving only a final sliver to vanish.
    scale: [1, 1.7, 1.6, 1.6, 1.6, 1.6, 1.6],
    y: [0, 0, 0, 0, -350, -650, -900],
    opacity: [1, 1, 1, 1, 1, 1, 0],
    transition: {
      duration: TIMING_DISMISS_MS / 1000,
      ease: timing.entrance,
      times: [0, 0.18, 0.32, 0.45, 0.7, 0.88, 1],
    },
  },
};

/**
 * Puffer Fish — an underwater scene that sends one fish at a time onto the
 * stage for the kid to tap. The state machine bootstraps to `arriving`: one
 * fish swims in immediately, queryable as the accessible button labelled
 * "Fish".
 */
export function PufferFish({ onComplete, sound, haptics }: ToyProps) {
  const [state, setState] = useState<LoopState>('arriving');
  // Counts the fish the kid has popped. Increments on each `waiting →
  // dismissing` transition (the tap). Reaching FISH_COUNT is the Goal-met
  // signal: `onComplete` fires once and the loop terminates.
  const [popped, setPopped] = useState(0);
  // ADR-0001 amendment: `onComplete` is a one-shot. The ref guards against a
  // re-render with a new `onComplete` reference (which the Shell does the
  // moment Completion starts) re-firing the effect.
  const completedRef = useRef(false);

  const goalMet = popped >= FISH_COUNT;

  useEffect(() => {
    if (state === 'arriving') {
      const timer = setTimeout(() => setState('waiting'), TIMING_ARRIVAL_MS);
      return () => clearTimeout(timer);
    }
    if (state === 'dismissing') {
      // The Goal-met float-away (Nth fish's exit) hands off to the terminal
      // `completed` state rather than back into the loop — AC #4: no further
      // fish mounts underneath the Shell's celebration overlay.
      const next: LoopState = goalMet ? 'completed' : 'idle';
      const timer = setTimeout(() => setState(next), TIMING_DISMISS_MS);
      return () => clearTimeout(timer);
    }
    if (state === 'idle') {
      const timer = setTimeout(() => setState('arriving'), TIMING_INTERMISSION_MS);
      return () => clearTimeout(timer);
    }
  }, [state, goalMet]);

  // Fire `onComplete` once when the Goal is met. Kept in its own effect so the
  // Shell re-rendering with a new `onComplete` reference (which happens the
  // moment Completion starts) doesn't double-fire — the completedRef pins it
  // to a single call.
  useEffect(() => {
    if (!goalMet || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [goalMet, onComplete]);

  // `idle` is the intermission gap — no fish on stage, matching AC #1's
  // "length ≤ 1" across the states (= 0 here).
  const fishOnStage = state === 'arriving' || state === 'waiting' || state === 'dismissing';

  return (
    <main
      data-toy-state={state}
      style={{
        position: 'relative',
        minHeight: '100dvh',
        // The seabed band's height — shared with UnderwaterBackdrop's
        // bottom-anchored sand layer (which reads `var(--ocean-floor)`) and its
        // coral. Defining it on the common ancestor keeps the sand line at a
        // fixed fraction of the viewport across aspect ratios (ADR-0005); a
        // shorter band than the meadow's ground since it's just a seabed strip.
        // The Fish floats in open water above it, so it keeps its own
        // viewport-relative resting position (`top: 42%`).
        ['--ocean-floor' as string]: 'clamp(150px, 26dvh, 360px)',
      }}
    >
      <UnderwaterBackdrop />
      {fishOnStage && (
        // Static centring wrapper. The `motion.button` inside drives `x`/`y`/
        // `scale` through its variants, so Motion fully owns the button's
        // `transform` — any inline `translateX(-50%)` on the button itself
        // would get clobbered the moment Motion writes its first transform
        // string (the gotcha caught on the Sheep). Splitting the centring
        // (here) from the per-state deltas (the button) keeps each transform
        // owned by exactly one thing: the wrapper's `translateX(-50%)` never
        // changes; the button's deltas compose with that fixed centring at
        // paint time. No Motion props on the wrapper — it's a static
        // positioning shell, not part of the choreography.
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '42%',
            transform: 'translateX(-50%)',
          }}
        >
          <motion.button
            // No React `key` here on purpose. `initial` (the off-left swim-in)
            // must run at every arrival, but it already does: the `idle` beat
            // unmounts the button (`fishOnStage` is false), so each new fish is
            // a genuinely fresh mount. Keying on `popped` instead would remount
            // the button on the *tap* (popped increments as `waiting →
            // dismissing` fires), so the dismiss would play on a brand-new node
            // starting from the swim-in `initial` — the fish slides back in
            // from the left, half-off-screen, while ballooning away. Letting
            // the existing node carry `waiting → dismissing` makes the balloon +
            // float-up animate in place, which is the signature beat.
            type="button"
            aria-label="Fish"
            variants={fishVariants}
            // Off-stage-left starting position for the swim-in. Combined with
            // the `arriving` variant's `x: 0`, Motion eases from -280 to 0 over
            // TIMING_ARRIVAL_MS using `timing.entrance`. The wrapper already
            // centres the resting position, so these deltas are relative to
            // centre — `x: 0` lands centred.
            initial={{ x: -280, opacity: 0, scale: 1 }}
            animate={state}
            // A small press-scale on tap: the fish squashes in slightly under
            // the finger, then releases into the balloon beat — a natural
            // anticipation before the puff. `whileTap` composes with the
            // variant transform and is auto-disabled under reduced motion by
            // the app-root MotionConfig. Kept gentle (0.96) so it reads as a
            // squash, not a competing shrink against the balloon's scale-up.
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              // Every tap gets the playful feedback — the puff voice + a haptic
              // tick — whether or not it counts (slice #08). A kid mashing the
              // screen mid-swim still hears the puff; the `waiting`-only guard
              // below blocks the state advance, not the feedback. Mirrors the
              // Sheep's `baa` + tick posture. Audio rides solely through the
              // injected `Sound.play(voice)` — the fish never touches Web Audio
              // (ADR-0003) — and both utilities are optional, so a bare mount
              // degrades to silence.
              sound?.play(puff);
              haptics?.tick();
              // Only `waiting` accepts the state advance — re-taps during other
              // beats are non-destructive no-ops (AC #3).
              if (state !== 'waiting') return;
              setPopped((p) => p + 1);
              setState('dismissing');
            }}
            style={{
              transformOrigin: 'center center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              // Kill the mobile tap-highlight + focus outline. Without this,
              // iOS/Android paint `-webkit-tap-highlight-color` (a translucent
              // dark overlay) across the button's full bounding box — the
              // 220px SVG *square* — on tap: it darkens the fish and shows as a
              // translucent square around it as the button balloons up. The
              // critter art is the only thing that should be visible.
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
              WebkitTouchCallout: 'none',
            }}
          >
            {/* The signature beat: the fish flips to the puffed art the moment
             * it starts floating away. "Puffed" lives in the `dismissing`
             * state, not on the fish — mirrors how the Sheep's done-glow lives
             * in its dismissing beat. */}
            <FishDrawing puffed={state === 'dismissing'} />
          </motion.button>
        </div>
      )}
    </main>
  );
}
