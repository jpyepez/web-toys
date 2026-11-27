import { memo, useEffect, useMemo, useState } from 'react';
import { buildPond, type PondArt } from './pond-scene';
import { POND, POND_SEED } from './pond-config';
import { palette } from './palette';

/**
 * The pond's static plates, shared by the live backdrop and the lab's frame
 * view so the two can never be two drawings of one place.
 *
 * Paint order IS depth order: open water, the deep-water masses under it,
 * ripples on the surface, then the banks with the drop to the water and the moss
 * fringe at the shoreline. One light direction, the upper left. Every fill is a
 * palette token and every line is a filled path; there is no `stroke`.
 */
export const PondPlates = memo(function PondPlates({ art }: { art: PondArt }) {
  const { frame } = art;
  return (
    <>
      <rect data-pond-layer="water" x={-2} y={-2} width={frame.w + 4} height={frame.h + 4} fill={palette.water} />
      <g data-pond-layer="deep">
        {art.deep.map((d, i) => (
          <path key={i} d={d.d} fill={palette.waterDeep} />
        ))}
      </g>
      <g data-pond-layer="ripples">
        {art.ripples.map((r, i) => (
          <path key={i} d={r.d} fill={r.light ? palette.ripple : palette.waterDeep} />
        ))}
      </g>
      <g data-pond-layer="duckweed">
        {art.duckweed.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={palette.moss} />
        ))}
      </g>
      {art.banks.map((b) => (
        <g key={b.side} data-pond-layer="bank">
          <path d={b.ink} fill={palette.contour} />
          <path d={b.d} fill={palette.bank} />
          <path d={b.shade} fill={palette.bankShade} />
          {b.moss && <path d={b.moss} fill={palette.moss} />}
        </g>
      ))}
    </>
  );
});

/** The viewport size, kept current on resize. */
function useViewport() {
  const read = () => ({ w: Math.max(1, window.innerWidth), h: Math.max(1, window.innerHeight) });
  const [size, setSize] = useState(read);
  useEffect(() => {
    const on = () => setSize(read());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return size;
}

/** The live scene behind the pads — absolute, full-bleed, never a hit target. */
export function PondBackdrop() {
  const { w, h } = useViewport();
  const art = useMemo(() => buildPond(POND, w, h, POND_SEED), [w, h]);
  return (
    <svg
      data-pond-backdrop=""
      viewBox={`0 0 ${art.frame.w} ${art.frame.h}`}
      // The viewBox aspect IS the viewport aspect, so `none` distorts nothing.
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <PondPlates art={art} />
    </svg>
  );
}
