import { palette } from './palette';
import { MudBlobs, type MudBlob } from './MudBlobs';

/**
 * The wing geometry, named once so the structural wing (under the mud) and the
 * tease wing (re-drawn on top, poking out) stay pixel-identical — the piglet's
 * shared-extremity invariant. Shape on-device-tuned; the invariant is that the
 * two references coincide.
 */
const WING = { cx: 71, cy: 57, rx: 12, ry: 16 } as const;

/**
 * The chick's mud blanket — discrete deterministic smudges, each its own
 * `data-mud-blob` node so coverage is countable (ADR-0006). Blankets the body +
 * tuft, leaving only the wing tease legible. Count/positions on-device-tuned;
 * the contract is discreteness. A touch smaller a set than the bigger animals,
 * matching the chick's smaller body — per-Critter blob count is a slice-#3
 * duration lever, not a fixed number.
 */
export const CHICK_BLOBS: readonly MudBlob[] = [
  { cx: 47, cy: 22, r: 9 },
  { cx: 57, cy: 24, r: 9 },
  { cx: 34, cy: 38, r: 11 },
  { cx: 48, cy: 36, r: 12 },
  { cx: 62, cy: 38, r: 11 },
  { cx: 30, cy: 50, r: 11 },
  { cx: 44, cy: 50, r: 12 },
  { cx: 58, cy: 50, r: 12 },
  { cx: 70, cy: 52, r: 10 },
  { cx: 36, cy: 62, r: 11 },
  { cx: 52, cy: 62, r: 12 },
  { cx: 66, cy: 62, r: 11 },
  { cx: 44, cy: 72, r: 10 },
  { cx: 58, cy: 72, r: 10 },
  { cx: 50, cy: 80, r: 9 },
  { cx: 30, cy: 60, r: 8 },
];

/**
 * The chick Critter, SVG primitives only (ADR-0002) — a warm golden round body
 * (deliberately oranger than the duckling's lemon so the two read apart), a
 * three-spike head tuft, a fluffy wing (the tease extremity), a tiny triangular
 * beak (its signature feature), big eyes with catchlights, blush cheeks. Every
 * fill sources the local barnyard palette; structural pieces carry the generic
 * `data-critter-part` cast hook.
 *
 * Muddy is the default: clean chick first, then a discrete `data-mud-blob` layer
 * with the wing re-drawn on top as the one tease; `cleaned` drops the mud.
 */
export function ChickDrawing({
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
      {/* head tuft — three little spikes */}
      <path data-critter-part="tuft" d="M44 24 L47 8 L50 24 Z" fill={palette.chickWing} />
      <path data-critter-part="tuft" d="M49 24 L52 6 L55 24 Z" fill={palette.chickWing} />
      <path data-critter-part="tuft" d="M54 24 L57 9 L60 24 Z" fill={palette.chickWing} />

      {/* fluffy wing behind the body */}
      <ellipse data-critter-part="wing" {...WING} fill={palette.chickWing} />

      {/* smooth round body */}
      <circle data-critter-part="body" cx="50" cy="56" r="30" fill={palette.chickBody} />

      {/* blushy cheeks */}
      <circle data-critter-part="cheek" cx="32" cy="60" r="6.5" fill={palette.chickCheek} />
      <circle data-critter-part="cheek" cx="68" cy="60" r="6.5" fill={palette.chickCheek} />

      {/* large round eyes with catchlights */}
      <circle data-critter-part="eye" cx="42" cy="50" r="4.5" fill={palette.chickEye} />
      <circle data-critter-part="eye" cx="58" cy="50" r="4.5" fill={palette.chickEye} />
      <circle data-critter-part="eye-shine" cx="43.6" cy="48.4" r="1.5" fill={palette.chickEyeShine} />
      <circle data-critter-part="eye-shine" cx="59.6" cy="48.4" r="1.5" fill={palette.chickEyeShine} />

      {/* tiny triangular beak — the signature feature */}
      <path data-critter-part="beak" d="M45 58 L55 58 L50 66 Z" fill={palette.chickBeak} />

      {!cleaned && (
        <>
          {/* mud layer caked on top of the clean chick */}
          <MudBlobs blobs={CHICK_BLOBS} remaining={remainingBlobIndices} />
          {/* tease — the wing re-drawn ON TOP of the mud, the one bit poking out */}
          <g data-critter-tease="wing">
            <ellipse {...WING} fill={palette.chickWing} />
          </g>
        </>
      )}
    </svg>
  );
}
