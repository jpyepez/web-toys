import { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  blob,
  closedPath,
  contourRing,
  crescent,
  grownContour,
  lobedLoop,
  quadPts,
  taperedOutline,
} from '../../shell/art/geometry';
import { disorder, line as houseLine, shading } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { palette, type FleeceName } from './palette';

/**
 * The Counting Sheep Critter — a faced, code-drawn Sheep (ADR-0002, primitives
 * only). Its appearance is a PURE FUNCTION of props; the loop's state machine
 * lives in `CountingSheep.tsx`.
 *
 * REBUILT onto the harvested house style (`shell/art/house.ts`). The old
 * construction was four overlapping `<circle>`s for the fleece, `<ellipse>`s for
 * the head and ears, `<rect>`s for the legs and a `stroke`d smile — the shape of
 * clip-art rather than of drawing, and visibly a different artist from the
 * fledglings two Cards away. What changed, and why each:
 *
 *  - **The fleece is a LOBED BOUNDARY, not a pile of circles.** Four overlapping
 *    circles give one merged silhouette with no notches, which is a cloud. Wool
 *    is round lobes with notches BETWEEN them, and the notch is the whole tell —
 *    the same shape problem as foliage, one subject over, so it uses the same
 *    arc emitter (`lobedLoop`).
 *  - **Its contour is GROWN, not ringed.** `contourRing` builds a reversed inner
 *    loop and fills between with `evenodd`; at the notch between two lobes that
 *    inner loop crosses itself and `evenodd` reads the crossing as a hole, so
 *    every notch comes out with a white nick in it. `grownContour` grows outward
 *    only and the real fill is painted on top.
 *  - **The fleece is at the house CAST lightness.** It used to sit at L 0.933 —
 *    level with the paper — which made the Critter the lightest thing in its own
 *    picture and left it clearing its own sky by 0.148 and a cloud by 0.045. See
 *    `palette.ts`; this is the load-bearing change and the rest follows it.
 *  - **Every line is a filled tapered path.** There is no `stroke` in this file.
 *    The smile was one, and a uniform vector stroke is the loudest clip-art tell.
 *  - **Forms are subdivided, not stacked.** The muzzle is oversized and clipped
 *    to the head, so it terminates on the head's OWN contour instead of floating
 *    concentrically inside it as a smaller shape.
 *  - **The face obeys the baby schema numerically.** Eyes sit BELOW the head's
 *    midline and the eye is strictly the largest feature on the face.
 *  - **Nothing is mirrored.** The two eyes, ears and legs differ in size, angle
 *    and height, and the head's axis is not parallel to the body's.
 *
 * Structural pieces stay tagged `data-sheep-part` so tests address them without
 * coupling to which primitive draws each one.
 */

/** Per-fleece colour set, every entry derived from one hue in `palette`. */
const FLEECE_COLOURS: Record<FleeceName, { body: string; crop: string; shade: string }> = {
  terracotta: { body: palette.terracottaBody, crop: palette.terracottaCrop, shade: palette.terracottaShade },
  amber: { body: palette.amberBody, crop: palette.amberCrop, shade: palette.amberShade },
  moss: { body: palette.mossBody, crop: palette.mossCrop, shade: palette.mossShade },
  slate: { body: palette.slateBody, crop: palette.slateCrop, shade: palette.slateShade },
  rose: { body: palette.roseBody, crop: palette.roseCrop, shade: palette.roseShade },
};

/**
 * The Sheep's rendered width, and the scene's unit — the meadow sizes every
 * bank, blade, bloom and the sun against it (see `meadow.ts`), so this is the
 * one place it is stated and the three constants below must agree with it.
 *
 * It used to be `min(220px, 55vw)`, which pins a Sheep at 220px on any screen
 * wider than 400px: 55% of a phone's width and 15% of a 1440px desktop's. The
 * upper clamp lets a big viewport get a bigger Sheep — and, because the meadow
 * is measured in Sheep, a proportionally bigger scene with fewer, larger
 * elements, which is calmer rather than busier. The lower bound keeps the tap
 * target generous on the narrowest phones.
 */
export const SHEEP_WIDTH = 'clamp(150px, 46vw, 240px)';
export const SHEEP_MIN_PX = 150;
export const SHEEP_VW = 0.46;
export const SHEEP_MAX_PX = 240;

/** The drawing's own box. Wider than tall, because a Sheep is. */
const VB_W = 100;
const VB_H = 88;
/** The aspect the layer above has to preserve when it places this drawing. */
export const SHEEP_ASPECT = VB_H / VB_W;

/*
 * Layout, in the 100x88 viewBox.
 *
 * The head/body AREA ratio is the load-bearing number: the house rule bans the
 * 0.7-1.5 "snowman" band, and a Sheep sits on the OPPOSITE side of it from a
 * fledgling — a big fleecy body carrying a smaller face, where the bird is a
 * chibi head on a small body at 1.55. Both are legal; the band between is what
 * reads as a featureless lump, and landing on opposite sides of it is also most
 * of why a Sheep and a bird stay distinguishable as solid black shapes.
 */
const BODY_CX = 44;
const BODY_CY = 46;
const BODY_RX = 30;
const BODY_RY = 24;
const HEAD_BODY_RATIO = 0.6;
const HEAD_R = Math.sqrt(HEAD_BODY_RATIO * BODY_RX * BODY_RY);
const HEAD_RY = HEAD_R * 0.96;
const HEAD_CX = BODY_CX + BODY_RX * 0.78;
const HEAD_CY = BODY_CY - BODY_RY * 0.55;
/** Wool lobe radius. Chunky enough to read as fleece at a Card's scale, small
 *  enough that the notches survive it. */
const LOBE_R = BODY_RX * 0.185;
const EYE_R = 4.6;
/** BELOW the midline. Above it is an adult skull, which is what the old drawing
 *  had before asking blush and catchlights to make it read as a lamb. */
const EYE_BELOW_MIDLINE = 2.4;
const EYE_SPREAD = 6.2;
/** Strictly under 1 so the eye outranks the blush for attention. The old art had
 *  the blush LARGER than the eye and the most saturated thing in the drawing. */
const CHEEK_SCALE = 0.6;
const FOOT_Y = 82;
/** Where the feet sit inside the box, so the Sheep can be stood on the meadow's
 *  walking line rather than at a CSS multiplier tuned against nothing. */
export const FOOT_FRACTION = FOOT_Y / VB_H;

/** One fixed seed for the whole cast: the disorder is authored, not random. */
const SEED = 4271;

export type SheepFigureProps = {
  /** Which Sheep — selects its hue-derived colours. */
  fleece?: FleeceName;
  /**
   * The dismiss beat's bloom, caught in the fleece. Lives in the loop's STATE,
   * not on the Sheep — the Toy passes it during `dismissing`.
   */
  done?: boolean;
  /** Re-enables the press on the painted Sheep when the wrapper is
   *  `pointer-events: none`. */
  interactive?: boolean;
};

/**
 * The Sheep itself, as bare SVG content — no `<svg>` wrapper, no sizing, no
 * breathing — so it can be dropped into any viewBox. Authored in a 100x88 box.
 */
export function SheepFigure({
  fleece = 'terracotta',
  done = false,
  interactive = false,
}: SheepFigureProps) {
  const colours = FLEECE_COLOURS[fleece];
  const uid = useId().replace(/:/g, '');
  const reducedMotion = useReducedMotion();

  // Geometry is a pure function of the fleece, so it is stable across renders
  // and identical between server and client. Seeded per fleece: the disorder is
  // deliberate but never random at runtime.
  const g = useMemo(() => geometry(fleece), [fleece]);

  const ring = (pts: Parameters<typeof contourRing>[0], width: number, seedName: string) =>
    contourRing(pts, width, houseLine.taper, houseLine.wobble, stream(SEED, seedName));

  const wFeature = houseLine.contour * houseLine.featureRatio;

  return (
    <>
      <defs>
        {/* Per-instance so two Sheep on one screen never share a clip. */}
        <clipPath id={`sheep-head-${uid}`}>
          <path d={g.head.d} />
        </clipPath>
        <clipPath id={`sheep-fleece-${uid}`}>
          <path d={g.fleece.d} />
        </clipPath>
        <radialGradient id={`sheep-glow-${uid}`} cx="0.5" cy="0.45" r="0.62">
          <stop offset="0" stopColor={palette.doneGlow} stopOpacity="0.9" />
          <stop offset="1" stopColor={palette.doneGlow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g
        data-sheep-part="sheep"
        style={interactive ? { pointerEvents: 'visiblePainted' } : undefined}
      >
        {/* Contact shadow. Without it the Sheep floats — which is exactly what
            the old art did, standing on a hill it had no agreement with. */}
        <ellipse
          data-sheep-part="contact"
          cx={BODY_CX + 3}
          cy={FOOT_Y + 2.4}
          rx={BODY_RX * 0.74}
          ry={2.8}
          fill={colours.shade}
          opacity={shading.contactStrength}
        />

        {/* tail — behind the fleece, and part of what makes the silhouette a
            Sheep rather than a generic lump */}
        <path d={ring(g.tail.pts, wFeature, `${fleece}-tail`)} fill={palette.contour} fillRule="evenodd" />
        <path data-sheep-part="tail" d={g.tail.d} fill={colours.crop} />

        {/* legs — drawn before the fleece so they emerge from behind it. Tapered
            FILLS, not the `<rect>`s this used to be: SVG has no variable-width
            stroke, so a drawn line has to be a fill either way. */}
        <g data-sheep-part="leg" fill={colours.crop}>
          {g.legs.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g data-sheep-part="hoof" fill={palette.sheepHoof}>
          {g.hooves.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>


        {/* THE FLEECE. Grown contour, then the fill on top — a ringed contour
            tears itself open at every notch between two lobes. */}
        <path d={g.fleeceInk} fill={palette.contour} />
        <path data-sheep-part="wool" d={g.fleece.d} fill={colours.body} />

        {/* Occlusion inside the fleece, clipped to it so each internal edge
            terminates on the fleece's own outline rather than floating within
            it. `shade()` colours throughout — never black, never a grey overlay,
            never opacity-on-black. */}
        <g clipPath={`url(#sheep-fleece-${uid})`}>
          <path d={g.fleeceOcclusion} fill={colours.shade} opacity={0.42} />
          <path d={g.neckOcclusion} fill={colours.shade} opacity={0.7} />
          {/* The done-glow blooms INSIDE the wool — the "warm light caught in the
              fleece" beat of the dismiss choreography, and clipped so it stays
              in the fleece rather than haloing beside it. */}
          {done && (
            <path
              data-sheep-part="glow"
              d={g.fleece.d}
              fill={`url(#sheep-glow-${uid})`}
            />
          )}
        </g>

        {/* head — tilted, so its axis is never parallel to the body's */}
        <g transform={`rotate(${g.headTilt} ${HEAD_CX} ${HEAD_CY})`}>
          {/*
            * Both ears sit BEHIND the skull, so only the part that clears the
            * head's own silhouette shows. Drawing the near one in front was an
            * attempt at a depth cue and it backfired: an ear and a head in the
            * same colour family overlap into one shape, so the ear's inner half
            * read as a dark patch painted across the cheek rather than as an ear
            * in front of a face. Behind, the silhouette does the work — which is
            * the whole reason the species cue lives in the outline.
            *
            * They differ in size, angle and height; each hinges on its own
            * attachment rather than on the head's centre.
            */}
          <g transform={`rotate(${g.nearEarRot} ${g.nearEarPivot[0]} ${g.nearEarPivot[1]})`}>
            <path d={ring(g.nearEar.pts, wFeature, `${fleece}-near-ear`)} fill={palette.contour} fillRule="evenodd" />
            <path data-sheep-part="ear" d={g.nearEar.d} fill={colours.crop} />
          </g>
          <g transform={`rotate(${g.farEarRot} ${g.farEarPivot[0]} ${g.farEarPivot[1]})`}>
            <path d={ring(g.farEar.pts, wFeature, `${fleece}-far-ear`)} fill={palette.contour} fillRule="evenodd" />
            <path data-sheep-part="ear" d={g.farEar.d} fill={colours.shade} />
          </g>

          <path d={ring(g.head.pts, houseLine.contour, `${fleece}-head`)} fill={palette.contour} fillRule="evenodd" />
          <path data-sheep-part="head" d={g.head.d} fill={colours.crop} />

          <g clipPath={`url(#sheep-head-${uid})`}>
            {/* the pale muzzle, deliberately oversized so it BREAKS the head's
                outline rather than sitting concentrically inside it */}
            <path data-sheep-part="muzzle" d={g.muzzle.d} fill={palette.sheepMuzzle} />
            <circle data-sheep-part="cheek" cx={g.cheekL[0]} cy={g.cheekL[1]} r={g.cheekR} fill={palette.sheepCheek} />
            <circle data-sheep-part="cheek" cx={g.cheekR2[0]} cy={g.cheekR2[1]} r={g.cheekR * 0.9} fill={palette.sheepCheek} />
            <path d={g.headOcclusion} fill={colours.shade} opacity={0.3} />
          </g>

          {/* Eyes blink on a slow loop — the highest "alive"-per-byte animation
              there is. Driven by Motion's own frameloop rather than a React
              timer: the loop's mechanic tests drain fake timers one transition
              at a time, and a self-rescheduling blink would pollute that queue.
              `transformBox: fill-box` pivots on the group's own box so the lids
              meet at the eye centreline rather than at the SVG origin. */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={reducedMotion ? undefined : { scaleY: [1, 1, 0.1, 1] }}
            transition={{ duration: 4.5, times: [0, 0.9, 0.945, 1], ease: 'easeOut', repeat: Infinity }}
          >
            <circle data-sheep-part="eye" cx={g.eyeL[0]} cy={g.eyeL[1]} r={g.eyeLR} fill={palette.sheepEye} />
            <circle data-sheep-part="eye" cx={g.eyeR[0]} cy={g.eyeR[1]} r={g.eyeRR} fill={palette.sheepEye} />
            {/* The catchlight is the PAPER showing through, never `#fff`. */}
            <circle
              data-sheep-part="eye-shine"
              cx={g.eyeL[0] - g.eyeLR * 0.34}
              cy={g.eyeL[1] - g.eyeLR * 0.36}
              r={g.eyeLR * 0.34}
              fill={palette.sheepEyeShine}
            />
            <circle
              data-sheep-part="eye-shine"
              cx={g.eyeR[0] - g.eyeRR * 0.3}
              cy={g.eyeR[1] - g.eyeRR * 0.38}
              r={g.eyeRR * 0.28}
              fill={palette.sheepEyeShine}
            />
          </motion.g>

          {/* nose and a gentle smile — both tapered fills. The smile was a
              `stroke` with a `strokeWidth`, which is the single loudest tell
              that a drawing came out of a vector editor rather than a hand. */}
          <path data-sheep-part="nose" d={g.nose} fill={colours.shade} />
          <path data-sheep-part="smile" d={g.smile} fill={palette.sheepEye} />
        </g>
      </g>
    </>
  );
}

/**
 * The sized element the Toy mounts: `SheepFigure` in its own `<svg>` at the
 * shipped `SHEEP_WIDTH`, carrying the breathing swell.
 *
 * The split exists so the Home Card can draw the REAL Sheep. The Card used to
 * carry a hand-simplified stand-in built from plain `<circle>`s — the exact
 * construction this file was rebuilt away from — which is clip-art sitting on a
 * Card whose scene is now generated and contoured. Simplifying the cast for a
 * thumbnail is not a saving; it is the defect, shrunk.
 *
 * The breath lives out here rather than in the figure: a Card is a still, and a
 * looping animation on five of them is five rAF subscriptions for a page nobody
 * is looking at yet.
 */
export function SheepDrawing(props: SheepFigureProps) {
  const reducedMotion = useReducedMotion();
  return (
    // A slow breathing swell rides on the whole drawing — the cheapest "alive"
    // there is, and it scales from the FEET so the Sheep never lifts off the
    // walking line it is standing on. Disabled under reduced motion.
    <motion.svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      aria-hidden="true"
      style={{
        width: SHEEP_WIDTH,
        height: 'auto',
        display: 'block',
        transformOrigin: 'center bottom',
        overflow: 'visible',
      }}
      animate={reducedMotion ? undefined : { scale: [1, 1.022, 1] }}
      transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity }}
    >
      <SheepFigure {...props} />
    </motion.svg>
  );
}

function geometry(fleece: FleeceName) {
  const rnd = stream(SEED, fleece);
  const jit = (amount: number) => (rnd() - 0.5) * 2 * amount;

  const headTilt = -5 + jit(disorder.instanceRotate * 0.5);

  /*
   * The fleece. `lobedLoop` runs circular lobes around an elliptical spine, so
   * the boundary is one continuous outline with a NOTCH between every pair —
   * which is what wool is. Four overlapping circles, which is what this was,
   * merge into a single smooth silhouette with no notches anywhere: a cloud.
   */
  const fleece_ = lobedLoop(BODY_CX, BODY_CY, BODY_RX, BODY_RY, LOBE_R, disorder.blobAmp * 8, rnd);

  const head = blob(HEAD_CX, HEAD_CY, HEAD_R, HEAD_RY, disorder.blobAmp, rnd, 24);

  /*
   * Ears. They were small, high and tucked BEHIND the skull, which left a round
   * dark head with two nubs on it — and a round dark head with nubs is a bear,
   * which is what the first render read as. A sheep's ears are large, set low
   * and out to the side, and they DROOP: that is most of the species cue, and it
   * is a silhouette cue rather than a marking, so it survives the black-shape
   * test the way a painted-on detail would not.
   *
   * They differ in size, angle and height — the pair is never mirrored.
   */
  const nearEarCx = HEAD_CX - HEAD_R * 1.12;
  const nearEar = blob(nearEarCx, HEAD_CY + HEAD_RY * 0.12, HEAD_R * 0.56, HEAD_RY * 0.3, disorder.blobAmp, rnd, 14);
  const farEarCx = HEAD_CX + HEAD_R * 1.0;
  const farEar = blob(farEarCx, HEAD_CY + HEAD_RY * 0.02, HEAD_R * 0.48, HEAD_RY * 0.26, disorder.blobAmp, rnd, 14);
  /*
   * Each ear rotates about its OWN attachment to the skull, never about the head
   * centre. Pivoting on the centre swings the ear bodily across the frame rather
   * than hinging it — the near ear came round over the muzzle and read as a dark
   * patch on the face. It is the same mistake the Nestlings tail made when it
   * rotated about the body's centre and disappeared behind the head, and the
   * same fix: hinge a limb where it actually joins.
   */
  const nearEarPivot: [number, number] = [nearEarCx + HEAD_R * 0.5, HEAD_CY + HEAD_RY * 0.12];
  const farEarPivot: [number, number] = [farEarCx - HEAD_R * 0.44, HEAD_CY + HEAD_RY * 0.02];
  const nearEarRot = -34 + jit(disorder.instanceRotate);
  const farEarRot = 28 + jit(disorder.instanceRotate);

  const tail = blob(BODY_CX - BODY_RX * 0.94, BODY_CY - BODY_RY * 0.34, LOBE_R * 1.5, LOBE_R * 1.35, disorder.blobAmp * 3, rnd, 12);

  // The muzzle is oversized on purpose: clipped to the head, it terminates on
  // the head's own contour instead of floating clear of it on all sides.
  const muzzle = blob(HEAD_CX - HEAD_R * 0.08, HEAD_CY + HEAD_RY * 0.62, HEAD_R * 0.66, HEAD_RY * 0.55, disorder.blobAmp, rnd, 18);

  const legX = [BODY_CX - BODY_RX * 0.42, BODY_CX + BODY_RX * 0.34];
  const legTop = BODY_CY + BODY_RY * 0.6;
  // The two legs differ in lean and length.
  const legs = [
    taperedOutline(quadPts([legX[0], legTop], [legX[0] - 1.4, (legTop + FOOT_Y) / 2], [legX[0] - 2.4, FOOT_Y]), houseLine.contour * 1.9, 0.35),
    taperedOutline(quadPts([legX[1], legTop], [legX[1] + 1.1, (legTop + FOOT_Y) / 2], [legX[1] + 2, FOOT_Y - 0.8]), houseLine.contour * 2.05, 0.35),
  ];
  const hoof = (x: number, y: number, tilt: number) =>
    taperedOutline(quadPts([x - 2.6, y - 1.2], [x + tilt, y + 1.2], [x + 2.8, y - 0.9], 8), houseLine.contour * 1.5, 0.5);
  const hooves = [hoof(legX[0] - 2.4, FOOT_Y, -0.3), hoof(legX[1] + 2, FOOT_Y - 0.8, 0.4)];

  const eyeY = HEAD_CY + EYE_BELOW_MIDLINE;
  // Not the same size, not the same height.
  const eyeLR = EYE_R * (1 + 0.06 * disorder.asymmetry);
  const eyeRR = EYE_R * (1 - 0.05 * disorder.asymmetry);
  const eyeL: [number, number] = [HEAD_CX - EYE_SPREAD, eyeY];
  const eyeR: [number, number] = [HEAD_CX + EYE_SPREAD * 1.04, eyeY + 0.5 * disorder.asymmetry];

  const noseY = HEAD_CY + HEAD_RY * 0.44;
  // Down from 0.2. At that width the nose was an 8-unit dark mass sitting
  // directly above the smile, and the two read together as an open mouth. A nose
  // in this tradition is a MARK — the eye has to stay the largest feature on the
  // face, and it was losing to a triangle.
  const noseW = HEAD_R * 0.12;

  return {
    fleece: fleece_,
    /*
     * GROWN, not ringed. `contourRing` offsets an inner loop inward and fills
     * between the two with `evenodd`; at the concave notch between two wool
     * lobes the inner loop crosses itself, and `evenodd` reads every one of
     * those crossings as a hole. Growing outward and painting the fill on top
     * gives the same visible line with no inner loop to self-intersect.
     */
    fleeceInk: grownContour(
      fleece_.pts,
      houseLine.contour * 0.55,
      houseLine.taper,
      houseLine.wobble,
      stream(SEED, `${fleece}-fleece-ink`),
    ),
    head,
    headTilt,
    nearEar,
    nearEarRot,
    nearEarPivot,
    farEar,
    farEarRot,
    farEarPivot,
    tail,
    muzzle,
    legs,
    hooves,
    eyeL,
    eyeR,
    eyeLR,
    eyeRR,
    cheekL: [HEAD_CX - HEAD_R * 0.66, eyeY + EYE_R * 0.62] as [number, number],
    cheekR2: [HEAD_CX + HEAD_R * 0.68, eyeY + EYE_R * 0.7] as [number, number],
    cheekR: EYE_R * CHEEK_SCALE,
    nose: closedPath([
      [HEAD_CX - noseW, noseY],
      [HEAD_CX + noseW, noseY - 0.3],
      [HEAD_CX + noseW * 0.55, noseY + noseW * 1.1],
      [HEAD_CX - noseW * 0.6, noseY + noseW * 1.05],
    ]),
    /*
     * The smile is a HAIRLINE. At `detail * 1.5` over a curve this deep it
     * filled in as a solid dark lens and read as an open mouth on a bear, which
     * is not the same face at all. A drawn smile in this tradition is the
     * lightest line on the drawing, well under the contour that carries the
     * form.
     */
    smile: taperedOutline(
      quadPts(
        [HEAD_CX - HEAD_R * 0.2, noseY + noseW * 1.6],
        [HEAD_CX + 0.3, noseY + noseW * 2.5],
        [HEAD_CX + HEAD_R * 0.22, noseY + noseW * 1.5],
        12,
      ),
      houseLine.detail * 0.85,
      0.5,
    ),
    /** Occlusion where the head and neck meet the fleece. */
    neckOcclusion: crescent(HEAD_CX - HEAD_R * 0.5, BODY_CY - BODY_RY * 0.5, BODY_RX * 0.5, 0.62, 0.7),
    /** The fleece's own form shadow, along its underside. */
    fleeceOcclusion: crescent(BODY_CX, BODY_CY + BODY_RY * 0.52, BODY_RX * 0.92, 0.7, 0.55),
    headOcclusion: crescent(HEAD_CX + HEAD_R * 0.5, HEAD_CY + HEAD_R * 0.1, HEAD_R * 0.82, 0.72, 1.5),
  };
}

/**
 * How far below the drawing's TOP edge the hooves sit, as a multiple of the
 * Sheep's rendered WIDTH — the one number that converts "where the walking line
 * is" into "where this element goes".
 *
 * Expressed against width rather than height because width is what CSS is given
 * (`SHEEP_WIDTH`); the height follows from the viewBox aspect. Deriving it here
 * rather than restating it in the Toy is what keeps the Sheep on the ground when
 * the drawing's proportions change.
 */
export const FOOT_OFFSET = SHEEP_ASPECT * FOOT_FRACTION;
