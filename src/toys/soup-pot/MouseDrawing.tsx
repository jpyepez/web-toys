import { useId, useMemo } from 'react';
import { blob, closedPath, contourRing, quadPts, taperedOutline, type Pt } from '../../shell/art/geometry';
import { disorder, line as houseLine } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { palette, type MouseKind } from './palette';

/**
 * The Soup Pot Critter — a mouse peeking over the pot's rim, face turned up to
 * the viewer, paws on the rim, body hidden behind the pot. Code-drawn SVG in the
 * house style (ADR-0002, primitives only); its looks are a PURE FUNCTION of
 * props, and `SoupPot` owns everything that moves it.
 *
 * Built the way the penguin and the fledgling are:
 *  - **One contour, a filled ring of varying width**, heavier underneath.
 *  - **Subdivided, not stacked.** The muzzle and the away-side shade are clipped
 *    to the head, so they end on its own contour.
 *  - **Every silhouette is a jittered path**, never an `<ellipse>`; `<circle>`
 *    survives only for eyes and catchlights.
 *  - **Nothing is mirrored.** Ears, eyes, whiskers and paws differ.
 *  - **Each kind is told apart by OUTLINE** — fill all three solid black and they
 *    stay distinguishable: big round ears, small ears with a top tuft, and one
 *    floppy ear hanging to the side.
 *
 * Authored in a 100x100 box with the PAWS at y 90 — the anchor the scene puts on
 * the rim (`kitchen.ts` mirrors these numbers as `MOUSE_*`).
 */

export const VB = 100;
/** Where the paws rest on the rim, as a fraction of the box. */
export const PAW_FRACTION = 0.9;

/**
 * A mouse's rendered width — and the scene's unit. The same clamp Penguin Slide
 * uses, for the same reasons: capped by the viewport height so a landscape window
 * keeps room above the pot, floored so a mouse stays a comfortable tap target
 * for the easter egg (issue 43).
 */
export const MOUSE_WIDTH = 'clamp(76px, min(22vw, 15vh), 132px)';
export function mousePx(w: number, h: number): number {
  return Math.min(132, Math.max(76, Math.min(w * 0.22, h * 0.15)));
}

export type MousePose = 'watching' | 'happy';

type Traits = {
  /** Ear centres and radii: [left, right]. */
  ears: Array<{ x: number; y: number; r: number }>;
  tuft: boolean;
  /** The right ear hangs down to the side. */
  floppy: boolean;
  /** Which side the tail peeks out on. */
  tail: -1 | 1;
};

const TRAITS: Record<MouseKind, Traits> = {
  roundEars: { ears: [{ x: 22, y: 22, r: 19 }, { x: 78, y: 21, r: 18.5 }], tuft: false, floppy: false, tail: 1 },
  tuft: { ears: [{ x: 27, y: 29, r: 12.5 }, { x: 73, y: 28, r: 12 }], tuft: true, floppy: false, tail: -1 },
  floppy: { ears: [{ x: 24, y: 24, r: 16.5 }, { x: 86, y: 44, r: 14 }], tuft: false, floppy: true, tail: 1 },
};

const SEED = 4271;
const HEAD = { cx: 50, cy: 52, rx: 30, ry: 26 };

function geometry(kind: MouseKind) {
  const t = TRAITS[kind];
  const rnd = stream(SEED, `mouse-${kind}`);
  const head = blob(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, disorder.blobAmp, rnd, 26);
  // Widest at the cheeks, narrower at the brow — a mouse face, not a ball.
  const headPts = head.pts.map(([x, y]) => {
    const up = Math.max(0, (HEAD.cy - y) / HEAD.ry);
    return [HEAD.cx + (x - HEAD.cx) * (1 - 0.1 * up), y] as Pt;
  });

  const ears = t.ears.map((e, i) => {
    const sx = i === 1 && t.floppy ? 0.78 : 1;
    const b = blob(e.x, e.y, e.r * sx, e.r, disorder.blobAmp * 1.2, rnd, 20);
    const inner = blob(e.x + (i === 0 ? 1.5 : -1.5), e.y + 1.5, e.r * sx * 0.58, e.r * 0.6, disorder.blobAmp, rnd, 16);
    return {
      d: b.d,
      ink: contourRing(b.pts, houseLine.contour, houseLine.taper, houseLine.wobble, stream(SEED, `${kind}-ear-${i}`)),
      inner: inner.d,
    };
  });

  const tuft = t.tuft
    ? (() => {
        const pts = quadPts([46, 30], [44, 16], [55, 11], 10);
        return { d: taperedOutline(pts, 8, 0.3), ink: taperedOutline(pts, 8 + houseLine.contour * 1.3, 0.3) };
      })()
    : null;

  const tail = (() => {
    const s = t.tail;
    const pts = quadPts([50 + s * 24, 80], [50 + s * 50, 78], [50 + s * 44, 50], 12);
    return { d: taperedOutline(pts, 6.5, 0.25), ink: taperedOutline(pts, 6.5 + houseLine.contour * 1.3, 0.25) };
  })();

  const paws = [
    blob(37, 89, 9.5, 6, 0.05, rnd, 14),
    blob(64, 90, 9, 5.8, 0.05, rnd, 14),
  ].map((p, i) => ({
    d: p.d,
    ink: contourRing(p.pts, houseLine.contour * 0.75, houseLine.taper, houseLine.wobble, stream(SEED, `${kind}-paw-${i}`)),
  }));

  // Whiskers — feature lines, three a side, not mirrored.
  const whiskers: string[] = [];
  const fw = houseLine.contour * houseLine.featureRatio * 0.7;
  for (const [side, ys] of [[-1, [60, 64, 68]], [1, [61, 65.5, 69]]] as const) {
    ys.forEach((y, k) => {
      const x0 = 50 + side * 9;
      const x1 = 50 + side * (36 + k * 3);
      const y1 = y + (k - 1) * 4;
      whiskers.push(taperedOutline(quadPts([x0, y], [(x0 + x1) / 2, y - 2 + k], [x1, y1], 8), fw, 0.3));
    });
  }

  const nudged = headPts.map(([x, y]) => [x - 4.5, y - 3.5] as Pt);

  return {
    t,
    head: {
      d: closedPath(headPts),
      ink: contourRing(headPts, houseLine.contour, houseLine.taper, houseLine.wobble, stream(SEED, `${kind}-ink`)),
    },
    away: `${closedPath(headPts)} ${closedPath(nudged)}`,
    muzzle: blob(50, 65, 15, 10.5, disorder.blobAmp, rnd, 16).d,
    nose: blob(50.5, 59.5, 4.2, 3.3, 0.04, rnd, 12),
    mouth: taperedOutline(quadPts([45, 68], [50, 72], [55.5, 68], 8), fw * 1.1, 0.5),
    ears,
    tuft,
    tail,
    paws,
    whiskers,
    eyes: [
      { cx: 39, cy: 50, r: 4.6 },
      { cx: 61.5, cy: 50.8, r: 4.3 },
    ],
    cheeks: [blob(30, 61, 4.6, 2.9, 0.05, rnd, 12).d, blob(70.5, 61.5, 4.3, 2.8, 0.05, rnd, 12).d],
  };
}

export type MouseFigureProps = {
  kind?: MouseKind;
  pose?: MousePose;
  /**
   * Shape-accurate hit target, for the tap easter egg (issue 43). The wrapper is
   * a rectangle bigger than the mouse, so only the painted mouse takes a press.
   */
  interactive?: boolean;
};

/** The mouse as bare SVG content in a 100x100 box — droppable into any viewBox. */
export function MouseFigure({ kind = 'roundEars', pose = 'watching', interactive = false }: MouseFigureProps) {
  const g = useMemo(() => geometry(kind), [kind]);
  const body = palette[`${kind}Body`];
  const shadeC = palette[`${kind}Shade`];
  const uid = useId().replace(/:/g, '');
  const featureW = houseLine.contour * houseLine.featureRatio;

  return (
    <g data-mouse-part="mouse" style={interactive ? { pointerEvents: 'visiblePainted' } : undefined}>
      <defs>
        <clipPath id={`mouse-head-${uid}`}>
          <path d={g.head.d} />
        </clipPath>
      </defs>

      {/* the tail, peeking out from behind */}
      <g data-mouse-part="tail">
        <path d={g.tail.ink} fill={palette.contour} />
        <path d={g.tail.d} fill={palette.mousePinkShade} />
      </g>

      {/* ears behind the head */}
      {g.ears.map((e, i) => (
        <g key={i} data-mouse-part="ear">
          <path d={e.ink} fill={palette.contour} fillRule="evenodd" />
          <path d={e.d} fill={body} />
          <path d={e.inner} fill={palette.mousePink} />
        </g>
      ))}

      {g.tuft && <path d={g.tuft.ink} fill={palette.contour} />}

      <path d={g.head.ink} fill={palette.contour} fillRule="evenodd" />
      <path data-mouse-part="head" d={g.head.d} fill={body} />
      <g clipPath={`url(#mouse-head-${uid})`}>
        <path data-mouse-part="muzzle" d={g.muzzle} fill={palette.mouseMuzzle} />
        <path d={g.away} fill={shadeC} fillRule="evenodd" opacity={0.45} />
      </g>
      {g.tuft && <path data-mouse-part="tuft" d={g.tuft.d} fill={body} />}

      {/* the face */}
      {g.cheeks.map((d, i) => (
        <path key={i} d={d} fill={palette.mousePink} opacity={0.7} />
      ))}
      {pose === 'happy'
        ? g.eyes.map((e, i) => (
            <path
              key={i}
              data-mouse-part="eye"
              d={taperedOutline(quadPts([e.cx - e.r, e.cy + 1], [e.cx, e.cy - e.r * 1.3], [e.cx + e.r, e.cy + 1], 8), featureW * 1.4, 0.5)}
              fill={palette.mouseEye}
            />
          ))
        : g.eyes.map((e, i) => (
            <g key={i} data-mouse-part="eye">
              <circle cx={e.cx} cy={e.cy} r={e.r} fill={palette.mouseEye} />
              <circle cx={e.cx - e.r * 0.32} cy={e.cy - e.r * 0.36} r={e.r * 0.36} fill={palette.mouseEyeShine} />
            </g>
          ))}
      {g.whiskers.map((d, i) => (
        <path key={i} data-mouse-part="whisker" d={d} fill={palette.contour} />
      ))}
      <path d={g.mouth} fill={palette.contour} />
      <path data-mouse-part="nose" d={g.nose.d} fill={palette.mousePink} />

      {/* paws on the rim, in front of everything */}
      {g.paws.map((p, i) => (
        <g key={i} data-mouse-part="paw">
          <path d={p.ink} fill={palette.contour} fillRule="evenodd" />
          <path d={p.d} fill={body} />
        </g>
      ))}
    </g>
  );
}

/** The mouse in its own `<svg>`, sized by its container. */
export function MouseDrawing(props: MouseFigureProps) {
  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      overflow="visible"
      data-mouse-drawing=""
      style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
    >
      <MouseFigure {...props} />
    </svg>
  );
}
