import { palette } from './palette';

/**
 * Deterministic god-ray shafts slanting down from the surface — soft, widening
 * light beams that make the scene read as top-lit. Each entry is a four-point
 * polygon (a narrow top at the surface fanning to a wider bottom), positioned
 * by `cx` (its centre at the surface) and `width` (how wide it fans by the
 * seabed). Static composition like the meadow's cloud scatter — no idle ambient
 * drift (the project's standing posture; the PRD scopes motion to the fish's
 * swim-in / balloon / float-up only). Coordinates are in the water layer's
 * square (`0 0 100 100`) viewBox: the rays run the full height (`0 → 100`) so
 * they reach from the surface to the seabed at every aspect ratio.
 */
const LIGHT_RAYS: readonly { cx: number; width: number; opacity: number }[] = [
  { cx: 22, width: 14, opacity: 0.35 },
  { cx: 54, width: 20, opacity: 0.28 },
  { cx: 82, width: 11, opacity: 0.4 },
];

/**
 * Deterministic drifting-bubble scatter through the water column — a handful of
 * small circles at varied sizes so they read as bubbles at different distances
 * rather than identical copies. Positions are stable across re-renders by
 * construction (no `Math.random()`, no per-render jitter). They live in the
 * water layer (a uniform-scale `slice` SVG) so the circles stay round at every
 * aspect ratio. `cy` sits in the upper/middle water column so the bubbles
 * survive the `slice` crop on a landscape desktop.
 */
const BUBBLES: readonly { cx: number; cy: number; r: number }[] = [
  { cx: 16, cy: 30, r: 0.9 },
  { cx: 34, cy: 60, r: 0.6 },
  { cx: 68, cy: 42, r: 1.2 },
  { cx: 84, cy: 68, r: 0.8 },
  { cx: 48, cy: 22, r: 0.5 },
];

/**
 * One branchy coral clump — soft rounded fingers off a low base, drawn in the
 * coral viewBox (`0 0 30 40`, base at the bottom edge `y=40`). Rendered in its
 * own aspect-correct SVG (see `Coral`) so the clump never squashes under the
 * seabed layer's horizontal stretch — the same split the meadow uses for its
 * tree. The right-hand clump reuses this path mirrored, so the two reefs read
 * as a related pair without minting a second path string.
 */
const CORAL_CLUMP =
  'M 13 40 Q 9 22 13 12 Q 15 20 16 26 Q 18 12 22 8 Q 24 18 23 28 Q 26 23 29 23 Q 29 35 26 40 Z';

/**
 * The Puffer Fish underwater backdrop — the analog of `MeadowBackdrop`: the
 * code-drawn world behind the Critter (ADR-0002, all SVG; ADR-0004, the fish
 * owns its scene assets locally). Every colour sources the local ocean
 * `palette`, so there are no hardcoded HSLs here.
 *
 * Responsive architecture — the same fix `MeadowBackdrop` carries (ADR-0005).
 * The scene used to be one phone-aspect (1:2) `viewBox` with `xMidYMid slice`;
 * on a landscape desktop `slice` scales by width and crops top/bottom about the
 * centre, pushing the seabed far down — while the Fish floated at a fixed
 * `top: 42%` of the viewport, so the two drifted apart as the viewport widened.
 * The scene is now layers that each stay locked across aspect ratios:
 *
 *  1. Water column — a square (`0 0 100 100`) `xMidYMid slice` SVG filling the
 *     viewport, carrying the top-lit water gradient, the god-rays, and the
 *     round bubbles (kept round by the uniform slice scale). The water always
 *     fills the viewport, so the Fish always floats in water.
 *  2. Seabed — a bottom-anchored SVG whose height is the shared `--ocean-floor`
 *     length (a `dvh` clamp set on the Toy's `<main>`) and whose
 *     `preserveAspectRatio="none"` maps the viewBox straight onto that box, so
 *     the sand line sits at a fixed fraction of the viewport at every aspect
 *     ratio. The gentle sand curve stretches horizontally — fine for a seabed,
 *     wrong for round things, which is why the coral lives in its own layer.
 *  3. Coral — small aspect-correct SVGs anchored to the seabed band, so the
 *     branchy clumps keep their shape whatever the viewport aspect.
 *
 * Layers are identified by `data-ocean-layer` so tests address the composition
 * without coupling to which primitive draws each one. Decorative: every SVG is
 * `aria-hidden` and `pointer-events: none` so screen readers and taps fall
 * straight through to the Critter above.
 */
export function UnderwaterBackdrop() {
  return (
    // Full-viewport positioning shell — fixed so the scene reads as the world
    // behind the fish and bleeds under the safe-area insets; `overflow: hidden`
    // clips the layers' bled edges, `zIndex: -1` parks it behind the Critter.
    <div
      className="underwater-backdrop"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {/* Layer 1 — water column: top-lit gradient + god-rays + round bubbles.
       * Square viewBox + `slice` fills the viewport at any aspect while keeping
       * the bubbles round. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {/* Water field — graded top-lit: lighter `palette.waterSurface` near the
         * surface deepening to `palette.water` below. The gradient `<defs>` live
         * INSIDE the layer group so both the layer hook and its palette-sourced
         * stops are addressable together. */}
        <g data-ocean-layer="water">
          <defs>
            <linearGradient id="ocean-water-grade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={palette.waterSurface} />
              <stop offset="1" stopColor={palette.water} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="url(#ocean-water-grade)" />
        </g>
        {/* God-ray shafts slanting down from the surface — translucent polygons
         * from `palette.lightRay`, running the full height so they read as light
         * filtering through the whole water column. */}
        {LIGHT_RAYS.map((ray, i) => (
          <polygon
            key={i}
            data-ocean-layer="light-ray"
            points={`${ray.cx - 1.5} 0, ${ray.cx + 1.5} 0, ${ray.cx + ray.width / 2} 100, ${ray.cx - ray.width / 2} 100`}
            fill={palette.lightRay}
            opacity={ray.opacity}
          />
        ))}
        {/* Drifting bubbles scattered through the water column. */}
        {BUBBLES.map((bubble, i) => (
          <circle
            key={i}
            data-ocean-layer="bubble"
            cx={bubble.cx}
            cy={bubble.cy}
            r={bubble.r}
            fill={palette.bubble}
            opacity={0.7}
          />
        ))}
      </svg>

      {/* Layer 2 — seabed: a bottom-anchored sand band whose height is the shared
       * `--ocean-floor` length, so the sand line sits at a fixed fraction of the
       * viewport at every aspect ratio. `preserveAspectRatio="none"` maps the
       * viewBox straight onto the box; the gentle sand curve stretches
       * horizontally, which reads fine for a seabed. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 'var(--ocean-floor)',
          pointerEvents: 'none',
        }}
      >
        <path
          data-ocean-layer="sand"
          d="M 0 26 Q 25 12 50 22 T 100 18 L 100 100 L 0 100 Z"
          fill={palette.sand}
        />
      </svg>

      {/* Layer 3 — coral clumps flanking the lower scene, each in its own
       * aspect-correct SVG so the branchy shapes never squash under Layer 2's
       * horizontal stretch (mirrors the meadow tree). Anchored to the seabed
       * band via `--ocean-floor` so they sit on the sand at every aspect. */}
      <Coral side="left" />
      <Coral side="right" />
    </div>
  );
}

/**
 * One coral clump as its own aspect-correct SVG (default `xMidYMid meet`), so
 * the branchy silhouette keeps its shape whatever the viewport aspect — Layer
 * 2's sand stretches, the coral does not. Anchored to the seabed band on the
 * left or right via `--ocean-floor` so it sits on the sand and frames the focal
 * Critter rather than competing with it; the right clump mirrors the shared
 * path so the two reefs read as a related pair.
 */
function Coral({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <svg
      viewBox="0 0 30 40"
      aria-hidden="true"
      style={{
        position: 'absolute',
        [isLeft ? 'left' : 'right']: isLeft ? '5%' : '7%',
        // Sits the clump base on the sloping sand (sand surface is near the top
        // of the floor band, ~0.78 up; the clump's own base rides a touch below
        // so it reads as rooted, not floating).
        bottom: 'calc(var(--ocean-floor) * 0.52)',
        width: isLeft ? 'clamp(38px, 9vmin, 84px)' : 'clamp(30px, 7vmin, 68px)',
        height: 'auto',
        pointerEvents: 'none',
        transform: isLeft ? undefined : 'scaleX(-1)',
      }}
    >
      <path data-ocean-layer="coral" d={CORAL_CLUMP} fill={palette.coral} />
    </svg>
  );
}
