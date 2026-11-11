import { useId, useMemo } from 'react';
import {
  blob,
  closedPath,
  contourRing,
  flattenCrown,
  grownContour,
  lobedLoop,
  polygonPath,
  quadPts,
  taperedOutline,
  type Pt,
} from '../../shell/art/geometry';
import { disorder, line as houseLine, shading } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { palette, type PenguinKind } from './palette';

/**
 * The Penguin Slide Critter — a code-drawn SVG penguin in the house style
 * (ADR-0002, primitives only). Its looks are a PURE FUNCTION of props; the Swipe
 * loop in `PenguinSlide` owns everything that moves it.
 *
 * Built the way the Nestlings fledgling is, for the same reasons:
 *  - **One contour, a filled ring of varying width**, heavier underneath — SVG
 *    has no variable-width stroke, so a drawn line has to be a fill.
 *  - **Subdivided, not stacked.** The pale face-and-belly patch is oversized
 *    and clipped to the body, so it ends on the body's own contour instead of
 *    floating inside it as a bullseye.
 *  - **Every silhouette is a jittered path**, never an `<ellipse>`; `<circle>`
 *    survives only for eyes and catchlights.
 *  - **Nothing is mirrored.** Eyes, flippers and feet differ in size, angle and
 *    height.
 *  - **Each kind is told apart by OUTLINE** — fill all five solid black and they
 *    stay distinguishable: the emperor is the tall plain egg, the fairy is small
 *    with its flippers out, the rockhopper wears a crest, the gentoo has a flat
 *    crown, a long beak and a tail, and the chick is a round fluffy ball.
 *
 * Authored in a 100x120 box with the FEET at `FOOT_FRACTION` of its height; the
 * scene anchors a standing penguin by its feet and a swimming one by its
 * waterline, and both land on that same point.
 */

export const VB_W = 100;
export const VB_H = 120;
/** Where a standing penguin's feet touch the ice, as a fraction of its box. */
export const FOOT_FRACTION = 114 / VB_H;
const FOOT_Y = 114;
/**
 * How far the swimming pose sinks the penguin, in box units. The waterline then
 * sits at the feet point, so the scene anchors both poses the same way, and what
 * shows above the water is `SWIM_VISIBLE_H` of a penguin (see `floe.ts`).
 */
const SWIM_SINK = 20;

/**
 * A penguin's rendered width — and the scene's unit: the floe, the slots and the
 * ripples are all measured in it, so it is stated once here and `penguinPx` must
 * agree with the CSS.
 *
 * Capped by the viewport HEIGHT as well as its width. On a square or landscape
 * window a width-only clamp made the penguin so tall relative to the frame that
 * there was no sea left above or below the floe, and a Swipe up or down had
 * nowhere good to end. The lower bound keeps a comfortable target for a
 * three-year-old's finger.
 */
export const PENGUIN_WIDTH = 'clamp(76px, min(22vw, 15vh), 132px)';
export const PENGUIN_MIN_PX = 76;
export const PENGUIN_MAX_PX = 132;
export function penguinPx(w: number, h: number): number {
  return Math.min(PENGUIN_MAX_PX, Math.max(PENGUIN_MIN_PX, Math.min(w * 0.22, h * 0.15)));
}

export type PenguinPose = 'standing' | 'sliding' | 'swimming';

type Traits = {
  rx: number;
  ry: number;
  cy: number;
  flippers: 'down' | 'out';
  crest: boolean;
  flatCrown: boolean;
  tail: boolean;
  beakLen: number;
  fluffy: boolean;
};

const TRAITS: Record<PenguinKind, Traits> = {
  emperor: { rx: 29, ry: 44, cy: 69, flippers: 'down', crest: false, flatCrown: false, tail: false, beakLen: 8, fluffy: false },
  fairy: { rx: 26, ry: 36, cy: 77, flippers: 'out', crest: false, flatCrown: false, tail: false, beakLen: 6.5, fluffy: false },
  rockhopper: { rx: 28, ry: 40, cy: 73, flippers: 'down', crest: true, flatCrown: false, tail: false, beakLen: 7, fluffy: false },
  gentoo: { rx: 29, ry: 41, cy: 72, flippers: 'down', crest: false, flatCrown: true, tail: true, beakLen: 11, fluffy: false },
  chick: { rx: 32, ry: 35, cy: 78, flippers: 'down', crest: false, flatCrown: false, tail: false, beakLen: 5.5, fluffy: true },
};

const colours = (kind: PenguinKind) => ({
  body: palette[`${kind}Body`],
  flipper: palette[`${kind}Flipper`],
  shade: palette[`${kind}Shade`],
});

const SEED = 4271;

/** Egg, not ellipse: narrower at the top, so head and body are one form. */
function egg(pts: readonly Pt[], cx: number, cy: number, ry: number): Pt[] {
  return pts.map(([x, y]) => [cx + (x - cx) * (1 - 0.17 * Math.max(0, (cy - y) / ry)), y] as Pt);
}

function geometry(kind: PenguinKind) {
  const t = TRAITS[kind];
  const rnd = stream(SEED, `penguin-${kind}`);
  const cx = 50 + (rnd() - 0.5) * 1.5;
  const top = t.cy - t.ry;

  let bodyPts: Pt[];
  let bodyD: string;
  let bodyInk: string;
  if (t.fluffy) {
    // Down, not feathers: round lobes with notches between them — built from
    // arcs, because a sine edge would read as water and an |sin| edge as a saw.
    const loop = lobedLoop(cx, t.cy, t.rx, t.ry, 4.2, 0.45, rnd, 48);
    bodyPts = loop.pts;
    bodyD = loop.d;
    // The contour is the same loop pushed out RADIALLY from the centre. Growing
    // it along per-vertex normals flipped them inside every notch and left
    // paper showing between the lobes; a near-round ball has a centre, so use it.
    const w = houseLine.contour * 1.1;
    bodyInk = polygonPath(
      bodyPts.map(([x, y]) => {
        const dx = x - cx;
        const dy = y - t.cy;
        const d = Math.hypot(dx, dy) || 1;
        const k = w * (1 + houseLine.taper * 0.5 * Math.max(0, dy / d));
        return [x + (dx / d) * k, y + (dy / d) * k] as Pt;
      }),
    );
  } else {
    const b = blob(cx, t.cy, t.rx, t.ry, disorder.blobAmp, rnd, 26);
    bodyPts = egg(b.pts, cx, t.cy, t.ry);
    if (t.flatCrown) bodyPts = flattenCrown(bodyPts, t.cy, t.ry, 0.72);
    bodyD = closedPath(bodyPts);
    bodyInk = contourRing(bodyPts, houseLine.contour, houseLine.taper, houseLine.wobble, stream(SEED, `${kind}-ink`));
  }

  // The face-and-belly patch: one pale form — a belly with two lobes for the
  // face — oversized and clipped to the body.
  const eyeY = top + t.ry * 0.62;
  const belly = blob(cx + 1, t.cy + t.ry * 0.3, t.rx * 0.74, t.ry * 0.62, disorder.blobAmp, rnd, 20);
  const faceL = blob(cx - 8.5, eyeY + 1, 11.5, 12, disorder.blobAmp, rnd, 16);
  const faceR = blob(cx + 9, eyeY + 1.5, 11, 11.5, disorder.blobAmp, rnd, 16);
  const neck = blob(cx, eyeY + 12, 13, 10, disorder.blobAmp, rnd, 16);

  // Flippers — tapered blades from the shoulder, ringed with the feature line.
  const flipper = (side: -1 | 1) => {
    const sx = cx + side * (t.rx * 0.82);
    const sy = t.cy - t.ry * 0.12 + (side > 0 ? 2 : 0);
    const out = t.flippers === 'out';
    const len = t.ry * (side > 0 ? 0.62 : 0.56);
    const ang = (out ? (side > 0 ? 55 : 125) : side > 0 ? 78 : 104) * (Math.PI / 180);
    const tip: Pt = [sx + Math.cos(ang) * len, sy + Math.sin(ang) * len];
    const ctrl: Pt = [sx + side * len * 0.35, sy + len * 0.45];
    const pts = quadPts([sx, sy], ctrl, tip, 10);
    return { d: taperedOutline(pts, 11, 0.32), ink: taperedOutline(pts, 11 + houseLine.contour * 1.3, 0.32) };
  };

  // Feet — warm blobs, never mirrored.
  const feet = [
    blob(cx - 9, FOOT_Y - 1, 8.5, 3.6, 0.04, rnd, 14),
    blob(cx + 10, FOOT_Y - 0.4, 9.2, 3.8, 0.04, rnd, 14),
  ];

  // Beak: a short wedge below the eyes. Sharp, so it takes a grown contour.
  const by = eyeY + 5;
  const beakPts: Pt[] = [
    [cx - 4.2, by],
    [cx + 4.6, by + 0.4],
    [cx + 0.6, by + t.beakLen],
  ];
  const beakSmooth = quadPts(beakPts[0], [cx + 0.2, by - 1.6], beakPts[1], 6).concat(
    quadPts(beakPts[1], [cx + 3.2, by + t.beakLen * 0.6], beakPts[2], 5).slice(1),
    quadPts(beakPts[2], [cx - 3, by + t.beakLen * 0.55], beakPts[0], 5).slice(1, -1),
  );

  // Crest: yellow plumes sweeping up and out from above each eye.
  const crest = t.crest
    ? [-1, 1].map((side) => {
        // Swept OUT, not up — upright plumes read as horns.
        const s: Pt = [cx + side * 8, top + 10];
        const pts = quadPts(s, [cx + side * 20, top + 4], [cx + side * 31, top + 1 + (side > 0 ? -2 : 0)], 10);
        return { d: taperedOutline(pts, 6.5, 0.3), ink: taperedOutline(pts, 6.5 + houseLine.contour * 1.2, 0.3) };
      })
    : [];
  // Rockhoppers also get a spiky top tuft; the chick a single soft curl.
  const tuft = t.crest
    ? taperedOutline(quadPts([cx - 2, top + 3], [cx - 1, top - 6], [cx + 5, top - 9], 8), 5, 0.3)
    : t.fluffy
      ? taperedOutline(quadPts([cx, top + 2], [cx + 2, top - 6], [cx + 7, top - 4], 8), 4.5, 0.35)
      : null;
  const tuftInk = tuft
    ? taperedOutline(
        t.crest
          ? quadPts([cx - 2, top + 3], [cx - 1, top - 6], [cx + 5, top - 9], 8)
          : quadPts([cx, top + 2], [cx + 2, top - 6], [cx + 7, top - 4], 8),
        (t.crest ? 5 : 4.5) + houseLine.contour * 1.2,
        t.crest ? 0.3 : 0.35,
      )
    : null;

  // Gentoo's tail — a stub poking out low on the far side.
  const tail = t.tail
    ? (() => {
        const pts = quadPts([cx + t.rx * 0.6, t.cy + t.ry * 0.7], [cx + t.rx + 5, t.cy + t.ry * 0.8], [cx + t.rx + 9, t.cy + t.ry * 0.62], 8);
        return { d: taperedOutline(pts, 9, 0.35), ink: taperedOutline(pts, 9 + houseLine.contour * 1.3, 0.35) };
      })()
    : null;

  // Occlusion on the away side — light is from the upper left. The body minus a
  // copy of itself nudged toward the light leaves a rim that follows the body's
  // OWN lower-right edge; a free-standing crescent read as a smear on the belly.
  const nudged = bodyPts.map(([x, y]) => [x - 4.5, y - 3.5] as Pt);
  const away = `${bodyD} ${t.fluffy ? polygonPath(nudged) : closedPath(nudged)}`;

  return {
    cx,
    top,
    t,
    body: { d: bodyD, ink: bodyInk },
    patch: [belly.d, faceL.d, faceR.d, neck.d],
    away,
    flippers: [flipper(-1), flipper(1)],
    feet: feet.map((f, i) => ({
      d: f.d,
      ink: contourRing(f.pts, houseLine.contour * 0.7, houseLine.taper, houseLine.wobble, stream(SEED, `${kind}-foot-${i}`)),
    })),
    beak: { d: closedPath(beakSmooth), ink: grownContour(beakSmooth, houseLine.contour * 0.55, 0.2, 0.1, stream(SEED, `${kind}-beak`)) },
    crest,
    tuft,
    tuftInk,
    tail,
    eyes: [
      { cx: cx - 8.4, cy: eyeY, r: 4.7 },
      { cx: cx + 8.8, cy: eyeY + 0.6, r: 4.4 },
    ],
    cheeks: [
      blob(cx - 15.5, eyeY + 7.5, 4.6, 2.9, 0.05, rnd, 12).d,
      blob(cx + 15.5, eyeY + 8, 4.3, 2.8, 0.05, rnd, 12).d,
    ],
    shadow: blob(cx + 2, FOOT_Y + 1.5, t.rx * 0.95, 3.4, 0.04, rnd, 16).d,
    ripple: {
      back: blob(cx, FOOT_Y, t.rx + 15, 7.5, 0.04, rnd, 22),
      inner: blob(cx, FOOT_Y + 0.5, t.rx + 7, 4.2, 0.04, rnd, 22),
    },
  };
}

export type PenguinFigureProps = {
  kind?: PenguinKind;
  pose?: PenguinPose;
  /**
   * Shape-accurate hit target. The wrappers around a penguin are rectangles far
   * bigger than the bird and the staggered rows overlap, so they are all
   * `pointer-events: none` and only the painted penguin takes the press.
   */
  interactive?: boolean;
};

/** The penguin as bare SVG content in a 100x120 box — droppable into any viewBox. */
export function PenguinFigure({ kind = 'emperor', pose = 'standing', interactive = false }: PenguinFigureProps) {
  const g = useMemo(() => geometry(kind), [kind]);
  const c = colours(kind);
  const uid = useId().replace(/:/g, '');
  const swimming = pose === 'swimming';
  const happy = pose === 'sliding';
  const featureW = houseLine.contour * houseLine.featureRatio;

  const figure = (
    <g
      data-penguin-part="penguin"
      style={interactive ? { pointerEvents: 'visiblePainted' } : undefined}
    >
      {/* contact shadow — a standing penguin is standing ON the ice */}
      {pose === 'standing' && <path d={g.shadow} fill={palette.iceShadow} opacity={shading.contactStrength} />}

      {g.tail && (
        <g data-penguin-part="tail">
          <path d={g.tail.ink} fill={palette.contour} />
          <path d={g.tail.d} fill={c.flipper} />
        </g>
      )}

      {/* far flipper, behind the body */}
      <path d={g.flippers[0].ink} fill={palette.contour} />
      <path data-penguin-part="flipper" d={g.flippers[0].d} fill={c.shade} />

      {!swimming && (
        <g data-penguin-part="foot">
          {g.feet.map((f, i) => (
            <g key={i}>
              <path d={f.ink} fill={palette.contour} fillRule="evenodd" />
              <path d={f.d} fill={palette.penguinFoot} />
            </g>
          ))}
        </g>
      )}

      {g.crest.map((p, i) => (
        <path key={`ci-${i}`} d={p.ink} fill={palette.contour} />
      ))}
      {g.tuftInk && <path d={g.tuftInk} fill={palette.contour} />}

      <path d={g.body.ink} fill={palette.contour} fillRule="evenodd" />
      <path data-penguin-part="body" d={g.body.d} fill={c.body} />

      <g clipPath={`url(#penguin-body-${uid})`}>
        {g.patch.map((d, i) => (
          <path key={i} data-penguin-part={i === 0 ? 'belly' : undefined} d={d} fill={palette.penguinBelly} />
        ))}
        <path d={g.away} fill={c.shade} fillRule="evenodd" opacity={0.45} />
      </g>

      {g.crest.map((p, i) => (
        <path key={`c-${i}`} data-penguin-part="crest" d={p.d} fill={palette.penguinCrest} />
      ))}
      {g.tuft && <path d={g.tuft} fill={g.t.crest ? palette.penguinCrest : c.body} />}

      {/* near flipper */}
      <path d={g.flippers[1].ink} fill={palette.contour} />
      <path data-penguin-part="flipper" d={g.flippers[1].d} fill={c.flipper} />

      {/* the face */}
      {g.cheeks.map((d, i) => (
        <path key={i} d={d} fill={palette.penguinCheek} opacity={0.85} />
      ))}
      {happy
        ? g.eyes.map((e, i) => (
            <path
              key={i}
              data-penguin-part="eye"
              d={taperedOutline(quadPts([e.cx - e.r, e.cy + 1], [e.cx, e.cy - e.r * 1.3], [e.cx + e.r, e.cy + 1], 8), featureW * 1.4, 0.5)}
              fill={palette.penguinEye}
            />
          ))
        : g.eyes.map((e, i) => (
            <g key={i} data-penguin-part="eye">
              <circle cx={e.cx} cy={e.cy} r={e.r} fill={palette.penguinEye} />
              <circle cx={e.cx - e.r * 0.32} cy={e.cy - e.r * 0.36} r={e.r * 0.36} fill={palette.penguinEyeShine} />
            </g>
          ))}
      <path d={g.beak.ink} fill={palette.contour} />
      <path data-penguin-part="beak" d={g.beak.d} fill={palette.penguinBeak} />
    </g>
  );

  return (
    <>
      <defs>
        <clipPath id={`penguin-body-${uid}`}>
          <path d={g.body.d} />
        </clipPath>
        {/* The waterline: everything below the feet point is underwater. */}
        <clipPath id={`penguin-above-${uid}`}>
          <rect x={-20} y={-40} width={140} height={FOOT_Y + 40} />
        </clipPath>
        <clipPath id={`penguin-below-${uid}`}>
          <rect x={-20} y={FOOT_Y} width={140} height={40} />
        </clipPath>
      </defs>
      {swimming ? (
        <>
          {/* the ripple ring around a swimmer: behind it, then its near half in front */}
          <path
            data-penguin-part="ripple"
            d={`${g.ripple.back.d} ${closedPath([...g.ripple.inner.pts].reverse())}`}
            fill={palette.waterLight}
            fillRule="evenodd"
          />
          <g clipPath={`url(#penguin-above-${uid})`}>
            <g transform={`translate(0 ${SWIM_SINK})`}>{figure}</g>
          </g>
          <path
            d={`${g.ripple.back.d} ${closedPath([...g.ripple.inner.pts].reverse())}`}
            fill={palette.waterLight}
            fillRule="evenodd"
            clipPath={`url(#penguin-below-${uid})`}
          />
        </>
      ) : (
        figure
      )}
    </>
  );
}

/** The penguin in its own `<svg>`, sized by its container. */
export function PenguinDrawing(props: PenguinFigureProps) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      overflow="visible"
      style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
    >
      <PenguinFigure {...props} />
    </svg>
  );
}
