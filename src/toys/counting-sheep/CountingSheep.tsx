import { useEffect, useId, useRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import type { ToyProps } from '../../shell/registry';
import { timing } from '../../shell/tokens';
import { palette } from './palette';
import { MeadowBackdrop } from './MeadowBackdrop';
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
const TIMING_DISMISS_MS = 700;
const TIMING_INTERMISSION_MS = 200;

/**
 * The wool body's four circle centres. Shared between the wool layer and
 * the done-state glow overlay so the bloom paints over the same shapes
 * the fleece does — keeping the glow visually inside the wool rather than
 * floating beside it.
 */
const WOOL_CIRCLES = [
  { cx: 40, cy: 44, r: 16 },
  { cx: 58, cy: 44, r: 16 },
  { cx: 49, cy: 34, r: 16 },
  { cx: 49, cy: 48, r: 18 },
] as const;

/**
 * A single Sheep, drawn from SVG primitives — no image assets (ADR-0002).
 * Every fill sources the dawn palette tokens. Structural pieces tagged with
 * `data-sheep-part` so tests can address them without coupling to which SVG
 * primitive draws each one (mirrors `data-meadow-layer` in MeadowBackdrop).
 *
 * The slice-#01 (mobile-rethink) rewrite keeps the SVG primitives verbatim —
 * only how many of these are mounted, and how they enter / exit, changes.
 */
function SheepDrawing({ done }: { done: boolean }) {
  // A stable per-instance id for the glow gradient — React's `useId` is
  // the idiomatic primitive here, and avoids a leaky module-level counter.
  const glowId = `sheep-glow-${useId()}`;
  return (
    // The sequential mechanic puts one Sheep centred on stage as a generous
    // touch target. Sizing on-device-tuned per the slice DoD; ~min(220px,
    // 55vw) is the cushioned-ease-out placeholder until the kid handoff
    // confirms it.
    <svg
      viewBox="0 0 100 80"
      aria-hidden="true"
      style={{ width: 'min(220px, 55vw)', height: 'auto', display: 'block' }}
    >
      <defs>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={palette.doneGlow} stopOpacity="0.85" />
          <stop offset="1" stopColor={palette.doneGlow} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* legs */}
      <rect data-sheep-part="leg" x="34" y="52" width="6" height="20" rx="3" fill={palette.sheepSilhouette} />
      <rect data-sheep-part="leg" x="58" y="52" width="6" height="20" rx="3" fill={palette.sheepSilhouette} />
      {/* fluffy body */}
      {WOOL_CIRCLES.map((c, i) => (
        <circle
          key={`wool-${i}`}
          data-sheep-part="wool"
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill={palette.sheepWool}
        />
      ))}
      {done &&
        WOOL_CIRCLES.map((c, i) => (
          <circle
            key={`glow-${i}`}
            data-sheep-part="glow"
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill={`url(#${glowId})`}
          />
        ))}
      {/* head */}
      <ellipse data-sheep-part="head" cx="72" cy="40" rx="12" ry="13" fill={palette.sheepSilhouette} />
      <circle data-sheep-part="eye" cx="68" cy="37" r="2.5" fill={palette.sheepWool} />
      <circle data-sheep-part="eye" cx="76" cy="37" r="2.5" fill={palette.sheepWool} />
      {/* ears */}
      <ellipse data-sheep-part="ear" cx="62" cy="34" rx="5" ry="3" fill={palette.sheepSilhouette} />
      <ellipse data-sheep-part="ear" cx="82" cy="34" rx="5" ry="3" fill={palette.sheepSilhouette} />
    </svg>
  );
}

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
    x: [0, 0, 280],
    y: [0, -22, 0],
    opacity: [1, 1, 0],
    transition: {
      duration: TIMING_DISMISS_MS / 1000,
      ease: timing.entrance,
      times: [0, 0.4, 1],
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
      const timer = setTimeout(() => setState('arriving'), TIMING_INTERMISSION_MS);
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

  return (
    <main
      data-toy-state={state}
      style={{ position: 'relative', minHeight: '100dvh' }}
    >
      <MeadowBackdrop />
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
            bottom: '30%',
            transform: 'translateX(-50%)',
          }}
        >
          <motion.button
            // Each Sheep gets a fresh React identity per loop iteration so
            // Motion's `initial` runs at every arrival (not just the first
            // one). Without the key the conditional render would
            // re-use the same DOM node across iterations and `initial` would
            // skip on subsequent arrivals.
            key={dismissed}
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
            <SheepDrawing done={state === 'dismissing'} />
          </motion.button>
        </div>
      )}
    </main>
  );
}
