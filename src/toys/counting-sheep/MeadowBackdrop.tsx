import { palette } from './palette';

/**
 * Deterministic per-index cloud cluster — four cloud clusters scattered
 * across the upper-sky region of the phone-aspect viewBox (`100×200`). The
 * scatter replaces the dusk-era star scatter that this slice originally
 * shipped (mobile-rethink PRD slice #02), pivoted to daytime under the
 * kid-handoff DoD's "the palette is kinda lame" on-device feedback. Same
 * deterministic-positions rule: positions are stable across re-renders
 * by construction, no per-render jitter, no animation (the polish PRD's
 * out-of-scope rule against idle ambient motion still applies — clouds
 * don't drift, just as stars didn't twinkle).
 *
 * Each cluster is rendered via the `<Cloud>` component below: three
 * overlapping circles + a flat-bottom ellipse, all painted from
 * `palette.clouds` (cool bright white). Sizes vary via the `scale`
 * field so the four clusters read as "clouds at different distances"
 * rather than four copies of the same shape. Count sits at four —
 * inside the 3–4 band picked on-device for a sparse playful sky that
 * doesn't compete with the focal Sheep below.
 */
const CLOUD_SCATTER: readonly { cx: number; cy: number; scale: number }[] = [
  // Cloud `cy` values tuned three times on-device, converging on full
  // upper-sky spread:
  // 1. Originally `cy` 20–38 — all clouds clustered near the top edge;
  //    cropped against the viewport's top on non-phone aspect ratios.
  // 2. First fix → `cy` 46–64 (all clouds in upper-middle band) — fixed
  //    the crop but left clouds far from the sheep/ground.
  // 3. Second fix → `cy` 78–95 (all clouds near the hill crest) —
  //    closer to the sheep but left the *upper* sky empty.
  // Final spread: `cy` 30–90, four clusters distributed across the full
  // upper-sky range. Positions remain deterministic-per-index (no
  // `Math.random()`, no per-render shuffle — the polish PRD's
  // out-of-scope rule against idle ambient motion still binds), but
  // chosen so one cluster sits near the top edge, one near the distant-
  // hill crest, and two between — same "natural-but-arranged" feel the
  // retired star scatter aimed for. Each `cy` was checked against the
  // distant-hill curve (`y≈100–117` at each `cx`) so no cloud's bottom
  // overlaps the hill.
  { cx: 18, cy: 68, scale: 1.0 },
  { cx: 45, cy: 30, scale: 1.3 },
  { cx: 72, cy: 90, scale: 0.85 },
  { cx: 92, cy: 52, scale: 0.75 },
];

/**
 * The Counting Sheep meadow — sky, clouds, two layered hills, and one
 * stylised tree, drawn as code SVG behind the Sheep. Per ADR-0002 every
 * visual is code-drawn; per the polish PRD every colour is sourced from
 * the palette tokens, so this component contains no hardcoded HSLs.
 *
 * Atmospheric pivot history — both PRDs originally pinned **dusk** (deep
 * blue sky, stars, half-moon, cottage + treeline silhouette). On-device
 * kid-handoff DoD review surfaced "kinda lame" with a daytime reference
 * (bright cyan sky, white clouds, vibrant lime hills, one stylised tree).
 * The pivot was authorised explicitly; recorded in polish PRD slice #03/#07
 * Notes + mobile-rethink PRD slice #02 Notes. After the pivot the scene's
 * elements are: sky + 4 clouds + 2 hill planes + 1 tree. The previous
 * elements (stars, moon, cottage, fir cluster, lit cottage window) all
 * retired with the pivot. The slice-#02 tests for `data-meadow-layer="star"`
 * / `"moon"` / `"scenery"` are rewritten in this commit to pin the new
 * `"cloud"` / `"tree-canopy"` / `"tree-trunk"` contract — sanctioned-pivot
 * pattern, same shape as the polish #07 → rounded-sans token rewrite.
 *
 * Composed as a single full-bleed SVG with `viewBox="0 0 100 200"` +
 * `preserveAspectRatio="xMidYMid slice"` — phone-aspect (~1:2) viewBox
 * scales uniformly to fill any viewport edge-to-edge; on phones it lands
 * naturally, on desktop the left/right edges crop slightly (acceptable
 * for a phone-first PWA). The previous "two SVGs to keep the moon round"
 * workaround retires with the moon — single SVG now does the whole
 * backdrop. Stars + moon distortion under `none` (the original bug that
 * forced the two-SVG split) is gone for the same reason: with `slice`
 * every shape scales uniformly.
 *
 * Layers are identified by `data-meadow-layer` so tests can address the
 * scene composition without coupling to which SVG primitive draws each
 * one — those shapes are tuned on-device per the slice-level DoD.
 *
 * Decorative: aria-hidden so screen readers skim straight to the
 * tappable Sheep above the scene.
 */
export function MeadowBackdrop() {
  return (
    <svg
      className="meadow-backdrop"
      viewBox="0 0 100 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      // Pins the backdrop to the viewport so the scene reads as the world
      // behind the Sheep (not as an inline tile beside them). Fixed
      // positioning intentionally bleeds under the safe-area insets — the
      // sky should run under the notch / home indicator, while the Sheep
      // (rendered in normal flow inside `.shell-frame`) still respect
      // them. `pointer-events: none` keeps every pixel of the backdrop
      // transparent to taps so the Sheep above stay reachable. Layout
      // correctness is on-device per the slice DoD.
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {/* Sky band — bright cyan-blue daytime fill from `palette.skyUpper`. */}
      <rect
        data-meadow-layer="sky"
        x="0"
        y="0"
        width="100"
        height="200"
        fill={palette.skyUpper}
      />
      {/* Cloud cluster scatter across the upper sky. Painted after the sky
       * and before the hills so clouds sit on the sky but never on top of
       * the ground. Each cloud is a `<g data-meadow-layer="cloud">` wrapping
       * three overlapping circles + a flat-bottom ellipse painted from
       * `palette.clouds`. */}
      {CLOUD_SCATTER.map((cloud, i) => (
        <Cloud key={i} cx={cloud.cx} cy={cloud.cy} scale={cloud.scale} />
      ))}
      {/* Distant hill silhouette — the deeper plane behind the foreground.
       * Teal-green from `palette.hillDistant` so the depth reads as
       * distinct from the warmer, lighter foreground hill. */}
      <path
        data-meadow-layer="hill-distant"
        d="M 0 116 Q 25 100 50 112 T 100 108 L 100 200 L 0 200 Z"
        fill={palette.hillDistant}
      />
      {/* Foreground hill silhouette — the frontmost ground plane. Vibrant
       * lime green from `palette.hillNear`. Curve carries the asymmetric
       * peak left-of-centre + shallow valley right tuned on-device during
       * earlier slice #02 review — the Sheep at x=50 lands on the descending
       * side of the peak where the surface y≈141 meets the Sheep's feet. */}
      <path
        data-meadow-layer="hill-near"
        d="M 0 160 Q 35 128 65 148 Q 85 156 100 152 L 100 200 L 0 200 Z"
        fill={palette.hillNear}
      />
      {/* Single stylised tree on the right side of the foreground hill, so
       * the Sheep at x=50 stays the focal subject. Painted AFTER the
       * foreground hill in DOM order so the trunk renders on top of the
       * hill's painted surface (otherwise the hill would occlude the trunk
       * base). Canopy in `palette.hillNear` silhouettes against the cooler
       * distant hill behind it; trunk in `palette.scenery`'s warm-brown
       * does too. Exact position + sizing tuned on-device per the slice
       * DoD. */}
      <Tree />
    </svg>
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
 * different scale values, reads as "clouds at different distances" rather
 * than identical copies.
 */
function Cloud({ cx, cy, scale }: { cx: number; cy: number; scale: number }) {
  return (
    <g data-meadow-layer="cloud">
      <ellipse
        cx={cx}
        cy={cy + 1.5 * scale}
        rx={6 * scale}
        ry={1.8 * scale}
        fill={palette.clouds}
      />
      <circle cx={cx - 3.5 * scale} cy={cy} r={3 * scale} fill={palette.clouds} />
      <circle cx={cx + 3.5 * scale} cy={cy} r={3 * scale} fill={palette.clouds} />
      <circle cx={cx} cy={cy - 2 * scale} r={3.6 * scale} fill={palette.clouds} />
    </g>
  );
}

/**
 * Single stylised tree — a circle canopy in `palette.hillNear` (vibrant
 * lime, matching the foreground hill the tree stands on — the canopy
 * silhouettes against the cooler distant hill behind it, not against the
 * foreground hill) atop a thin warm-brown trunk in `palette.scenery`.
 * Positioned at x=80, on the right side of the foreground hill so the
 * Sheep at x=50 stays visually focal. Trunk base lands at y=152 — the
 * foreground hill's approximate surface y at x=80 — so the tree appears
 * to grow from the ground rather than float above it.
 */
function Tree() {
  return (
    <g>
      <rect
        data-meadow-layer="tree-trunk"
        x="79"
        y="140"
        width="2"
        height="12"
        fill={palette.scenery}
      />
      <circle
        data-meadow-layer="tree-canopy"
        cx="80"
        cy="132"
        r="10"
        fill={palette.hillNear}
      />
    </g>
  );
}
