import type { ComponentType } from 'react';
import type { MudBlob } from './MudBlobs';
import { PigletDrawing, MUD_BLOBS } from './PigletDrawing';
import { DucklingDrawing, DUCKLING_BLOBS } from './DucklingDrawing';
import { LambDrawing, LAMB_BLOBS } from './LambDrawing';
import { ChickDrawing, CHICK_BLOBS } from './ChickDrawing';
import { CalfDrawing, CALF_BLOBS } from './CalfDrawing';

/**
 * One member of the surprise cast: everything the loop needs to mount and Wipe a
 * Critter, with nothing it doesn't. `id` is the stable identity (the `data-critter`
 * hook + dedupe key); `label` is the accessible name shown on stage; `blobs` is
 * the Critter's own mud blanket (its slice-#3 wipe levers); `Drawing` renders it,
 * taking the muddy↔clean `cleaned` flag and the `remainingBlobIndices` the Wipe
 * drives down. A small, deep descriptor — the loop stays animal-agnostic.
 */
export type Critter = {
  id: string;
  label: string;
  blobs: readonly MudBlob[];
  Drawing: ComponentType<{ cleaned?: boolean; remainingBlobIndices?: readonly number[] }>;
};

/**
 * The fixed five-animal cast — piglet, duckling, lamb, chick, calf, ONE EACH (no
 * repeats by construction). A single play walks the whole cast, so the five
 * cleaned Critters are five distinct animals; `shuffle(CAST)` reorders them per
 * play so "Play again" feels fresh (the order is the only thing that varies — the
 * five-set is invariant). This is NOT a collection to track — no progress/score
 * meta-layer; the Completion is the whole reward.
 */
/**
 * The piglet — the first Critter (slices #02–#04 were piglet-only) and the
 * standalone default the Wipe mechanic falls back to when no cast member is
 * named. Lifted to a named const so it is a single source of truth shared
 * between `CAST` and that default, rather than the descriptor being written
 * twice.
 */
export const PIGLET: Critter = {
  id: 'piglet',
  label: 'Piglet',
  blobs: MUD_BLOBS,
  Drawing: PigletDrawing,
};

export const CAST: readonly Critter[] = [
  PIGLET,
  { id: 'duckling', label: 'Duckling', blobs: DUCKLING_BLOBS, Drawing: DucklingDrawing },
  { id: 'lamb', label: 'Lamb', blobs: LAMB_BLOBS, Drawing: LambDrawing },
  { id: 'chick', label: 'Chick', blobs: CHICK_BLOBS, Drawing: ChickDrawing },
  { id: 'calf', label: 'Calf', blobs: CALF_BLOBS, Drawing: CalfDrawing },
];

/**
 * Returns a new array holding the same elements as `items` in a freshly-shuffled
 * order — a permutation (one each, no repeats), with the input left untouched.
 *
 * Fisher–Yates, so every ordering is equally likely and the result is unbiased.
 * Randomness is the one boundary collaborator (per the mocking policy): it is
 * injected as `random` (default `Math.random`) so the ordering is deterministic
 * in tests while app code stays seed-free — the slice Notes bless `Math.random()`
 * in app code and require no seeding.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
