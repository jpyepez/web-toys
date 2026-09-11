import { useId, useMemo } from 'react';
import {
  blob,
  closedPath,
  contourRing,
  crescent,
  quadPts,
  taperedOutline,
  type Pt,
} from '../../shell/art/geometry';
import { disorder, line as houseLine } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { palette, shadeOf } from './palette';
import { BALLOON_WIDTH, KNOT_Y, VB_H, VB_W } from './balloon-metrics';

/**
 * The Up & Away Critter — a faced, code-drawn balloon (ADR-0002, primitives
 * only). Its whole appearance is a PURE FUNCTION of a continuous `fill` prop
 * (0→1): limp and sad at 0, swelling and brightening to plump and happy at 1.
 * Unlike the Muddy Puddle piglet's BINARY `cleaned` prop, `fill` is continuous
 * because the leak walks it smoothly back down — so the mapping must be
 * continuous and reversible, never a binary flip.
 *
 * REBUILT onto the harvested house style (`shell/art/house.ts`). The old
 * construction was an `<ellipse>` body, `<circle>` eyes and cheeks, and a
 * `stroke`d mouth and string — the shape of clip-art rather than of drawing, and
 * visibly a different artist from the Sheep two Cards away. What changed, and
 * why each:
 *
 *  - **The body is a PINCHED BLOB, not an ellipse.** A primitive has no vertices
 *    to perturb, which is why unmodified shapes read as software rather than as
 *    drawing — and an ellipse is not the shape anyway: a balloon is round at the
 *    crown and draws in to a neck, and that taper is what makes the knot a knot
 *    rather than a dot stuck on the bottom.
 *  - **Its contour is a filled RING.** SVG has no variable-width stroke, so a
 *    contour that swells underneath and lightens on top has to be a filled ring.
 *    A uniform `stroke` is the single loudest tell that a drawing came out of a
 *    vector editor.
 *  - **The body is at the house CAST lightness and chroma.** The five used to
 *    span L 0.60 to 0.83, which is not a family — and the yellow one sat ABOVE
 *    its own sky and its own clouds, so it dissolved into both. See `palette.ts`;
 *    this is the load-bearing change and the rest follows it.
 *  - **The catchlight is the PAPER.** It was `hsl(0 0% 100%)`. Nothing in this
 *    collection is pure white; a highlight is the paper showing through.
 *  - **The occlusion is `shade()` of this balloon's own body**, clipped to it, so
 *    it terminates on the body's own contour instead of floating inside it.
 *  - **The string reaches the peg.** Its end is a prop the Toy computes from the
 *    scene's tether point, rather than a fixed `M50 92 Q54 110 50 132` that
 *    pointed at wherever the peg happened to be at one aspect ratio.
 *
 * Structural pieces stay tagged `data-balloon-part` so tests address them
 * without coupling to which primitive draws each one. This art is STATELESS — it
 * owns no hold/leak logic; `HoldableBalloon` owns the fill value and passes it in.
 */

/*
 * Layout, in the 100x132 viewBox.
 *
 * The crown is deliberately large against the face: a balloon is a head with no
 * body, so the baby schema is carried entirely by where the features sit inside
 * it. Eyes BELOW the midline, and the eye strictly the largest feature on the
 * face — the old art had the blush the same size as the eye and more saturated
 * than it.
 */
const BODY_CX = 50;
const BODY_CY = 50;
const BODY_RX = 45;
const BODY_RY = 48;
/**
 * How hard the lower half draws in toward the neck. At 0 the body is an ellipse;
 * at 0.74 the widest point of the base is about a quarter of the crown, which is
 * a balloon. Applied as a squared falloff so the shoulders stay round and only
 * the last third pinches — a linear pull cones the whole lower half and gives a
 * pear, not a balloon.
 */
const PINCH = 0.74;
const EYE_R = 6.4;
/** BELOW the midline. Above it is an adult skull. */
const EYE_BELOW_MIDLINE = 3.2;
const EYE_SPREAD = 13.5;
/** Strictly under 1 so the eye outranks the blush for attention. */
const CHEEK_SCALE = 0.62;

/** One fixed seed for the whole cast: the disorder is authored, not random. */
const SEED = 4271;

/**
 * Where the string ends, as an offset from the knot in the drawing's own box
 * units.
 *
 * The default is a plumb line just past the bottom of the box, so a decorative
 * mount — the Card preview, the ghost-finger demo, a bare test render — still
 * draws a balloon on a string. The live Toy overrides it with the real vector
 * from this balloon's knot to the scene's tether, which is what makes five
 * strings converge on one peg at every aspect ratio.
 */
export type Tail = { dx: number; dy: number };
const DEFAULT_TAIL: Tail = { dx: -2, dy: VB_H - KNOT_Y };

export type BalloonFigureProps = {
  /** Inflation 0→1. Drives the body swell and the sad→happy face. */
  fill?: number;
  /** Balloon body colour, one of `palette.balloon1`…`balloon5`. */
  color?: string;
  /** Where this balloon's string ends — see `Tail`. */
  tail?: Tail;
  /**
   * When true, the balloon's painted shape is the pointer hit-target
   * (`pointer-events: visiblePainted`) — so a Hold registers on the round
   * balloon the child sees, not on the SVG's larger transparent bounding box.
   * Opt-in (default off) because the wrapper around a live balloon is made
   * pointer-transparent so overlapping balloons don't steal each other's taps,
   * and the DECORATIVE uses must stay untappable. Stays art-only: this is
   * *where* the art can be touched, not hold/leak logic.
   */
  interactive?: boolean;
};

/**
 * The balloon itself, as bare SVG content — no `<svg>` wrapper, no sizing — so
 * it can be dropped into any viewBox. Authored in a 100x132 box.
 *
 * The split exists so the Home Card can draw the REAL balloon. The Card used to
 * carry a hand-simplified stand-in built from plain `<ellipse>`s — the exact
 * construction this file was rebuilt away from — which is clip-art sitting on a
 * Card whose scene is now generated and contoured. Simplifying the cast for a
 * thumbnail is not a saving; it is the defect, shrunk.
 */
export function BalloonFigure({
  fill = 0,
  color = palette.balloon1,
  tail = DEFAULT_TAIL,
  interactive = false,
}: BalloonFigureProps) {
  const uid = useId().replace(/:/g, '');
  const shade = shadeOf(color);

  // Geometry is a pure function of `fill`, so it is stable across renders and
  // identical between server and client. Seeded: the disorder is deliberate but
  // never random at runtime — the same fill always draws the same balloon.
  const g = useMemo(() => geometry(fill), [fill]);
  const string = useMemo(() => stringPath(tail), [tail]);

  // Body swell: limp at fill 0, plump at fill 1. Monotonic in fill so the leak
  // walks it smoothly back down. Scales about the KNOT, which is the one point
  // that must not move — the scene ties its string there.
  const swell = 0.68 + 0.32 * fill;

  return (
    <>
      <defs>
        {/* Per-instance so two balloons on one screen never share a clip. */}
        <clipPath id={`balloon-body-${uid}`}>
          <path d={g.body.d} />
        </clipPath>
      </defs>

      {/* The string — a tapered FILL, not a `stroke`. It is drawn OUTSIDE the
          swelling group so it stays anchored while the balloon inflates above
          it, and first so the knot covers where the two meet. */}
      <path data-balloon-part="string" d={string} fill={palette.string} />

      <g
        data-balloon-part="balloon"
        /*
         * Scaled about the KNOT, spelled out as translate-scale-translate rather
         * than left to `transform-origin`. CSS `transform-origin` does not apply
         * to an SVG `transform` ATTRIBUTE — only to the CSS `transform` property
         * — so the previous `transformOrigin: '50px 90px'` beside a
         * `transform="scale(...)"` did nothing at all, and the balloon deflated
         * toward the top-left corner of its own box instead of settling onto its
         * knot. The attribute is what the fill tests read, so the origin has to
         * be written into it.
         */
        transform={`translate(${BODY_CX} ${KNOT_Y}) scale(${swell.toFixed(4)}) translate(${-BODY_CX} ${-KNOT_Y})`}
        style={{
          // Shape-accurate hit-target for a live balloon (see `interactive`):
          // only the painted balloon takes the press, never the empty corners of
          // the SVG box. Decorative balloons leave it inherited (untappable).
          ...(interactive ? { pointerEvents: 'visiblePainted' as const } : {}),
        }}
      >
        {/* The knot, behind the body so the body's own contour crops it — a
            subdivision of the form rather than a shape stacked under it. */}
        <path d={g.knotInk} fill={palette.contour} fillRule="evenodd" />
        <path data-balloon-part="knot" d={g.knot.d} fill={shade} />

        {/* THE BODY. Contour ring first, then the fill on top. */}
        <path d={g.bodyInk} fill={palette.contour} fillRule="evenodd" />
        <path data-balloon-part="body" d={g.body.d} fill={color} />

        <g clipPath={`url(#balloon-body-${uid})`}>
          {/* Occlusion down the away side, clipped to the body so it terminates
              on the body's own outline. `shade()` of this balloon — never black,
              never a grey overlay, never opacity-on-black. */}
          <path data-balloon-part="shade" d={g.occlusion} fill={shade} opacity={0.34} />
          {/* The highlight is the PAPER showing through, on the lit side, and
              tilted to follow the crown rather than lying flat across it. */}
          <path
            data-balloon-part="sheen"
            d={g.sheen.d}
            fill={palette.paper}
            opacity={0.55}
            transform={`rotate(-28 ${BODY_CX - BODY_RX * 0.44} ${BODY_CY - BODY_RY * 0.5})`}
          />
        </g>

        {/* The blush — invisible while limp, brightening in as it fills. Held
            under the eye in size so the eye stays the largest feature. */}
        <circle data-balloon-part="cheek" cx={g.cheekL[0]} cy={g.cheekL[1]} r={g.cheekR} fill={palette.cheek} opacity={fill} />
        <circle data-balloon-part="cheek" cx={g.cheekR2[0]} cy={g.cheekR2[1]} r={g.cheekR * 0.9} fill={palette.cheek} opacity={fill * 0.92} />

        {/* Nothing is mirrored: the two eyes differ in size and height. */}
        <circle data-balloon-part="eye" cx={g.eyeL[0]} cy={g.eyeL[1]} r={g.eyeLR} fill={palette.faceInk} />
        <circle data-balloon-part="eye" cx={g.eyeR[0]} cy={g.eyeR[1]} r={g.eyeRR} fill={palette.faceInk} />
        <circle
          data-balloon-part="eye-shine"
          cx={g.eyeL[0] - g.eyeLR * 0.32}
          cy={g.eyeL[1] - g.eyeLR * 0.36}
          r={g.eyeLR * 0.34}
          fill={palette.faceShine}
        />
        <circle
          data-balloon-part="eye-shine"
          cx={g.eyeR[0] - g.eyeRR * 0.3}
          cy={g.eyeR[1] - g.eyeRR * 0.38}
          r={g.eyeRR * 0.28}
          fill={palette.faceShine}
        />

        {/* The mouth bows a frown into a smile as it fills — the expression
            changes by SHAPE, not by colour, so it reads at a glance and stays
            continuous under the leak. A tapered fill, and a HAIRLINE: a drawn
            smile in this tradition is the lightest line on the drawing, well
            under the contour that carries the form. At contour weight over a
            curve this deep it fills in as a solid dark lens and reads as an open
            mouth rather than a smile. */}
        <path data-balloon-part="mouth" d={g.mouth} fill={palette.faceInk} />
      </g>
    </>
  );
}

/**
 * The sized element the Toy mounts: `BalloonFigure` in its own `<svg>` at the
 * shipped `BALLOON_WIDTH`.
 *
 * `overflow: visible` is load-bearing rather than defensive — the string is
 * drawn from the knot to wherever the scene's peg is, which is routinely well
 * outside this box for a balloon high in the bunch.
 */
export function BalloonDrawing(props: BalloonFigureProps) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      aria-hidden="true"
      style={{
        width: BALLOON_WIDTH,
        height: 'auto',
        display: 'block',
        overflow: 'visible',
      }}
    >
      <BalloonFigure {...props} />
    </svg>
  );
}

/**
 * The string, as a tapered fill from the knot to wherever the scene says the peg
 * is.
 *
 * It BOWS rather than running straight: a string under a balloon has slack in
 * it, and a dead-straight line between two points is the same "rule drawn across
 * the picture" the scene's own composition rules are about. The bow is
 * perpendicular to the run and scaled by its length, so a short string sags a
 * little and a long one sags a lot.
 */
function stringPath(tail: Tail): string {
  const from: Pt = [BODY_CX, KNOT_Y];
  const to: Pt = [BODY_CX + tail.dx, KNOT_Y + tail.dy];
  const len = Math.hypot(tail.dx, tail.dy) || 1;
  const sag = Math.min(18, len * 0.16);
  const ctrl: Pt = [
    (from[0] + to[0]) / 2 - (tail.dy / len) * sag,
    (from[1] + to[1]) / 2 + (tail.dx / len) * sag,
  ];
  return taperedOutline(quadPts(from, ctrl, to, 16), houseLine.detail * 1.15, 0.3);
}

function geometry(fill: number) {
  // Seeded on the fill BUCKET rather than on the raw value: the fill changes
  // every 16ms while held, and re-rolling the disorder on each tick would make
  // the balloon shimmer instead of swell. Twelve buckets is fine enough that the
  // shape evolves as it inflates and coarse enough to stay still between ticks.
  const rnd = stream(SEED, `balloon-${Math.round(fill * 12)}`);
  const jit = (amount: number) => (rnd() - 0.5) * 2 * amount;

  /*
   * The body. A blob for the disorder, then PINCHED toward the neck below the
   * midline — the taper is what makes it a balloon rather than an egg, and it
   * has to happen after the wobble so the wobble follows the real silhouette.
   */
  const round = blob(BODY_CX, BODY_CY, BODY_RX, BODY_RY, disorder.blobAmp, rnd, 30);
  const pts: Pt[] = round.pts.map(([x, y]) => {
    if (y <= BODY_CY) return [x, y] as Pt;
    const t = Math.min(1, (y - BODY_CY) / BODY_RY);
    return [BODY_CX + (x - BODY_CX) * (1 - PINCH * t * t), y] as Pt;
  });
  const body = { d: closedPath(pts), pts };

  /*
   * The knot. A small three-cornered pinch below the neck, tilted off-axis —
   * it is the one asymmetry that reads at a glance, and a symmetric one would
   * look like a stem.
   */
  const neckY = BODY_CY + BODY_RY;
  const knotW = BODY_RX * 0.16;
  const knotTilt = jit(disorder.instanceRotate * 1.6);
  const knot = blob(BODY_CX + knotTilt * 0.3, neckY + knotW * 0.55, knotW, knotW * 0.85, disorder.blobAmp * 3, rnd, 12);

  const eyeY = BODY_CY + EYE_BELOW_MIDLINE;
  // Not the same size, not the same height.
  const eyeLR = EYE_R * (1 + 0.07 * disorder.asymmetry);
  const eyeRR = EYE_R * (1 - 0.06 * disorder.asymmetry);
  const eyeL: Pt = [BODY_CX - EYE_SPREAD, eyeY];
  const eyeR: Pt = [BODY_CX + EYE_SPREAD * 1.05, eyeY + 0.6 * disorder.asymmetry];

  /*
   * The mouth. The control point crosses the endpoints as `fill` rises, bowing a
   * frown into a smile — continuous in fill, so the leak reverses the expression
   * smoothly rather than flipping it. The endpoints also lift slightly, because
   * a mouth that only changes curvature reads as a mechanism.
   */
  const mouthY = eyeY + EYE_R * 2.4;
  const mouthHalf = EYE_SPREAD * 0.62;
  const mouth = taperedOutline(
    quadPts(
      [BODY_CX - mouthHalf, mouthY - 1.2 * fill],
      [BODY_CX + jit(0.6), mouthY + (-6 + 15 * fill)],
      [BODY_CX + mouthHalf * 1.04, mouthY - 1.4 * fill],
      14,
    ),
    houseLine.detail * 1.1,
    0.5,
  );

  const ring = (loop: readonly Pt[], width: number, name: string) =>
    contourRing(loop, width, houseLine.taper, houseLine.wobble, stream(SEED, name));

  return {
    body,
    bodyInk: ring(pts, houseLine.contour, 'balloon-body-ink'),
    knot,
    knotInk: ring(knot.pts, houseLine.contour * houseLine.featureRatio, 'balloon-knot-ink'),
    /**
     * The form shadow down the away side. One light direction, obeyed by every
     * element — the same upper-left key the scene's own reliefs follow.
     */
    occlusion: crescent(BODY_CX + BODY_RX * 0.5, BODY_CY + BODY_RY * 0.16, BODY_RX * 0.72, 0.62, 1.5),
    /**
     * The specular highlight, up on the lit shoulder. A pinched blob rather than
     * a circle, and the PAPER rather than white — a highlight in this collection
     * is the paper showing through.
     */
    sheen: blob(BODY_CX - BODY_RX * 0.44, BODY_CY - BODY_RY * 0.5, BODY_RX * 0.2, BODY_RY * 0.13, disorder.blobAmp * 2, rnd, 14),
    eyeL,
    eyeR,
    eyeLR,
    eyeRR,
    cheekL: [BODY_CX - EYE_SPREAD * 1.42, eyeY + EYE_R * 0.9] as Pt,
    cheekR2: [BODY_CX + EYE_SPREAD * 1.44, eyeY + EYE_R * 1.0] as Pt,
    cheekR: EYE_R * CHEEK_SCALE,
    mouth,
  };
}
