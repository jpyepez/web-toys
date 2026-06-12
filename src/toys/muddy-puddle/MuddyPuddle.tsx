import { useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import type { ToyProps } from '../../shell/registry';
import { timing } from '../../shell/tokens';
import { BarnyardBackdrop } from './BarnyardBackdrop';
import { WipeableCritter } from './WipeableCritter';
import { GhostFinger } from './GhostFinger';
import { CAST, shuffle } from './cast';
import { squelch } from './sounds';

/**
 * The five states of the per-Critter loop — its OWN copy, duplicated from the
 * Puffer Fish / Counting Sheep machine rather than shared (the deliberate cost
 * of Toy independence; a shared/extracted Toy-loop hook is explicitly rejected,
 * see `../../out-of-scope/shared-toy-loop-abstraction.md`).
 *
 *  - `arriving`   — current Critter trotting in muddy from the side
 *  - `wiping`     — current Critter centred, awaiting the kid's Wipe (the
 *                   user-driven beat; named `wiping` here vs the tap toys'
 *                   `waiting`)
 *  - `dismissing` — current Critter revealed clean + trotting off (or, for the
 *                   last one, splashing in the now-clean puddle)
 *  - `idle`       — no Critter on stage; intermission beat between Critters
 *  - `completed`  — N Critters cleaned; loop terminal, `onComplete` fired
 */
type LoopState = 'arriving' | 'wiping' | 'dismissing' | 'idle' | 'completed';

/**
 * How many Critters make up the Goal — the whole cast, one each (slice #05). The
 * count and the cast are the same number by construction, so the ~15–30s
 * duration is tuned via blobs-per-Critter + threshold (slice #3 levers), never
 * by changing this. Sized for ~15–30s of kid-paced loops.
 */
const GOAL_COUNT = CAST.length;

/**
 * Per-Critter beat durations (ms). The state machine drains its current timer
 * when each beat completes; transitions are time-driven except `wiping →
 * dismissing` (the kid's Wipe crossing the clean threshold). Exact ms is
 * on-device-tuned per the slice DoD — the structural rule is the named beats.
 * Own copies, duplicated from the Fish's machine rather than shared.
 */
const TIMING_ARRIVAL_MS = 500;
const TIMING_DISMISS_MS = 1100;
const TIMING_INTERMISSION_MS = 250;

/**
 * Idle delay before the wordless ghost-finger demo arms (ms). Armed once a
 * Critter is settled in `wiping` with no contributing Wipe yet; on fire the demo
 * goes active and SHOWS the kid how to Wipe (slice #06). ~2–3s, on-device-tuned
 * per the kid-handoff DoD — the structural contract tested is THAT a stall flips
 * the demo on and a Wipe flips it off, never the exact ms.
 */
const IDLE_DEMO_DELAY_MS = 2500;

/**
 * Motion variants for the on-stage Critter's per-state choreography (slice spec
 * body), shared by every cast member (slice #05): the Critter trots in muddy
 * from the side, holds centred for the Wipe, then on the clean-snap either trots
 * off happy to the far side (`dismissing`) or — for the last one — splashes for
 * joy in the now-clean puddle (`splashing`, the
 * on-stage-only Outro layered under the Shell's Completion, ADR-0001
 * amendment). The trot/splash offsets, scales and timing tuples are
 * on-device-tuned per the slice testing decisions and deliberately NOT
 * unit-asserted — the structural rule is the named beats sourcing their ease
 * from the shared `timing` token. Reduced motion is honoured app-wide by the
 * root `MotionConfig reducedMotion="user"` (as Sheep/Fish rely on), so the
 * splash degrades for motion-sensitive kids without per-component work.
 *
 * Transform-ownership gotcha (user-memory `motion-transform-ownership`, caught
 * on the Sheep): the centring `translateX(-50%)` lives on a static non-Motion
 * wrapper; this Motion element carries only its `x`/`y`/`scale` deltas, which
 * Motion fully owns — an inline `translateX(-50%)` here would be clobbered the
 * moment Motion writes its first transform string.
 */
const critterVariants: Variants = {
  arriving: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    transition: { duration: TIMING_ARRIVAL_MS / 1000, ease: timing.entrance },
  },
  wiping: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    transition: { duration: 0 },
  },
  // Happy trot-off to the far side: a couple of bouncy hops carry the revealed-
  // clean Critter off the right edge, fading only at the very end so the reveal
  // is savoured before it leaves.
  dismissing: {
    x: [0, 40, 120, 260, 420],
    y: [0, -18, 0, -14, 0],
    scale: 1,
    opacity: [1, 1, 1, 1, 0],
    transition: {
      duration: TIMING_DISMISS_MS / 1000,
      ease: timing.entrance,
      times: [0, 0.25, 0.5, 0.75, 1],
    },
  },
  // The last Critter's splash-for-joy Outro: it hops up then plops down into the
  // puddle with a squash-and-settle, staying centred (the Shell's Completion
  // overlay layers on top). Held opaque throughout — it's celebrating, not
  // leaving.
  splashing: {
    x: 0,
    y: [0, -40, 90, 70, 80],
    scale: [1, 1.05, 0.9, 1.02, 1],
    opacity: 1,
    transition: {
      duration: TIMING_DISMISS_MS / 1000,
      ease: timing.entrance,
      times: [0, 0.22, 0.55, 0.8, 1],
    },
  },
};

/**
 * Muddy Puddle — a barnyard scene that sends one muddy Critter at a time onto
 * the stage for the kid to Wipe clean. The cast is the fixed five animals,
 * SHUFFLED once per play (slice #05), so each round is a different animal and
 * "Play again" feels fresh (a replay is a fresh mount → a fresh shuffle). The
 * state machine bootstraps to `arriving`: the first cast member trots in
 * immediately, reachable as the accessible element labelled with its name and
 * tagged `data-critter` with its id.
 */
export function MuddyPuddle({ onComplete, sound }: ToyProps) {
  // The per-play running order — `CAST` shuffled once at mount. `useState`'s lazy
  // initialiser runs the shuffle exactly once per mount (not per render), so the
  // order is stable across a play and re-rolled only when the Shell remounts the
  // Toy for "Play again". `Math.random` is fine here (slice Notes); the shuffle's
  // randomness is unit-tested separately through its injectable boundary.
  const [cast] = useState(() => shuffle(CAST));
  const [state, setState] = useState<LoopState>('arriving');
  // Which cast member is on stage — the index into the shuffled `cast`. Advances
  // only when a fresh Critter trots in (the `idle → arriving` beat), so it stays
  // pinned to the on-stage animal through that animal's whole wipe-and-dismiss
  // cycle (distinct from `cleaned`, which advances at the clean-snap).
  const [round, setRound] = useState(0);
  // Counts the Critters the kid has cleaned. Increments on each `wiping →
  // dismissing` transition (the clean-snap). Reaching GOAL_COUNT is the Goal-met
  // signal: `onComplete` fires once and the loop terminates.
  const [cleaned, setCleaned] = useState(0);
  // ADR-0001 amendment: `onComplete` is a one-shot. The ref guards against a
  // re-render with a new `onComplete` reference (which the Shell does the moment
  // Completion starts) re-firing the effect. Mirrors the Fish's `completedRef`.
  const completedRef = useRef(false);
  // The wordless ghost-finger demo's active flag (slice #06). Arms while a
  // Critter sits un-wiped in `wiping`; flips true on the idle stall, false the
  // instant the kid Wipes. Toy-LOCAL on purpose — NOT pre-abstracted into a
  // shared primitive (the `shared-toy-loop-abstraction` cautionary precedent).
  const [demoActive, setDemoActive] = useState(false);
  // Has the kid made a contributing Wipe on the CURRENT Critter? Set the instant
  // they Wipe, reset when the next Critter settles in `wiping`. Suppresses the
  // demo for the rest of this Critter (it teaches, then gets out of the way) —
  // but re-arms on a later Critter where they stall again (AC: cancel on this
  // one, re-prompt on a later one). A ref, not state: it gates the idle timer's
  // own callback without needing to re-run the arming effect.
  const wipedRef = useRef(false);

  const goalMet = cleaned >= GOAL_COUNT;
  // The on-stage Critter (clamped so the last Critter's dismissing/splash beat,
  // where `round` has reached the final index, still resolves in-bounds).
  const current = cast[Math.min(round, cast.length - 1)];

  useEffect(() => {
    if (state === 'arriving') {
      const timer = setTimeout(() => setState('wiping'), TIMING_ARRIVAL_MS);
      return () => clearTimeout(timer);
    }
    if (state === 'dismissing') {
      // The Goal-met trot-off (last Critter's exit) hands off to the terminal
      // `completed` state rather than back into the loop — AC #5: no further
      // Critter mounts underneath the Shell's celebration overlay.
      const next: LoopState = goalMet ? 'completed' : 'idle';
      const timer = setTimeout(() => setState(next), TIMING_DISMISS_MS);
      return () => clearTimeout(timer);
    }
    if (state === 'idle') {
      // The intermission gap, then the NEXT cast member trots in — advancing
      // `round` so a different animal arrives (the surprise-cast rhythm).
      const timer = setTimeout(() => {
        setRound((r) => r + 1);
        setState('arriving');
      }, TIMING_INTERMISSION_MS);
      return () => clearTimeout(timer);
    }
  }, [state, goalMet]);

  // Fire `onComplete` once when the Goal is met. Kept in its own effect so the
  // Shell re-rendering with a new `onComplete` reference (which happens the
  // moment Completion starts) doesn't double-fire — the completedRef pins it to
  // a single call. Fires at the clean-snap (goalMet flips as `cleaned` hits
  // GOAL_COUNT), so the Shell's overlay layers over the last Critter's splash
  // Outro while the Toy stays mounted through both (ADR-0001 amendment).
  useEffect(() => {
    if (!goalMet || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [goalMet, onComplete]);

  // Arm the wordless demo's idle timer (slice #06). It runs ONLY while a Critter
  // is settled in `wiping`: re-entering `wiping` for each fresh Critter re-arms
  // it (so the demo re-prompts on any later Critter where the kid stalls), and
  // the cleanup — on leaving `wiping` (the clean-snap → `dismissing`) or
  // unmount — both clears the pending timer and drops `demoActive`, so the demo
  // never bleeds past the Critter it was teaching. The on-stage ghost-finger
  // sweep + blob lift/reform driven by `demoActive` is on-device-tuned and not
  // unit-asserted.
  useEffect(() => {
    if (state !== 'wiping') return;
    // A fresh Critter has settled — clear the prior one's Wipe flag so the demo
    // can re-prompt here if the kid stalls.
    wipedRef.current = false;
    const timer = setTimeout(() => {
      // Don't prompt if the kid started Wiping during the wait — they don't need
      // teaching once they're already doing it.
      if (!wipedRef.current) setDemoActive(true);
    }, IDLE_DEMO_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setDemoActive(false);
    };
  }, [state, round]);

  // `idle` is the intermission gap — no Critter on stage, matching AC #1's
  // "zero Critters during idle".
  const critterOnStage = state === 'arriving' || state === 'wiping' || state === 'dismissing';

  return (
    <main
      data-toy-state={state}
      data-demo-active={demoActive}
      style={{
        position: 'relative',
        minHeight: '100dvh',
        // The ground band's height — shared with BarnyardBackdrop's
        // bottom-anchored grass + mud-puddle layers (which read
        // `var(--barnyard-floor)`). Defining it on the common ancestor keeps the
        // horizon + puddle at a fixed fraction of the viewport across aspect
        // ratios (ADR-0005). On-device-tuned; the name is the contract.
        ['--barnyard-floor' as string]: 'clamp(160px, 30dvh, 380px)',
      }}
    >
      <BarnyardBackdrop />
      {critterOnStage && (
        // Static centring wrapper. The `motion.div` inside drives `x`/`y`/`scale`
        // through its variants, so Motion fully owns its `transform` — splitting
        // the centring (here) from the per-state deltas (the Motion element)
        // keeps each transform owned by exactly one thing (the
        // `motion-transform-ownership` gotcha). Sits upper-center, clear of the
        // bottom palm-rest dead zone (slice spec); `top`/offsets on-device-tuned.
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '34%',
            transform: 'translateX(-50%)',
          }}
        >
          <motion.div
            // No React `key`: each arrival is a genuinely fresh mount because the
            // `idle` beat unmounts the critter (`critterOnStage` is false), so
            // `initial` (the off-side trot-in) replays every arrival. Keying on
            // `cleaned` instead would remount on the clean-snap, so the trot-off
            // / splash would play on a brand-new node starting from off-side.
            // Letting the existing node carry `wiping → dismissing` animates the
            // exit in place — the signature beat.
            role="img"
            // The on-stage Critter's identity — the accessible name (`aria-label`)
            // for screen readers, and `data-critter` (its id) as the public hook
            // the loop tests read to confirm the play reveals five DISTINCT
            // animals without coupling to the non-deterministic shuffle order.
            aria-label={current.label}
            data-critter={current.id}
            variants={critterVariants}
            // Off-stage-left start for the trot-in; the `arriving` variant eases
            // x back to 0 (centred) over TIMING_ARRIVAL_MS. Deltas are relative
            // to the wrapper's fixed centring.
            initial={{ x: -280, opacity: 0, scale: 1 }}
            // The last Critter's goal-met exit is the splash Outro, not a trot-off
            // — picked here so the Completion overlay layers over the splash.
            animate={goalMet && state === 'dismissing' ? 'splashing' : state}
            style={{ transformOrigin: 'center center' }}
          >
            <WipeableCritter
              critter={current}
              onWipe={() => {
                // Every contributing Wipe gets its wet squelch (slice #07) —
                // the playful per-blob feedback, played through the injected
                // Sound (the Toy never touches Web Audio, ADR-0003). Optional, so
                // a bare mount degrades to silence.
                sound?.play(squelch());
                // The kid is Wiping for real — cancel the ghost-finger demo at
                // once and suppress it for the rest of this Critter (AC #2).
                wipedRef.current = true;
                setDemoActive(false);
              }}
              onClean={() => {
                // Only `wiping` accepts the clean-snap — a Wipe landing during
                // the trot-in (`arriving`) or trot-off (`dismissing`) is a
                // non-destructive no-op (AC #3): no count advance, no early
                // arrival, no `onComplete`. Mirrors the Fish's `waiting`-only tap
                // guard.
                if (state !== 'wiping') return;
                setCleaned((c) => c + 1);
                setState('dismissing');
              }}
            />
          </motion.div>
          {/* The wordless demo's ghost finger, overlaid on the mud while the kid
           * stalls (slice #06). Rendered only when `demoActive` (which is true
           * only during `wiping`), sits ON TOP of the Critter, and is
           * `pointer-events: none` so the real Wipe underneath is untouched. */}
          {demoActive && <GhostFinger />}
        </div>
      )}
    </main>
  );
}
