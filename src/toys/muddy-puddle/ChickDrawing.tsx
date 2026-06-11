import { palette } from './palette';

/**
 * The wing geometry, named once so the structural wing (under the mud) and the
 * tease wing (re-drawn on top, poking out) stay pixel-identical — the piglet's
 * shared-extremity invariant. Shape on-device-tuned; the invariant is that the
 * two references coincide.
 */
const WING = { cx: 71, cy: 57, rx: 12, ry: 16 } as const;

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

      {!cleaned && null}
    </svg>
  );
}
