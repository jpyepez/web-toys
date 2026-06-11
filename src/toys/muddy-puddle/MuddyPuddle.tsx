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

/**
 * Per-piglet beat durations (ms). The state machine drains its current timer
 * when each beat completes; transitions are time-driven except `wiping →
 * dismissing` (the kid's Wipe crossing the clean threshold). Exact ms is
 * on-device-tuned per the slice DoD — the structural rule is the named beats.
 * Own copies, duplicated from the Fish's machine rather than shared.
 */
const TIMING_ARRIVAL_MS = 500;

/**
 * Muddy Puddle — a barnyard scene that sends one muddy piglet at a time onto
 * the stage for the kid to Wipe clean. The state machine bootstraps to
 * `arriving`: one piglet trots in immediately, reachable as the accessible
 * element labelled "Piglet".
 */
export function MuddyPuddle(_props: ToyProps) {
  const [state, setState] = useState<LoopState>('arriving');

  useEffect(() => {
    if (state === 'arriving') {
      const timer = setTimeout(() => setState('wiping'), TIMING_ARRIVAL_MS);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <main data-toy-state={state} style={{ position: 'relative', minHeight: '100dvh' }}>
      <BarnyardBackdrop />
      <div role="img" aria-label="Piglet">
        <WipeableCritter onClean={() => setState('dismissing')} />
      </div>
    </main>
  );
}
