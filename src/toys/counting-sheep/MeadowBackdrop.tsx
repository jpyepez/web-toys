import { palette } from './palette';

/**
 * Deterministic per-index cloud cluster — four cloud clusters scattered
 * across the upper-sky region. Positions are stable across re-renders by
 * construction (no per-render jitter, no animation — the polish PRD's
 * out-of-scope rule against idle ambient motion still binds).
 *
 * `cy` sits in the 28–50 band of the square sky viewBox so the clusters stay
 * inside the always-visible region after the sky layer's `slice` crop on a
 * landscape desktop (where the crop keeps roughly the middle ~60% of the
 * viewBox height). On a phone the whole sky is visible and the clouds spread
 * across the top naturally. `cx` is spread left-to-right; `scale` varies the
 * cluster sizes so they read as "clouds at different distances."
 */
const CLOUD_SCATTER: readonly { cx: number; cy: number; scale: number }[] = [
  { cx: 18, cy: 34, scale: 1.0 },
  { cx: 44, cy: 28, scale: 1.3 },
  { cx: 70, cy: 46, scale: 0.85 },
  { cx: 90, cy: 36, scale: 0.75 },
];

/**
 * The Counting Sheep meadow — sky, clouds, two layered hills, and one
 * stylised tree, drawn as code SVG behind the Sheep. Per ADR-0002 every
 * visual is code-drawn; per the polish PRD every colour is sourced from
 * the palette tokens, so this component contains no hardcoded HSLs.
 *
 * Responsive architecture (the "floating Sheep on desktop" fix). The scene
 * used to be a single phone-aspect (1:2) viewBox with `xMidYMid slice`. On a
 * landscape desktop viewport `slice` scales by width and crops top/bottom
 * about the vertical centre, which pushes the hills (low in the viewBox) far
 * down — while the Sheep was placed at a fixed `bottom: 30%` of the viewport.
 * Those are two unrelated reference frames, so as the viewport gets wider the
 * horizon and the Sheep drift apart and the Sheep floats above the ground.
 *
 * The scene is now three layers that each stay locked across aspect ratios:
 *
 *  1. Sky + clouds — a square (`0 0 100 100`) `xMidYMid slice` SVG that fills
 *     the whole viewport. The flat sky rect covers edge-to-edge at any aspect;
 *     the round clouds keep their shape (uniform slice scale) and sit in the
 *     always-visible middle band.
 *  2. Ground hills — a bottom-anchored SVG whose height is the shared
 *     `--meadow-ground` length (a `dvh`-based clamp set on the Toy's `<main>`)
 *     and whose `preserveAspectRatio="none"` maps the viewBox straight onto
 *     that box. Because the box height is a fixed fraction of the viewport, the
 *     horizon always lands at the same distance from the bottom — regardless of
 *     aspect ratio. The gentle hill curves stretch horizontally on wide
 *     screens, which reads fine for rolling hills.
 *  3. Tree — its own small aspect-correct SVG anchored to the ground band, so
 *     the round canopy never squashes under the hills layer's horizontal
 *     stretch.
 *
 * The Sheep (in CountingSheep.tsx) positions its feet against the same
 * `--meadow-ground` length, so Sheep and hill always meet.
 *
 * Layers are identified by `data-meadow-layer` so tests address the scene
 * composition without coupling to which SVG primitive draws each one — those
 * shapes are tuned on-device per the slice-level DoD.
 *
 * Decorative: aria-hidden so screen readers skim straight to the tappable
 * Sheep above the scene.
 */
export function MeadowBackdrop() {
  return (
    // Full-viewport positioning shell. Fixed so the scene reads as the world
    // behind the Sheep (not an inline tile beside them) and bleeds under the
    // safe-area insets. `pointer-events: none` keeps every pixel transparent
    // to taps so the Sheep above stay reachable; `overflow: hidden` clips the
    // layers' bled edges. `zIndex: -1` parks it behind the Sheep.
    <div
      className="meadow-backdrop"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {/* Layer 1 — sky + clouds. Square viewBox + `slice` fills the viewport at
       * any aspect while keeping the clouds round. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {/* Sky band — bright cyan-blue daytime fill from `palette.skyUpper`. */}
        <rect
          data-meadow-layer="sky"
          x="0"
          y="0"
          width="100"
          height="100"
          fill={palette.skyUpper}
        />
        {CLOUD_SCATTER.map((cloud, i) => (
          <Cloud key={i} cx={cloud.cx} cy={cloud.cy} scale={cloud.scale} />
        ))}
      </svg>

      {/* Layer 2 — ground hills. Bottom-anchored, height = the shared
       * `--meadow-ground` length so the horizon sits at a fixed fraction of the
       * viewport height across every aspect ratio. `preserveAspectRatio="none"`
       * maps the viewBox straight onto the box: viewBox-y is a direct percentage
       * of the ground band, so the hill surface the Sheep stands on is always the
       * same distance from the bottom. The rolling curves stretch horizontally on
       * wide screens — acceptable for hills. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 'var(--meadow-ground)',
        }}
      >
        {/* Distant hill silhouette — the deeper plane behind the foreground, in
         * the cooler `palette.hillDistant` token so the depth reads as a
         * distinct plane. Crest near the top of the ground band (the horizon). */}
        <path
          data-meadow-layer="hill-distant"
          d="M 0 24 Q 30 8 55 16 T 100 12 L 100 100 L 0 100 Z"
          fill={palette.hillDistant}
        />
        {/* Foreground hill silhouette — the frontmost ground plane in vibrant
         * lime `palette.hillNear`. The surface at x=50 sits around y≈30 of the
         * 0–100 band, which is where the Sheep's feet rest (CountingSheep.tsx
         * anchors the Sheep to the same `--meadow-ground` length). */}
        <path
          data-meadow-layer="hill-near"
          d="M 0 40 Q 30 24 55 32 Q 80 38 100 34 L 100 100 L 0 100 Z"
          fill={palette.hillNear}
        />
      </svg>

      {/* Layer 3 — the single stylised tree, in its own aspect-correct SVG so the
       * round canopy never squashes under Layer 2's horizontal stretch. Anchored
       * to the ground band on the right side so the Sheep at centre stays focal;
       * `bottom` places the trunk base onto the foreground hill's right slope. */}
      <Tree />
    </div>
  );
}

/**
 * One cloud cluster — three overlapping circles forming a bumpy top + a
 * flat-bottom ellipse for the cloud's underside, all painted from
 * `palette.clouds`. Wrapped in a `<g data-meadow-layer="cloud">` so tests
 * count clusters (not individual shape-elements) and assert each cluster's
 * shapes carry the clouds-token fill.
 *
 * `scale` lets the four-cluster scatter render at different sizes without
 * minting per-cluster path strings — same `<Cloud>` primitive, four
 * different scale values, reads as "clouds at different distances."
 */
function Cloud({ cx, cy, scale }: { cx: number; cy: number; scale: number }) {
  return (
    <g data-meadow-layer="cloud">
      <ellipse
        cx={cx}
        cy={cy + 0.8 * scale}
        rx={3.2 * scale}
        ry={1 * scale}
        fill={palette.clouds}
      />
      <circle cx={cx - 1.8 * scale} cy={cy} r={1.6 * scale} fill={palette.clouds} />
      <circle cx={cx + 1.8 * scale} cy={cy} r={1.6 * scale} fill={palette.clouds} />
      <circle cx={cx} cy={cy - 1 * scale} r={1.9 * scale} fill={palette.clouds} />
    </g>
  );
}

/**
 * Single stylised tree — a round canopy in `palette.hillNear` (vibrant lime,
 * matching the foreground hill it stands on, so it silhouettes against the
 * cooler distant hill behind it) atop a thin warm-brown trunk in
 * `palette.scenery`. Drawn in its own aspect-correct SVG (default
 * `xMidYMid meet`) so the canopy circle stays round whatever the viewport
 * aspect — Layer 2's hills stretch, the tree does not.
 *
 * Anchored to the right of the ground band via `--meadow-ground`: `bottom`
 * lands the trunk base on the foreground hill's right slope, and the width is
 * a `vmin` clamp so the tree scales gently with the viewport without ever
 * dominating the focal Sheep at centre.
 */
function Tree() {
  return (
    <svg
      viewBox="0 0 24 50"
      style={{
        position: 'absolute',
        right: '14%',
        // Lifts the canopy above the foreground-hill crest so it silhouettes
        // against the sky / distant hill rather than vanishing into the
        // same-lime near hill (the canopy fill is `hillNear` by the slice's
        // test contract, so contrast has to come from position, not colour).
        // The long trunk below reaches down past the crest into the grass, so
        // the tree reads as rooted on the hill at every aspect ratio.
        bottom: 'calc(var(--meadow-ground) * 0.5)',
        width: 'clamp(44px, 10vmin, 96px)',
        height: 'auto',
      }}
    >
      {/* Long trunk: starts inside the canopy (y=11, within the r=10 circle) so
       * the two never visually detach, and runs to the viewBox bottom so it
       * crosses the hill crest into the grass below. */}
      <rect
        data-meadow-layer="tree-trunk"
        x="11"
        y="11"
        width="2"
        height="39"
        fill={palette.scenery}
      />
      <circle
        data-meadow-layer="tree-canopy"
        cx="12"
        cy="11"
        r="10"
        fill={palette.hillNear}
      />
    </svg>
  );
}
