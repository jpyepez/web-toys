import { describe, it, expect } from 'vitest';
import { shuffle } from './cast';

/**
 * Muddy Puddle — the surprise cast's ordering (muddy-puddle PRD, slice #05).
 *
 * `shuffle` is the pure ordering primitive behind "Play again feels fresh": it
 * reorders the fixed five-animal cast per play with no repeats and no drops.
 * Randomness is the one boundary collaborator — injected as a `random` parameter
 * (default `Math.random`) so the behaviour is deterministically testable while
 * app code stays seed-free (slice Notes: `Math.random()` is fine in app code).
 * We assert the two contract halves the slice authorises — that it is a
 * permutation (one each, no repeats) and that it actually reorders (the shuffle
 * is applied) — never a specific play-time order, which is non-deterministic.
 */
describe('Muddy Puddle — shuffle', () => {
  it('returns a permutation of its input — same elements, none dropped or duplicated, input untouched', () => {
    // The "one each, no repeats" guarantee (AC #3) at the ordering layer: the
    // shuffled order is the SAME multiset as the input — every element present
    // exactly once — so a five-distinct cast stays five-distinct after shuffling.
    // Non-mutating (returns a new array; the caller's cast is left intact), per
    // the interface-design "return results, don't mutate" principle.
    const input = ['piglet', 'duckling', 'lamb', 'chick', 'calf'];
    const before = [...input];

    const result = shuffle(input);

    expect([...result].sort()).toEqual([...input].sort());
    expect(result).toHaveLength(input.length);
    expect(input).toEqual(before);
  });

  it('applies the injected randomness — the order it produces is determined by the random source', () => {
    // AC #4: the shuffle is APPLIED (not a pass-through copy). A real shuffle
    // consults its randomness to place each element, so feeding two different
    // deterministic random sources yields two different orders — proof the
    // ordering depends on the source. We assert that dependence, never a
    // specific permutation (that would couple to the algorithm and is
    // non-deterministic at play time per the slice Notes). Randomness is the one
    // boundary collaborator, injected so this stays deterministic.
    const cast = ['piglet', 'duckling', 'lamb', 'chick', 'calf'];

    const lows = shuffle(cast, () => 0.01);
    const highs = shuffle(cast, () => 0.99);

    expect(lows).not.toEqual(highs);
    // Each remains a permutation — the applied shuffle never invents or drops.
    expect([...lows].sort()).toEqual([...cast].sort());
    expect([...highs].sort()).toEqual([...cast].sort());
  });
});
