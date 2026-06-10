import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
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
// Lengthened from 700 → 1100 to give the dismiss beat a savour-the-glow linger
// before the Sheep slides off (mirrors the Puffer Fish's puff-then-float exit,
// which the kid handoff liked). The extra ~400ms is the hold in the middle of
// the choreography, not a slower hop — see the `dismissing` variant.
const TIMING_DISMISS_MS = 1100;
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

  // Ambient life makes the still, waiting Sheep read as a friendly creature
  // rather than a sticker (research: blink is the highest "alive"-per-byte
  // animation; a slow breathe sells "calm and alive"). Both are driven by
  // Motion's own frameloop — not React `setTimeout`s — deliberately: the
  // Toy's mechanic tests drain the state-machine's fake timers one transition
  // at a time, and a self-rescheduling blink timer pollutes that queue. Keeping
  // the idle motion on Motion's rAF loop keeps it out of the timer queue the
  // tests own. Both gate on reduced-motion — non-essential looping motion stops
  // for those who opt out; the state-machine choreography is untouched.
  const reducedMotion = useReducedMotion();

  return (
    // The sequential mechanic puts one Sheep centred on stage as a generous
    // touch target. Sizing on-device-tuned per the slice DoD; ~min(220px,
    // 55vw) is the cushioned-ease-out placeholder until the kid handoff
    // confirms it. A slow breathing swell (scale from the feet) rides on top —
    // disabled under reduced-motion.
    <motion.svg
      viewBox="0 0 100 80"
      aria-hidden="true"
      style={{
        width: 'min(220px, 55vw)',
        height: 'auto',
        display: 'block',
        transformOrigin: 'center bottom',
      }}
      animate={reducedMotion ? undefined : { scale: [1, 1.025, 1] }}
      transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity }}
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
      {/* head + ears (drawn first so the face features paint on top) */}
      <ellipse data-sheep-part="ear" cx="62" cy="34" rx="5" ry="3" fill={palette.sheepSilhouette} />
      <ellipse data-sheep-part="ear" cx="82" cy="34" rx="5" ry="3" fill={palette.sheepSilhouette} />
      <ellipse data-sheep-part="head" cx="72" cy="40" rx="12" ry="13" fill={palette.sheepSilhouette} />
      {/*
       * The cute-lamb face. Built from the baby-schema research: features sit
       * low on the face, eyes are large with a bright base + a white catchlight
       * (the "alive, friendly" lever vs. flat dots), a soft cream muzzle lets
       * the dark eyes + smile read against the dark head, and rosy cheeks warm
       * it. Geometry is on-device-tunable per the slice DoD; the load-bearing
       * pieces are the part hooks and that every fill sources a palette token.
       */}
      {/* cream snout patch — drops the features into the lower face */}
      <ellipse data-sheep-part="muzzle" cx="72" cy="46" rx="6.5" ry="5" fill={palette.muzzle} />
      {/*
       * Eyes blink on a slow loop: the group holds open most of the cycle, then
       * squashes to a sliver (scaleY → 0.1) and back — one ~450ms blink every
       * ~4.5s. `transformBox: fill-box` pivots on the group's own bounding box
       * so the lids meet at the eye centreline rather than the SVG origin.
       */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={reducedMotion ? undefined : { scaleY: [1, 1, 0.1, 1] }}
        transition={{
          duration: 4.5,
          times: [0, 0.9, 0.945, 1],
          ease: 'easeOut',
          repeat: Infinity,
        }}
      >
        {/* bright eye base */}
        <ellipse data-sheep-part="eye" cx="67.5" cy="39" rx="3" ry="3.4" fill={palette.eyeWhite} />
        <ellipse data-sheep-part="eye" cx="76.5" cy="39" rx="3" ry="3.4" fill={palette.eyeWhite} />
        {/* big pupils, converged slightly inward + down (warm, not blank) */}
        <circle cx="68.3" cy="39.7" r="2" fill={palette.eyePupil} />
        <circle cx="75.7" cy="39.7" r="2" fill={palette.eyePupil} />
        {/* catchlights — both offset the same way (consistent light) */}
        <circle cx="69" cy="38.6" r="0.8" fill={palette.eyeShine} />
        <circle cx="76.4" cy="38.6" r="0.8" fill={palette.eyeShine} />
      </motion.g>
      {/* tiny nose + a gentle, shallow smile */}
      <ellipse data-sheep-part="nose" cx="72" cy="43.4" rx="1.5" ry="1.1" fill={palette.noseTip} />
      <path
        data-sheep-part="smile"
        d="M 69.5 46 Q 72 48.6 74.5 46"
        fill="none"
        stroke={palette.eyePupil}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </motion.svg>
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
      style={{
        position: 'relative',
        minHeight: '100dvh',
        // The ground band's height — shared with MeadowBackdrop's bottom-
        // anchored hills layer (which reads `var(--meadow-ground)`) and with
        // the Sheep's `bottom` below. Defining it here, on the common ancestor
        // of both the backdrop and the Sheep, is what keeps the horizon and the
        // Sheep's feet locked together across aspect ratios: the hills fill this
        // band from the viewport bottom up, so the surface the Sheep stands on
        // is always the same fraction of the viewport tall — never the
        // slice-cropped, aspect-dependent line that floated the Sheep on
        // desktop. `dvh` + clamp keeps the band sane from short landscape to
        // tall phone.
        ['--meadow-ground' as string]: 'clamp(240px, 42dvh, 520px)',
      }}
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
            // Anchor the Sheep's feet to the shared ground band rather than a
            // raw viewport fraction. The foreground hill's surface at centre
            // sits ~0.7 up the band; the 0.62 multiplier lands the feet on that
            // surface (the Sheep sprite's legs end a little above its box
            // bottom, so the resting point is slightly below the bare surface
            // fraction). Because both this and MeadowBackdrop's hills derive
            // from `--meadow-ground`, they track together at every aspect ratio
            // — fixing the desktop "Sheep floating above the hill" bug.
            bottom: 'calc(var(--meadow-ground) * 0.62)',
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
            <SheepDrawing done={state === 'dismissing'} />
          </motion.button>
        </div>
      )}
    </main>
  );
}
