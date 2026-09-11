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
 * The duckling. Rebuilt onto the house style alongside the rest of the cast —
 * see `PigletDrawing.tsx` for the full account of what changed and why; this
 * file carries only what makes it a duckling.
 *
 * SILHOUETTE. The bill is the whole cue, and it is a boundary cue: broad, flat
 * and jutting clear of the body's outline, which no other animal in the cast
 * does. The folded wing notches the body's side and the tail flicks up behind.
 * Filled solid black it cannot be confused with the chick beside it, whose beak
 * is a tiny wedge and whose head carries spikes.
 *
 * That mattered more here than anywhere else in the cast: the duckling and the
 * chick are the two whose hues sit closest together, because sRGB will not hold
 * the cast's chroma anywhere in the yellows and both had to come out of the same
 * narrow warm arc. Colour cannot separate them, so the outline has to.
 */

const NAME = 'duckling' as const;
const PART = 'data-critter-part';

const BODY_CX = 46;
const BODY_CY = 52;
const BODY_RX = 29;
const BODY_RY = 27;
const HEAD = { cx: BODY_CX + 2, cy: BODY_CY - 3, r: BODY_RX * 0.8, ry: BODY_RY * 0.8 };

function geometry() {
  const rnd = rngFor(NAME, 'body');
  const jit = (a: number) => (rnd() - 0.5) * 2 * a;

  const body = blob(BODY_CX, BODY_CY, BODY_RX, BODY_RY, BLOB_AMP, rnd, 26);

  /*
   * THE BILL. Wide, shallow and set low, reaching past the body's right edge so
   * it breaks the silhouette. It was an `<ellipse>` plus a second `<ellipse>`
   * for the parting line — concentric, entirely inside the body, and invisible
   * the moment the drawing was filled black.
   */
  const billCx = BODY_CX + BODY_RX * 0.78;
  const billCy = BODY_CY + BODY_RY * 0.24;
  const bill = blob(billCx, billCy, BODY_RX * 0.42, BODY_RY * 0.19, BLOB_AMP * 1.2, rnd, 18);
  /** The bill's parting — a tapered line, so the two mandibles read as one form
   *  divided rather than as two shapes laid on each other. */
  const billLine = taperedOutline(
    quadPts(
      [billCx - BODY_RX * 0.34, billCy + 0.6],
      [billCx, billCy + 1.5],
      [billCx + BODY_RX * 0.38, billCy + 0.2],
      12,
    ),
    houseLine.detail * 1.1,
    0.5,
  );

  /*
   * The folded wing — a lobe notching the body's own side. Behind the body's
   * contour, so what shows is the part clearing it: a wing drawn on top is a
   * patch of colour painted on a ball.
   */
  const wing = blob(BODY_CX - BODY_RX * 0.42, BODY_CY + BODY_RY * 0.18, BODY_RX * 0.46, BODY_RY * 0.38, BLOB_AMP * 1.4, rnd, 18);
  const wingRot = -13 + jit(3);

  /** The tail flick — short, up, and on one side only. */
  const tail = taperedOutline(
    quadPts(
      [BODY_CX - BODY_RX * 0.86, BODY_CY - BODY_RY * 0.12],
      [BODY_CX - BODY_RX * 1.2, BODY_CY - BODY_RY * 0.46],
      [BODY_CX - BODY_RX * 1.16, BODY_CY - BODY_RY * 0.66],
      12,
    ),
    houseLine.contour * 2.2,
    0.28,
  );

  // Webbed feet rather than hooves — flat, splayed, and the second thing after
  // the bill that says "waterfowl" in outline alone.
  const foot = (x: number, y: number, flip: number) =>
    closedPath([
      [x - 4.2 * flip, y - 1.2],
      [x + 4.6 * flip, y - 0.4],
      [x + 3.8 * flip, y + 2.2],
      [x - 3.6 * flip, y + 1.9],
    ]);
  const legs = legGeometry(
    [BODY_CX - BODY_RX * 0.34, BODY_CX + BODY_RX * 0.3],
    BODY_CY + BODY_RY * 0.74,
    NAME,
    1.5,
  );

  return {
    body,
    bill,
    billLine,
    wing,
    wingRot,
    tail,
    legs,
    feet: [foot(BODY_CX - BODY_RX * 0.34 - 1, 85, 1), foot(BODY_CX + BODY_RX * 0.3 + 1, 84.2, -1)],
    face: faceGeometry(HEAD, ASYM),
    smile: smilePath(BODY_CX + 2, BODY_CY + BODY_RY * 0.02, BODY_RX * 0.1, 1.4),
    bodyOcclusion: occlusion(BODY_CX, BODY_CY + BODY_RY * 0.5, BODY_RX * 0.94, 0.7, 0.55),
  };
}

const G = geometry();

/**
 * The duckling's mud blanket. Blankets the body AND the wing, leaving only the
 * bill to be redrawn on top as the tease — the extremity that most obviously
 * asks "who is that?" without answering it.
 */
export const DUCKLING_BLOBS: readonly MudBlob[] = [
  { cx: 30, cy: 27, r: 10 },
  { cx: 44, cy: 24, r: 11 },
  { cx: 58, cy: 27, r: 10 },
  { cx: 24, cy: 38, r: 10 },
  { cx: 37, cy: 35, r: 11 },
  { cx: 51, cy: 34, r: 11 },
  { cx: 64, cy: 38, r: 10 },
  { cx: 20, cy: 50, r: 10 },
  { cx: 33, cy: 48, r: 12 },
  { cx: 47, cy: 47, r: 12 },
  { cx: 61, cy: 50, r: 11 },
  { cx: 70, cy: 44, r: 8 },
  { cx: 24, cy: 62, r: 10 },
  { cx: 37, cy: 62, r: 11 },
  { cx: 51, cy: 61, r: 11 },
  { cx: 63, cy: 61, r: 10 },
  { cx: 33, cy: 72, r: 9 },
  { cx: 47, cy: 74, r: 10 },
  { cx: 58, cy: 71, r: 9 },
];

export type DucklingFigureProps = {
  cleaned?: boolean;
  remainingBlobIndices?: readonly number[];
};

export function DucklingFigure({ cleaned = false, remainingBlobIndices }: DucklingFigureProps) {
  const c = coloursFor(NAME);
  const uid = useId().replace(/:/g, '');
  const Bill = () => (
    <>
      <path d={ring(G.bill.pts, FEATURE_WIDTH, NAME, 'bill')} fill={palette.contour} fillRule="evenodd" />
      <path {...{ [PART]: 'beak' }} d={G.bill.d} fill={c.feature} />
      <path {...{ [PART]: 'beak' }} d={G.billLine} fill={c.shade} />
    </>
  );
  return (
    <>
      <defs>
        <clipPath id={`duckling-body-${uid}`}>
          <path d={G.body.d} />
        </clipPath>
      </defs>

      <ContactShadow cx={BODY_CX + 2} rx={BODY_RX * 0.7} colour={c.shade} />

      <path {...{ [PART]: 'tail' }} d={G.tail} fill={c.crop} />

      <g {...{ [PART]: 'leg' }} fill={c.crop}>
        {G.legs.map((l, i) => (
          <path key={i} d={l.leg} />
        ))}
      </g>
      {/* Webbed feet — flat and splayed where the rest of the cast has hooves. */}
      <g {...{ [PART]: 'foot' }} fill={c.feature}>
        {G.feet.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* the wing, BEHIND the body so only the part clearing its silhouette shows */}
      <g transform={`rotate(${G.wingRot} ${BODY_CX - BODY_RX * 0.42} ${BODY_CY + BODY_RY * 0.18})`}>
        <path d={ring(G.wing.pts, FEATURE_WIDTH, NAME, 'wing')} fill={palette.contour} fillRule="evenodd" />
        <path {...{ [PART]: 'wing' }} d={G.wing.d} fill={c.crop} />
      </g>

      {/* THE BILL, drawn BEFORE the body so the body's contour crosses its root —
          which is what makes it grow out of the head rather than sit on it. */}
      <Bill />

      <path d={ring(G.body.pts, houseLine.contour, NAME, 'body')} fill={palette.contour} fillRule="evenodd" />
      <path {...{ [PART]: 'body' }} d={G.body.d} fill={c.body} />

      <g clipPath={`url(#duckling-body-${uid})`}>
        <path d={G.bodyOcclusion} fill={c.shade} opacity={0.38} />
        <Face face={G.face} partAttr={PART} />
        <path {...{ [PART]: 'smile' }} d={G.smile} fill={palette.critterEye} />
      </g>

      {!cleaned && (
        <>
          <MudBlobs blobs={DUCKLING_BLOBS} remaining={remainingBlobIndices} critter={NAME} />
          {/* tease — the bill, reusing its own geometry so it cannot jump when
              the tease is dropped at the clean-snap. */}
          <g data-critter-tease="beak">
            <Bill />
          </g>
        </>
      )}
    </>
  );
}

export function DucklingDrawing(props: DucklingFigureProps) {
  return (
    <CritterSvg>
      <DucklingFigure {...props} />
    </CritterSvg>
  );
}
