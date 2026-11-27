import { palette } from './palette';

/**
 * The pond behind the pads: soft bands of deeper and lighter water and a few
 * pale ripple marks, all cropped by the frame so none is Critter-sized and
 * closed. Placeholder scene. Drawn as filled shapes, never strokes.
 */
const WAVES = [
  { y: 22, fill: palette.waterLight },
  { y: 46, fill: palette.waterDeep },
  { y: 70, fill: palette.waterLight },
  { y: 92, fill: palette.waterDeep },
];

/** The bare waves, in a 100x100 box, so the Card's Preview draws the same ones. */
export function PondWaves() {
  return (
    <g data-pond-waves="">
      {WAVES.map((w, i) => (
        <path
          key={i}
          d={`M -5 ${w.y} Q 25 ${w.y - 6} 50 ${w.y} T 105 ${w.y} L 105 ${w.y + 14} Q 75 ${w.y + 8} 50 ${w.y + 14} T -5 ${w.y + 14} Z`}
          fill={w.fill}
          opacity={0.6}
        />
      ))}
    </g>
  );
}

export function PondBackdrop() {
  return (
    <svg
      data-pond-backdrop=""
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <PondWaves />
    </svg>
  );
}
