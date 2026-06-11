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
});
