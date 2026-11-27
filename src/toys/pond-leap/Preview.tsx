import { useMemo } from 'react';
import { FOOT_FRACTION, FrogFigure } from './FrogDrawing';
import { PadFigure } from './PadDrawing';
import { PondPlates } from './PondBackdrop';
import { buildPond } from './pond-scene';
import { POND, POND_SEED } from './pond-config';

/** The phone the preview is cropped from, and the window onto it (frame units). */
const PHONE = { w: 390, h: 844 };
const WINDOW = { x: 0, y: 118, w: 100, h: 60 };
/** The pad the frog sits on in the preview. */
const FROG_PAD = 1;

/**
 * Pond Leap's Card preview: a window cropped out of the real phone scene — the
 * same generator, the same pads and the same frog, waiting on its second pad
 * with the next one cut by the top edge. Decorative: the Card's title and link
 * carry the meaning.
 */
export function Preview() {
  const art = useMemo(() => buildPond(POND, PHONE.w, PHONE.h, POND_SEED), []);
  const [fx, fy] = art.pads[FROG_PAD];
  return (
    <svg
      viewBox={`${WINDOW.x} ${WINDOW.y} ${WINDOW.w} ${WINDOW.h}`}
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <PondPlates art={art} />
      {art.pads.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${(art.padR * 2) / 100})`}>
          <PadFigure index={i} bloom={i === art.pads.length - 1} />
        </g>
      ))}
      <g transform={`translate(${fx - art.fw / 2} ${fy - art.fw * (FOOT_FRACTION + 0.05)}) scale(${art.fw / 100})`}>
        <FrogFigure />
      </g>
    </svg>
  );
}
