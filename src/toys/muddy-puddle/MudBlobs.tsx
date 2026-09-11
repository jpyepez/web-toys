import { useMemo } from 'react';
import { blob } from '../../shell/art/geometry';
import { palette } from './palette';
import { SEED } from './critter-metrics';
import { BLOB_AMP } from './critter-figure';
import type { CritterName } from './palette';
import { stream } from '../../shell/art/rng';

export type MudBlob = { cx: number; cy: number; r: number };

/**
 * The shared mud layer for the surprise cast — discrete `data-mud-blob` smudge
 * nodes caked over a clean Critter to obscure it, each its OWN SVG node so the
 * Wipe observes coverage by COUNTING remaining nodes, never reading pixels
 * (ADR-0006). Drawn last, on top of the clean art, by the caller.
 *
 * WHAT CHANGED. Every blob was a bare `<circle>` filled flat. Twenty flat
 * circles of one colour do not read as mud: they read as polka dots, because a
 * primitive has no vertices to perturb and a mass of identical primitives is the
 * clearest "this came out of software" signal there is. Three things fix it,
 * none of which touch the wipe mechanic:
 *
 *  - **Each clod is a `blob`, not a circle** — an ellipse whose radius is
 *    modulated by a low-order periodic function, so it carries the house's 1%
 *    disorder and no two are the same shape.
 *  - **Each carries a shaded rim on its away side**, following the house light
 *    direction, so a clod reads as a lump of earth with a form rather than as a
 *    disc of paint.
 *  - **They overlap far more than they used to**, so the mass reads as one
 *    caked blanket with notches in it rather than as a scatter of separate
 *    marks. Individually they stay separate NODES, which is all the Wipe needs.
 *
 * The geometry is seeded per Critter and per blob index, so it is stable across
 * re-renders, identical between server and client, and — the load-bearing part —
 * a blob keeps its exact shape as its neighbours are wiped away. Regenerating on
 * each render would make the remaining mud visibly reshuffle under the finger
 * clearing it.
 *
 * `remaining` is which blob indices are still caked on — the Wipe drives this
 * down as the child clears blobs; defaults to the full set (the static
 * fully-muddy art) when the caller is rendering outside the wipe mechanic.
 */
export function MudBlobs({
  blobs,
  remaining,
  critter,
}: {
  blobs: readonly MudBlob[];
  remaining?: readonly number[];
  /** Whose mud this is — seeds the per-clod disorder so two animals on one
   *  screen are never caked in the same pattern of lumps. */
  critter: CritterName;
}) {
  const indices = remaining ?? blobs.map((_, i) => i);
  // Built for the WHOLE blanket, not for `remaining`, so a clod's shape does not
  // change when a different clod is wiped off.
  const shapes = useMemo(
    () =>
      blobs.map((b, i) => {
        const rnd = stream(SEED, `${critter}-mud-${i}`);
        /*
         * The authored blanket is a rough grid of similar radii, which is what a
         * hand-typed list of twenty coordinates always is — and twenty similar
         * lobes in a grid do not read as mud. They read as a PINECONE: regular
         * overlapping scales, which is exactly what the first render came out
         * as. Breaking the radius and the centre per clod is what turns the grid
         * back into a substance, and it is done here rather than in the five
         * authored lists so all five animals get it from one place.
         */
        // Biased UP, never down. The first version ran 0.78-1.40 and the low
        // end punched holes in the blanket: an ear and a cheek showed through
        // the mud on a Critter that is supposed to be unrecognisable, which
        // gives away the answer to the question the Toy is asking. Variation has
        // to come from clods being BIGGER than authored, never smaller.
        const scale = 0.98 + rnd() * 0.52;
        const cx = b.cx + (rnd() - 0.5) * b.r * 0.45;
        const cy = b.cy + (rnd() - 0.5) * b.r * 0.45;
        const r = b.r * scale;
        const clod = blob(cx, cy, r, r * (0.74 + rnd() * 0.4), BLOB_AMP * 4.5, rnd, 16);
        // The away-side rim, following this clod's own lower edge rather than a
        // second shape behind it — a copy of the silhouette offset behind shows
        // through wherever the two outlines diverge.
        const rim = blob(cx + r * 0.16, cy + r * 0.24, r * 0.78, r * 0.5, BLOB_AMP * 2.5, rnd, 14);
        return { clod: clod.d, rim: rim.d };
      }),
    [blobs, critter],
  );

  return (
    <g data-mud-layer="mud">
      {indices.map((i) => (
        // The hit target is the group, so `data-blob-index` reads off whichever
        // of the two paths a finger actually crosses — the rim is inside the
        // clod's own outline, so there is no gap between them to fall through.
        <g key={i} data-mud-blob="" data-blob-index={i}>
          <path data-blob-index={i} d={shapes[i].clod} fill={palette.mud} />
          <path data-blob-index={i} d={shapes[i].rim} fill={palette.mudShade} opacity={0.38} />
        </g>
      ))}
    </g>
  );
}
