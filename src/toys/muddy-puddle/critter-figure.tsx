import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { contourRing, crescent, quadPts, taperedOutline, type Pt } from '../../shell/art/geometry';
import { disorder, line as houseLine, shading } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { palette, type CritterName } from './palette';
import { CRITTER_WIDTH, FOOT_Y, SEED, VB_H, VB_W } from './critter-metrics';

/**
 * The shared drawing kit for the barnyard cast.
 *
 * WHY IT EXISTS. The five animals used to be five files that each independently
 * re-derived the same drawing: a `<circle>` body, two `<ellipse>` ears, two
 * `<circle>` eyes with two `<circle>` catchlights, two `<circle>` cheeks and a
 * `stroke`d smile, at five slightly different hand-typed coordinates. That is
 * not five drawings sharing a style — it is one drawing copied four times, and
 * every fix to it had to be applied five times or the cast drifted apart. It
 * had already drifted: the eyes sat at r 4.5 on three animals and r 5 on two,
 * and the catchlight offsets disagreed on all five.
 *
 * So the FAMILY lives here — the face, the contour language, the contact shadow,
 * the sizing, the breath — and each animal file owns only what makes it that
 * animal: its silhouette. That split is also what makes the silhouette test
 * meaningful. If species were carried by colour or by a painted-on marking, five
 * animals filled solid black would be one shape five times.
 *
 * Nothing here picks a colour or a line weight. Both come from the house style
 * through `palette` and `houseLine`, so a Critter cannot fall out of step with
 * the collection by being edited in isolation.
 */

/** Per-Critter colour set, every entry derived from that animal's one hue. */
export type CritterColours = {
  body: string;
  crop: string;
  feature: string;
  shade: string;
};

const COLOURS: Record<CritterName, CritterColours> = {
  piglet: {
    body: palette.pigletBody,
    crop: palette.pigletCrop,
    feature: palette.pigletFeature,
    shade: palette.pigletShade,
  },
  duckling: {
    body: palette.ducklingBody,
    crop: palette.ducklingCrop,
    feature: palette.ducklingFeature,
    shade: palette.ducklingShade,
  },
  lamb: {
    body: palette.lambBody,
    crop: palette.lambCrop,
    feature: palette.lambFeature,
    shade: palette.lambShade,
  },
  chick: {
    body: palette.chickBody,
    crop: palette.chickCrop,
    feature: palette.chickFeature,
    shade: palette.chickShade,
  },
  calf: {
    body: palette.calfBody,
    crop: palette.calfCrop,
    feature: palette.calfFeature,
    shade: palette.calfShade,
  },
};

export const coloursFor = (name: CritterName): CritterColours => COLOURS[name];

/** The seeded stream every animal draws its disorder from. */
export const rngFor = (name: CritterName, part: string) => stream(SEED, `${name}-${part}`);

/**
 * A filled contour ring at the house taper and wobble — the collection's line.
 *
 * There is no `stroke` anywhere in this Toy's art, and that is the single
 * loudest clip-art tell there is: SVG has no variable-width stroke, so a uniform
 * one reads as a different line language from the cast's filled contour and the
 * scene stops looking like one artist drew it.
 */
export const ring = (pts: readonly Pt[], width: number, name: CritterName, part: string) =>
  contourRing(pts, width, houseLine.taper, houseLine.wobble, rngFor(name, part));

/** Feature lines — a wing's edge, an ear's rim — at the house ratio. */
export const FEATURE_WIDTH = houseLine.contour * houseLine.featureRatio;

/**
 * The face, derived from whatever head frame an animal hands it.
 *
 * Every number below is shared by all five, which is what makes a piglet and a
 * calf read as the same illustrator's work. What differs between animals is the
 * HEAD the face is placed on, never the face itself.
 */
export type HeadFrame = { cx: number; cy: number; r: number; ry: number };

/** BELOW the midline. Above it is an adult skull, which is what all five had. */
const EYE_BELOW_MIDLINE = 0.1;
const EYE_SPREAD = 0.42;
const EYE_R = 0.19;
/** Strictly under 1 so the eye outranks the blush for attention. The old art had
 *  the cheek at r 7 against an eye at r 5 — the blush was the largest and most
 *  saturated thing on every face in the cast. */
const CHEEK_SCALE = 0.62;

export function faceGeometry(head: HeadFrame, asym: number) {
  const eyeY = head.cy + head.ry * EYE_BELOW_MIDLINE;
  const eyeR = head.r * EYE_R;
  // Not the same size, not the same height — nothing in this collection is
  // mirrored.
  const eyeLR = eyeR * (1 + 0.06 * asym);
  const eyeRR = eyeR * (1 - 0.05 * asym);
  return {
    eyeL: [head.cx - head.r * EYE_SPREAD, eyeY] as Pt,
    eyeR: [head.cx + head.r * EYE_SPREAD * 1.04, eyeY + 0.4 * asym] as Pt,
    eyeLR,
    eyeRR,
    cheekL: [head.cx - head.r * 0.72, eyeY + eyeR * 0.9] as Pt,
    cheekR: [head.cx + head.r * 0.74, eyeY + eyeR * 1.0] as Pt,
    cheekR2: eyeR * CHEEK_SCALE,
  };
}

/**
 * Eyes, catchlights and blush, blinking on a slow loop.
 *
 * The blink is driven by Motion's own frameloop rather than a React timer: the
 * loop's mechanic tests drain fake timers one transition at a time, and a
 * self-rescheduling blink would pollute that queue (ADR-0003's test-harness
 * constraint, and the React-19 fake-timer trap behind it).
 *
 * `partAttr` is the hook name the animal's tests address it by — the piglet
 * predates the shared `data-critter-part` convention and still uses
 * `data-piglet-part`, so the attribute is injected rather than hardcoded.
 */
export function Face({
  face,
  partAttr,
}: {
  face: ReturnType<typeof faceGeometry>;
  partAttr: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <>
      <circle {...{ [partAttr]: 'cheek' }} cx={face.cheekL[0]} cy={face.cheekL[1]} r={face.cheekR2} fill={palette.critterCheek} />
      <circle {...{ [partAttr]: 'cheek' }} cx={face.cheekR[0]} cy={face.cheekR[1]} r={face.cheekR2 * 0.9} fill={palette.critterCheek} />
      <motion.g
        // `transformBox: fill-box` pivots on the group's own box so the lids meet
        // at the eye centreline rather than at the SVG origin.
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={reducedMotion ? undefined : { scaleY: [1, 1, 0.1, 1] }}
        transition={{ duration: 4.5, times: [0, 0.9, 0.945, 1], ease: 'easeOut', repeat: Infinity }}
      >
        <circle {...{ [partAttr]: 'eye' }} cx={face.eyeL[0]} cy={face.eyeL[1]} r={face.eyeLR} fill={palette.critterEye} />
        <circle {...{ [partAttr]: 'eye' }} cx={face.eyeR[0]} cy={face.eyeR[1]} r={face.eyeRR} fill={palette.critterEye} />
        {/* The catchlight is the PAPER showing through, never `#fff`. */}
        <circle
          {...{ [partAttr]: 'eye-shine' }}
          cx={face.eyeL[0] - face.eyeLR * 0.34}
          cy={face.eyeL[1] - face.eyeLR * 0.36}
          r={face.eyeLR * 0.34}
          fill={palette.critterEyeShine}
        />
        <circle
          {...{ [partAttr]: 'eye-shine' }}
          cx={face.eyeR[0] - face.eyeRR * 0.3}
          cy={face.eyeR[1] - face.eyeRR * 0.38}
          r={face.eyeRR * 0.28}
          fill={palette.critterEyeShine}
        />
      </motion.g>
    </>
  );
}

/**
 * A gentle smile, as a HAIRLINE tapered fill.
 *
 * It was a `stroke` with a `strokeWidth` on every animal in the cast. Beyond the
 * line-language problem, weight matters here: at anything near the contour's
 * width a curve this deep fills in as a solid dark lens and reads as an open
 * mouth. A drawn smile in this tradition is the lightest line on the drawing.
 */
export const smilePath = (cx: number, cy: number, halfW: number, drop: number) =>
  taperedOutline(
    quadPts([cx - halfW, cy], [cx + halfW * 0.06, cy + drop], [cx + halfW * 0.95, cy - drop * 0.1], 12),
    houseLine.detail * 0.85,
    0.5,
  );

/**
 * The contact shadow. Without it a Critter floats — which is exactly what the
 * old art did, positioned at `top: 34%` over a ground band it had no agreement
 * with. A Critter with a contact shadow is standing on something.
 */
export function ContactShadow({
  cx,
  rx,
  colour,
  y = FOOT_Y + 2.2,
}: {
  cx: number;
  rx: number;
  colour: string;
  y?: number;
}) {
  return (
    <ellipse
      data-critter-part="contact"
      cx={cx}
      cy={y}
      rx={rx}
      ry={2.6}
      fill={colour}
      opacity={shading.contactStrength}
    />
  );
}

/**
 * A pair of legs, tapered fills rather than the `<rect>`s and bare body-bottoms
 * the cast used to stand on. They differ in lean and length: nothing is
 * mirrored.
 */
export function legGeometry(
  xs: [number, number],
  top: number,
  name: CritterName,
  thickness = 1.9,
) {
  const rnd = rngFor(name, 'legs');
  const jit = (a: number) => (rnd() - 0.5) * 2 * a;
  return xs.map((x, i) => {
    const lean = (i === 0 ? -1 : 1) * (1.2 + jit(0.5));
    const foot = FOOT_Y - (i === 0 ? 0 : 0.8);
    return {
      leg: taperedOutline(
        quadPts([x, top], [x + lean * 0.6, (top + foot) / 2], [x + lean, foot], 10),
        houseLine.contour * (thickness + jit(0.15)),
        0.35,
      ),
      hoof: taperedOutline(
        quadPts([x + lean - 2.5, foot - 1.1], [x + lean + jit(0.4), foot + 1.2], [x + lean + 2.7, foot - 0.85], 8),
        houseLine.contour * 1.5,
        0.5,
      ),
    };
  });
}

/** An occlusion crescent — RULE 8's shape, never a grey overlay or black. */
export const occlusion = crescent;

/** The house asymmetry constant, surfaced so animals do not restate it. */
export const ASYM = disorder.asymmetry;
export const BLOB_AMP = disorder.blobAmp;

/**
 * The sized element the Toy mounts: an animal's figure in its own `<svg>` at the
 * shipped width, carrying the breathing swell.
 *
 * The split between this and the bare figure exists so the Home Card can draw
 * the REAL Critter. The Card used to carry a hand-simplified stand-in built from
 * plain `<circle>`s — the exact construction this art was rebuilt away from —
 * which is clip-art sitting on a Card advertising a contoured scene. Simplifying
 * the cast for a thumbnail is not a saving; it is the defect, shrunk.
 *
 * The breath lives out here rather than in the figure: a Card is a still, and a
 * looping animation on five of them is five rAF subscriptions for a page nobody
 * is looking at yet.
 */
export function CritterSvg({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  return (
    // A slow breathing swell rides on the whole drawing — the cheapest "alive"
    // there is, and it scales from the FEET so a Critter never lifts off the
    // trotting line it is standing on.
    <motion.svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      aria-hidden="true"
      style={{
        width: CRITTER_WIDTH,
        height: 'auto',
        display: 'block',
        transformOrigin: 'center bottom',
        overflow: 'visible',
      }}
      animate={reducedMotion ? undefined : { scale: [1, 1.022, 1] }}
      transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity }}
    >
      {children}
    </motion.svg>
  );
}
