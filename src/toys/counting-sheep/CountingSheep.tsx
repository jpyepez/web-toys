import type { ToyProps } from '../../shell/registry';

/** How many Sheep make up the meadow. Sized for ~15–30s; easy to tune. */
const SHEEP_COUNT = 5;

/** A single Sheep, drawn from SVG primitives — no image assets (ADR-0002). */
function SheepDrawing() {
  return (
    <svg viewBox="0 0 100 80" width="100" height="80" aria-hidden="true">
      {/* legs */}
      <rect x="34" y="52" width="6" height="20" rx="3" fill="#5b5b6b" />
      <rect x="58" y="52" width="6" height="20" rx="3" fill="#5b5b6b" />
      {/* fluffy body */}
      <circle cx="40" cy="44" r="16" fill="#f7f7fb" />
      <circle cx="58" cy="44" r="16" fill="#f7f7fb" />
      <circle cx="49" cy="34" r="16" fill="#f7f7fb" />
      <circle cx="49" cy="48" r="18" fill="#f7f7fb" />
      {/* head */}
      <ellipse cx="72" cy="40" rx="12" ry="13" fill="#3f3f4a" />
      <circle cx="68" cy="37" r="2.5" fill="#ffffff" />
      <circle cx="76" cy="37" r="2.5" fill="#ffffff" />
      {/* ears */}
      <ellipse cx="62" cy="34" rx="5" ry="3" fill="#3f3f4a" />
      <ellipse cx="82" cy="34" rx="5" ry="3" fill="#3f3f4a" />
    </svg>
  );
}

/**
 * Counting Sheep: a meadow of tappable Sheep. Tapping a Sheep counts it; once
 * every Sheep is counted the Goal is met and the Toy signals the Shell.
 */
export function CountingSheep(_props: ToyProps) {
  const sheep = Array.from({ length: SHEEP_COUNT }, (_, i) => i);

  return (
    <main>
      {sheep.map((i) => (
        <button key={i} type="button" aria-label={`Sheep ${i + 1}`}>
          <SheepDrawing />
        </button>
      ))}
    </main>
  );
}
