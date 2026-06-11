import { palette } from './palette';
import { MudBlobs, type MudBlob } from './MudBlobs';

/**
 * The left ear's geometry, named once so the structural ear (under the mud) and
 * the tease ear (re-drawn on top, poking out) stay pixel-identical — the
 * piglet's shared-ear invariant. Shape on-device-tuned; the invariant is that
 * the two references coincide.
 */
const LEFT_EAR = { cx: 24, cy: 46, rx: 8, ry: 13 } as const;

/**
 * The lamb's mud blanket — discrete deterministic smudges, each its own
 * `data-mud-blob` node so coverage is countable (ADR-0006). Reaches the wool's
 * cloud bumps (up to cy≈24) so the body is fully obscured, leaving only the ear
 * tease legible. Count/positions on-device-tuned; the contract is discreteness.
 */
export const LAMB_BLOBS: readonly MudBlob[] = [
  { cx: 38, cy: 24, r: 11 },
  { cx: 50, cy: 22, r: 12 },
  { cx: 62, cy: 24, r: 11 },
  { cx: 28, cy: 36, r: 11 },
  { cx: 44, cy: 34, r: 12 },
  { cx: 58, cy: 34, r: 12 },
  { cx: 72, cy: 38, r: 11 },
  { cx: 26, cy: 48, r: 11 },
  { cx: 42, cy: 48, r: 13 },
  { cx: 58, cy: 48, r: 13 },
  { cx: 74, cy: 50, r: 11 },
  { cx: 32, cy: 60, r: 12 },
  { cx: 50, cy: 60, r: 13 },
  { cx: 68, cy: 60, r: 12 },
  { cx: 38, cy: 72, r: 11 },
  { cx: 56, cy: 72, r: 11 },
  { cx: 72, cy: 70, r: 9 },
  { cx: 50, cy: 80, r: 9 },
];

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

      {!cleaned && (
        <>
          {/* mud layer caked on top of the clean lamb */}
          <MudBlobs blobs={LAMB_BLOBS} remaining={remainingBlobIndices} />
          {/* tease — the left ear re-drawn ON TOP of the mud, the one bit poking out */}
          <g data-critter-tease="ear">
            <ellipse {...LEFT_EAR} fill={palette.lambEar} />
          </g>
        </>
      )}
    </svg>
  );
}
