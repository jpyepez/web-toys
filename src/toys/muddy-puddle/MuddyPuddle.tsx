import { useEffect, useState } from 'react';
import type { ToyProps } from '../../shell/registry';
import { BarnyardBackdrop } from './BarnyardBackdrop';
import { WipeableCritter } from './WipeableCritter';

/**
 * The five states of the per-piglet loop — its OWN copy, duplicated from the
 * Puffer Fish / Counting Sheep machine rather than shared (the deliberate cost
 * of Toy independence; a shared/extracted Toy-loop hook is explicitly rejected,
 * see `../../out-of-scope/shared-toy-loop-abstraction.md`).
 *
 *  - `arriving`   — current piglet trotting in muddy from the side
 *  - `wiping`     — current piglet centred, awaiting the kid's Wipe (the
 *                   user-driven beat; named `wiping` here vs the tap toys'
 *                   `waiting`)
 *  - `dismissing` — current piglet revealed clean + trotting off (or, for the
 *                   last one, splashing in the now-clean puddle)
 *  - `idle`       — no piglet on stage; intermission beat between piglets
 *  - `completed`  — N piglets cleaned; loop terminal, `onComplete` fired
 */
type LoopState = 'arriving' | 'wiping' | 'dismissing' | 'idle' | 'completed';

/** How many piglets make up the Goal. Sized for ~15–30s of kid-paced loops. */
const PIGLET_COUNT = 5;

/**
 * Per-piglet beat durations (ms). The state machine drains its current timer
 * when each beat completes; transitions are time-driven except `wiping →
 * dismissing` (the kid's Wipe crossing the clean threshold). Exact ms is
 * on-device-tuned per the slice DoD — the structural rule is the named beats.
 * Own copies, duplicated from the Fish's machine rather than shared.
 */
const TIMING_ARRIVAL_MS = 500;
const TIMING_DISMISS_MS = 1100;
const TIMING_INTERMISSION_MS = 250;

/**
 * Muddy Puddle — a barnyard scene that sends one muddy piglet at a time onto
 * the stage for the kid to Wipe clean. The state machine bootstraps to
 * `arriving`: one piglet trots in immediately, reachable as the accessible
 * element labelled "Piglet".
 */
export function MuddyPuddle(_props: ToyProps) {
  const [state, setState] = useState<LoopState>('arriving');
  // Counts the piglets the kid has cleaned. Increments on each `wiping →
  // dismissing` transition (the clean-snap). Reaching PIGLET_COUNT is the
  // Goal-met signal: the loop terminates in `completed`.
  const [cleaned, setCleaned] = useState(0);

  const goalMet = cleaned >= PIGLET_COUNT;

  useEffect(() => {
    if (state === 'arriving') {
      const timer = setTimeout(() => setState('wiping'), TIMING_ARRIVAL_MS);
      return () => clearTimeout(timer);
    }
    if (state === 'dismissing') {
      // The Goal-met trot-off (Nth piglet's exit) hands off to the terminal
      // `completed` state rather than back into the loop — AC #4: no further
      // piglet mounts underneath the Shell's celebration overlay.
      const next: LoopState = goalMet ? 'completed' : 'idle';
      const timer = setTimeout(() => setState(next), TIMING_DISMISS_MS);
      return () => clearTimeout(timer);
    }
    if (state === 'idle') {
      const timer = setTimeout(() => setState('arriving'), TIMING_INTERMISSION_MS);
      return () => clearTimeout(timer);
    }
  }, [state, goalMet]);

  // `idle` is the intermission gap — no piglet on stage, matching AC #1's
  // "zero Critters during idle".
  const critterOnStage = state === 'arriving' || state === 'wiping' || state === 'dismissing';

  return (
    <main data-toy-state={state} style={{ position: 'relative', minHeight: '100dvh' }}>
      <BarnyardBackdrop />
      {critterOnStage && (
        <div role="img" aria-label="Piglet">
          <WipeableCritter
            onClean={() => {
              // Only `wiping` accepts the clean-snap — a Wipe landing during the
              // trot-in (`arriving`) or trot-off (`dismissing`) is a
              // non-destructive no-op (AC #3): no count advance, no early
              // arrival, no `onComplete`. Mirrors the Fish's `waiting`-only tap
              // guard.
              if (state !== 'wiping') return;
              setCleaned((c) => c + 1);
              setState('dismissing');
            }}
          />
        </div>
      )}
    </main>
  );
}
