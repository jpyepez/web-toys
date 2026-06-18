import { palette } from './palette';

/**
 * The Balloons Critter — a faced, code-drawn SVG balloon (ADR-0002, primitives
 * only). Its whole appearance is a PURE FUNCTION of a continuous `fill` prop
 * (0→1): limp/sad at 0, swelling and brightening to plump/happy at 1. Unlike the
 * Muddy Puddle piglet's BINARY `cleaned` prop, `fill` is continuous because the
 * leak (slice #3) walks it smoothly back down — so the mapping must be
 * continuous and reversible, never a binary flip.
 *
 * Structural pieces are tagged `data-balloon-part` so tests address them without
 * coupling to which primitive draws each one (mirrors `data-piglet-part` /
 * `data-fish-part`). This art is STATELESS — it owns no hold/leak logic; slice
 * #3 owns the fill value and passes it in.
 */
export function BalloonDrawing({
  fill = 0,
  color = palette.balloon1,
  interactive = false,
}: {
  /** Inflation 0→1. Drives the body swell and the sad→happy face. */
  fill?: number;
  /** Balloon body colour, from slice #1's palette (`palette.balloon1`…`5`). */
  color?: string;
  /**
   * When true, the balloon's painted shape is the pointer hit-target
   * (`pointer-events: visiblePainted`) — so a Hold registers on the round
   * balloon the child sees, not on the SVG's larger transparent bounding box.
   * Opt-in (default off) because the wrapper around a live balloon is made
   * pointer-transparent so overlapping balloons don't steal each other's taps,
   * and the DECORATIVE uses (the `GhostHoldFinger` demo) must stay untappable.
   * Stays art-only: this is *where* the art can be touched, not hold/leak logic.
   */
  interactive?: boolean;
}) {
  // Body swell: limp at fill 0, plump at fill 1. Monotonic in fill so slice #3's
  // leak walks it smoothly back down. Curve constants are on-device-tuned.
  const swell = 0.72 + 0.28 * fill;

  // Face: sad/limp at fill 0, happy at 1. The mouth's control point drops below
  // its endpoints as it fills, bowing a frown (control above) into a smile
  // (control below); the blush brightens in. Both continuous in fill so the
  // expression reshapes smoothly rather than flipping. Constants on-device-tuned.
  const mouthControlY = 58 + 12 * fill;

  return (
    <svg
      viewBox="0 0 100 140"
      aria-hidden="true"
      style={{ width: 'min(230px, 58vw)', height: 'auto', display: 'block' }}
    >
      {/* string — anchors the balloon down to the peg; stays put as the body
       * swells above it. */}
      <path
        data-balloon-part="string"
        d="M50 92 Q54 110 50 132"
        fill="none"
        stroke={palette.string}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* the inflating balloon — body + face swell together with fill, scaling
       * up from the knot at the bottom so the string stays anchored. */}
      <g
        data-balloon-part="balloon"
        transform={`scale(${swell})`}
        style={{
          transformOrigin: '50px 90px',
          // Shape-accurate hit-target for a live balloon (see `interactive`):
          // only the painted balloon takes the press, never the empty corners of
          // the SVG box. Decorative balloons leave it inherited (untappable).
          ...(interactive ? { pointerEvents: 'visiblePainted' as const } : {}),
        }}
      >
        <ellipse data-balloon-part="body" cx="50" cy="50" rx="34" ry="40" fill={color} />

        {/* blushy cheeks — invisible while limp, brightening in as it fills. */}
        <circle data-balloon-part="cheek" cx="32" cy="56" r="5" fill={palette.cheek} opacity={fill} />
        <circle data-balloon-part="cheek" cx="68" cy="56" r="5" fill={palette.cheek} opacity={fill} />

        <circle data-balloon-part="eye" cx="40" cy="46" r="4" fill={palette.faceInk} />
        <circle data-balloon-part="eye" cx="60" cy="46" r="4" fill={palette.faceInk} />

        <path
          data-balloon-part="mouth"
          d={`M42 64 Q50 ${mouthControlY} 58 64`}
          fill="none"
          stroke={palette.faceInk}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
