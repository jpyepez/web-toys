import { useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import type { ToyProps } from '../../shell/registry';
import { timing } from '../../shell/tokens';
import { FLEECES } from './palette';
import { MeadowBackdrop } from './MeadowBackdrop';
import { SheepDrawing, FOOT_OFFSET, SHEEP_WIDTH } from './SheepDrawing';
import { useMeadowScene } from './useMeadowScene';
import { baa } from './sounds';

/** How many Sheep make up the Goal. Sized for ~15–30s of kid-paced loops. */
const SHEEP_COUNT = 5;

/**
 * Per-Sheep beat durations (ms). The state machine drains its current
 * timer when each beat completes; transitions are time-driven except
 * `waiting → dismissing` (the kid's tap). Exact ms is on-device-tuned
 * per the slice DoD — the structural rule is "three named beats."
 */
const TIMING_ARRIVAL_MS = 400;
// Lengthened from 700 → 1100 to give the dismiss beat a savour-the-glow linger
// before the Sheep slides off (mirrors the Puffer Fish's puff-then-float exit,
// which the kid handoff liked). The extra ~400ms is the hold in the middle of
// the choreography, not a slower hop — see the `dismissing` variant. Exported
// so the registry holds the Shell's Completion for this final-Sheep exit beat.
export const TIMING_DISMISS_MS = 1100;
const TIMING_INTERMISSION_MS = 200;

/**
 * The five states of the per-Sheep loop (mobile-rethink PRD, slice #01).
 *  - `arriving`   — current Sheep sliding in from the left
 *  - `waiting`    — current Sheep centred, awaiting the kid's tap
 *  - `dismissing` — current Sheep hopping and sliding off-stage to the right
 *  - `idle`       — no Sheep on stage; intermission beat between Sheep
 *  - `completed`  — five Sheep dismissed; loop terminal, `onComplete` fired
 *
 * The only user-driven transition is `waiting → dismissing` (the tap); the
 * rest are time-driven by the beat durations above.
 */
type LoopState = 'arriving' | 'waiting' | 'dismissing' | 'idle' | 'completed';

/**
 * Motion variants for the Sheep's per-state choreography (slice spec body —
 * "arriving Sheep slides in from the left with a soft ease … dismissing
 * Sheep does a brief rise-fall hop with the done-glow blooming, then
 * slides off-stage to the right with a fade"). Tuples and offsets are
 * on-device-tunable per the slice testing decisions; the structural rule
 * is the three named beats (arriving, waiting, dismissing) and that they
 * source their ease from `timing.entrance`.
 *
 * Sliding offsets (`x: -260` / `x: 280`) are pixel-units chosen to clear a
 * 390px phone viewport from the centred resting position; on a wider
 * desktop viewport they still read as "comes in from the side." Hop is a
 * keyframe at 40% of the dismiss beat so the slide-off happens after the
 * fleece pops.
 */
const sheepVariants: Variants = {
  arriving: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: { duration: TIMING_ARRIVAL_MS / 1000, ease: timing.entrance },
  },
  waiting: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: { duration: 0 },
  },
  dismissing: {
    // Four sub-beats, in order, so the done-glow is savoured before the exit
    // (mirrors the Puffer Fish's puff → linger → float):
    //   1. hop    — a brief rise-fall while the glow blooms in the fleece.
    //   2. linger — the Sheep holds centred, glow lit, fully opaque (the kid
    //               registers the warm light before it leaves).
    //   3. slide  — the Sheep bounds off-stage to the right…
    //   4. fade   — …and only THEN dissolves.
    //
    // The fade is a SEPARATE, delayed `opacity` tween — deliberately decoupled
    // from the x/y keyframe track. Sharing one `times` array with the steep
    // `timing.entrance` ease let the eased opacity bleed early, so the Sheep
    // dissolved on the spot before it had moved (the "fades as it stands" bug).
    // Giving opacity its own `delay` pins the fade to *after* the slide starts.
    x: [0, 0, 0, 0, 240, 460],
    y: [0, -22, 0, 0, 0, 0],
    opacity: [1, 0],
    transition: {
      duration: TIMING_DISMISS_MS / 1000,
      ease: timing.entrance,
      // Top-level `times` drives x/y through hop (0–0.32) → linger (0.32–0.5)
      // → slide (0.5–1). `times` is only honoured at the top level — nesting it
      // per-property makes Motion drop it and the Sheep jumps off instantly.
      times: [0, 0.16, 0.32, 0.5, 0.74, 1],
      // Opacity overrides with its own delayed tween so the fade starts at 0.64
      // — well after the slide begins at 0.5 — instead of bleeding early off the
      // shared eased track (the "fades as it stands" bug).
      opacity: {
        delay: (TIMING_DISMISS_MS / 1000) * 0.64,
        duration: (TIMING_DISMISS_MS / 1000) * 0.36,
        ease: 'easeIn',
      },
    },
  },
};

/**
 * Counting Sheep — a meadow that sends one Sheep at a time onto the stage
 * for the kid to tap. Five Sheep in the play-loop; the 5th tap fires the
 * Goal and the Shell's Completion layers over the 5th Sheep's exit (the
 * layered-concurrent rule, ADR-0001 amendment).
 *
 * The play-loop is a five-state machine (`LoopState`): the kid drives the
 * `waiting → dismissing` transition (their tap); everything else is
 * time-driven by the three named beats (`TIMING_ARRIVAL_MS`,
 * `TIMING_DISMISS_MS`, `TIMING_INTERMISSION_MS`). `onComplete` fires once
 * — ref-guarded — at the start of the 5th `waiting → dismissing` so the
 * Shell's celebration overlay starts simultaneously with the 5th Sheep's
 * exit choreography. After the 5th dismiss beat the loop lands in
 * `completed` — terminal, no further Sheep arrive (AC #5).
 *
 * Observables for tests: `data-toy-state` on the root `<main>` (the
 * current state); `getByRole('button', { name: 'Sheep' })` returns the
 * current on-stage Sheep (only mounted in `arriving | waiting |
 * dismissing` per AC #1). The Motion choreography (slide-in, hop,
 * slide-off) consumes `timing.entrance` and isn't unit-asserted — it's
 * on-device per the slice's testing decisions.
 */
export function CountingSheep({ onComplete, sound, haptics }: ToyProps) {
  const [state, setState] = useState<LoopState>('arriving');
  // Counts the Sheep the kid has dismissed. Increments on each
  // `waiting → dismissing` transition (the tap). Reaching SHEEP_COUNT is
  // the Goal-met signal: `onComplete` fires once and the loop terminates.
  const [dismissed, setDismissed] = useState(0);
  /*
   * WHICH Sheep is on stage, as distinct from HOW MANY have been dismissed.
   *
   * These used to be the same number, and that was fine only while all five
   * Sheep were identical. `dismissed` increments on the TAP, and it drove both
   * the React `key` and the fleece colour — so the instant a child tapped, the
   * Sheep they had just touched was unmounted and a fresh one of the NEXT colour
   * was mounted off-stage-left in its place. The tapped Sheep never played its
   * exit at all; the next one performed it and then walked back in wearing the
   * same fleece. Measured: tap an amber Sheep and it is moss at +0ms, still moss
   * as it slides off at +700ms, and moss again when it arrives at +1800ms.
   *
   * Giving the two roles their own counters puts each change where it belongs —
   * identity and colour flip when a NEW Sheep arrives, not when the current one
   * is sent away.
   */
  const [onStage, setOnStage] = useState(0);
  // ADR-0001 amendment: `onComplete` is a one-shot. The ref guards against
  // a re-render with a new `onComplete` reference (which the Shell does the
  // moment Completion starts) re-firing the effect.
  const completedRef = useRef(false);

  const goalMet = dismissed >= SHEEP_COUNT;

  useEffect(() => {
    if (state === 'arriving') {
      const timer = setTimeout(() => setState('waiting'), TIMING_ARRIVAL_MS);
      return () => clearTimeout(timer);
    }
    if (state === 'dismissing') {
      // The Goal-met dismiss beat (5th Sheep's exit) hands off to the
      // terminal `completed` state rather than back into the loop —
      // AC #5, the loop never mounts another Sheep underneath the
      // Shell's celebration overlay.
      const next: LoopState = goalMet ? 'completed' : 'idle';
      const timer = setTimeout(() => setState(next), TIMING_DISMISS_MS);
      return () => clearTimeout(timer);
    }
    if (state === 'idle') {
      // The intermission is where the cast actually changes over: the next Sheep
      // gets its identity and its fleece here, off-stage, rather than at the tap.
      const timer = setTimeout(() => {
        setOnStage((n) => n + 1);
        setState('arriving');
      }, TIMING_INTERMISSION_MS);
      return () => clearTimeout(timer);
    }
  }, [state, goalMet]);

  // Fire `onComplete` once when the Goal is met. Kept in its own effect so
  // the Shell re-rendering with a new `onComplete` reference (which happens
  // the moment Completion starts) doesn't double-fire — the completedRef
  // pins it to a single call.
  useEffect(() => {
    if (!goalMet || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [goalMet, onComplete]);

  // `idle` is the intermission gap between Sheep — no Sheep on stage,
  // matching AC #1's "length ≤ 1" across the four states (=0 here).
  const sheepOnStage = state === 'arriving' || state === 'waiting' || state === 'dismissing';

  /*
   * The scene geometry, shared with the backdrop. The Sheep stands on the
   * walking line this produces rather than on a CSS length tuned beside it —
   * see `useMeadowScene`. Rebuilt only when the viewport crosses an aspect
   * bucket, so it is stable across every frame of the choreography.
   */
  const scene = useMeadowScene();
  /*
   * Where the walking line sits, as a percentage of the viewport's height. The
   * scene's frame is 100 wide by `frame.h` tall with its aspect MATCHING the
   * viewport, so a frame-space y maps straight onto a percentage of the
   * viewport height with nothing to correct.
   */
  const groundPct = (scene.art.stand[1] / scene.frame.h) * 100;
  /*
   * Which Sheep is on stage. The five share the house cast lightness and chroma
   * and differ only in hue, so they read as one flock while still being five
   * visibly different animals — which gives a three-year-old something to notice
   * arriving, without adding a score, a streak or any other meta-layer (Home
   * stays a pure launcher).
   */
  const fleece = FLEECES[onStage % FLEECES.length];

  return (
    <main
      data-toy-state={state}
      style={{ position: 'relative', minHeight: '100dvh' }}
    >
      <MeadowBackdrop scene={scene} />
      {sheepOnStage && (
        // Centring wrapper. The `motion.button` inside drives `x` through
        // its variants, which means Motion fully owns the button's
        // `transform` property — any inline `translateX(-50%)` on the
        // button itself gets clobbered the moment Motion writes its first
        // transform string (the on-device review found this: `x: 0` in
        // the `waiting` variant overrode the centring and left the Sheep
        // sitting against the viewport's left edge offset by `left: 50%`,
        // landing the body ~75% from the left on a 390px phone). Splitting
        // the centring (here) from the per-state slide (the button) keeps
        // each transform owned by exactly one thing — the wrapper's
        // `translateX(-50%)` never changes; the button's `x` deltas
        // (-260 → 0 → +280) compose with that fixed centring at paint
        // time. No Motion props on the wrapper — it's a static positioning
        // shell, not part of the choreography.
        <div
          style={{
            position: 'absolute',
            left: '50%',
            /*
             * The Sheep's FEET land on the meadow's walking line, and both read
             * the same generator. This used to be `calc(var(--meadow-ground) *
             * 0.62)` — a multiplier tuned by eye against a hill curve it could
             * not see, in a reference frame the backdrop's `slice`-cropped sky
             * did not share. As the viewport widened the horizon and the Sheep
             * drifted apart and the Sheep floated above the ground.
             *
             * `groundPct` is the line's own height in the scene; subtracting
             * `FOOT_OFFSET` of the Sheep's width converts the drawing's top edge
             * to the point its hooves actually sit at. Nothing here is tuned:
             * both numbers come out of the geometry.
             */
            top: `calc(${groundPct.toFixed(3)}% - ${SHEEP_WIDTH} * ${FOOT_OFFSET.toFixed(4)})`,
            transform: 'translateX(-50%)',
          }}
        >
          <motion.button
            // Each Sheep gets a fresh React identity per loop iteration so
            // Motion's `initial` runs at every arrival (not just the first
            // one). Without the key the conditional render would
            // re-use the same DOM node across iterations and `initial` would
            // skip on subsequent arrivals.
            key={onStage}
            type="button"
            aria-label="Sheep"
            variants={sheepVariants}
            // Off-stage-left starting position for the slide-in. Combined
            // with the `arriving` variant's `x: 0`, Motion eases from -260
            // to 0 over TIMING_ARRIVAL_MS using `timing.entrance`. The
            // wrapper above already centres the resting position, so these
            // deltas are relative to centre — `x: 0` lands centred, not
            // left-edge-at-centre.
            initial={{ x: -260, opacity: 0 }}
            animate={state}
            // A small press-scale gives the tap a tactile beat the instant the
            // kid's finger lands — before the dismiss choreography takes over.
            // `whileTap` composes with the variant-driven `x`/`y` (Motion still
            // owns the transform; the gesture just multiplies in a scale) and
            // is auto-disabled under reduced motion by the app-root MotionConfig.
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              // Every tap gets the playful feedback whether or not it
              // counts — re-taps mid-animation stay friendly, no penalty
              // (polish PRD slice #03's principle).
              sound?.play(baa);
              haptics?.tick();
              // Only `waiting` accepts the state advance — AC #3. Re-taps
              // during `arriving` and `dismissing` are non-destructive
              // no-ops so a kid mashing the screen mid-animation doesn't
              // punch through the choreography.
              if (state !== 'waiting') return;
              setDismissed((d) => d + 1);
              setState('dismissing');
            }}
            style={{
              transformOrigin: 'bottom center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {/*
             * Slice notes: "done lives in the dismissing state, not on the
             * Sheep." The bloom inside the wool is the "warm light caught in
             * the fleece" beat of the rise-fall hop choreography.
             */}
            <SheepDrawing fleece={fleece} done={state === 'dismissing'} interactive />
          </motion.button>
        </div>
      )}
    </main>
  );
}
