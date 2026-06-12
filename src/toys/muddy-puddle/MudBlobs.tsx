import { palette } from './palette';

export type MudBlob = { cx: number; cy: number; r: number };

/**
 * The shared mud layer for the surprise cast — discrete `data-mud-blob` smudge
 * nodes caked over a clean Critter to obscure it, each its OWN SVG node so slice
 * #3's Wipe observes coverage by COUNTING remaining nodes, never reading pixels
 * (ADR-0006). Drawn last (on top of the clean art) by the caller; each blob
 * carries `data-blob-index` so the wipe surface can tell which one a touch point
 * crossed. Sourced once here rather than re-inlined per animal — the piglet's
 * mud-layer JSX, lifted so the four new animals share it verbatim (the load-
 * bearing `data-mud-blob` / `data-blob-index` hooks are already generic).
 *
 * `remaining` is which blob indices are still caked on — the Wipe drives this
 * down as the child clears blobs; defaults to the full set (the static fully-
 * muddy art) when the caller is rendering outside the wipe mechanic.
 */
export function MudBlobs({
  blobs,
  remaining,
}: {
  blobs: readonly MudBlob[];
  remaining?: readonly number[];
}) {
  const indices = remaining ?? blobs.map((_, i) => i);
  return (
    <g data-mud-layer="mud">
      {indices.map((i) => (
        <circle
          key={i}
          data-mud-blob=""
          data-blob-index={i}
          cx={blobs[i].cx}
          cy={blobs[i].cy}
          r={blobs[i].r}
          fill={palette.mud}
        />
      ))}
    </g>
  );
}
