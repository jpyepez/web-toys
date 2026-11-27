import { FrogFigure } from './FrogDrawing';
import { PadFigure } from './PadDrawing';
import { PondWaves } from './PondBackdrop';

/**
 * Pond Leap's Card preview: the real pads and the real frog, mid-leap along the
 * path. Decorative — the Card's title and link carry the meaning.
 */
const PADS: ReadonlyArray<[number, number]> = [
  [22, 44],
  [50, 22],
  [78, 40],
];

export function Preview() {
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" style={{ display: 'block' }}>
      <g transform="scale(1 0.6)">
        <PondWaves />
      </g>
      {PADS.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(0.26)`}>
          <PadFigure bloom={i === 2} />
        </g>
      ))}
      <g transform="translate(40 4) scale(0.2)">
        <FrogFigure />
      </g>
    </svg>
  );
}
