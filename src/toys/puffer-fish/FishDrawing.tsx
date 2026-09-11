import { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  blob,
  closedPath,
  contourRing,
  crescent,
  grownContour,
  quadPts,
  taperedOutline,
  type Pt,
} from '../../shell/art/geometry';
import { disorder, line as houseLine } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { palette } from './palette';

/**
 * The Puffer Fish Critter — a faced, code-drawn puffer (ADR-0002, primitives
 * only). Its appearance is a PURE FUNCTION of props; the loop's state machine
 * lives in `PufferFish.tsx`.
 *
 * REBUILT onto the harvested house style (`shell/art/house.ts`). The old
 * construction was a `<circle>` body, four `<ellipse>` fins, two `<circle>` eyes
 * and three `stroke`d curves for the smile and the squint — the shape of
 * clip-art rather than of drawing, and visibly a different artist from the Sheep
 * one Card away. What changed, and why each:
 *
 *  - **The body is at the house CAST lightness.** It used to sit at L 0.968 —
 *    ABOVE the paper the collection prints on — which made the Critter the
 *    lightest surface in the entire app, clearing its own water by 0.128 and its
 *    own bubbles by 0.033 against a floor of 0.30. Greyscaled, the fish was two
 *    eyes and a smile floating on blue. See `palette.ts`; this is the
 *    load-bearing change and the rest follows it.
 *  - **Every form is a perturbed BLOB, not a primitive.** A `<circle>` has no
 *    vertices to perturb, which is exactly why unmodified primitives read as
 *    software rather than as drawing. `blob` modulates the radius with a
 *    low-order periodic function — Molnár's 1% disorder made concrete.
 *  - **The contour is a filled variable-width RING.** SVG has no variable-width
 *    stroke, so a uniform one reads as a different line language from the rest
 *    of the collection's filled contours — that single mismatch is most of what
 *    makes a drawing look like it came out of a vector editor.
 *  - **Every line is a filled tapered path.** There is no `stroke` in this file.
 *    The smile and the `^w^` squint were both strokes.
 *  - **Forms are subdivided, not stacked.** The belly is oversized and clipped
 *    to the body, so it terminates on the body's OWN contour instead of floating
 *    concentrically inside it as a smaller shape.
 *  - **The face obeys the baby schema numerically.** Eyes sit BELOW the body's
 *    midline and the eye is strictly the largest feature on the face — the old
 *    cheeks were larger than the eyes AND the most saturated thing in the frame.
 *  - **Nothing is mirrored.** The two eyes, cheeks and pectoral fins differ in
 *    size, angle and height.
 *
 * THERE IS NO CONTACT SHADOW, and that is a decision rather than an omission: a
 * shadow under a Critter in open water is cast by nothing. The Fish is
 * SWIMMING — the reef gives it a hover point above the seabed (`reef.ts`), not a
 * place to stand — so what sells its position is the scene passing behind it and
 * the bed sitting well below, never a contact mark.
 *
 * The silhouette stays smooth and round in BOTH states — there are no spikes,
 * ever. Structural pieces stay tagged `data-fish-part` so tests address them
 * without coupling to which primitive draws each one.
 */

/**
 * The Fish's rendered width, and the scene's unit — the reef sizes every ridge,
 * blade, polyp and the sun against it (see `reef.ts`), so this is the one place
 * it is stated and the three constants below must agree with it.
 *
 * It used to be `min(220px, 55vw)`, which pins a Fish at 220px on any screen
 * wider than 400px: 55% of a phone's width and 15% of a 1440px desktop's. The
 * upper clamp lets a big viewport get a bigger Fish — and, because the reef is
 * measured in Fish, a proportionally bigger scene with fewer, larger elements,
 * which is calmer rather than busier. The upper bound is lower than the Sheep's
 * because this Critter BALLOONS on the way out: at 44vw a phone Fish is ~172px,
 * and the dismiss beat's 1.7x scale has to stay on screen.
 */
export const FISH_WIDTH = 'clamp(140px, 44vw, 220px)';
export const FISH_MIN_PX = 140;
export const FISH_VW = 0.44;
export const FISH_MAX_PX = 220;

/** The drawing's own box. Wider than tall, because a puffer with a tail is. */
const VB_W = 100;
const VB_H = 92;
/** The aspect the layer above has to preserve when it places this drawing. */
export const FISH_ASPECT = VB_H / VB_W;

/*
 * Layout, in the 100x92 viewBox.
 *
 * A puffer is the collection's one Critter with NO separate head — it is a
 * single round mass wearing a face, which is the opposite end of the head/body
 * scale from the fledglings (a chibi head on a small body) and from the Sheep (a
 * fleecy body carrying a smaller face). The house rule bans the 0.7-1.5
 * "snowman" band; a body/head ratio of infinity is not in it, and the three
 * Critters stay mutually distinguishable as solid black shapes, which is the
 * test that matters.
 */
const BODY_CX = 54;
const BODY_CY = 44;
const BODY_RX = 30;
const BODY_RY = 28;
/** How much rounder the body reads when puffed. The Toy scales the whole
 *  drawing on top of this; the art swap only has to say "inflated". */
const PUFF_SCALE = 1.18;
const EYE_R = 5.4;
/** BELOW the midline. Above it is an adult skull, which is what the old drawing
 *  had before asking blush and catchlights to make it read as a baby. */
const EYE_BELOW_MIDLINE = 2.2;
const EYE_SPREAD = 9.4;
/** Strictly under 1 so the eye outranks the blush for attention. */
const CHEEK_SCALE = 0.62;
/** Where the body's CENTRE sits in the box, so the Fish can be hung on the
 *  reef's hover point rather than at a CSS percentage tuned against nothing. */
export const BODY_FRACTION = BODY_CY / VB_H;

/** One fixed seed for the Critter: the disorder is authored, not random. */
const SEED = 4271;

export type FishFigureProps = {
  /**
   * The puff. Lives in the loop's STATE, not on the Fish — the Toy passes it
   * during `dismissing`, the same way the Sheep's done-glow does.
   */
  puffed?: boolean;
  /** Re-enables the press on the painted Fish when the wrapper is
   *  `pointer-events: none`. */
  interactive?: boolean;
};

/**
 * The Fish itself, as bare SVG content — no `<svg>` wrapper, no sizing, no
 * breathing — so it can be dropped into any viewBox. Authored in a 100x92 box.
 */
export function FishFigure({ puffed = false, interactive = false }: FishFigureProps) {
  const uid = useId().replace(/:/g, '');
  const reducedMotion = useReducedMotion();

  // Geometry is a pure function of the state, so it is stable across renders and
  // identical between server and client. Seeded: the disorder is deliberate but
  // never random at runtime.
  const g = useMemo(() => geometry(puffed), [puffed]);

  const ring = (pts: readonly Pt[], width: number, seedName: string) =>
    contourRing(pts, width, houseLine.taper, houseLine.wobble, stream(SEED, seedName));

  /** For the fins, whose tips are sharp and whose notch is concave — see the
   *  tail's note on why a ring tears itself open on both. */
  const grow = (pts: readonly Pt[], width: number, seedName: string) =>
    grownContour(pts, width * 0.5, houseLine.taper, houseLine.wobble, stream(SEED, seedName));

  const wFeature = houseLine.contour * houseLine.featureRatio;

  return (
    <>
      <defs>
        {/* Per-instance so two Fish on one screen never share a clip. */}
        <clipPath id={`fish-body-${uid}`}>
          <path d={g.body.d} />
        </clipPath>
      </defs>

      <g
        data-fish-part="fish"
        style={interactive ? { pointerEvents: 'visiblePainted' } : undefined}
      >
        {/*
          * THE TAIL, and it is doing more work than any other part: it is what
          * says FISH.
          *
          * It was a round blob set behind the body at head height, and the first
          * render of it is why this note exists — a circle with a round nub
          * behind it and two more on top is a BEAR, and that is exactly what the
          * drawing read as. A caudal fin has to be a forked FAN: two tips spread
          * well past the body's own height with a concave notch between them, so
          * the silhouette leaves the body and comes back. That notch is the
          * whole species cue, and it survives the black-shape test the way a
          * marking would not.
          *
          * GROWN, not ringed: `contourRing` builds a reversed inner loop and
          * fills between with `evenodd`, and at the tail's sharp tips and its
          * concave notch that inner loop crosses itself — every one of those
          * crossings comes out as a white nick.
          */}
        <g transform={`rotate(${g.tailRot} ${g.tailPivot[0]} ${g.tailPivot[1]})`}>
          <path d={grow(g.tail.pts, wFeature, 'tail')} fill={palette.contour} />
          <path data-fish-part="tail" d={g.tail.d} fill={palette.fishFin} />
        </g>

        {/* dorsal fin — a low swept triangle on the BACK, not a nub on the
            crown. Set well behind the face, so it reads as a fin on a back
            rather than as an ear on a head. */}
        <path d={grow(g.dorsal.pts, wFeature, 'dorsal')} fill={palette.contour} />
        <path data-fish-part="fin" d={g.dorsal.d} fill={palette.fishFin} />

        {/* THE BODY. Contour ring, then the fill on top. */}
        <path d={ring(g.body.pts, houseLine.contour, 'body')} fill={palette.contour} fillRule="evenodd" />
        <path data-fish-part="body" d={g.body.d} fill={palette.fishBody} />

        {/* Everything inside the body is CLIPPED to it, so each internal edge
            terminates on the body's own outline rather than floating within it.
            `shade()` colours throughout — never black, never a grey overlay. */}
        <g clipPath={`url(#fish-body-${uid})`}>
          {/* the pale underside, deliberately oversized so it BREAKS the body's
              outline rather than sitting concentrically inside it */}
          <path data-fish-part="belly" d={g.belly.d} fill={palette.fishBelly} />
          {/* the spot mass on the back — a counted texture, well under the size
              a spot would need to be countable as a thing of its own */}
          <g data-fish-part="spots" fill={palette.fishShade} opacity={0.55}>
            {g.spots.map((s, i) => (
              <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} />
            ))}
          </g>
          <path d={g.bodyOcclusion} fill={palette.fishShade} opacity={0.4} />
          <circle data-fish-part="cheek" cx={g.cheekL[0]} cy={g.cheekL[1]} r={g.cheekR} fill={palette.fishCheek} />
          <circle data-fish-part="cheek" cx={g.cheekR2[0]} cy={g.cheekR2[1]} r={g.cheekR * 0.92} fill={palette.fishCheek} />
        </g>

        {/* the pectoral fin — in FRONT of the body and the only part that is, so
            it reads as the near side of a solid form. On the FLANK and swept
            back: forward, on the pale belly, a dark fin is read as a mouth, and
            a nub on the outline is an ear. It splays when the fish puffs, which
            is the one part of the inflation that is not simply "bigger". */}
        <g transform={`rotate(${g.pectoralRot} ${g.pectoralPivot[0]} ${g.pectoralPivot[1]})`}>
          <path d={grow(g.pectoral.pts, wFeature, 'pectoral')} fill={palette.contour} />
          <path data-fish-part="fin" d={g.pectoral.d} fill={palette.fishFin} />
        </g>

        {puffed ? (
          /* The happy `^w^` squint. Tapered FILLS, not the `stroke`d arcs this
             used to be — a uniform vector stroke beside a variable-width contour
             is the loudest clip-art tell there is. */
          <>
            <path data-fish-part="eye-squint" d={g.squintL} fill={palette.fishEye} />
            <path data-fish-part="eye-squint" d={g.squintR} fill={palette.fishEye} />
          </>
        ) : (
          /* Eyes blink on a slow loop — the highest "alive"-per-byte animation
             there is. Driven by Motion's own frameloop rather than a React
             timer: the loop's mechanic tests drain fake timers one transition at
             a time, and a self-rescheduling blink would pollute that queue.
             `transformBox: fill-box` pivots on the group's own box so the lids
             meet at the eye centreline rather than at the SVG origin. */
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={reducedMotion ? undefined : { scaleY: [1, 1, 0.1, 1] }}
            transition={{ duration: 4.8, times: [0, 0.9, 0.945, 1], ease: 'easeOut', repeat: Infinity }}
          >
            <circle data-fish-part="eye" cx={g.eyeL[0]} cy={g.eyeL[1]} r={g.eyeLR} fill={palette.fishEye} />
            <circle data-fish-part="eye" cx={g.eyeR[0]} cy={g.eyeR[1]} r={g.eyeRR} fill={palette.fishEye} />
            {/* The catchlight is the PAPER showing through, never `#fff`. */}
            <circle
              data-fish-part="eye-shine"
              cx={g.eyeL[0] - g.eyeLR * 0.32}
              cy={g.eyeL[1] - g.eyeLR * 0.36}
              r={g.eyeLR * 0.32}
              fill={palette.fishEyeShine}
            />
            <circle
              data-fish-part="eye-shine"
              cx={g.eyeR[0] - g.eyeRR * 0.3}
              cy={g.eyeR[1] - g.eyeRR * 0.38}
              r={g.eyeRR * 0.28}
              fill={palette.fishEyeShine}
            />
          </motion.g>
        )}

        {/* the smile — a HAIRLINE tapered fill. At any real weight a curve this
            deep fills in as a solid dark lens and reads as an open mouth, which
            is a different animal's expression entirely. */}
        <path data-fish-part="smile" d={g.smile} fill={palette.fishEye} />
      </g>
    </>
  );
}

/**
 * The sized element the Toy mounts: `FishFigure` in its own `<svg>` at the
 * shipped `FISH_WIDTH`, carrying the breathing swell.
 *
 * The split exists so the Home Card can draw the REAL Fish. The Card used to
 * carry a hand-simplified `MiniFish` built from plain `<ellipse>`s — the exact
 * construction this file was rebuilt away from — which is clip-art sitting on a
 * Card whose scene is now generated and contoured. Simplifying the cast for a
 * thumbnail is not a saving; it is the defect, shrunk.
 *
 * The breath lives out here rather than in the figure: a Card is a still, and a
 * looping animation on five of them is five rAF subscriptions for a page nobody
 * is looking at yet.
 */
export function FishDrawing(props: FishFigureProps) {
  const reducedMotion = useReducedMotion();
  return (
    // A slow breathing swell rides on the whole drawing — the cheapest "alive"
    // there is, and it scales from the CENTRE because this Critter hovers rather
    // than stands. Disabled under reduced motion.
    <motion.svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      aria-hidden="true"
      style={{
        width: FISH_WIDTH,
        height: 'auto',
        display: 'block',
        transformOrigin: 'center center',
        overflow: 'visible',
      }}
      animate={reducedMotion ? undefined : { scale: [1, 1.026, 1] }}
      transition={{ duration: 3.1, ease: 'easeInOut', repeat: Infinity }}
    >
      <FishFigure {...props} />
    </motion.svg>
  );
}

function geometry(puffed: boolean) {
  const rnd = stream(SEED, puffed ? 'puffed' : 'rest');
  const jit = (amount: number) => (rnd() - 0.5) * 2 * amount;

  const s = puffed ? PUFF_SCALE : 1;
  const rx = BODY_RX * s;
  const ry = BODY_RY * s;

  /*
   * The body. One perturbed blob rather than a circle — and the perturbation is
   * the whole reason it reads as drawn: a primitive has no vertices to move, so
   * a `<circle>` is always exactly a circle and always looks it.
   */
  const body = blob(BODY_CX, BODY_CY, rx, ry, disorder.blobAmp, rnd, 28);

  /*
   * THE TAIL. A forked FAN, not a blob — see the note at its render site: a
   * round nub behind a round body is an ear, and the whole drawing read as a
   * bear until this became a fin.
   *
   * Built as an explicit outline rather than from `blob`, because the two things
   * that make it a tail are a sharp TIP at each corner and a concave NOTCH
   * between them, and a radius-modulated ellipse can produce neither. The tips
   * reach well past the body's own height: a fan inside the body's silhouette is
   * not visible as a fan at all.
   */
  const tailBase = BODY_CX - rx * 0.86;
  const tailReach = rx * 0.92;
  const tailSpread = ry * (puffed ? 0.78 : 0.92);
  const tailPts: Pt[] = [
    [tailBase, BODY_CY - ry * 0.3],
    [tailBase - tailReach * 0.72, BODY_CY - tailSpread],
    [tailBase - tailReach, BODY_CY - tailSpread * 0.86],
    // The notch. It comes BACK toward the body between the two tips, which is
    // the fork, and it is the single most legible thing in the silhouette.
    [tailBase - tailReach * 0.34, BODY_CY + jit(0.6)],
    [tailBase - tailReach * 0.98, BODY_CY + tailSpread * 0.9],
    [tailBase - tailReach * 0.66, BODY_CY + tailSpread * 1.02],
    [tailBase, BODY_CY + ry * 0.34],
  ];
  const tail = { d: closedPath(tailPts), pts: tailPts };
  const tailPivot: Pt = [tailBase, BODY_CY];
  const tailRot = (puffed ? -9 : -2) + jit(disorder.instanceRotate);

  /*
   * The dorsal fin. A low swept triangle on the BACK — set behind the face, not
   * on the crown. A rounded lobe on top of a round head is the other ear.
   */
  const dorsalPts: Pt[] = [
    [BODY_CX - rx * 0.74, BODY_CY - ry * 0.64],
    [BODY_CX - rx * 0.84, BODY_CY - ry * 1.08],
    [BODY_CX - rx * 0.16, BODY_CY - ry * 0.92],
    [BODY_CX - rx * 0.18, BODY_CY - ry * 0.64],
  ];
  const dorsal = { d: closedPath(dorsalPts), pts: dorsalPts };

  /*
   * The pectoral fin. A leaf swept BACK and DOWN off the FLANK — and where it
   * sits is the whole lesson of the first render. Drawn forward, under the face,
   * a dark fin lying across the pale belly is read as a MOUTH: the eye finds a
   * dark mass below two eyes and calls it a muzzle, whatever the anatomy says.
   * Behind the face, on the flank, the same shape is unmistakably a fin.
   *
   * There is exactly one, and no anal fin behind it. A second and third fin on a
   * body this round is clutter that the silhouette cannot spend: the tail's fork
   * is what says fish, and everything else is competing with it.
   */
  const pectoralPts: Pt[] = [
    [BODY_CX - rx * 0.44, BODY_CY + ry * 0.24],
    [BODY_CX - rx * 0.64, BODY_CY + ry * 0.82],
    [BODY_CX - rx * 0.4, BODY_CY + ry * 0.98],
    [BODY_CX - rx * 0.12, BODY_CY + ry * 0.52],
  ];
  const pectoral = { d: closedPath(pectoralPts), pts: pectoralPts };
  const pectoralPivot: Pt = [BODY_CX - rx * 0.3, BODY_CY + ry * 0.34];
  const pectoralRot = (puffed ? 26 : 5) + jit(disorder.instanceRotate);

  /*
   * The belly. BROAD and LOW — a band along the whole underside, oversized so
   * that, clipped to the body, it terminates on the body's own contour instead
   * of floating clear of it.
   *
   * It used to be a round patch centred under the mouth, at which point it was
   * not a belly at all: a pale oval under a smile is a MUZZLE, and it was half
   * of why the drawing read as a bear. A belly runs the length of the animal.
   */
  const belly = blob(BODY_CX - rx * 0.05, BODY_CY + ry * 0.86, rx * 1.05, ry * 0.62, disorder.blobAmp, rnd, 20);

  /*
   * The spots. A counted texture on the back, each one a small fraction of the
   * body and none of them large enough to be sorted as a thing of its own — the
   * same rule the scene's polyps are held to, applied inside the cast. Placed on
   * a jittered arc rather than at random: uniform random has energy at very low
   * spatial frequencies, which shows up as clumps and bare patches.
   */
  const spots: Array<[number, number, number]> = Array.from({ length: 7 }, (_, i) => {
    const t = (i + 0.5) / 7;
    // The upper-BACK arc only: spots wandering onto the face read as freckles,
    // and a face with freckles under two round eyes is a different animal again.
    const a = Math.PI * (1.02 + t * 0.62) + jit(0.1);
    const rad = 0.46 + rnd() * 0.34;
    return [
      BODY_CX + Math.cos(a) * rx * rad,
      BODY_CY + Math.sin(a) * ry * rad,
      rx * (0.045 + rnd() * 0.035),
    ];
  });

  const eyeY = BODY_CY + EYE_BELOW_MIDLINE;
  // Not the same size, not the same height.
  const eyeLR = EYE_R * (1 + 0.06 * disorder.asymmetry);
  const eyeRR = EYE_R * (1 - 0.05 * disorder.asymmetry);
  const faceX = BODY_CX + rx * 0.2;
  const eyeL: Pt = [faceX - EYE_SPREAD, eyeY];
  const eyeR: Pt = [faceX + EYE_SPREAD * 1.04, eyeY + 0.5 * disorder.asymmetry];

  /** One `^` of the squint, as a tapered fill. */
  const squint = (cx: number, cy: number, r: number): string =>
    taperedOutline(
      quadPts([cx - r, cy + r * 0.42], [cx, cy - r * 0.7], [cx + r, cy + r * 0.42], 12),
      houseLine.contour * 1.15,
      0.5,
    );

  const mouthY = eyeY + EYE_R * 1.85;

  return {
    body,
    tail,
    tailRot,
    tailPivot,
    dorsal,
    pectoral,
    pectoralRot,
    pectoralPivot,
    belly,
    spots,
    eyeL,
    eyeR,
    eyeLR,
    eyeRR,
    squintL: squint(eyeL[0], eyeL[1], eyeLR * 1.05),
    squintR: squint(eyeR[0], eyeR[1], eyeRR * 1.05),
    cheekL: [eyeL[0] - EYE_R * 1.35, eyeY + EYE_R * 0.95] as Pt,
    cheekR2: [eyeR[0] + EYE_R * 1.3, eyeY + EYE_R * 1.02] as Pt,
    cheekR: EYE_R * CHEEK_SCALE,
    /*
     * The smile is a HAIRLINE, well under the contour that carries the form —
     * a drawn smile in this tradition is the lightest line on the drawing. It
     * sits on the same face axis as the eyes, so it is never pushed to one side.
     */
    smile: taperedOutline(
      quadPts(
        [faceX - EYE_R * 0.95, mouthY],
        [faceX + 0.3, mouthY + EYE_R * 0.85],
        [faceX + EYE_R * 1.0, mouthY - 0.2],
        12,
      ),
      houseLine.detail * 0.95,
      0.5,
    ),
    /** The body's own form shadow, along its underside. */
    bodyOcclusion: crescent(BODY_CX, BODY_CY + ry * 0.5, rx * 0.95, 0.7, 0.55),
  };
}

/**
 * How far below the drawing's TOP edge the body's centre sits, as a multiple of
 * the Fish's rendered WIDTH — the one number that converts "where the reef's
 * hover point is" into "where this element goes".
 *
 * Expressed against width rather than height because width is what CSS is given
 * (`FISH_WIDTH`); the height follows from the viewBox aspect. Deriving it here
 * rather than restating it in the Toy is what keeps the Fish over the sand when
 * the drawing's proportions change.
 */
export const BODY_OFFSET = FISH_ASPECT * BODY_FRACTION;
