/**
 * Returns a new array with the same elements as `items`. The ordering is the
 * concern of the next behaviour (an applied shuffle); for now this pins only the
 * permutation contract — same multiset, input untouched.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  return [...items];
}
