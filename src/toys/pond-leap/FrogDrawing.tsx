import { useId, useMemo } from 'react';
import { blob, closedPath, contourRing, grownContour, quadPts, taperedOutline, type Pt } from '../../shell/art/geometry';
import { disorder, line as houseLine } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { palette } from './palette';

/**
 * The Pond Leap Critter — a frog sitting front-on, face turned up to the viewer,
 * on a pond the camera looks down on. That is the Soup Pot convention: the scene
 * is seen from above, the Critter always shows its face. Code-drawn SVG in the
 * house style (ADR-0002, primitives only); its looks are a PURE FUNCTION of
 * props, and `PondLeap` owns everything that moves it.
 *
 *  - **One contour, a filled ring of varying width**, heavier underneath.
 *  - **Subdivided, not stacked.** The belly and the away-side shade are clipped
 *    to the body, so they end on its own contour.
 *  - **Every silhouette is a jittered path**, never an `<ellipse>`; `<circle>`
 *    survives only for eyes, pupils, catchlights and nostrils.
 *  - **Nothing is mirrored.** The eyes, thighs, feet and hands all differ a little.
 *  - **Read by outline.** Fill it solid black and it is still a frog: two eye
 *    bumps on the crown, a wide squat body, folded thighs and splayed webbed feet.
 *
 * Authored in a 100x100 box with the FEET at y 90 — the anchor `PondLeap` puts
 * on the pad.
 */

export const VB_W = 100;
export const VB_H = 100;
/** Where the feet rest, as a fraction of the box. */
export const FOOT_FRACTION = 0.9;

/** The frog's rendered width — and the scene's unit. Mirrors `FROG_WIDTH` in `pond.ts`. */
export function frogPx(w: number): number {
  return Math.min(92, Math.max(60, w * 0.17));
}

export type FrogPose = 'sitting' | 'happy';

const SEED = 4271;
const BODY = { cx: 50, cy: 64, rx: 31, ry: 23 };
const C: number = houseLine.contour;

function geometry() {
  const rnd = stream(SEED, 'frog');
  const ring = (pts: Pt[], name: string, width: number = C) =>
    contourRing(pts, width, houseLine.taper, houseLine.wobble, stream(SEED, `frog-${name}`));

  // Wider at the hips than at the crown: a squat frog, not a ball.
  const body = blob(BODY.cx, BODY.cy, BODY.rx, BODY.ry, disorder.blobAmp, rnd, 28);
  const bodyPts = body.pts.map(([x, y]) => {
    const up = Math.max(0, (BODY.cy - y) / BODY.ry);
    const down = Math.max(0, (y - BODY.cy) / BODY.ry);
    return [BODY.cx + (x - BODY.cx) * (1 - 0.12 * up + 0.06 * down), y] as Pt;
  });

  // Eye bumps on the crown, behind the body: not a matched pair.
  const bumps = [
    { cx: 35, cy: 38, r: 11.5 },
    { cx: 65.5, cy: 37, r: 11 },
  ].map((b, i) => {
    const s = blob(b.cx, b.cy, b.r, b.r * 0.95, disorder.blobAmp, rnd, 18);
    return { ...b, d: s.d, ink: ring(s.pts, `bump-${i}`) };
  });

  // Folded thighs at either side, behind the body.
  const thighs = [
    blob(23, 75, 14.5, 11, disorder.blobAmp, rnd, 18),
    blob(77.5, 76, 13.5, 10.5, disorder.blobAmp, rnd, 18),
  ].map((t, i) => ({ d: t.d, ink: ring(t.pts, `thigh-${i}`) }));

  // Webbed feet splayed outward at the bottom corners: three toe lobes each.
  const foot = (x: number, dir: -1 | 1, name: string) => {
    const pts: Pt[] = [];
    const toes = [-0.55, 0, 0.55];
    for (let k = 0; k <= 40; k++) {
      const a = Math.PI + (k / 40) * Math.PI; // the upper half-circle, left to right
      // three soft toes along the top edge, not a scallop: cos^2 lobes
      const lobe = toes.reduce((m, c) => m + 0.22 * Math.exp(-(((a - Math.PI * 1.5 - c) / 0.22) ** 2)), 0);
      const r = 8.5 * (0.85 + lobe);
      pts.push([x + Math.cos(a) * r * 1.15 + dir * 1.5, 90 + Math.sin(a) * r * 0.55]);
    }
    pts.push([x + 9 * dir, 91.5], [x - 9 * dir, 91.5]);
    return { d: closedPath(pts), ink: grownContour(pts, C * 0.8, houseLine.taper, houseLine.wobble, stream(SEED, `frog-${name}`)) };
  };
  const feet = [foot(16, -1, 'foot-0'), foot(84.5, 1, 'foot-1')];

  // Short front arms down to small splayed hands on the ground.
  const fw = C * houseLine.featureRatio;
  const arms = [
    { from: [39, 72] as Pt, ctrl: [35, 82] as Pt, to: [37, 88.5] as Pt },
    { from: [62, 72.5] as Pt, ctrl: [66.5, 82] as Pt, to: [63.5, 89] as Pt },
  ].map((a, i) => {
    const pts = quadPts(a.from, a.ctrl, a.to, 10);
    const hand = blob(a.to[0], a.to[1] + 0.5, 6, 3.4, 0.05, rnd, 14);
    return {
      d: taperedOutline(pts, 7, 0.6),
      ink: taperedOutline(pts, 7 + C * 1.3, 0.6),
      hand: hand.d,
      handInk: ring(hand.pts, `hand-${i}`, C * 0.75),
    };
  });

  // The away side (light from the upper left): the body minus a copy nudged
  // toward the light leaves a crescent on the lower right.
  const nudged = bodyPts.map(([x, y]) => [x - 5, y - 4] as Pt);

  return {
    body: { d: closedPath(bodyPts), ink: ring(bodyPts, 'body') },
    away: `${closedPath(bodyPts)} ${closedPath(nudged)}`,
    belly: blob(50.5, 75, 18, 11.5, disorder.blobAmp, rnd, 18).d,
    bumps,
    thighs,
    feet,
    arms,
    mouth: taperedOutline(quadPts([33, 57], [50, 66.5], [68, 56], 12), fw * 1.15, 0.5),
    cheeks: [blob(29.5, 61.5, 4.4, 2.8, 0.05, rnd, 12).d, blob(71, 61, 4.2, 2.7, 0.05, rnd, 12).d],
    happyEyes: bumps.map((b) => taperedOutline(quadPts([b.cx - 6, b.cy + 1], [b.cx, b.cy - 5], [b.cx + 6, b.cy + 1], 8), fw * 1.2, 0.5)),
  };
}

/** The frog as bare SVG content in a 100x100 box — droppable into any viewBox. */
export function FrogFigure({ pose = 'sitting' }: { pose?: FrogPose }) {
  const g = useMemo(geometry, []);
  const uid = useId().replace(/:/g, '');
  return (
    <g data-frog-figure="">
      <defs>
        <clipPath id={`frog-body-${uid}`}>
          <path d={g.body.d} />
        </clipPath>
      </defs>

      {/* behind the body: thighs, then the eye bumps */}
      {g.thighs.map((t, i) => (
        <g key={i} data-frog-part="thigh">
          <path d={t.ink} fill={palette.contour} fillRule="evenodd" />
          <path d={t.d} fill={palette.frogBody} />
        </g>
      ))}
      {g.bumps.map((b, i) => (
        <g key={i} data-frog-part="bump">
          <path d={b.ink} fill={palette.contour} fillRule="evenodd" />
          <path d={b.d} fill={palette.frogBody} />
        </g>
      ))}

      <path d={g.body.ink} fill={palette.contour} fillRule="evenodd" />
      <path data-frog-part="body" d={g.body.d} fill={palette.frogBody} />
      <g clipPath={`url(#frog-body-${uid})`}>
        <path data-frog-part="belly" d={g.belly} fill={palette.frogBelly} />
        <path d={g.away} fill={palette.frogShade} fillRule="evenodd" opacity={0.5} />
      </g>

      {/* arms and hands over the belly, feet on the ground */}
      {g.arms.map((a, i) => (
        <g key={i} data-frog-part="arm">
          <path d={a.ink} fill={palette.contour} />
          <path d={a.d} fill={palette.frogBody} />
          <path d={a.handInk} fill={palette.contour} fillRule="evenodd" />
          <path d={a.hand} fill={palette.frogBody} />
        </g>
      ))}
      {g.feet.map((f, i) => (
        <g key={i} data-frog-part="foot">
          <path d={f.ink} fill={palette.contour} />
          <path d={f.d} fill={palette.frogBody} />
        </g>
      ))}

      {/* the face */}
      {g.cheeks.map((d, i) => (
        <path key={i} d={d} fill={palette.frogCheek} opacity={0.75} />
      ))}
      {pose === 'happy'
        ? g.happyEyes.map((d, i) => (
            <path key={i} data-frog-part="eye" d={d} fill={palette.frogEye} />
          ))
        : g.bumps.map((b, i) => (
            <g key={i} data-frog-part="eye">
              <circle cx={b.cx} cy={b.cy} r={b.r * 0.6} fill={palette.paper} />
              <circle cx={b.cx + (i ? -0.8 : 0.9)} cy={b.cy + 1} r={b.r * 0.34} fill={palette.frogEye} />
              <circle cx={b.cx + (i ? 0.6 : 2.1)} cy={b.cy - 0.6} r={1.25} fill={palette.frogEyeShine} />
            </g>
          ))}
      <circle data-frog-part="nostril" cx={46.5} cy={50} r={0.95} fill={palette.frogEye} />
      <circle cx={54} cy={49.6} r={0.9} fill={palette.frogEye} />
      <path data-frog-part="mouth" d={g.mouth} fill={palette.frogEye} />
    </g>
  );
}

/** The frog as a standalone SVG, sized by its parent. */
export function FrogDrawing({ pose = 'sitting' }: { pose?: FrogPose }) {
  return (
    <svg
      data-frog-drawing=""
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
    >
      <FrogFigure pose={pose} />
    </svg>
  );
}
