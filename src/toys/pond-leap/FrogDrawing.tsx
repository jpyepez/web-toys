import { palette } from './palette';

/** The frog's drawing box. Its feet rest at `FOOT_FRACTION` of the height. */
export const VB_W = 100;
export const VB_H = 100;
export const FOOT_FRACTION = 0.9;

/** The contour: every shape is drawn once in ink, a little larger, then in colour. */
const LINE = 2.4;

function Blob({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r + LINE} fill={palette.contour} />
      <circle cx={cx} cy={cy} r={r} fill={fill} />
    </>
  );
}

/**
 * The frog, from SVG primitives only: a round body, two eye bumps, a smile and
 * folded back legs. Placeholder art, drawn without a stroke like the rest of
 * the collection. The bare figure, so the Card's Preview draws the very same one.
 */
export function FrogFigure() {
  return (
    <g data-frog-figure="">
      {/* back legs, folded */}
      <Blob cx={22} cy={72} r={13} fill={palette.frogShade} />
      <Blob cx={78} cy={72} r={13} fill={palette.frogShade} />
      <Blob cx={15} cy={86} r={7} fill={palette.frogShade} />
      <Blob cx={85} cy={86} r={7} fill={palette.frogShade} />
      {/* body */}
      <Blob cx={50} cy={62} r={28} fill={palette.frogBody} />
      <Blob cx={50} cy={72} r={15} fill={palette.frogBelly} />
      {/* front hands */}
      <Blob cx={36} cy={86} r={6} fill={palette.frogBody} />
      <Blob cx={64} cy={86} r={6} fill={palette.frogBody} />
      {/* eyes on top of the head */}
      <Blob cx={34} cy={34} r={11} fill={palette.frogBody} />
      <Blob cx={66} cy={34} r={11} fill={palette.frogBody} />
      <circle cx={34} cy={34} r={7} fill={palette.paper} />
      <circle cx={66} cy={34} r={7} fill={palette.paper} />
      <circle cx={35} cy={35} r={4} fill={palette.frogEye} />
      <circle cx={65} cy={35} r={4} fill={palette.frogEye} />
      <circle cx={36.2} cy={33.6} r={1.3} fill={palette.frogEyeShine} />
      <circle cx={66.2} cy={33.6} r={1.3} fill={palette.frogEyeShine} />
      {/* cheeks and a smile (a filled crescent, not a line) */}
      <circle cx={28} cy={58} r={4.5} fill={palette.frogCheek} />
      <circle cx={72} cy={58} r={4.5} fill={palette.frogCheek} />
      <path d="M38 56 Q50 66 62 56 Q50 72 38 56 Z" fill={palette.frogEye} />
    </g>
  );
}

/** The frog as a standalone SVG, sized by its parent. */
export function FrogDrawing() {
  return (
    <svg
      data-frog-drawing=""
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
    >
      <FrogFigure />
    </svg>
  );
}
