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
 * The Muddy Puddle piglet — the first Critter, and the standalone default the
 * Wipe falls back to when no cast member is named.
 *
 * REBUILT onto the harvested house style (`shell/art/house.ts`). The old
 * construction was a `<circle>` body, four straight-sided `<path>` triangles for
 * the ears, an `<ellipse>` snout with two `<ellipse>` nostrils and a `stroke`d
 * smile — the shape of clip-art rather than of drawing, and visibly a different
 * artist from the fledglings two Cards away. What changed, and why each:
 *
 *  - **The body is a `blob`, not a circle.** A primitive has no vertices to
 *    perturb, which is exactly why unmodified shapes read as software.
 *  - **Its contour is a filled ring.** There is no `stroke` in this file. The
 *    smile was one, and a uniform vector stroke is the loudest clip-art tell.
 *  - **The body is at the house CAST lightness.** It used to sit at L 0.82 —
 *    a pastel pink — clearing its own sky by 0.06 against a floor of 0.30.
 *  - **The snout is subdivided, not stacked.** It is oversized and CLIPPED to
 *    the body, so it terminates on the body's own contour instead of floating
 *    concentrically inside it as a smaller ellipse.
 *  - **The face obeys the baby schema numerically.** Eyes sit BELOW the midline
 *    and the eye is strictly the largest feature — the blush used to be r 7
 *    against an r 5 eye, so the most prominent thing on the face was the blush.
 *  - **Nothing is mirrored.** The ears, eyes and legs differ in size, angle and
 *    height; the tail is on one side only.
 *
 * SILHOUETTE. Species has to read from the OUTLINE, because the mud covers every
 * marking and colour a Critter has — and because five animals that differ only
 * in fill are one drawing five times. The piglet's cues are all boundary cues: a
 * round body, two upright pointed ears, a snout that BREAKS the body's outline,
 * and a curled tail. Filled solid black it stays a piglet.
 *
 * Structural pieces keep their `data-piglet-part` hooks. The rest of the cast
 * uses the later `data-critter-part` convention; the piglet predates it and its
 * tests still address it by the old name, so the difference is preserved rather
 * than churned.
 */

const NAME = 'piglet' as const;
const PART = 'data-piglet-part';

/* Layout, in the shared 100x92 viewBox. */
const BODY_CX = 48;
const BODY_CY = 50;
const BODY_RX = 30;
const BODY_RY = 26;
/** The head IS the body — a piglet in this style is a chibi round. The face is
 *  placed on the body's own frame rather than on a second smaller circle. */
const HEAD = { cx: BODY_CX + 1, cy: BODY_CY - 1, r: BODY_RX * 0.82, ry: BODY_RY * 0.82 };

function geometry() {
  const rnd = rngFor(NAME, 'body');
  const jit = (a: number) => (rnd() - 0.5) * 2 * a;

  const body = blob(BODY_CX, BODY_CY, BODY_RX, BODY_RY, BLOB_AMP, rnd, 26);

  /*
   * Ears. Upright and POINTED, which is the piglet's strongest boundary cue and
   * the one that separates it from the calf's sideways ears and the lamb's
   * droops at black-shape scale. Built as narrow blobs rather than as the
   * straight-sided triangles they were: a triangle has three vertices and reads
   * as a polygon, not as an ear.
   *
   * They sit BEHIND the body, so only the part clearing the body's own
   * silhouette shows. Drawn in front, an ear and a body in the same colour
   * family overlap into one shape and the ear's lower half reads as a dark patch
   * painted on the cheek.
   */
  const earL = blob(BODY_CX - BODY_RX * 0.56, BODY_CY - BODY_RY * 1.02, BODY_RX * 0.21, BODY_RY * 0.34, BLOB_AMP * 1.6, rnd, 12);
  const earR = blob(BODY_CX + BODY_RX * 0.52, BODY_CY - BODY_RY * 1.06, BODY_RX * 0.19, BODY_RY * 0.3, BLOB_AMP * 1.6, rnd, 12);
  const earLRot = -16 + jit(3);
  const earRRot = 19 + jit(3);
  const earInnerL = blob(BODY_CX - BODY_RX * 0.56, BODY_CY - BODY_RY * 0.98, BODY_RX * 0.11, BODY_RY * 0.2, BLOB_AMP, rnd, 10);

  /*
   * The snout — the signature feature, deliberately OVERSIZED so that, clipped
   * to the body, it breaks the body's outline at the bottom instead of sitting
   * concentrically inside it. That is the difference between a form subdivided
   * and two shapes stacked.
   */
  const snout = blob(BODY_CX + 1, BODY_CY + BODY_RY * 0.5, BODY_RX * 0.42, BODY_RY * 0.34, BLOB_AMP, rnd, 20);
  const snoutY = BODY_CY + BODY_RY * 0.5;
  const nostril = (dx: number, scale: number) =>
    closedPath([
      [BODY_CX + 1 + dx - 1.5 * scale, snoutY - 1.8 * scale],
      [BODY_CX + 1 + dx + 1.5 * scale, snoutY - 2.1 * scale],
      [BODY_CX + 1 + dx + 1.2 * scale, snoutY + 2.0 * scale],
      [BODY_CX + 1 + dx - 1.4 * scale, snoutY + 1.9 * scale],
    ]);

  /*
   * The tail. A curl, and the only cue in the drawing that is pure outline —
   * which makes it the one that survives being filled black at Card size, where
   * the ears have already merged into the head's own round.
   */
  const tail = taperedOutline(
    quadPts(
      [BODY_CX - BODY_RX * 0.94, BODY_CY + BODY_RY * 0.12],
      [BODY_CX - BODY_RX * 1.34, BODY_CY - BODY_RY * 0.3],
      [BODY_CX - BODY_RX * 1.02, BODY_CY - BODY_RY * 0.44],
      14,
    ),
    houseLine.contour * 1.5,
    0.3,
  );

  const legs = legGeometry(
    [BODY_CX - BODY_RX * 0.46, BODY_CX + BODY_RX * 0.42],
    BODY_CY + BODY_RY * 0.72,
    NAME,
  );

  return {
    body,
    earL,
    earR,
    earLRot,
    earRRot,
    earInnerL,
    snout,
    nostrils: [nostril(-5.4, 1), nostril(5.2, 0.94)],
    tail,
    legs,
    face: faceGeometry(HEAD, ASYM),
    smile: smilePath(BODY_CX + 1, BODY_CY + BODY_RY * 0.92, BODY_RX * 0.17, 2.4),
    /** The body's own form shadow, along its underside. */
    bodyOcclusion: occlusion(BODY_CX, BODY_CY + BODY_RY * 0.5, BODY_RX * 0.94, 0.7, 0.55),
  };
}

/** Computed once: the geometry is a pure function of one fixed seed. */
const G = geometry();

/**
 * The piglet's mud blanket — discrete smudges in the shared 100x92 viewBox,
 * caked over the clean art to obscure who it is. Each entry becomes its own
 * `data-mud-blob` node so coverage is observable by COUNTING nodes, never by
 * reading pixels (ADR-0006).
 *
 * They blanket the body AND both ears, so the only bit left legible is the
 * single tease ear redrawn on top of the mud. Positions follow the rebuilt
 * body — the old set was authored against a `<circle>` at cy 54 in a 100x100
 * box and would leave the new silhouette's shoulders and tail bare.
 */
export const MUD_BLOBS: readonly MudBlob[] = [
  // ear zone — caked over both ears so neither pokes out on its own.
  { cx: 33, cy: 22, r: 9 },
  { cx: 46, cy: 19, r: 10 },
  { cx: 60, cy: 20, r: 9 },
  { cx: 68, cy: 26, r: 8 },
  // body
  { cx: 26, cy: 38, r: 10 },
  { cx: 38, cy: 33, r: 11 },
  { cx: 52, cy: 31, r: 11 },
  { cx: 64, cy: 36, r: 10 },
  { cx: 73, cy: 45, r: 9 },
  { cx: 22, cy: 50, r: 10 },
  { cx: 35, cy: 47, r: 12 },
  { cx: 50, cy: 45, r: 12 },
  { cx: 63, cy: 49, r: 11 },
  { cx: 74, cy: 57, r: 9 },
  { cx: 25, cy: 61, r: 10 },
  { cx: 38, cy: 60, r: 12 },
  { cx: 52, cy: 59, r: 12 },
  { cx: 65, cy: 62, r: 10 },
  { cx: 34, cy: 71, r: 9 },
  { cx: 48, cy: 72, r: 10 },
  { cx: 60, cy: 71, r: 9 },
];

export type PigletFigureProps = {
  cleaned?: boolean;
  /**
   * Which mud blobs (by index into `MUD_BLOBS`) are still caked on. Defaults to
   * all of them. The Wipe drives this down as the child clears blobs; each
   * rendered blob carries `data-blob-index` so the wipe surface can tell which
   * one a touch point crossed. Ignored when `cleaned` — the reveal drops the
   * whole mud layer at the clean-snap.
   */
  remainingBlobIndices?: readonly number[];
};

/**
 * The piglet as bare SVG content — no `<svg>` wrapper, no sizing, no breathing —
 * so it can be dropped into any viewBox. The Home Card draws the REAL piglet
 * through this, rather than the hand-simplified `<circle>` stand-in it carried.
 */
export function PigletFigure({ cleaned = false, remainingBlobIndices }: PigletFigureProps) {
  const c = coloursFor(NAME);
  const uid = useId().replace(/:/g, '');
  return (
    <>
      <defs>
        {/* Per-instance so two piglets on one screen never share a clip. */}
        <clipPath id={`piglet-body-${uid}`}>
          <path d={G.body.d} />
        </clipPath>
      </defs>

      <ContactShadow cx={BODY_CX + 2} rx={BODY_RX * 0.72} colour={c.shade} />

      {/* tail — behind the body, and the cue that survives the black-shape test
          at Card size after the ears have merged into the head's round */}
      <path {...{ [PART]: 'tail' }} d={G.tail} fill={c.crop} />

      {/* legs — tapered FILLS. SVG has no variable-width stroke, so a drawn line
          has to be a fill either way; these used to be nothing at all, and the
          piglet sat on the ground as a legless ball. */}
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

      {/* ears, BEHIND the body so only what clears its silhouette shows. Each
          hinges on its own attachment; they differ in size and angle. */}
      <g transform={`rotate(${G.earLRot} ${BODY_CX - BODY_RX * 0.56} ${BODY_CY - BODY_RY * 0.6})`}>
        <path d={ring(G.earL.pts, FEATURE_WIDTH, NAME, 'ear-l')} fill={palette.contour} fillRule="evenodd" />
        <path {...{ [PART]: 'ear' }} d={G.earL.d} fill={c.crop} />
        <path {...{ [PART]: 'ear' }} d={G.earInnerL.d} fill={c.feature} />
      </g>
      <g transform={`rotate(${G.earRRot} ${BODY_CX + BODY_RX * 0.52} ${BODY_CY - BODY_RY * 0.6})`}>
        <path d={ring(G.earR.pts, FEATURE_WIDTH, NAME, 'ear-r')} fill={palette.contour} fillRule="evenodd" />
        <path {...{ [PART]: 'ear' }} d={G.earR.d} fill={c.shade} />
      </g>

      {/* THE BODY. Contour ring first, fill on top. */}
      <path d={ring(G.body.pts, houseLine.contour, NAME, 'body')} fill={palette.contour} fillRule="evenodd" />
      <path {...{ [PART]: 'body' }} d={G.body.d} fill={c.body} />

      {/* Everything on the face is CLIPPED to the body, so each internal edge
          terminates on the body's own outline rather than floating within it.
          `shade()` colours throughout — never black, never a grey overlay. */}
      <g clipPath={`url(#piglet-body-${uid})`}>
        <path d={G.bodyOcclusion} fill={c.shade} opacity={0.38} />
        <Face face={G.face} partAttr={PART} />
        {/* the snout — oversized on purpose so it BREAKS the body's outline */}
        <path {...{ [PART]: 'snout' }} d={G.snout.d} fill={c.feature} />
        {G.nostrils.map((d, i) => (
          <path key={i} {...{ [PART]: 'snout' }} d={d} fill={palette.critterEye} />
        ))}
        <path {...{ [PART]: 'smile' }} d={G.smile} fill={palette.critterEye} />
      </g>

      {!cleaned && (
        <>
          {/* mud layer — discrete clods caked over the clean piglet, each its own
              node so coverage is countable (ADR-0006). Drawn last so it sits on
              top of every part, obscuring who it is. */}
          <MudBlobs blobs={MUD_BLOBS} remaining={remainingBlobIndices} critter={NAME} />

          {/* tease — one extremity re-drawn ON TOP of the mud so it pokes out:
              the only legible bit of the Critter while muddy, sparking "who's
              that?". It reuses the ear's own geometry, so it cannot jump at the
              clean-snap when the tease is dropped. */}
          <g data-piglet-tease="ear" transform={`rotate(${G.earLRot} ${BODY_CX - BODY_RX * 0.56} ${BODY_CY - BODY_RY * 0.6})`}>
            <path d={ring(G.earL.pts, FEATURE_WIDTH, NAME, 'ear-l')} fill={palette.contour} fillRule="evenodd" />
            <path d={G.earL.d} fill={c.crop} />
            <path d={G.earInnerL.d} fill={c.feature} />
          </g>
        </>
      )}
    </>
  );
}

/** The sized element the Toy mounts, carrying the breathing swell. */
export function PigletDrawing(props: PigletFigureProps) {
  return (
    <CritterSvg>
      <PigletFigure {...props} />
    </CritterSvg>
  );
}
