import { useId } from 'react';
import { blob, grownContour, lobedLoop } from '../../shell/art/geometry';
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
 * The lamb. Rebuilt onto the house style alongside the rest of the cast — see
 * `PigletDrawing.tsx` for the full account; this file carries only what makes it
 * a lamb.
 *
 * SILHOUETTE, AND THE ONE REAL SHAPE FIX IN THIS FILE. The wool used to be six
 * overlapping `<circle>`s. Six overlapping circles merge into a single smooth
 * outline with no notches anywhere, which is a CLOUD — and the drawing beside it
 * in this Toy is a duckling, so the cast contained a cloud-shaped animal and a
 * bird. Wool is round lobes with NOTCHES between them, and the notch is the
 * whole tell: it is the same shape problem as foliage, one subject over, so it
 * uses the same arc emitter (`lobedLoop`).
 *
 * Its contour is GROWN rather than ringed. `contourRing` builds a reversed inner
 * loop and fills between the two with `evenodd`; at the concave notch between
 * two wool lobes that inner loop crosses itself and `evenodd` reads the crossing
 * as a hole, so every notch comes out with a white nick in it. `grownContour`
 * grows outward only and the real fill is painted on top.
 *
 * The face is a pale patch on the wool and the ears DROOP low and wide — both
 * boundary cues, so the lamb survives the black-shape test that a marking
 * painted on the face would not.
 */

const NAME = 'lamb' as const;
const PART = 'data-critter-part';

const BODY_CX = 48;
const BODY_CY = 50;
const BODY_RX = 29;
const BODY_RY = 26;
/** Wool lobe radius. Chunky enough to read as fleece at a Card's scale, small
 *  enough that the notches survive it. */
const LOBE_R = BODY_RX * 0.185;
/** The face sits low on the wool — a lamb's head is mostly fleece. */
const HEAD = { cx: BODY_CX + 1, cy: BODY_CY + BODY_RY * 0.16, r: BODY_RX * 0.58, ry: BODY_RY * 0.54 };

function geometry() {
  const rnd = rngFor(NAME, 'body');
  const jit = (a: number) => (rnd() - 0.5) * 2 * a;

  const wool = lobedLoop(BODY_CX, BODY_CY, BODY_RX, BODY_RY, LOBE_R, BLOB_AMP * 8, rnd);

  /*
   * The face — a pale patch, oversized so that, clipped to the wool, it
   * terminates on the wool's own boundary rather than floating inside it as a
   * smaller ellipse. It is `critterPale`, which is the PAPER one step down:
   * the paper showing through the fleece, not an invented cream.
   */
  const face = blob(HEAD.cx, HEAD.cy + HEAD.ry * 0.12, HEAD.r * 1.06, HEAD.ry * 0.98, BLOB_AMP, rnd, 20);

  /*
   * Ears. Large, set LOW and out to the side, and drooping — that is most of the
   * species cue, and it is a silhouette cue rather than a marking, so it
   * survives the black-shape test. They were two upright `<ellipse>`s at the
   * head's own height, which is a rabbit.
   *
   * Both sit behind the wool; each hinges on its OWN attachment rather than on
   * the body's centre. Pivoting on the centre swings an ear bodily across the
   * frame instead of hinging it — the near ear comes round over the face and
   * reads as a dark patch on the cheek.
   */
  const earLCx = BODY_CX - BODY_RX * 0.92;
  const earLCy = BODY_CY + BODY_RY * 0.1;
  const earL = blob(earLCx, earLCy, BODY_RX * 0.3, BODY_RY * 0.15, BLOB_AMP * 1.4, rnd, 14);
  const earRCx = BODY_CX + BODY_RX * 0.9;
  const earRCy = BODY_CY + BODY_RY * 0.04;
  const earR = blob(earRCx, earRCy, BODY_RX * 0.26, BODY_RY * 0.13, BLOB_AMP * 1.4, rnd, 14);

  const legs = legGeometry(
    [BODY_CX - BODY_RX * 0.44, BODY_CX + BODY_RX * 0.4],
    BODY_CY + BODY_RY * 0.7,
    NAME,
  );

  return {
    wool,
    woolInk: grownContour(
      wool.pts,
      houseLine.contour * 0.55,
      houseLine.taper,
      houseLine.wobble,
      rngFor(NAME, 'wool-ink'),
    ),
    face,
    earL,
    earR,
    earLPivot: [earLCx + BODY_RX * 0.24, earLCy] as [number, number],
    earRPivot: [earRCx - BODY_RX * 0.2, earRCy] as [number, number],
    earLRot: 26 + jit(3),
    earRRot: -21 + jit(3),
    legs,
    faceGeo: faceGeometry(HEAD, ASYM),
    smile: smilePath(HEAD.cx, HEAD.cy + HEAD.ry * 0.62, HEAD.r * 0.24, 2),
    /** A nose mark. Small by rule — the eye has to stay the largest feature. */
    nose: blob(HEAD.cx, HEAD.cy + HEAD.ry * 0.36, HEAD.r * 0.14, HEAD.ry * 0.1, BLOB_AMP, rnd, 10),
    woolOcclusion: occlusion(BODY_CX, BODY_CY + BODY_RY * 0.52, BODY_RX * 0.92, 0.7, 0.55),
    faceOcclusion: occlusion(HEAD.cx + HEAD.r * 0.4, HEAD.cy - HEAD.ry * 0.5, HEAD.r * 0.9, 0.6, 1.4),
  };
}

const G = geometry();

/** The lamb's mud blanket — over the wool AND both ears, leaving one ear to be
 *  redrawn on top as the tease. */
export const LAMB_BLOBS: readonly MudBlob[] = [
  { cx: 32, cy: 26, r: 10 },
  { cx: 46, cy: 23, r: 11 },
  { cx: 60, cy: 26, r: 10 },
  { cx: 22, cy: 38, r: 10 },
  { cx: 36, cy: 34, r: 11 },
  { cx: 50, cy: 33, r: 11 },
  { cx: 64, cy: 36, r: 10 },
  { cx: 74, cy: 44, r: 9 },
  { cx: 18, cy: 50, r: 10 },
  { cx: 32, cy: 47, r: 12 },
  { cx: 48, cy: 46, r: 12 },
  { cx: 62, cy: 48, r: 11 },
  { cx: 76, cy: 54, r: 9 },
  { cx: 22, cy: 61, r: 10 },
  { cx: 36, cy: 60, r: 11 },
  { cx: 50, cy: 60, r: 12 },
  { cx: 64, cy: 60, r: 10 },
  { cx: 34, cy: 71, r: 9 },
  { cx: 48, cy: 72, r: 10 },
  { cx: 61, cy: 70, r: 9 },
];

export type LambFigureProps = {
  cleaned?: boolean;
  remainingBlobIndices?: readonly number[];
};

export function LambFigure({ cleaned = false, remainingBlobIndices }: LambFigureProps) {
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
        <clipPath id={`lamb-wool-${uid}`}>
          <path d={G.wool.d} />
        </clipPath>
        <clipPath id={`lamb-face-${uid}`}>
          <path d={G.face.d} />
        </clipPath>
      </defs>

      <ContactShadow cx={BODY_CX + 2} rx={BODY_RX * 0.72} colour={c.shade} />

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

      {/* ears, behind the wool — they droop LOW and WIDE, which is the cue that
          separates a lamb from every round animal beside it in the cast */}
      <NearEar />
      <g transform={`rotate(${G.earRRot} ${G.earRPivot[0]} ${G.earRPivot[1]})`}>
        <path d={ring(G.earR.pts, FEATURE_WIDTH, NAME, 'ear-r')} fill={palette.contour} fillRule="evenodd" />
        <path {...{ [PART]: 'ear' }} d={G.earR.d} fill={c.shade} />
      </g>

      {/* THE WOOL. Grown contour, then the fill on top — a ringed contour tears
          itself open at every notch between two lobes. */}
      <path d={G.woolInk} fill={palette.contour} />
      <path {...{ [PART]: 'body' }} d={G.wool.d} fill={c.body} />

      <g clipPath={`url(#lamb-wool-${uid})`}>
        <path d={G.woolOcclusion} fill={c.shade} opacity={0.42} />
        {/* the pale face patch, oversized so it BREAKS the wool's boundary */}
        <path {...{ [PART]: 'face' }} d={G.face.d} fill={palette.critterPale} />
        <g clipPath={`url(#lamb-face-${uid})`}>
          <path d={G.faceOcclusion} fill={c.shade} opacity={0.22} />
        </g>
        <Face face={G.faceGeo} partAttr={PART} />
        <path {...{ [PART]: 'nose' }} d={G.nose.d} fill={c.shade} />
        <path {...{ [PART]: 'smile' }} d={G.smile} fill={palette.critterEye} />
      </g>

      {!cleaned && (
        <>
          <MudBlobs blobs={LAMB_BLOBS} remaining={remainingBlobIndices} critter={NAME} />
          <g data-critter-tease="ear">
            <NearEar />
          </g>
        </>
      )}
    </>
  );
}

export function LambDrawing(props: LambFigureProps) {
  return (
    <CritterSvg>
      <LambFigure {...props} />
    </CritterSvg>
  );
}
