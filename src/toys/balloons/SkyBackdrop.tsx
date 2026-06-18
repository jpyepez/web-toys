import { palette } from './palette';

/**
 * The Balloons sky backdrop — the analog of `UnderwaterBackdrop` /
 * `BarnyardBackdrop` / the meadow: the code-drawn world behind the balloon
 * Critters (ADR-0002, all SVG; ADR-0004, the Toy owns its scene assets locally).
 * Every colour sources the local sky `palette`, so there are no hardcoded HSLs
 * here.
 *
 * Bottom-anchored layered architecture (ADR-0005): the scene is layers that each
 * stay locked across aspect ratios rather than one sliced portrait viewBox the
 * Critter is positioned over independently. The grassy rise + peg share one CSS
 * length (`--balloons-ground`, a `dvh` clamp set on the Toy's `<main>`) so the
 * horizon sits at a fixed fraction of the viewport at every aspect ratio.
 *
 * INVERSION of emphasis vs the prior Toys (slice notes): the load-bearing space
 * here is the TALL SKY above — where the balloons rise and gather (slices #3,
 * #5) — not the ground band, which is just the anchor the balloons are tied to.
 *
 * Layers are identified by `data-sky-layer` so tests address the composition
 * without coupling to which primitive draws each one. Decorative: every SVG is
 * `aria-hidden` and `pointer-events: none` so screen readers and taps fall
 * straight through to the Critters above.
 */
export function SkyBackdrop() {
  return (
    // Full-viewport positioning shell — fixed so the scene reads as the world
    // behind the balloons and bleeds under the safe-area insets; `overflow:
    // hidden` clips the layers' bled edges, `zIndex: -1` parks it behind the
    // Critters.
    <div
      className="sky-backdrop"
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
       * aspect with the open, deliberately-tall sky. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <rect data-sky-layer="sky" x="0" y="0" width="100" height="100" fill={palette.sky} />
        {/* Cloud(s) — soft rounded puffs high in the tall sky, drawn in the
         * round `slice` layer so they stay round at any aspect (ADR-0005). A
         * couple of overlapping circles + a base read as a fluffy cloud; count
         * and position are on-device-tuned. */}
        <circle data-sky-layer="cloud" cx="24" cy="20" r="7" fill={palette.cloud} />
        <circle data-sky-layer="cloud" cx="32" cy="18" r="9" fill={palette.cloud} />
        <circle data-sky-layer="cloud" cx="41" cy="21" r="6.5" fill={palette.cloud} />
        <circle data-sky-layer="cloud" cx="74" cy="30" r="6" fill={palette.cloud} />
        <circle data-sky-layer="cloud" cx="81" cy="28" r="7.5" fill={palette.cloud} />
      </svg>

      {/* Layer 2 — grassy rise: a bottom-anchored band whose height is the
       * shared `--balloons-ground` length, so the grass horizon sits at a fixed
       * fraction of the viewport at every aspect ratio (ADR-0005 — the analog of
       * the meadow's ground / Puffer Fish's seabed). `preserveAspectRatio="none"`
       * maps the viewBox straight onto the band so the gentle rise stretches
       * horizontally, which reads fine for a grassy field. Deliberately a thin
       * lower-third band — the tall sky above is the load-bearing play space. */}
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
          height: 'var(--balloons-ground)',
          pointerEvents: 'none',
        }}
      >
        <path
          data-sky-layer="grass"
          d="M 0 28 Q 25 18 50 24 T 100 22 L 100 100 L 0 100 Z"
          fill={palette.grass}
        />
        {/* Peg — a low stake driven into the grassy rise that the bunch of
         * balloons is tied to (slice #2/#3 attach their strings to its top). A
         * short post with a small cap, standing on the horizon line so its foot
         * sits in the grass; drawn after the grass so it reads as planted in the
         * field. Drawn in the `none`-mapped ground layer so it rises with the
         * grass at every aspect ratio. Position/size on-device-tuned. */}
        <rect data-sky-layer="peg" x="48.4" y="30" width="3.2" height="22" fill={palette.peg} />
        <ellipse data-sky-layer="peg" cx="50" cy="30" rx="3.4" ry="1.6" fill={palette.peg} />
      </svg>
    </div>
  );
}
