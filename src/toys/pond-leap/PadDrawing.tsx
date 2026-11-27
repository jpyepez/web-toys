import { useId, useMemo } from 'react';
import { blob, closedPath, contourRing, grownContour, quadPts, taperedOutline, type Pt } from '../../shell/art/geometry';
import { disorder, line as houseLine } from '../../shell/art/house';
import { jitter, stream } from '../../shell/art/rng';
import { palette } from './palette';

/**
 * A lily pad seen from above: a round leaf with a wedge cut to its middle, a few
 * veins, and a shaded rim on the side away from the light (the upper left).
 *
 * WHY A PAD IS ALLOWED AT ITS SIZE. A pad is about 1.6 frogs across — inside the
 * rival band, where the skill says a convex closed shape must not be drawn. The
 * pads are the mechanic: the frog lands on them, and there is no Toy without
 * them. What keeps them from being a second cast is the same as the floe's
 * licence: they CARRY the cast (a frog sits on each), the notch makes them
 * concave, they are pale objects (L 0.81, 0.31 lighter than the frog), and their
 * contour is held at half the frog's in rendered pixels.
 *
 * No two pads are the same: each index gets its own notch angle, size and
 * wobble from a seeded stream.
 */

const R = 43;
/** Half the notch's opening, radians. */
const NOTCH = 0.3;

/**
 * The pad's contour, in its own -50..50 box. The pad renders about 1.65 frogs
 * wide (`PAD_WIDTH` ÷ `FROG_WIDTH` is 1.6–1.65 at every width), so 0.75 here is
 * under HALF the frog's 2.6 in rendered pixels — the contour belongs to the
 * figure. `pond-art.test.ts` asserts it at every viewport width.
 */
export const PAD_CONTOUR = 0.75;
/** How many tiny blossoms crown the last pad — each under 1/8 of a frog. */
export const BLOSSOMS: ReadonlyArray<{ x: number; y: number; r: number }> = [
  { x: -20, y: -18, r: 3.6 },
  { x: -11.5, y: -24.5, r: 3.1 },
  { x: -25.5, y: -8, r: 2.8 },
];
/** A blossom's radius, in pad units, may be at most this: 1/8 of a frog. */
export const BLOSSOM_MAX_R = 3.7;

function geometry(index: number) {
  const rnd = stream(4271, `pad-${index}`);
  const aim = -Math.PI / 4 + jitter(rnd, 0.6);
  const r = R * (1 + jitter(rnd, disorder.instanceScale));
  const wob = blob(0, 0, 1, 1, disorder.blobAmp, rnd, 48).pts; // a unit wobble profile
  const edge: Pt[] = [[Math.cos(aim) * r * 0.06, Math.sin(aim) * r * 0.06]];
  const steps = 48;
  for (let k = 0; k <= steps; k++) {
    const a = aim + NOTCH + (k / steps) * (Math.PI * 2 - NOTCH * 2);
    const m = Math.hypot(...wob[k % wob.length]);
    edge.push([Math.cos(a) * r * m, Math.sin(a) * r * m]);
  }
  const nudged = edge.map(([x, y]) => [x - 4, y - 3.5] as Pt);

  // Veins: from the middle out to the rim, skipping the notch.
  const veins: string[] = [];
  const vw = PAD_CONTOUR * 0.8;
  for (let k = 0; k < 6; k++) {
    const a = aim + NOTCH + 0.45 + (k / 5) * (Math.PI * 2 - NOTCH * 2 - 0.9) + jitter(rnd, 0.06);
    const bend = jitter(rnd, 0.12);
    const tip: Pt = [Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82];
    const mid: Pt = [Math.cos(a + bend) * r * 0.42, Math.sin(a + bend) * r * 0.42];
    veins.push(taperedOutline(quadPts([0, 0], mid, tip, 10), vw, 0.15));
  }

  const blossoms = BLOSSOMS.map((b, i) => {
    const s = blob(b.x, b.y, b.r, b.r, 0.05, stream(4271, `pad-${index}-blossom-${i}`), 12);
    return {
      d: s.d,
      ink: contourRing(s.pts, PAD_CONTOUR, houseLine.taper, houseLine.wobble, stream(4271, `pad-${index}-blossom-ink-${i}`)),
      heart: { x: b.x + 0.4, y: b.y - 0.3, r: b.r * 0.38 },
    };
  });

  return {
    d: closedPath(edge),
    ink: grownContour(edge, PAD_CONTOUR, houseLine.taper, houseLine.wobble, stream(4271, `pad-${index}-ink`)),
    away: `${closedPath(edge)} ${closedPath(nudged)}`,
    veins,
    blossoms,
  };
}

/** The pad's bare figure, centred on (0,0) in a -50..50 box. */
export function PadFigure({ index = 0, bloom = false }: { index?: number; bloom?: boolean }) {
  const g = useMemo(() => geometry(index), [index]);
  const uid = useId().replace(/:/g, '');
  return (
    <g data-pad-figure="">
      <defs>
        <clipPath id={`pad-${uid}`}>
          <path d={g.d} />
        </clipPath>
      </defs>
      <path d={g.ink} fill={palette.contour} />
      <path d={g.d} fill={palette.pad} />
      <g clipPath={`url(#pad-${uid})`}>
        {g.veins.map((d, i) => (
          <path key={i} d={d} fill={palette.padVein} />
        ))}
        <path d={g.away} fill={palette.padShade} fillRule="evenodd" />
      </g>
      {bloom &&
        g.blossoms.map((b, i) => (
          <g key={i} data-pad-blossom="">
            <path d={b.ink} fill={palette.contour} fillRule="evenodd" />
            <path d={b.d} fill={palette.blossom} />
            <circle cx={b.heart.x} cy={b.heart.y} r={b.heart.r} fill={palette.blossomHeart} />
          </g>
        ))}
    </g>
  );
}

export function PadDrawing({ index = 0, bloom = false }: { index?: number; bloom?: boolean }) {
  return (
    <svg
      data-pad-drawing=""
      viewBox="-50 -50 100 100"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
    >
      <PadFigure index={index} bloom={bloom} />
    </svg>
  );
}
