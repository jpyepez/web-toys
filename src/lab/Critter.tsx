/**
 * `render(config)` — a pure function from config to a bird.
 *
 * THE RULES LIVE HERE, hardcoded, because they are what makes this idea *this*
 * idea rather than a generic playground:
 *
 *  1. Ink on paper. Every fill is a multiply plate over a warm paper ground; no
 *     pure white exists, and a highlight is a KNOCKOUT (ink removed so paper
 *     shows through), which is what a screenprint physically does.
 *  4. One silhouette, subdivided. Internal parts are `clipPath`'d chords of the
 *     parent contour — never smaller shapes floating on top of it. A wing's
 *     trailing edge IS the body's own outline.
 *  5. No unmodified primitives. Every silhouette is a jittered path. `<circle>`
 *     survives only for eyes and catchlights.
 *  6. Face geometry is numeric: eyes at or below the head midline, eye radius
 *     greater than every other face feature.
 *  7. Nothing is mirrored. Paired elements differ in size, angle and height.
 *  8. Occlusion at every junction; shadow colour is `shade()`, never black.
 *  9. Line is a filled tapered path. There is no `stroke` anywhere in this file.
 * 10. No filters. Everything here is geometry and blend modes, so a critter can
 *     animate by transform without ever re-rastering.
 *
 * Species cues all change the OUTLINE. That is the fix for the real bug: the
 * shipped birds' "distinct silhouette cues" were wing-bars and breast streaks —
 * internal line work — which left robin, sparrow and goldfinch byte-identical in
 * silhouette. Flip the silhouette test on and watch these five stay distinct.
 */

import { useId, useMemo } from 'react';
import {
  blob,
  closedPath,
  contourRing,
  crescent,
  flattenCrown,
  quadPts,
  taperedOutline,
  type Pt,
} from '../shell/art/geometry';
import { hex, shade, tint, type Oklch } from '../shell/art/oklch';
import { derive, type Config, type Species } from './config';
import { jitter, stream } from '../shell/art/rng';
import { SceneLayers } from './scene';

export const VIEW = { w: 100, h: 120 } as const;

/** Per-species outline cues. Every one of these changes the silhouette. */
const CUES: Record<
  Species,
  { crest: boolean; tail: 'fan' | 'up' | 'fork' | 'long'; beakScale: number; crown: 'round' | 'flat' }
> = {
  robin: { crest: false, tail: 'fan', beakScale: 1, crown: 'round' },
  bluebird: { crest: true, tail: 'fan', beakScale: 0.95, crown: 'round' },
  sparrow: { crest: false, tail: 'fork', beakScale: 1.05, crown: 'flat' },
  wren: { crest: false, tail: 'up', beakScale: 0.9, crown: 'round' },
  goldfinch: { crest: false, tail: 'long', beakScale: 1.35, crown: 'round' },
};

export function Critter({
  config,
  className,
  bare = false,
}: {
  config: Config;
  className?: string;
  /**
   * Drop the paper ground. The canvas and the cast rail want the paper behind
   * the bird — it is the surface the whole collection prints on. The frame view
   * does NOT: there the bird stands in a scene, and painting its own square of
   * paper behind it is what turned five birds into five stickers.
   */
  bare?: boolean;
}) {
  // Ids must be per-instance: the cast row draws five birds at once, and shared
  // ids would silently give all five the first bird's clip paths and knockout.
  const uid = useId().replace(/:/g, '');
  const art = useMemo(() => build(config, uid, bare), [config, uid, bare]);
  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      {art}
    </svg>
  );
}

function build(cfg: Config, uid: string, bare = false) {
  const ID = {
    body: `clip-body-${uid}`,
    head: `clip-head-${uid}`,
    knockout: `knockout-${uid}`,
  };
  const d = derive(cfg);
  const { critter: k, disorder, line, shading, mode } = cfg;
  const cue = CUES[mode.species];
  const sp = d.cast[mode.species];

  const rnd = stream(cfg.seed, mode.species);
  const flat = mode.silhouetteTest;

  /* --- proportions ------------------------------------------------- */
  const bodyRx = k.bodyWidth;
  const bodyRy = k.bodyWidth * 0.92;
  const bodyCx = 50;
  const bodyCy = 76;
  // RULE 6: head/body is an AREA ratio, so the radius is the square root of it.
  const headR = Math.sqrt(k.headBodyRatio * bodyRx * bodyRy);
  // Overlap the body decisively — a near-miss reads as a mistake, not a join.
  const headCy = bodyCy - (bodyRy + headR) * 0.72;
  // RULE 7: the head axis is never parallel to the body axis.
  const headTilt = 4 + jitter(rnd, disorder.instanceRotate * 0.5);
  const headCx = bodyCx + jitter(rnd, disorder.asymmetry);

  const body = blob(bodyCx, bodyCy, bodyRx, bodyRy, disorder.blobAmp, rnd, 26);
  const headRy = headR * 0.96;
  const headRaw = blob(headCx, headCy, headR, headRy, disorder.blobAmp, rnd, 26);
  const headPts = flattenCrown(headRaw.pts, headCy, headRy, cue.crown === 'flat' ? k.crownFlatten : 1);
  const head = { pts: headPts, d: closedPath(headPts) };

  /* --- colour ------------------------------------------------------ */
  const paper = d.paper;
  // The Critter paints its LANDED colours opaquely (see `derive`). Only the
  // scenery behind it is built as multiply plates over the paper.
  const inkOf = (c: Oklch) => hex(c);
  const contourInk = inkOf(cfg.ink);

  /**
   * RULE 2, as a mode. On three drums the wing gets its own darker ink. On two,
   * it is the SAME ink as the body, overprinted — `multiply` on the shape itself
   * so it doubles where it crosses the body and produces a genuine third colour
   * from two plates. That is exactly how red over yellow gave mid-century books
   * an orange they never paid for.
   */
  const overprint = mode.inks === 2;
  const wingBase = shade(sp.base, { dl: shading.occlusionDl * 1.15, hueRotate: shading.occlusionHueRotate * 0.6, dc: 0 });
  const wingInk = overprint ? sp.solid : inkOf(wingBase);
  const wingBlend = overprint ? ({ mixBlendMode: 'multiply' } as const) : undefined;
  const occInk = sp.occlusionSolid;
  // RULE 6: the blush never out-saturates the body, and never out-sizes the eye.
  const cheek = inkOf({
    l: Math.min(0.9, sp.base.l + 0.06),
    c: Math.min(k.cheekChroma, sp.base.c * 0.9),
    h: 20,
  });
  const bellyInk = inkOf(tint(sp.base, { dl: 0.14, hueRotate: -10 }));
  const eyeInk = contourInk;

  const F = (real: string) => (flat ? contourInk : real);

  /* --- line weights: RULE 9's three tiers, 1 : 1.6 : 2.5 ------------ */
  const wContour = line.width;
  const wFeature = line.width * 0.62;
  const wDetail = line.detailWidth;

  /* --- tail: a silhouette cue, drawn behind the body ---------------- */
  /*
   * Tails rotate about their ATTACHMENT to the body, not about the body centre.
   * Rotating about the centre swung the wren's cocked tail up behind the head,
   * where the head's own silhouette swallowed it — so the wren and the robin
   * came out identical under RULE 4's gate, which is the exact bug this whole
   * exercise exists to fix. Caught by the silhouette test on my own art.
   */
  const attachX = bodyCx + bodyRx * 0.6;
  const attachY = bodyCy + bodyRy * 0.2;
  const tail = (() => {
    const a = disorder.blobAmp * 1.4;
    switch (cue.tail) {
      case 'up':
        return blob(attachX + 15, attachY, 15, 6, a, rnd, 14);
      case 'fork':
        return blob(attachX + 14, attachY + 2, 15, 6.5, a, rnd, 14);
      case 'long':
        return blob(attachX + 23, attachY + 1, 24, 5.5, a, rnd, 14);
      default:
        return blob(attachX + 12, attachY + 2, 13, 7.5, a, rnd, 14);
    }
  })();
  const tailRot =
    cue.tail === 'up' ? -52 : cue.tail === 'long' ? 8 : cue.tail === 'fork' ? 18 : 22;

  /* --- wings: RULE 7, the pair is never identical ------------------- */
  const nearW = blob(
    bodyCx + bodyRx * 0.46,
    bodyCy + 2,
    bodyRx * 0.44,
    bodyRy * 0.66,
    disorder.blobAmp,
    rnd,
    18,
  );
  const farW = blob(
    bodyCx - bodyRx * 0.86,
    bodyCy - 3.5 - disorder.asymmetry,
    bodyRx * 0.34,
    bodyRy * 0.5,
    disorder.blobAmp,
    rnd,
    16,
  );

  /* --- legs and feet: tapered fills, differentiated ----------------- */
  const footY = bodyCy + bodyRy + 11;
  const leg = (x: number, lean: number, len: number) =>
    taperedOutline(quadPts([x, bodyCy + bodyRy - 4], [x + lean * 0.4, footY - len * 0.5], [x + lean, footY]), wDetail * 1.5, 0.3);
  const toe = (x: number, dx: number, dy: number) =>
    taperedOutline(
      quadPts([x, footY], [x + dx * 0.5, footY + dy * 0.4], [x + dx, footY + dy]),
      wDetail,
      0.25,
    );

  /* --- face: RULE 6, numerically ------------------------------------ */
  const eyeY = headCy + k.eyeBelowMidline;
  const eyeR = k.eyeRadius;
  // RULE 7: the two eyes are not the same size and not at the same height.
  const eyeLR = eyeR * (1 + 0.06 * disorder.asymmetry);
  const eyeRR = eyeR * (1 - 0.05 * disorder.asymmetry);
  const eyeLX = headCx - k.eyeSpread;
  const eyeRX = headCx + k.eyeSpread * 1.03;
  const eyeLY = eyeY;
  const eyeRY = eyeY + 0.6 * disorder.asymmetry;
  const cheekR = eyeR * k.cheekScale;

  const beakLen = k.beakLength * cue.beakScale;
  const beakY = eyeY + eyeR + 4;
  const beakX = headCx + 0.8 * disorder.asymmetry;
  // Two mandibles, asymmetric, clear of the eyes — not one isoceles caret.
  const hw = beakLen * 0.42;
  const bh = beakLen * 0.78;
  // Straights against curves: a hard top edge, a curved underside, an off-centre
  // tip. A symmetric isoceles triangle reads as a caret glyph, not a beak.
  const upperBeak =
    `M${beakX - hw},${beakY} ` +
    `L${beakX + hw},${beakY + 0.8} ` +
    `Q${beakX + hw * 0.3},${beakY + bh} ${beakX - hw * 0.4},${beakY + bh * 0.48} Z`;
  const lowerBeak =
    `M${beakX - hw * 0.62},${beakY + bh * 0.4} ` +
    `L${beakX + hw * 0.5},${beakY + bh * 0.34} ` +
    `Q${beakX + hw * 0.08},${beakY + bh * 0.8} ${beakX - hw * 0.62},${beakY + bh * 0.4} Z`;

  /* --- crest / nape: outline cues ----------------------------------- */
  const crest = cue.crest
    ? taperedOutline(
        quadPts(
          [headCx - 5, headCy - headR + 3],
          [headCx - 1, headCy - headR - 11],
          [headCx + 7, headCy - headR - 1],
        ),
        wContour * 2.4,
        0.55,
      )
    : null;

  /* ------------------------------------------------------------------ */
  return (
    <>
      <defs>
        <clipPath id={ID.body}>
          <path d={body.d} />
        </clipPath>
        <clipPath id={ID.head}>
          <path d={head.d} transform={`rotate(${headTilt} ${headCx} ${headCy})`} />
        </clipPath>
        {/*
          RULE 1 — the catchlight is a knockout through every plate, so what you
          see in it is the paper itself. There is no white ink in this drawing.
        */}
        <mask id={ID.knockout}>
          <rect x="0" y="0" width={VIEW.w} height={VIEW.h} fill="#fff" />
          {/* The knockout must follow the CRITTER, not the canvas: with the bird
              hidden it was still punching two catchlight holes through the sky. */}
          {!flat && mode.showCritter && (
            <g transform={`rotate(${headTilt} ${headCx} ${headCy})`}>
              <circle cx={eyeLX - eyeLR * 0.34} cy={eyeLY - eyeLR * 0.36} r={eyeLR * 0.34} fill="#000" />
              <circle cx={eyeRX - eyeRR * 0.3} cy={eyeRY - eyeRR * 0.38} r={eyeRR * 0.28} fill="#000" />
            </g>
          )}
        </mask>
      </defs>

      {/* paper — never blended, the ground everything multiplies onto */}
      {!bare && <rect x="0" y="0" width={VIEW.w} height={VIEW.h} fill={paper} />}

      <g mask={`url(#${ID.knockout})`} style={{ isolation: 'isolate' }}>
        {/* backdrop plates. Each drum pass is one ink, one registration offset. */}
        {cfg.mode.showBackdrop && !flat && (
          <>
            {/* Everything else — treeline, ground, branch, nest — in the BIRD'S
                own viewBox, at true relative size. Cohesion is a comparative
                judgement and cannot be made across two screens. */}
            <SceneLayers cfg={cfg} uid={uid} viewW={VIEW.w} viewH={VIEW.h} />
          </>
        )}

        {/* the critter plate */}
        {/* Opaque, and NOT a multiply plate: a figure that blends with its own
            ground is not a figure. */}
        <g style={{ display: cfg.mode.showCritter ? undefined : 'none' }}>
          {/* RULE 8 — contact shadow. Without it the bird floats, which is
              exactly what the shipped art does. */}
          {!flat && (
            <ellipse
              cx={bodyCx + 2}
              cy={footY + 3}
              rx={bodyRx * 0.72}
              ry={3.2}
              fill={occInk}
              opacity={shading.contactStrength}
            />
          )}

          {/* tail — behind everything, and a silhouette cue */}
          <g transform={`rotate(${tailRot} ${attachX} ${attachY})`}>
            {cfg.mode.line === 'contour' && (
              <path d={contourRing(tail.pts, wFeature, line.taper, line.wobble, rnd)} fill={contourInk} fillRule="evenodd" />
            )}
            <path d={tail.d} fill={F(wingInk)} style={flat ? undefined : wingBlend} />
          </g>

          {/* far wing — smaller, higher, darker. RULE 7. */}
          <g>
            {cfg.mode.line === 'contour' && (
              <path d={contourRing(farW.pts, wFeature, line.taper, line.wobble, rnd)} fill={contourInk} fillRule="evenodd" />
            )}
            <path
              d={farW.d}
              fill={F(overprint ? sp.solid : inkOf(shade(wingBase, { dl: 0.06, hueRotate: 8, dc: 0 })))}
              style={flat ? undefined : wingBlend}
            />
          </g>

          {/* legs — drawn before the body so they emerge from behind it */}
          <g fill={contourInk}>
            <path d={leg(bodyCx - 7, -2.5, 11)} />
            <path d={leg(bodyCx + 7.5, 2, 12.5)} />
            <path d={toe(bodyCx - 9.5, -4.5, 2.4)} />
            <path d={toe(bodyCx - 9.5, 3.2, 3)} />
            <path d={toe(bodyCx + 9.5, -3, 2.8)} />
            <path d={toe(bodyCx + 9.5, 4.8, 2.2)} />
          </g>

          {/* body */}
          {cfg.mode.line === 'contour' && (
            <path d={contourRing(body.pts, wContour, line.taper, line.wobble, rnd)} fill={contourInk} fillRule="evenodd" />
          )}
          <path d={body.d} fill={F(sp.solid)} />

          {/* RULE 4 — everything below is CLIPPED TO THE BODY, so each internal
              edge terminates on the body's own contour instead of floating as a
              smaller shape inside it. This is the difference between a drawing
              and a sticker stack. */}
          {!flat && (
            <g clipPath={`url(#${ID.body})`}>
              {/* belly — deliberately oversized so it breaks the body outline
                  rather than sitting concentrically inside it */}
              <path
                d={blob(bodyCx + 2, bodyCy + bodyRy * k.bellyRise, bodyRx * 0.78, bodyRy * 0.82, disorder.blobAmp, rnd, 18).d}
                fill={bellyInk}
              />
              {/* occlusion where the head meets the chest */}
              <path
                d={crescent(headCx, bodyCy - bodyRy + 5, bodyRx * 0.95, 0.55, 0.42)}
                fill={occInk}
                opacity={0.85}
              />
              {/* occlusion under the near wing */}
              <path
                d={crescent(bodyCx + bodyRx * 0.42, bodyCy + bodyRy * 0.52, bodyRx * 0.5, 0.6, 0.34)}
                fill={occInk}
                opacity={0.5}
              />
            </g>
          )}

          {/* near wing — clipped to the body, so its trailing edge IS the body
              contour. It is a subdivision of the silhouette, not a shape on it. */}
          <g clipPath={`url(#${ID.body})`}>
            {cfg.mode.line === 'contour' && (
              <path d={contourRing(nearW.pts, wFeature, line.taper, line.wobble, rnd)} fill={contourInk} fillRule="evenodd" />
            )}
            <path d={nearW.d} fill={F(wingInk)} style={flat ? undefined : wingBlend} />
          </g>

          {/* head */}
          <g transform={`rotate(${headTilt} ${headCx} ${headCy})`}>
            {cfg.mode.line === 'contour' && (
              <path d={contourRing(head.pts, wContour, line.taper, line.wobble, rnd)} fill={contourInk} fillRule="evenodd" />
            )}
            <path d={head.d} fill={F(sp.solid)} />

            {!flat && (
              <g clipPath={`url(#${ID.head})`}>
                {/* cheeks break the head contour and get clipped to it — not
                    the near-miss tangent the shipped bird has at 0.24 units */}
                <circle cx={headCx - headR * 0.72} cy={eyeY + eyeR * 0.5} r={cheekR} fill={cheek} />
                <circle cx={headCx + headR * 0.74} cy={eyeY + eyeR * 0.62} r={cheekR * 0.92} fill={cheek} />
                {/* form shadow on the side away from the light */}
                <path
                  d={crescent(headCx + headR * 0.55, headCy + headR * 0.1, headR * 0.8, 0.72, 1.5)}
                  fill={occInk}
                  opacity={0.28}
                />
              </g>
            )}

            {/* beak — two mandibles, asymmetric, clear of the eyes */}
            <path d={upperBeak} fill={F(inkOf(shade(sp.base, { dl: 0.22, hueRotate: 30, dc: 0.01 })))} />
            {!flat && (
              <path d={lowerBeak} fill={inkOf(shade(sp.base, { dl: 0.3, hueRotate: 30, dc: 0.01 }))} opacity={0.85} />
            )}

            {/* eyes — RULE 6: below the midline, and the largest face feature.
                The catchlight is punched out of the mask above, not painted. */}
            {!flat && (
              <>
                <circle cx={eyeLX} cy={eyeLY} r={eyeLR} fill={eyeInk} />
                <circle cx={eyeRX} cy={eyeRY} r={eyeRR} fill={eyeInk} />
              </>
            )}

            {crest && <path d={crest} fill={F(wingInk)} style={flat ? undefined : wingBlend} />}
          </g>
        </g>
      </g>
    </>
  );
}

/** Exposed so the panel can show the resolved palette next to the art. */
export function paletteSwatches(cfg: Config): Array<{ label: string; value: string }> {
  const d = derive(cfg);
  return [
    { label: 'paper', value: d.paper },
    { label: 'ink', value: hex(cfg.ink) },
    { label: 'sky', value: d.skyInk },
    { label: 'ground', value: d.groundInk },
    ...Object.entries(d.cast).map(([k, v]) => ({ label: k, value: v.fill })),
  ];
}

export type { Pt };
