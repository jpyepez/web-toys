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
 * The chick. Rebuilt onto the house style alongside the rest of the cast — see
 * `PigletDrawing.tsx` for the full account; this file carries only what makes it
 * a chick.
 *
 * SILHOUETTE, AND WHY IT MATTERS MOST HERE. The chick and the duckling are the
 * two members of the cast whose hues sit closest together, and that is forced
 * rather than careless: sRGB will not hold the cast's chroma anywhere in the
 * yellows at the cast's lightness, so both yellow birds had to come out of the
 * same narrow warm arc. Colour therefore cannot tell them apart, and the outline
 * has to carry the entire distinction.
 *
 * So the chick is built to differ from the duckling in every boundary term: it
 * is SMALLER and rounder, it wears three head spikes where the duckling is
 * smooth, its beak is a small wedge where the duckling's bill is broad and flat,
 * and it stands on thin twig legs where the duckling has webbed feet. Filled
 * solid black the two are unmistakable.
 *
 * The spikes are the one shape worth naming: they are elongated and open, so
 * they carry no size rule, and three of them of DIFFERENT heights is a tuft
 * where three of the same height is a comb.
 */

const NAME = 'chick' as const;
const PART = 'data-critter-part';

/** Smaller than the rest of the cast — a chick is the baby of the yard, and
 *  relative size is itself a silhouette cue when five animals share a stage. */
const BODY_CX = 49;
const BODY_CY = 56;
const BODY_RX = 25;
const BODY_RY = 23;
const HEAD = { cx: BODY_CX + 1, cy: BODY_CY - 3, r: BODY_RX * 0.82, ry: BODY_RY * 0.82 };

function geometry() {
  const rnd = rngFor(NAME, 'body');
  const jit = (a: number) => (rnd() - 0.5) * 2 * a;

  const body = blob(BODY_CX, BODY_CY, BODY_RX, BODY_RY, BLOB_AMP, rnd, 24);

  /*
   * The head tuft — three spikes of DIFFERENT heights and leans. They were three
   * identical straight-sided triangles evenly spaced, which is a comb: a row of
   * matched shapes, and a row of anything is the treeline's problem at critter
   * scale.
   */
  const spikes = [0, 1, 2].map((i) => {
    const baseX = BODY_CX - BODY_RX * 0.22 + i * BODY_RX * 0.22 + jit(1);
    const baseY = BODY_CY - BODY_RY * 0.92;
    const len = BODY_RY * (0.42 + [0.12, 0.3, 0.04][i]) + jit(1);
    const lean = (i - 1) * BODY_RX * 0.12 + jit(1.2);
    return taperedOutline(
      quadPts([baseX, baseY], [baseX + lean * 0.5, baseY - len * 0.6], [baseX + lean, baseY - len], 10),
      houseLine.contour * 1.7,
      0.24,
    );
  });

  /*
   * The beak — a small wedge, set high, jutting just clear of the body's edge.
   * Small BY RULE: the eye has to remain the largest feature on the face, and
   * the old beak was a 10-unit triangle against a 4.5-unit eye.
   */
  const beakX = BODY_CX + BODY_RX * 0.82;
  const beakY = BODY_CY - BODY_RY * 0.02;
  const beak = closedPath([
    [beakX - BODY_RX * 0.2, beakY - BODY_RY * 0.11],
    [beakX + BODY_RX * 0.22, beakY + BODY_RY * 0.01],
    [beakX - BODY_RX * 0.18, beakY + BODY_RY * 0.14],
  ]);

  /** The folded wing — a lobe notching the body's side. */
  const wing = blob(BODY_CX - BODY_RX * 0.4, BODY_CY + BODY_RY * 0.2, BODY_RX * 0.42, BODY_RY * 0.34, BLOB_AMP * 1.4, rnd, 16);
  const wingRot = -11 + jit(3);

  // Twig legs — thin where the rest of the cast is sturdy, and the reason the
  // chick reads as light on its feet.
  const legs = legGeometry(
    [BODY_CX - BODY_RX * 0.3, BODY_CX + BODY_RX * 0.28],
    BODY_CY + BODY_RY * 0.78,
    NAME,
    1.1,
  );
  const toe = (x: number, y: number, flip: number) =>
    taperedOutline(
      quadPts([x - 3.2 * flip, y + 0.4], [x, y + 1.1], [x + 3.4 * flip, y + 0.2], 8),
      houseLine.contour * 1.1,
      0.5,
    );

  return {
    body,
    spikes,
    beak,
    wing,
    wingRot,
    legs,
    toes: [toe(BODY_CX - BODY_RX * 0.3 - 1, 85, 1), toe(BODY_CX + BODY_RX * 0.28 + 1, 84.2, -1)],
    face: faceGeometry(HEAD, ASYM),
    smile: smilePath(BODY_CX + 1, BODY_CY + BODY_RY * 0.34, BODY_RX * 0.12, 1.5),
    bodyOcclusion: occlusion(BODY_CX, BODY_CY + BODY_RY * 0.5, BODY_RX * 0.94, 0.7, 0.55),
  };
}

const G = geometry();

/** The chick's mud blanket. Smaller body, so a tighter blanket — and it covers
 *  the spikes too, leaving only the wing to poke out as the tease. */
export const CHICK_BLOBS: readonly MudBlob[] = [
  { cx: 38, cy: 30, r: 9 },
  { cx: 50, cy: 27, r: 9 },
  { cx: 60, cy: 31, r: 9 },
  { cx: 30, cy: 41, r: 9 },
  { cx: 42, cy: 38, r: 10 },
  { cx: 55, cy: 38, r: 10 },
  { cx: 66, cy: 43, r: 9 },
  { cx: 27, cy: 53, r: 10 },
  { cx: 39, cy: 51, r: 11 },
  { cx: 52, cy: 50, r: 11 },
  { cx: 64, cy: 53, r: 10 },
  { cx: 71, cy: 58, r: 8 },
  { cx: 29, cy: 64, r: 10 },
  { cx: 41, cy: 64, r: 11 },
  { cx: 54, cy: 63, r: 11 },
  { cx: 65, cy: 64, r: 9 },
  { cx: 38, cy: 74, r: 9 },
  { cx: 51, cy: 75, r: 9 },
  { cx: 61, cy: 73, r: 8 },
];

export type ChickFigureProps = {
  cleaned?: boolean;
  remainingBlobIndices?: readonly number[];
};

export function ChickFigure({ cleaned = false, remainingBlobIndices }: ChickFigureProps) {
  const c = coloursFor(NAME);
  const uid = useId().replace(/:/g, '');
  const Wing = () => (
    <g transform={`rotate(${G.wingRot} ${BODY_CX - BODY_RX * 0.4} ${BODY_CY + BODY_RY * 0.2})`}>
      <path d={ring(G.wing.pts, FEATURE_WIDTH, NAME, 'wing')} fill={palette.contour} fillRule="evenodd" />
      <path {...{ [PART]: 'wing' }} d={G.wing.d} fill={c.crop} />
    </g>
  );
  return (
    <>
      <defs>
        <clipPath id={`chick-body-${uid}`}>
          <path d={G.body.d} />
        </clipPath>
      </defs>

      <ContactShadow cx={BODY_CX + 2} rx={BODY_RX * 0.68} colour={c.shade} />

      <g {...{ [PART]: 'leg' }} fill={c.crop}>
        {G.legs.map((l, i) => (
          <path key={i} d={l.leg} />
        ))}
      </g>
      <g {...{ [PART]: 'toe' }} fill={c.feature}>
        {G.toes.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* the head tuft — three spikes of different heights, behind the body */}
      <g {...{ [PART]: 'tuft' }} fill={c.crop}>
        {G.spikes.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      <Wing />

      {/* the beak, drawn before the body so its root is crossed by the body's
          own contour and it grows out of the head rather than sitting on it */}
      <path {...{ [PART]: 'beak' }} d={G.beak} fill={c.feature} />

      <path d={ring(G.body.pts, houseLine.contour, NAME, 'body')} fill={palette.contour} fillRule="evenodd" />
      <path {...{ [PART]: 'body' }} d={G.body.d} fill={c.body} />

      <g clipPath={`url(#chick-body-${uid})`}>
        <path d={G.bodyOcclusion} fill={c.shade} opacity={0.38} />
        <Face face={G.face} partAttr={PART} />
        <path {...{ [PART]: 'smile' }} d={G.smile} fill={palette.critterEye} />
      </g>

      {!cleaned && (
        <>
          <MudBlobs blobs={CHICK_BLOBS} remaining={remainingBlobIndices} critter={NAME} />
          <g data-critter-tease="wing">
            <Wing />
          </g>
        </>
      )}
    </>
  );
}

export function ChickDrawing(props: ChickFigureProps) {
  return (
    <CritterSvg>
      <ChickFigure {...props} />
    </CritterSvg>
  );
}
