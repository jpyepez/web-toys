import { palette } from './palette';

/**
 * Deterministic fence-post x-positions (in the silhouette layer's `0 0 100 100`
 * viewBox), a low post-and-rail run flanking the barn to the right. Stable
 * across re-renders by construction (no `Math.random()`, no per-render jitter),
 * like the meadow's cloud scatter and the ocean's bubbles. Count/positions are
 * on-device-tuned; the structural contract is that the fence renders.
 */
const FENCE_POSTS: readonly number[] = [46, 56, 66, 76, 86];

/**
 * The Muddy Puddle barnyard backdrop — the analog of `UnderwaterBackdrop` / the
 * meadow: the code-drawn world behind the Critter (ADR-0002, all SVG; ADR-0004,
 * the Toy owns its scene assets locally). Every colour sources the local
 * barnyard `palette`, so there are no hardcoded HSLs here.
 *
 * Bottom-anchored layered architecture (ADR-0005): the scene is layers that
 * each stay locked across aspect ratios rather than one sliced portrait viewBox
 * the Critter is positioned over independently. The ground band + mud puddle
 * share one CSS length (`--barnyard-floor`, a `dvh` clamp set on the Toy's
 * `<main>`) so the horizon sits at a fixed fraction of the viewport at every
 * aspect ratio — the puddle is the analog ground anchor of Puffer Fish's seabed.
 *
 * Layers are identified by `data-barnyard-layer` so tests address the
 * composition without coupling to which primitive draws each one. Decorative:
 * every SVG is `aria-hidden` and `pointer-events: none` so screen readers and
 * taps fall straight through to the Critter above.
 */
export function BarnyardBackdrop() {
  return (
    // Full-viewport positioning shell — fixed so the scene reads as the world
    // behind the critters and bleeds under the safe-area insets; `overflow:
    // hidden` clips the layers' bled edges, `zIndex: -1` parks it behind the
    // Critter.
    <div
      className="barnyard-backdrop"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {/* Layer 1 — sky: a square viewBox + `slice` fills the viewport at any
       * aspect with the open barnyard sky. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <rect data-barnyard-layer="sky" x="0" y="0" width="100" height="100" fill={palette.sky} />
      </svg>

      {/* Layer 2 — distant barn/fence silhouette: a bottom-anchored band sitting
       * on the horizon where the grass meets the sky. `preserveAspectRatio="none"`
       * maps the viewBox straight onto the band so the silhouette stays at a
       * fixed fraction of the viewport at every aspect ratio (ADR-0005). Its
       * height is the shared `--barnyard-floor` length so it rises with the
       * ground band. The barn is the gable-roofed shape anchoring the horizon. */}
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
          height: 'var(--barnyard-floor)',
          pointerEvents: 'none',
        }}
      >
        {/* Barn — a simple gable-roofed barn body, its base at the horizon line
         * (the top of the ground band) so it reads as standing in the field. */}
        <path
          data-barnyard-layer="barn"
          d="M 16 22 L 16 8 L 26 2 L 36 8 L 36 22 Z"
          fill={palette.barn}
        />
        {/* Fence — a low post-and-rail run flanking the barn to the right,
         * deterministic posts (no jitter) so it's stable across re-renders. The
         * rail and each post are tagged `fence` so the test addresses the run
         * without coupling to how many posts draw it. Posts stand on the horizon
         * line, so their feet sit where the grass band begins. */}
        {FENCE_POSTS.map((x, i) => (
          <rect key={i} data-barnyard-layer="fence" x={x} y="13" width="2" height="9" fill={palette.fence} />
        ))}
        <rect data-barnyard-layer="fence" x={FENCE_POSTS[0]} y="16" width={FENCE_POSTS[FENCE_POSTS.length - 1] - FENCE_POSTS[0] + 2} height="2.2" fill={palette.fence} />
      </svg>

      {/* Layer 3 — grass ground band: a bottom-anchored band whose height is the
       * shared `--barnyard-floor` length, so the grass horizon sits at a fixed
       * fraction of the viewport at every aspect ratio (ADR-0005 — the barnyard
       * analog of Puffer Fish's seabed). `preserveAspectRatio="none"` maps the
       * viewBox straight onto the box; the gentle grass curve stretches
       * horizontally, which reads fine for a field. Drawn after the silhouette so
       * the near foreground field sits in front of the distant barn/fence, whose
       * feet meet the grass at the horizon. */}
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
          height: 'var(--barnyard-floor)',
          pointerEvents: 'none',
        }}
      >
        <path
          data-barnyard-layer="grass"
          d="M 0 24 Q 25 16 50 22 T 100 20 L 100 100 L 0 100 Z"
          fill={palette.grass}
        />
        {/* Mud puddle — a wide, flat pool anchored in the lower third of the
         * ground band: an earthy `mud` base with a lighter `puddle` wet sheen
         * floated on top and a couple of `sparkle` glints. This is where the
         * muddy critters emerge from (slice #02) and the last one splashes in
         * (slice #04). Drawn after the grass so it sits on the field. Flat like
         * the seabed, so the `none` stretch reads fine; the glints are small
         * enough that the stretch doesn't betray them. */}
        <ellipse data-barnyard-layer="puddle" cx="50" cy="82" rx="34" ry="12" fill={palette.mud} />
        <ellipse data-barnyard-layer="puddle" cx="50" cy="80" rx="26" ry="8" fill={palette.puddle} />
        <circle data-barnyard-layer="puddle" cx="40" cy="78" r="1.6" fill={palette.sparkle} />
        <circle data-barnyard-layer="puddle" cx="60" cy="81" r="1.1" fill={palette.sparkle} />
      </svg>
    </div>
  );
}
