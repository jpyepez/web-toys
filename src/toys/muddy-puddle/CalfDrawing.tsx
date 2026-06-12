import { palette } from './palette';
import { MudBlobs, type MudBlob } from './MudBlobs';

/**
 * The left ear's geometry, named once so the structural ear (under the mud) and
 * the tease ear (re-drawn on top, poking out) stay pixel-identical — the
 * piglet's shared-extremity invariant. Shape on-device-tuned; the invariant is
 * that the two references coincide.
 */
const LEFT_EAR = { cx: 23, cy: 38, rx: 9, ry: 7 } as const;

/**
 * The calf's mud blanket — discrete deterministic smudges, each its own
 * `data-mud-blob` node so coverage is countable (ADR-0006). Blankets the body +
 * muzzle, leaving only the ear tease legible. Count/positions on-device-tuned;
 * the contract is discreteness.
 */
export const CALF_BLOBS: readonly MudBlob[] = [
  { cx: 40, cy: 24, r: 10 },
  { cx: 52, cy: 22, r: 11 },
  { cx: 62, cy: 24, r: 10 },
  { cx: 70, cy: 30, r: 8 },
  { cx: 30, cy: 36, r: 11 },
  { cx: 44, cy: 34, r: 12 },
  { cx: 58, cy: 34, r: 12 },
  { cx: 72, cy: 40, r: 10 },
  { cx: 28, cy: 48, r: 11 },
  { cx: 42, cy: 48, r: 12 },
  { cx: 58, cy: 48, r: 12 },
  { cx: 72, cy: 50, r: 10 },
  { cx: 32, cy: 60, r: 11 },
  { cx: 50, cy: 60, r: 13 },
  { cx: 68, cy: 60, r: 11 },
  { cx: 40, cy: 72, r: 11 },
  { cx: 56, cy: 72, r: 11 },
  { cx: 50, cy: 80, r: 9 },
  { cx: 30, cy: 28, r: 8 },
];

/**
 * The calf Critter, SVG primitives only (ADR-0002) — a warm tan round body with
 * cream patches, a pale cream muzzle with two nostrils (its signature feature),
 * two side ears (the left one is the tease extremity), big eyes with
 * catchlights, blush cheeks. Every fill sources the local barnyard palette;
 * structural pieces carry the generic `data-critter-part` cast hook.
 *
 * Muddy is the default: clean calf first, then a discrete `data-mud-blob` layer
 * with the left ear re-drawn on top as the one tease; `cleaned` drops the mud.
 */
export function CalfDrawing({
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
      {/* side ears behind the body */}
      <ellipse data-critter-part="ear" {...LEFT_EAR} fill={palette.calfBody} />
      <ellipse data-critter-part="ear" cx="77" cy="38" rx="9" ry="7" fill={palette.calfBody} />

      {/* smooth round body */}
      <circle data-critter-part="body" cx="50" cy="54" r="32" fill={palette.calfBody} />

      {/* cream patches */}
      <circle data-critter-part="spot" cx="66" cy="42" r="8" fill={palette.calfSpot} />
      <circle data-critter-part="spot" cx="32" cy="48" r="6" fill={palette.calfSpot} />

      {/* blushy cheeks */}
      <circle data-critter-part="cheek" cx="31" cy="60" r="6.5" fill={palette.calfCheek} />
      <circle data-critter-part="cheek" cx="69" cy="60" r="6.5" fill={palette.calfCheek} />

      {/* large round eyes with catchlights */}
      <circle data-critter-part="eye" cx="42" cy="48" r="5" fill={palette.calfEye} />
      <circle data-critter-part="eye" cx="58" cy="48" r="5" fill={palette.calfEye} />
      <circle data-critter-part="eye-shine" cx="43.8" cy="46.2" r="1.6" fill={palette.calfEyeShine} />
      <circle data-critter-part="eye-shine" cx="59.8" cy="46.2" r="1.6" fill={palette.calfEyeShine} />

      {/* pale muzzle — the signature feature — with two nostrils */}
      <ellipse data-critter-part="muzzle" cx="50" cy="65" rx="16" ry="11" fill={palette.calfMuzzle} />
      <ellipse data-critter-part="muzzle" cx="44" cy="65" rx="2.2" ry="3.2" fill={palette.calfEye} />
      <ellipse data-critter-part="muzzle" cx="56" cy="65" rx="2.2" ry="3.2" fill={palette.calfEye} />

      {!cleaned && (
        <>
          {/* mud layer caked on top of the clean calf */}
          <MudBlobs blobs={CALF_BLOBS} remaining={remainingBlobIndices} />
          {/* tease — the left ear re-drawn ON TOP of the mud, the one bit poking out */}
          <g data-critter-tease="ear">
            <ellipse {...LEFT_EAR} fill={palette.calfBody} />
          </g>
        </>
      )}
    </svg>
  );
}
