import { palette } from './palette';

/**
 * The left ear's geometry, named once so the structural ear (under the mud) and
 * the tease ear (re-drawn on top, poking out) stay pixel-identical — the
 * piglet's shared-ear invariant. Shape on-device-tuned; the invariant is that
 * the two references coincide.
 */
const LEFT_EAR = { cx: 24, cy: 46, rx: 8, ry: 13 } as const;

/**
 * The lamb Critter, SVG primitives only (ADR-0002) — a cloud of cream wool
 * bumps, a taupe face showing through (its signature feature), two floppy ears
 * (the left one is the tease extremity), big eyes with catchlights, blush
 * cheeks, a small smile. Every fill sources the local barnyard palette;
 * structural pieces carry the generic `data-critter-part` cast hook.
 *
 * Muddy is the default: clean lamb first, then a discrete `data-mud-blob` layer
 * with the left ear re-drawn on top as the one tease; `cleaned` drops the mud.
 */
export function LambDrawing({
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
      {/* floppy ears behind the wool */}
      <ellipse data-critter-part="ear" {...LEFT_EAR} fill={palette.lambEar} />
      <ellipse data-critter-part="ear" cx="76" cy="46" rx="8" ry="13" fill={palette.lambEar} />

      {/* wool — a round body plus a ring of bumps for the cloud silhouette */}
      <circle data-critter-part="body" cx="50" cy="54" r="32" fill={palette.lambWool} />
      <circle data-critter-part="body" cx="28" cy="40" r="11" fill={palette.lambWool} />
      <circle data-critter-part="body" cx="50" cy="28" r="12" fill={palette.lambWool} />
      <circle data-critter-part="body" cx="72" cy="40" r="11" fill={palette.lambWool} />
      <circle data-critter-part="body" cx="74" cy="64" r="11" fill={palette.lambWool} />
      <circle data-critter-part="body" cx="26" cy="64" r="11" fill={palette.lambWool} />

      {/* taupe face — the signature feature, showing through the wool */}
      <ellipse data-critter-part="face" cx="50" cy="58" rx="19" ry="17" fill={palette.lambFace} />

      {/* blushy cheeks */}
      <circle data-critter-part="cheek" cx="36" cy="62" r="6" fill={palette.lambCheek} />
      <circle data-critter-part="cheek" cx="64" cy="62" r="6" fill={palette.lambCheek} />

      {/* large round eyes with catchlights */}
      <circle data-critter-part="eye" cx="42" cy="54" r="4.5" fill={palette.lambEye} />
      <circle data-critter-part="eye" cx="58" cy="54" r="4.5" fill={palette.lambEye} />
      <circle data-critter-part="eye-shine" cx="43.6" cy="52.4" r="1.5" fill={palette.lambEyeShine} />
      <circle data-critter-part="eye-shine" cx="59.6" cy="52.4" r="1.5" fill={palette.lambEyeShine} />

      {/* small smile */}
      <path
        data-critter-part="smile"
        d="M44 66 Q50 71 56 66"
        fill="none"
        stroke={palette.lambEye}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {!cleaned && null}
    </svg>
  );
}
