import { useId } from 'react';
import { blob, closedPath, quadPts, taperedOutline } from '../../shell/art/geometry';
import { line as houseLine } from '../../shell/art/house';
import { palette } from './palette';
import { MudBlobs, type MudBlob } from './MudBlobs';
import {
  ASYM,
  BLOB_AMP,
  ContactShadow,
  CritterSvg,
  FEATURE_WIDTH,
  Face,
  coloursFor,
  faceGeometry,
  legGeometry,
  occlusion,
  ring,
  rngFor,
  smilePath,
} from './critter-figure';

/**
 * The calf. Rebuilt onto the house style alongside the rest of the cast — see
 * `PigletDrawing.tsx` for the full account; this file carries only what makes it
 * a calf.
 *
 * SILHOUETTE. The calf is the biggest of the five and its cues are all sideways:
 * ears set WIDE and horizontal where the piglet's are upright and the lamb's
 * droop, two small horn buds breaking the top of the skull, and a broad muzzle
 * that pushes clear of the body's outline at the bottom. Nothing about it
 * depends on the patches.
 *
 * WHICH IS JUST AS WELL, BECAUSE THE PATCHES ARE GONE. They were two cream
 * `<circle>`s at r 8 and r 6, sitting on a body at r 32 — convex, closed,
 * roughly a quarter of the animal, and in a colour class of their own at L 0.925
 * against a body at 0.58. On a muddy calf they read as two more clods; on a
 * clean one they read as two objects on a cow. A marking that is not part of the
 * form is a rival at critter scale, so the calf's dapple is now carried by the
 * house shadow formula on its own hide instead.
 *
 * The hue is the other thing worth naming: a naturalistic tan calf sits around
 * hue 60, and sRGB does not hold the cast's chroma there at the cast's
 * lightness. Slate is the substitution that costs least — a Friesian's cool grey
 * is a cow a three-year-old recognises.
 */

const NAME = 'calf' as const;
const PART = 'data-critter-part';

/** The biggest of the five. Relative size is itself a silhouette cue. */
const BODY_CX = 48;
const BODY_CY = 50;
const BODY_RX = 31;
const BODY_RY = 27;
const HEAD = { cx: BODY_CX + 1, cy: BODY_CY - 1, r: BODY_RX * 0.8, ry: BODY_RY * 0.8 };

function geometry() {
  const rnd = rngFor(NAME, 'body');
  const jit = (a: number) => (rnd() - 0.5) * 2 * a;

  const body = blob(BODY_CX, BODY_CY, BODY_RX, BODY_RY, BLOB_AMP, rnd, 26);

  /*
   * Ears — wide, horizontal, and set at the skull's midline. They differ in size
   * and angle; each hinges on its own attachment rather than on the body's
   * centre, which would swing an ear bodily across the face instead of hinging
   * it.
   */
  const earLCx = BODY_CX - BODY_RX * 0.94;
  const earLCy = BODY_CY - BODY_RY * 0.24;
  const earL = blob(earLCx, earLCy, BODY_RX * 0.28, BODY_RY * 0.16, BLOB_AMP * 1.4, rnd, 14);
  const earRCx = BODY_CX + BODY_RX * 0.92;
  const earRCy = BODY_CY - BODY_RY * 0.3;
  const earR = blob(earRCx, earRCy, BODY_RX * 0.25, BODY_RY * 0.14, BLOB_AMP * 1.4, rnd, 14);

  /*
   * Horn buds — small, and the one cue no other animal in the cast has. Two
   * lobes rather than two points: a calf's horns have not come through yet, and
   * a point here would read as a goat.
   */
  const hornL = blob(BODY_CX - BODY_RX * 0.34, BODY_CY - BODY_RY * 0.98, BODY_RX * 0.09, BODY_RY * 0.1, BLOB_AMP * 2, rnd, 10);
  const hornR = blob(BODY_CX + BODY_RX * 0.28, BODY_CY - BODY_RY * 1.02, BODY_RX * 0.08, BODY_RY * 0.09, BLOB_AMP * 2, rnd, 10);

  /*
   * THE MUZZLE — the signature feature, oversized so that, clipped to the body,
   * it breaks the body's outline at the bottom rather than sitting concentrically
   * inside it as a smaller ellipse.
   */
  const muzzleY = BODY_CY + BODY_RY * 0.54;
  const muzzle = blob(BODY_CX + 1, muzzleY, BODY_RX * 0.44, BODY_RY * 0.32, BLOB_AMP, rnd, 20);
  const nostril = (dx: number, scale: number) =>
    closedPath([
      [BODY_CX + 1 + dx - 1.6 * scale, muzzleY - 1.9 * scale],
      [BODY_CX + 1 + dx + 1.6 * scale, muzzleY - 2.2 * scale],
      [BODY_CX + 1 + dx + 1.3 * scale, muzzleY + 2.1 * scale],
      [BODY_CX + 1 + dx - 1.5 * scale, muzzleY + 2.0 * scale],
    ]);

  /** A tufted tail on one side only — nothing in this collection is mirrored. */
  const tail = taperedOutline(
    quadPts(
      [BODY_CX - BODY_RX * 0.9, BODY_CY + BODY_RY * 0.3],
      [BODY_CX - BODY_RX * 1.24, BODY_CY + BODY_RY * 0.5],
      [BODY_CX - BODY_RX * 1.16, BODY_CY + BODY_RY * 0.86],
      14,
    ),
    houseLine.contour * 1.6,
    0.3,
  );

  const legs = legGeometry(
    [BODY_CX - BODY_RX * 0.46, BODY_CX + BODY_RX * 0.42],
    BODY_CY + BODY_RY * 0.72,
    NAME,
    2.1,
  );

  return {
    body,
    earL,
    earR,
    earLPivot: [earLCx + BODY_RX * 0.22, earLCy] as [number, number],
    earRPivot: [earRCx - BODY_RX * 0.2, earRCy] as [number, number],
    earLRot: 12 + jit(3),
    earRRot: -9 + jit(3),
    hornL,
    hornR,
    muzzle,
    nostrils: [nostril(-5.8, 1), nostril(5.6, 0.94)],
    tail,
    legs,
    face: faceGeometry(HEAD, ASYM),
    smile: smilePath(BODY_CX + 1, BODY_CY + BODY_RY * 0.96, BODY_RX * 0.18, 2.4),
    bodyOcclusion: occlusion(BODY_CX, BODY_CY + BODY_RY * 0.5, BODY_RX * 0.94, 0.7, 0.55),
    /**
     * The dapple, which is what the two cream `<circle>` patches became: the
     * house shadow formula on the calf's own hide, following the body's form
     * along its away side rather than sitting on it as a separate object.
     */
    dapple: occlusion(BODY_CX - BODY_RX * 0.52, BODY_CY - BODY_RY * 0.28, BODY_RX * 0.6, 0.5, 1.2),
  };
}

const G = geometry();

/** The calf's mud blanket — the biggest of the five, so the widest blanket. It
 *  covers the ears and horns, leaving one ear as the tease. */
export const CALF_BLOBS: readonly MudBlob[] = [
  { cx: 30, cy: 22, r: 10 },
  { cx: 44, cy: 19, r: 11 },
  { cx: 58, cy: 21, r: 10 },
  { cx: 69, cy: 27, r: 9 },
  { cx: 20, cy: 35, r: 10 },
  { cx: 34, cy: 32, r: 11 },
  { cx: 49, cy: 30, r: 12 },
  { cx: 63, cy: 34, r: 11 },
  { cx: 75, cy: 42, r: 9 },
  { cx: 17, cy: 49, r: 10 },
  { cx: 31, cy: 46, r: 12 },
  { cx: 47, cy: 45, r: 13 },
  { cx: 62, cy: 48, r: 11 },
  { cx: 77, cy: 55, r: 9 },
  { cx: 21, cy: 61, r: 10 },
  { cx: 35, cy: 60, r: 12 },
  { cx: 50, cy: 59, r: 12 },
  { cx: 64, cy: 61, r: 11 },
  { cx: 33, cy: 72, r: 10 },
  { cx: 48, cy: 73, r: 10 },
  { cx: 61, cy: 71, r: 9 },
];

export type CalfFigureProps = {
  cleaned?: boolean;
  remainingBlobIndices?: readonly number[];
};

export function CalfFigure({ cleaned = false, remainingBlobIndices }: CalfFigureProps) {
  const c = coloursFor(NAME);
  const uid = useId().replace(/:/g, '');
  const NearEar = () => (
    <g transform={`rotate(${G.earLRot} ${G.earLPivot[0]} ${G.earLPivot[1]})`}>
      <path d={ring(G.earL.pts, FEATURE_WIDTH, NAME, 'ear-l')} fill={palette.contour} fillRule="evenodd" />
      <path {...{ [PART]: 'ear' }} d={G.earL.d} fill={c.crop} />
    </g>
  );
  return (
    <>
      <defs>
        <clipPath id={`calf-body-${uid}`}>
          <path d={G.body.d} />
        </clipPath>
      </defs>

      <ContactShadow cx={BODY_CX + 2} rx={BODY_RX * 0.74} colour={c.shade} />

      <path {...{ [PART]: 'tail' }} d={G.tail} fill={c.crop} />

      <g {...{ [PART]: 'leg' }} fill={c.crop}>
        {G.legs.map((l, i) => (
          <path key={i} d={l.leg} />
        ))}
      </g>
      <g {...{ [PART]: 'hoof' }} fill={palette.critterHoof}>
        {G.legs.map((l, i) => (
          <path key={i} d={l.hoof} />
        ))}
      </g>

      {/* horn buds — the one cue no other animal in the cast has */}
      <g {...{ [PART]: 'horn' }} fill={c.crop}>
        <path d={G.hornL.d} />
        <path d={G.hornR.d} />
      </g>

      {/* ears, behind the body — WIDE and horizontal, the calf's own cue */}
      <NearEar />
      <g transform={`rotate(${G.earRRot} ${G.earRPivot[0]} ${G.earRPivot[1]})`}>
        <path d={ring(G.earR.pts, FEATURE_WIDTH, NAME, 'ear-r')} fill={palette.contour} fillRule="evenodd" />
        <path {...{ [PART]: 'ear' }} d={G.earR.d} fill={c.shade} />
      </g>

      <path d={ring(G.body.pts, houseLine.contour, NAME, 'body')} fill={palette.contour} fillRule="evenodd" />
      <path {...{ [PART]: 'body' }} d={G.body.d} fill={c.body} />

      <g clipPath={`url(#calf-body-${uid})`}>
        <path d={G.bodyOcclusion} fill={c.shade} opacity={0.38} />
        {/* the dapple — the hide's own form shadow, which is what the two cream
            circle patches became. A marking that is not part of the form is a
            rival at this scale. */}
        <path {...{ [PART]: 'dapple' }} d={G.dapple} fill={c.shade} opacity={0.3} />
        <Face face={G.face} partAttr={PART} />
        {/* the muzzle — oversized on purpose so it BREAKS the body's outline */}
        <path {...{ [PART]: 'muzzle' }} d={G.muzzle.d} fill={palette.critterPale} />
        {G.nostrils.map((d, i) => (
          <path key={i} {...{ [PART]: 'muzzle' }} d={d} fill={palette.critterEye} />
        ))}
        <path {...{ [PART]: 'smile' }} d={G.smile} fill={palette.critterEye} />
      </g>

      {!cleaned && (
        <>
          <MudBlobs blobs={CALF_BLOBS} remaining={remainingBlobIndices} critter={NAME} />
          <g data-critter-tease="ear">
            <NearEar />
          </g>
        </>
      )}
    </>
  );
}

export function CalfDrawing(props: CalfFigureProps) {
  return (
    <CritterSvg>
      <CalfFigure {...props} />
    </CritterSvg>
  );
}
