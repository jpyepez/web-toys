import { palette } from './palette';

/**
 * Deterministic god-ray shafts slanting down from the surface — soft,
 * widening light beams that make the scene read as top-lit. Each entry is a
 * four-point polygon (a narrow top at the surface fanning to a wider bottom),
 * positioned by `cx` (its centre at the surface) and `width` (how wide it fans
 * by the seabed). Static composition like the meadow's cloud scatter — no idle
 * ambient drift (the project's standing posture; the PRD scopes motion to the
 * fish's swim-in / balloon / float-up only). Three shafts sit inside the
 * "a few soft rays" band; exact geometry + softness are tuned on-device per the
 * slice DoD.
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
 * construction (no `Math.random()`, no per-render jitter): static composition
 * like the meadow's cloud scatter — no idle ambient drift (the PRD scopes
 * motion to the fish's swim-in / balloon / float-up only). Exact positions +
 * sizes are tuned on-device per the slice DoD.
 */
const BUBBLES: readonly { cx: number; cy: number; r: number }[] = [
  { cx: 16, cy: 48, r: 1.6 },
  { cx: 34, cy: 96, r: 1.0 },
  { cx: 68, cy: 64, r: 2.1 },
  { cx: 84, cy: 120, r: 1.3 },
  { cx: 48, cy: 30, r: 0.8 },
];

/**
 * Deterministic coral / reef silhouettes standing on the seabed — soft branchy
 * clumps drawn as filled paths from `palette.coral`. Two clumps flank the lower
 * scene so they frame the focal Critter without competing with it. Each path's
 * coordinates are anchored to the seabed band (`y≈170–200`) so the coral
 * appears to grow from the floor. Exact shapes + count are tuned on-device per
 * the slice DoD.
 */
const CORAL: readonly string[] = [
  // Left clump — three rounded fingers off a low base.
  'M 10 200 Q 8 184 11 178 Q 13 184 14 188 Q 15 178 18 174 Q 20 182 19 190 Q 22 184 25 182 Q 26 192 24 200 Z',
  // Right clump — a slightly taller, narrower fan.
  'M 84 200 Q 82 182 86 172 Q 88 180 88 186 Q 91 176 94 178 Q 94 188 92 200 Z',
];

/**
 * The Puffer Fish underwater backdrop — the analog of `MeadowBackdrop`: a
 * single full-bleed code-drawn SVG scene behind the Critter. Per ADR-0002 every
 * visual is code-drawn SVG; per ADR-0004 the fish carries its own scene assets
 * (the ocean palette + this backdrop live in the Toy folder, not the Shell).
 * Every colour is sourced from the local ocean `palette`, so this component
 * contains no hardcoded HSLs.
 *
 * A *different world* from the meadow — water instead of sky — so the second
 * Toy reads as unmistakably its own place. Layers are identified by
 * `data-ocean-layer` (mirroring `data-meadow-layer`) so tests can address the
 * scene composition without coupling to which SVG primitive draws each one;
 * those shapes are tuned on-device per the slice DoD.
 *
 * Composed as a single full-bleed SVG with `viewBox="0 0 100 200"` +
 * `preserveAspectRatio="xMidYMid slice"` — same phone-aspect (~1:2) posture as
 * `MeadowBackdrop`, so the scene scales uniformly to fill any viewport
 * edge-to-edge (lands naturally on phones, crops the left/right edges slightly
 * on desktop — acceptable for a phone-first PWA).
 *
 * Decorative: aria-hidden so screen readers skim straight to the tappable
 * Critter above the scene.
 */
export function UnderwaterBackdrop() {
  return (
    <svg
      className="underwater-backdrop"
      viewBox="0 0 100 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      // Pins the backdrop to the viewport so the scene reads as the world
      // behind the fish (not as an inline tile beside it). Same posture as
      // `MeadowBackdrop`: fixed positioning intentionally bleeds under the
      // safe-area insets so the water runs under the notch / home indicator;
      // `pointer-events: none` keeps every pixel transparent to taps so the
      // Critter above stays reachable. Layout correctness is on-device per the
      // slice DoD.
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {/* Water field — the underwater body the whole scene sits in, graded
       * top-lit: the lighter `palette.waterSurface` near the surface deepening
       * to `palette.water` below, so the scene reads as lit from above. The
       * gradient's `<defs>` live INSIDE the layer group so both the layer hook
       * and its palette-sourced stops are addressable together (mirrors how the
       * meadow's cloud `<g>` groups its shapes). One justified depth gradient —
       * a flat fill can't read as "lighter toward the surface". */}
      <g data-ocean-layer="water">
        <defs>
          <linearGradient id="ocean-water-grade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette.waterSurface} />
            <stop offset="1" stopColor={palette.water} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="200" fill="url(#ocean-water-grade)" />
      </g>
      {/* Soft god-ray shafts slanting down from the surface — painted after the
       * water and before the seabed so the light reads as filtering through the
       * water column. Each ray is a translucent `<polygon>` from
       * `palette.lightRay`; opacity (softness) is a visual property, not a
       * palette concern. */}
      {LIGHT_RAYS.map((ray, i) => (
        <polygon
          key={i}
          data-ocean-layer="light-ray"
          points={`${ray.cx - 2} 0, ${ray.cx + 2} 0, ${ray.cx + ray.width / 2} 200, ${ray.cx - ray.width / 2} 200`}
          fill={palette.lightRay}
          opacity={ray.opacity}
        />
      ))}
      {/* Drifting bubbles scattered through the water column — small circles
       * from `palette.bubble` (pale, slightly translucent so the water tone
       * shows through). Static, no per-render jitter, no animation. */}
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
      {/* Soft sandy floor — a gently undulating seabed band from `palette.sand`
       * across the bottom of the scene. Drawn before the coral so the coral
       * silhouettes sit on top of the floor rather than under it. */}
      <path
        data-ocean-layer="sand"
        d="M 0 188 Q 25 180 50 186 T 100 184 L 100 200 L 0 200 Z"
        fill={palette.sand}
      />
      {/* Coral silhouettes on the seabed — branchy clumps from `palette.coral`,
       * flanking the lower scene so they frame the Critter rather than compete
       * with it. */}
      {CORAL.map((d, i) => (
        <path key={i} data-ocean-layer="coral" d={d} fill={palette.coral} />
      ))}
    </svg>
  );
}
