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
