import type { ToyProps } from '../../shell/registry';

/** How many Sheep make up the meadow. Sized for ~15–30s; easy to tune. */
const SHEEP_COUNT = 5;

/**
 * Counting Sheep: a meadow of tappable Sheep. Tapping a Sheep counts it; once
 * every Sheep is counted the Goal is met and the Toy signals the Shell.
 */
export function CountingSheep(_props: ToyProps) {
  const sheep = Array.from({ length: SHEEP_COUNT }, (_, i) => i);

  return (
    <main>
      {sheep.map((i) => (
        <button key={i} type="button" aria-label={`Sheep ${i + 1}`} />
      ))}
    </main>
  );
}
