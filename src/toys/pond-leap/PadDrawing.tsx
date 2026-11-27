import { palette } from './palette';

/** A lily pad is a round leaf with a wedge missing. Centred on the origin, radius 44. */
const R = 44;
const NOTCH = 0.32; // radians either side of the notch, which points up-right
const AIM = -Math.PI / 4;
const pt = (a: number, r: number) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
const PAD_PATH = `M 0 0 L ${pt(AIM - NOTCH, R)} A ${R} ${R} 0 1 0 ${pt(AIM + NOTCH, R)} Z`;

/** The pad's bare figure, centred on (0,0) in a -50..50 box. */
export function PadFigure({ bloom = false }: { bloom?: boolean }) {
  return (
    <g data-pad-figure="">
      {/* contour: the same leaf, a touch larger */}
      <path d={PAD_PATH} fill={palette.contour} transform="scale(1.07)" />
      <path d={PAD_PATH} fill={palette.pad} />
      {/* the shaded lower rim: occlusion on the side away from the light */}
      <path d={PAD_PATH} fill={palette.padShade} transform="translate(0 5) scale(0.9)" />
      <path d={PAD_PATH} fill={palette.pad} transform="scale(0.9)" />
      {bloom && (
        <g transform="translate(-26 -20)">
          <circle r={9.5} fill={palette.contour} />
          <circle r={7.5} fill={palette.bloom} />
          <circle r={2.6} fill={palette.paper} />
        </g>
      )}
    </g>
  );
}

export function PadDrawing({ bloom = false }: { bloom?: boolean }) {
  return (
    <svg
      data-pad-drawing=""
      viewBox="-50 -50 100 100"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
    >
      <PadFigure bloom={bloom} />
    </svg>
  );
}
