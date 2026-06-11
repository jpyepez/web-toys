import { palette } from './palette';
import { MudBlobs, type MudBlob } from './MudBlobs';

/**
 * The duckling's bill geometry, named once so the structural bill (drawn under
 * the mud) and the tease bill (re-drawn on top, the bit poking out) stay
 * pixel-identical — otherwise the bill would jump at the clean-snap when the
 * tease drops (the piglet's shared-ear invariant, applied to the bill). Shape is
 * on-device-tuned; the invariant is that the two references coincide.
 */
const BILL = { cx: 50, cy: 64, rx: 13, ry: 8 } as const;
const BILL_SPLIT = 'M40 64 Q50 68 60 64';

/**
 * The duckling's mud blanket — discrete smudges (in the `0 0 100 100` viewBox)
 * caked over the clean duckling. Deterministic by construction (no randomness),
 * each becoming its own `data-mud-blob` node so coverage is countable (ADR-0006).
 * Count/positions/radii are on-device-tuned; the contract is discrete countable
 * nodes blanketing the Critter, leaving only the bill tease legible.
 */
export const DUCKLING_BLOBS: readonly MudBlob[] = [
  { cx: 40, cy: 24, r: 10 },
  { cx: 52, cy: 22, r: 11 },
  { cx: 62, cy: 24, r: 10 },
  { cx: 30, cy: 36, r: 11 },
  { cx: 44, cy: 34, r: 12 },
  { cx: 58, cy: 34, r: 12 },
  { cx: 70, cy: 38, r: 10 },
  { cx: 28, cy: 48, r: 11 },
  { cx: 42, cy: 48, r: 12 },
  { cx: 58, cy: 48, r: 12 },
  { cx: 72, cy: 50, r: 10 },
  { cx: 32, cy: 60, r: 11 },
  { cx: 50, cy: 60, r: 13 },
  { cx: 68, cy: 60, r: 11 },
  { cx: 40, cy: 72, r: 10 },
  { cx: 56, cy: 72, r: 10 },
  { cx: 50, cy: 80, r: 9 },
];

/**
 * The duckling Critter, drawn from SVG primitives only (ADR-0002) — a pale-lemon
 * round body, a folded wing, a rounded orange bill (its signature feature + the
 * tease extremity), big friendly eyes with catchlights, and blushy cheeks. Every
 * fill sources the local barnyard palette. Structural pieces are tagged
 * `data-critter-part` so tests address them without coupling to which primitive
 * draws each (the generic cast hook, mirroring the piglet's `data-piglet-part`).
 *
 * Muddy is the default: the clean duckling is drawn first, then (while muddy)
 * caked in discrete `data-mud-blob` smudges with the bill re-drawn on top as the
 * one tease poking out; `cleaned` drops that mud layer for the full reveal.
 */
export function DucklingDrawing({
  cleaned = false,
  remainingBlobIndices,
}: {
  cleaned?: boolean;
  remainingBlobIndices?: readonly number[];
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ width: 'min(220px, 55vw)', height: 'auto', display: 'block' }}
    >
      {/* folded wing behind the body */}
      <ellipse data-critter-part="wing" cx="68" cy="58" rx="16" ry="20" fill={palette.ducklingWing} />

      {/* smooth round body */}
      <circle data-critter-part="body" cx="50" cy="54" r="32" fill={palette.ducklingBody} />

      {/* blushy cheeks */}
      <circle data-critter-part="cheek" cx="32" cy="58" r="7" fill={palette.ducklingCheek} />
      <circle data-critter-part="cheek" cx="68" cy="58" r="7" fill={palette.ducklingCheek} />

      {/* large round eyes with white catchlights */}
      <circle data-critter-part="eye" cx="41" cy="46" r="5" fill={palette.ducklingEye} />
      <circle data-critter-part="eye" cx="59" cy="46" r="5" fill={palette.ducklingEye} />
      <circle data-critter-part="eye-shine" cx="42.8" cy="44.2" r="1.6" fill={palette.ducklingEyeShine} />
      <circle data-critter-part="eye-shine" cx="60.8" cy="44.2" r="1.6" fill={palette.ducklingEyeShine} />

      {/* rounded bill — the signature feature; a soft split line gives it form */}
      <ellipse data-critter-part="beak" {...BILL} fill={palette.ducklingBeak} />
      <path
        data-critter-part="beak"
        d={BILL_SPLIT}
        fill="none"
        stroke={palette.ducklingEye}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {!cleaned && (
        <>
          {/* mud layer caked on top of the clean duckling */}
          <MudBlobs blobs={DUCKLING_BLOBS} remaining={remainingBlobIndices} />
          {/* tease — the bill re-drawn ON TOP of the mud, the one bit poking out */}
          <g data-critter-tease="beak">
            <ellipse {...BILL} fill={palette.ducklingBeak} />
            <path
              d={BILL_SPLIT}
              fill="none"
              stroke={palette.ducklingEye}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        </>
      )}
    </svg>
  );
}
