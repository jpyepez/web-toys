import { palette } from './palette';

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
    </div>
  );
}
