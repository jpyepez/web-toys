import { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { blob, closedPath, contourRing, crescent, flattenCrown, quadPts, taperedOutline } from '../../shell/art/geometry';
import { disorder, line as houseLine, shading } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { palette } from './palette';

/**
 * The Nestlings Critter — a faced, code-drawn SVG fledgling (ADR-0002,
 * primitives only). Its appearance is a PURE FUNCTION of props, and the carry /
 * snap logic still lives in slice #3; this file owns only the looks and a little
 * idle life.
 *
 * REBUILT from the critter lab's harvested house style
 * (`src/lab/saved/bluebird-contour-4271.json` → `shell/art/house.ts`). The old
 * construction was a stack of independently-closed primitives — an `<ellipse>`
 * body, a smaller `<ellipse>` belly floating concentrically inside it, a
 * `<circle>` head on top — which is the shape of clip-art rather than of
 * drawing. What changed, and the reason for each:
 *
 *  - **Forms are subdivided, not stacked.** The belly is oversized and clipped to
 *    the body, so it terminates on the body's OWN contour instead of floating
 *    clear of it on all sides. A concentric inner shape reads as a bullseye.
 *  - **Every silhouette is a jittered path, not a primitive.** `<circle>` now
 *    survives only for eyes and catchlights.
 *  - **There is one contour, and it is a filled ring of varying width** — SVG has
 *    no variable-width stroke, so a drawn line has to be a fill. It is heavier
 *    on undersides, and carries a deliberate wobble.
 *  - **Occlusion at every junction**, in `shade()` colours: hue rotated toward
 *    the ambient, never black, never grey, never opacity-on-black.
 *  - **The face obeys the baby schema numerically.** Eyes sit BELOW the head's
 *    midline (they used to sit above it, which is an adult skull) and the eye is
 *    strictly the largest feature on the face (the blush used to be bigger, and
 *    the most saturated thing in the drawing).
 *  - **Nothing is mirrored.** The two eyes, wings and feet differ in size, angle
 *    and height, and the head axis is not parallel to the body's.
 *  - **Every species cue changes the SILHOUETTE.** The old wing-bars and breast
 *    streaks were internal line work, which left robin, sparrow and goldfinch
 *    with byte-identical outlines despite the file claiming five distinct birds.
 *
 * ONE DELIBERATE EXCEPTION. The near wing is drawn overlapping the body rather
 * than clipped to it. Clipping is the stronger construction, but a clipped wing
 * cannot leave the silhouette, and this wing has to flap. It overlaps decisively
 * and carries its own occlusion shadow underneath, which buys the depth read
 * that clipping would have given.
 *
 * Structural pieces stay tagged `data-bird-part` so tests address them without
 * coupling to which primitive draws each one.
 */
export type BirdSpecies = 'robin' | 'bluebird' | 'sparrow' | 'wren' | 'goldfinch';

/** Per-species colour set, every entry derived from one hue in `palette`. */
const SPECIES_COLOURS: Record<
  BirdSpecies,
  { body: string; wing: string; beak: string; shade: string }
> = {
  robin: { body: palette.robinBody, wing: palette.robinWing, beak: palette.robinBeak, shade: palette.robinShade },
  bluebird: { body: palette.bluebirdBody, wing: palette.bluebirdWing, beak: palette.bluebirdBeak, shade: palette.bluebirdShade },
  sparrow: { body: palette.sparrowBody, wing: palette.sparrowWing, beak: palette.sparrowBeak, shade: palette.sparrowShade },
  wren: { body: palette.wrenBody, wing: palette.wrenWing, beak: palette.wrenBeak, shade: palette.wrenShade },
  goldfinch: { body: palette.goldfinchBody, wing: palette.goldfinchWing, beak: palette.goldfinchBeak, shade: palette.goldfinchShade },
};

/**
 * Per-species OUTLINE cues. Each one changes the silhouette, which is the whole
 * point — render any two of these as solid shapes and they stay distinguishable.
 * A nape was tried for the sparrow and rejected: these birds are drawn front-on,
 * so the back of the neck cannot read, and the shape collided with the eye.
 */
const SPECIES_TRAITS: Record<
  BirdSpecies,
  { crest: boolean; tail: 'fan' | 'up' | 'fork' | 'long'; beakScale: number; crown: 'round' | 'flat' }
> = {
  robin: { crest: false, tail: 'fan', beakScale: 1, crown: 'round' },
  bluebird: { crest: true, tail: 'fan', beakScale: 0.95, crown: 'round' },
  sparrow: { crest: false, tail: 'fork', beakScale: 1.05, crown: 'flat' },
  wren: { crest: false, tail: 'up', beakScale: 0.9, crown: 'round' },
  goldfinch: { crest: false, tail: 'long', beakScale: 1.35, crown: 'round' },
};

/*
 * Layout, in the Toy's existing 100×100 viewBox. These are the harvested config's
 * proportions scaled to fit that box — the head/body AREA ratio of 1.55 is the
 * load-bearing number (RULE 6 bans the 0.7–1.5 "snowman" band, where the old art
 * sat at 1.24), and the radii follow from it.
 */
const BODY_RX = 21;
const BODY_RY = 19.3;
const BODY_CX = 50;
const BODY_CY = 66;
const HEAD_R = Math.sqrt(1.55 * BODY_RX * BODY_RY);
const HEAD_RY = HEAD_R * 0.96;
const EYE_R = 5.2;
/** RULE 6 — BELOW the midline. Above it is an adult skull, which is what the
 *  old art drew before asking blush and catchlights to make it read as a baby. */
const EYE_BELOW_MIDLINE = 2.9;
const EYE_SPREAD = 7.2;
/** Strictly under 1 so the eye outranks the blush for attention. */
const CHEEK_SCALE = 0.62;
const BEAK_LEN = 7.6;
const CROWN_FLATTEN = 0.78;

/**
 * A fledgling's rendered width, and the scene's unit — the canopy sizes every
 * limb, lobe and moon against it (see `canopy.ts`), so this is the one place it
 * is stated and `BIRD_PX`/`BIRD_VW`/`BIRD_MAX_PX` below must agree with it.
 *
 * It used to be `min(140px, 36vw)`, which pins a bird at 140px on ANY screen
 * wider than ~390px. On a phone that is 36% of the width and correct; on a
 * 1440px desktop it is 10%, and five of them in a tree read as a diorama seen
 * from across the room. The upper clamp lets a big viewport get bigger birds —
 * and, because the tree is measured in birds, a proportionally bigger tree with
 * fewer, larger elements, which is calmer rather than busier.
 *
 * The lower bound only bites under ~333px, where 36vw would drop below a
 * comfortable tap target for a three-year-old.
 */
export const BIRD_WIDTH = 'clamp(120px, 36vw, 190px)';
export const BIRD_MIN_PX = 120;
export const BIRD_VW = 0.36;
export const BIRD_MAX_PX = 190;

export type BirdFigureProps = {
  /** Which fledgling — selects its hue-derived colours + silhouette cue. */
  species?: BirdSpecies;
  /**
   * The nestled-in look: head tucked, eyes closed, wings still. Drives the
   * placed/Outro states. Awake draws open eyes with catchlights and flapping
   * wings; asleep draws closed lids and tucks the feet away.
   */
  asleep?: boolean;
  /** The carried lift cue — the bird lifts and scales slightly toward the finger. */
  carried?: boolean;
  /**
   * Shape-accurate hit target for a carriable bird (slice #3, ADR-0007): when the
   * positioning wrapper is `pointer-events: none`, this re-enables the press on
   * the painted bird only.
   */
  interactive?: boolean;
};

/**
 * The bird itself, as bare SVG content — no `<svg>` wrapper, no sizing — so it
 * can be dropped into any viewBox. Authored in a 100x100 box.
 */
export function BirdFigure({
  species = 'robin',
  asleep = false,
  carried = false,
  interactive = false,
}: BirdFigureProps) {
  const colours = SPECIES_COLOURS[species];
  const traits = SPECIES_TRAITS[species];
  const uid = useId().replace(/:/g, '');

  const reducedMotion = useReducedMotion();
  const flapping = !asleep && !reducedMotion;

  // Geometry is a pure function of the species, so it is stable across renders
  // and identical between server and client. Seeded per species: the disorder is
  // deliberate but never random at runtime.
  const g = useMemo(() => geometry(species, asleep), [species, asleep]);

  const amp = carried ? 20 : 10;
  const flapTransition = {
    duration: carried ? 0.42 : 0.85,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };
  const leftWingStyle = { transformBox: 'fill-box' as const, transformOrigin: 'right center' };
  const rightWingStyle = { transformBox: 'fill-box' as const, transformOrigin: 'left center' };

  const ring = (pts: Parameters<typeof contourRing>[0], width: number, seedName: string) =>
    contourRing(pts, width, houseLine.taper, houseLine.wobble, stream(SEED, seedName));

  const wFeature = houseLine.contour * houseLine.featureRatio;

  return (
    <>
      <defs>
        {/* Per-instance so several birds on one screen never share a clip. */}
        <clipPath id={`bird-body-${uid}`}>
          <path d={g.body.d} />
        </clipPath>
      </defs>

      {/* the whole bird — lifts and scales toward the finger while carried */}
      <g
        data-bird-part="bird"
        {...(carried ? { transform: 'translate(0 -6) scale(1.06)' } : {})}
        style={{
          transformOrigin: '50px 64px',
          ...(interactive ? { pointerEvents: 'visiblePainted' as const } : {}),
        }}
      >
        {/* RULE 8 — contact shadow. Without it the bird floats, which is exactly
            what the old art did: nothing in the drawing agreed with the light. */}
        {!asleep && (
          <ellipse
            cx={BODY_CX + 1.5}
            cy={BODY_CY + BODY_RY + 11.5}
            rx={BODY_RX * 0.72}
            ry={2.6}
            fill={colours.shade}
            opacity={shading.contactStrength}
          />
        )}

        {/* tail — behind the body, and a silhouette cue. Rotated about its own
            attachment to the body: rotating about the body's centre swung the
            wren's cocked tail up behind the head, where it vanished. */}
        <g transform={`rotate(${g.tailRot} ${g.attach[0]} ${g.attach[1]})`}>
          <path d={ring(g.tail.pts, wFeature, `${species}-tail`)} fill={palette.contour} fillRule="evenodd" />
          <path data-bird-part="tail" d={g.tail.d} fill={colours.wing} />
        </g>

        {/* far wing — smaller, higher and darker than the near one. RULE 7: the
            pair is never identical, which is a depth cue as well as a life cue. */}
        <motion.g
          style={leftWingStyle}
          animate={flapping ? { rotate: [0, -amp, 0] } : { rotate: 0 }}
          transition={flapTransition}
        >
          <path d={ring(g.farWing.pts, wFeature, `${species}-far`)} fill={palette.contour} fillRule="evenodd" />
          <path data-bird-part="wing" d={g.farWing.d} fill={colours.shade} />
        </motion.g>

        {/* legs — drawn before the body so they emerge from behind it. Tapered
            FILLS, not strokes: a uniform stroke is the loudest clip-art tell, and
            SVG has no variable-width stroke to reach for instead. */}
        {!asleep && (
          <g data-bird-part="foot" fill={palette.birdFoot}>
            {g.legs.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        )}

        {/* body */}
        <path d={ring(g.body.pts, houseLine.contour, `${species}-body`)} fill={palette.contour} fillRule="evenodd" />
        <path data-bird-part="body" d={g.body.d} fill={colours.body} />

        {/* RULE 4 — clipped to the body, so each internal edge terminates on the
            body's own contour instead of floating inside it as a smaller shape. */}
        <g clipPath={`url(#bird-body-${uid})`}>
          {/* the pale breast, deliberately oversized so it BREAKS the outline
              rather than sitting concentrically within it */}
          <path data-bird-part="belly" d={g.belly.d} fill={palette.birdBelly} />
          {/* occlusion where the head meets the chest */}
          <path d={g.chinOcclusion} fill={colours.shade} opacity={0.85} />
          {/* occlusion under the near wing — this is what buys back the depth
              that clipping the wing would have given */}
          <path d={g.wingOcclusion} fill={colours.shade} opacity={0.5} />
        </g>

        {/* near wing — overlaps the body decisively so it can flap free of it */}
        <motion.g
          style={rightWingStyle}
          animate={flapping ? { rotate: [0, amp, 0] } : { rotate: 0 }}
          transition={flapTransition}
        >
          <path d={ring(g.nearWing.pts, wFeature, `${species}-near`)} fill={palette.contour} fillRule="evenodd" />
          <path data-bird-part="wing" d={g.nearWing.d} fill={colours.wing} />
        </motion.g>

        {/* head — tilted, so its axis is never parallel to the body's */}
        <g transform={`rotate(${g.headTilt} ${g.headCx} ${g.headCy})`}>
          <path d={ring(g.head.pts, houseLine.contour, `${species}-head`)} fill={palette.contour} fillRule="evenodd" />
          <path data-bird-part="head" d={g.head.d} fill={colours.body} />

          {/* cheeks and form shadow, clipped to the head so the blush breaks the
              contour instead of floating a hair short of it — the old art left a
              0.24-unit gap, a near-miss tangent that aliases into a touch */}
          <g clipPath={`url(#bird-head-${uid})`}>
            <circle data-bird-part="cheek" cx={g.cheekL[0]} cy={g.cheekL[1]} r={g.cheekR} fill={palette.birdCheek} />
            <circle data-bird-part="cheek" cx={g.cheekR2[0]} cy={g.cheekR2[1]} r={g.cheekR * 0.92} fill={palette.birdCheek} />
            <path d={g.headOcclusion} fill={colours.shade} opacity={0.28} />
          </g>

          {traits.crest && <path data-bird-part="crest" d={g.crest} fill={colours.wing} />}

          {/* beak — two mandibles, asymmetric, clear of the eyes. A single
              isoceles triangle reads as a caret glyph, not a beak. */}
          <path data-bird-part="beak" d={g.upperBeak} fill={colours.beak} />
          <path data-bird-part="beak" d={g.lowerBeak} fill={colours.shade} opacity={0.85} />

          {/* eyes — open circles with a PAPER catchlight while awake (never
              white); closed curved lids once nestled, a different primitive at
              the eye hook so the face genuinely changes */}
          {asleep ? (
            <>
              <path data-bird-part="eye" d={g.lidL} fill={palette.birdEye} />
              <path data-bird-part="eye" d={g.lidR} fill={palette.birdEye} />
            </>
          ) : (
            <>
              <circle data-bird-part="eye" cx={g.eyeL[0]} cy={g.eyeL[1]} r={g.eyeLR} fill={palette.birdEye} />
              <circle data-bird-part="eye" cx={g.eyeR[0]} cy={g.eyeR[1]} r={g.eyeRR} fill={palette.birdEye} />
              <circle
                data-bird-part="eye-shine"
                cx={g.eyeL[0] - g.eyeLR * 0.34}
                cy={g.eyeL[1] - g.eyeLR * 0.36}
                r={g.eyeLR * 0.34}
                fill={palette.birdEyeShine}
              />
              <circle
                data-bird-part="eye-shine"
                cx={g.eyeR[0] - g.eyeRR * 0.3}
                cy={g.eyeR[1] - g.eyeRR * 0.38}
                r={g.eyeRR * 0.28}
                fill={palette.birdEyeShine}
              />
            </>
          )}
        </g>

        <defs>
          <clipPath id={`bird-head-${uid}`}>
            <path d={g.head.d} />
          </clipPath>
        </defs>
      </g>
    </>
  );
}

/**
 * The sized element the Toy mounts: `BirdFigure` in its own `<svg>` at the
 * shipped `BIRD_WIDTH`.
 *
 * The split exists so the Home Card can draw the REAL bird. The Card used to
 * carry a hand-simplified stand-in, and that stand-in was the exact construction
 * this file was rebuilt away from — a stacked `<ellipse>` body, a concentric
 * belly, a `<circle>` head, no contour anywhere. Next to a Card whose scene is
 * now generated and contoured, it read as clip-art from a different app, which
 * is precisely the seam the house style exists to close. One figure, drawn once,
 * rendered at whatever size the surface needs.
 */
export function BirdDrawing(props: BirdFigureProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ width: BIRD_WIDTH, height: 'auto', display: 'block' }}
    >
      <BirdFigure {...props} />
    </svg>
  );
}

/** One fixed seed for the whole cast: the disorder is authored, not random. */
const SEED = 4271;

function geometry(species: BirdSpecies, asleep: boolean) {
  const traits = SPECIES_TRAITS[species];
  const rnd = stream(SEED, species);
  const jit = (amount: number) => (rnd() - 0.5) * 2 * amount;

  // Asleep tucks the head down toward the body.
  const headCy = BODY_CY - (BODY_RY + HEAD_R) * (asleep ? 0.63 : 0.72);
  const headCx = BODY_CX + jit(disorder.asymmetry);
  const headTilt = 4 + jit(disorder.instanceRotate * 0.5);

  const body = blob(BODY_CX, BODY_CY, BODY_RX, BODY_RY, disorder.blobAmp, rnd, 26);

  const headRaw = blob(headCx, headCy, HEAD_R, HEAD_RY, disorder.blobAmp, rnd, 26);
  const headPts = flattenCrown(headRaw.pts, headCy, HEAD_RY, traits.crown === 'flat' ? CROWN_FLATTEN : 1);
  const head = { pts: headPts, d: closedPath(headPts) };

  const attach: [number, number] = [BODY_CX + BODY_RX * 0.6, BODY_CY + BODY_RY * 0.2];
  const a = disorder.blobAmp * 1.4;
  const tail =
    traits.tail === 'up'
      ? blob(attach[0] + 12.5, attach[1], 12.5, 5, a, rnd, 14)
      : traits.tail === 'fork'
        ? blob(attach[0] + 11.5, attach[1] + 1.6, 12.5, 5.4, a, rnd, 14)
        : traits.tail === 'long'
          ? blob(attach[0] + 19, attach[1] + 1, 20, 4.6, a, rnd, 14)
          : blob(attach[0] + 10, attach[1] + 1.6, 11, 6.2, a, rnd, 14);
  const tailRot =
    traits.tail === 'up' ? -52 : traits.tail === 'long' ? 8 : traits.tail === 'fork' ? 18 : 22;

  const nearWing = blob(BODY_CX + BODY_RX * 0.52, BODY_CY + 1.5, BODY_RX * 0.42, BODY_RY * 0.62, disorder.blobAmp, rnd, 18);
  const farWing = blob(
    BODY_CX - BODY_RX * 0.78,
    BODY_CY - 3 - disorder.asymmetry,
    BODY_RX * 0.32,
    BODY_RY * 0.48,
    disorder.blobAmp,
    rnd,
    16,
  );

  const belly = blob(BODY_CX + 1.6, BODY_CY + BODY_RY * 0.55, BODY_RX * 0.78, BODY_RY * 0.82, disorder.blobAmp, rnd, 18);

  const footY = BODY_CY + BODY_RY + 9;
  const legPath = (x: number, lean: number, len: number) =>
    taperedOutline(
      quadPts([x, BODY_CY + BODY_RY - 4], [x + lean * 0.4, footY - len * 0.5], [x + lean, footY]),
      houseLine.detail * 1.5,
      0.3,
    );
  const toePath = (x: number, dx: number, dy: number) =>
    taperedOutline(quadPts([x, footY], [x + dx * 0.5, footY + dy * 0.4], [x + dx, footY + dy]), houseLine.detail, 0.25);
  // RULE 7: the two feet differ in lean and length.
  const legs = [
    legPath(BODY_CX - 6, -2, 9),
    legPath(BODY_CX + 6.5, 1.8, 10.5),
    toePath(BODY_CX - 8, -3.8, 2),
    toePath(BODY_CX - 8, 2.6, 2.5),
    toePath(BODY_CX + 8.3, -2.5, 2.3),
    toePath(BODY_CX + 8.3, 4, 1.8),
  ];

  const eyeY = headCy + EYE_BELOW_MIDLINE;
  // RULE 7: not the same size, not the same height.
  const eyeLR = EYE_R * (1 + 0.06 * disorder.asymmetry);
  const eyeRR = EYE_R * (1 - 0.05 * disorder.asymmetry);
  const eyeL: [number, number] = [headCx - EYE_SPREAD, eyeY];
  const eyeR: [number, number] = [headCx + EYE_SPREAD * 1.03, eyeY + 0.6 * disorder.asymmetry];
  const cheekR = EYE_R * CHEEK_SCALE;

  const lid = (cx: number, cy: number, r: number) =>
    taperedOutline(quadPts([cx - r, cy - 0.6], [cx, cy + r * 0.8], [cx + r, cy - 0.6]), houseLine.detail * 1.6, 0.5);

  const beakLen = BEAK_LEN * traits.beakScale;
  const hw = beakLen * 0.42;
  const bh = beakLen * 0.78;
  const bx = headCx + 0.8 * disorder.asymmetry;
  // Clear of the eyes by more than the 3-unit tangent floor.
  const by = eyeY + EYE_R + 3.4;

  return {
    body,
    head,
    headCx,
    headCy,
    headTilt,
    attach,
    tail,
    tailRot,
    nearWing,
    farWing,
    belly,
    legs,
    eyeL,
    eyeR,
    eyeLR,
    eyeRR,
    cheekL: [headCx - HEAD_R * 0.72, eyeY + EYE_R * 0.5] as [number, number],
    cheekR2: [headCx + HEAD_R * 0.74, eyeY + EYE_R * 0.62] as [number, number],
    cheekR,
    lidL: lid(eyeL[0], eyeL[1], eyeLR),
    lidR: lid(eyeR[0], eyeR[1], eyeRR),
    upperBeak:
      `M${bx - hw},${by} L${bx + hw},${by + 0.7} ` +
      `Q${bx + hw * 0.3},${by + bh} ${bx - hw * 0.4},${by + bh * 0.48} Z`,
    lowerBeak:
      `M${bx - hw * 0.62},${by + bh * 0.4} L${bx + hw * 0.5},${by + bh * 0.34} ` +
      `Q${bx + hw * 0.08},${by + bh * 0.8} ${bx - hw * 0.62},${by + bh * 0.4} Z`,
    crest: taperedOutline(
      quadPts([headCx - 4, headCy - HEAD_R + 2.5], [headCx - 1, headCy - HEAD_R - 9], [headCx + 6, headCy - HEAD_R - 1]),
      houseLine.contour * 2.4,
      0.55,
    ),
    chinOcclusion: crescent(headCx, BODY_CY - BODY_RY + 4, BODY_RX * 0.95, 0.55, 0.42),
    wingOcclusion: crescent(BODY_CX + BODY_RX * 0.42, BODY_CY + BODY_RY * 0.52, BODY_RX * 0.5, 0.6, 0.34),
    headOcclusion: crescent(headCx + HEAD_R * 0.55, headCy + HEAD_R * 0.1, HEAD_R * 0.8, 0.72, 1.5),
  };
}
