import { motion } from 'motion/react';
import { palette } from './palette';

/**
 * The first stars of the settle Outro (slice #5) — a scatter of glints twinkled
 * into the upper dusk sky (viewBox 0..100) once `night` falls. `delay` staggers
 * the twinkle so they don't blink in unison; `r` varies the glint size. Kept in
 * the upper-mid band so the deepening sky reads as filling with stars above the
 * sleeping nest, never down in the reachable lower zone. Positions/sizes are
 * on-device-tuned per the slice DoD, not a unit-asserted contract.
 */
const STARS = [
  { cx: 18, cy: 14, r: 0.9, delay: 0 },
  { cx: 34, cy: 9, r: 0.7, delay: 0.5 },
  { cx: 52, cy: 16, r: 1.0, delay: 0.2 },
  { cx: 69, cy: 11, r: 0.7, delay: 0.7 },
  { cx: 83, cy: 19, r: 0.9, delay: 0.35 },
  { cx: 26, cy: 26, r: 0.6, delay: 0.9 },
  { cx: 61, cy: 28, r: 0.7, delay: 0.6 },
  { cx: 90, cy: 33, r: 0.6, delay: 1.1 },
] as const;

/**
 * The settle & sleep Outro's duration (ms) — how long the whole nestful takes to
 * deepen to night, twinkle the first stars in, and bob to sleep on the terminal
 * placement (slice #5). The registry wires this to its `winDelayMs` field (slice
 * #8) so the Shell HOLDS the Completion dialogue for this beat rather than
 * landing it on a mid-settle frame — the analog of Balloons' `FLOAT_AWAY_MS` /
 * Counting Sheep's exit. The exact value is on-device-tuned per the slice DoD
 * (the kid-handoff "lands WITH the confetti, dialogue arrives after the beat"
 * check); the contract is only that it exists and holds the beat, never the ms.
 */
export const SETTLE_MS = 2400;

/**
 * The Nestlings dusk backdrop — the analog of `SkyBackdrop` /
 * `UnderwaterBackdrop` / `BarnyardBackdrop`: the code-drawn world behind the
 * fledgling Critters (ADR-0002, all SVG; ADR-0004, the Toy owns its scene
 * assets locally). Every colour sources the local dusk `palette`, so there are
 * no hardcoded HSLs here.
 *
 * Bottom-anchored layered architecture (ADR-0005): the scene is layers that each
 * stay locked across aspect ratios rather than one sliced portrait viewBox the
 * Critter is positioned over independently. The ground band's height is a shared
 * CSS length (`--nestlings-ground`, a `dvh` clamp set on the Toy's `<main>` in a
 * later slice) so the horizon sits at a fixed fraction of the viewport at every
 * aspect ratio.
 *
 * Emphasis split (slice notes): the deepening dusk SKY above is the mood space
 * the carry happens through; the nest + ground band is the reachable lower
 * anchor the birds are tucked into (clear of the bottom palm-rest dead zone).
 *
 * Layers are identified by `data-dusk-layer` so tests address the composition
 * without coupling to which primitive draws each one. Decorative: every SVG is
 * `aria-hidden` and `pointer-events: none` so screen readers and presses fall
 * straight through to the Critters above.
 */
export function DuskBackdrop({ night = false, hovered = false, placedCount = 0 }: {
  /**
   * The settle & sleep Outro flag (slice #5). Off during play; flipped true on
   * the terminal placement so the whole nestful goes to sleep — the dusk deepens
   * toward night and the first stars twinkle in. Reflected to `data-dusk-night`
   * so the Outro state is observable at the value boundary. The deepen / star
   * choreography it drives is on-device-tuned, not unit-asserted (slice Notes).
   */
  night?: boolean;
  /**
   * Whether a carried bird is currently hovering over the nest's drop zone. While
   * true the nest swells a touch — a "yes, drop it here" nudge for the child. A
   * transform cue, so the root `reducedMotion="user"` gate softens it for
   * motion-sensitive users. Decorative; not unit-asserted.
   */
  hovered?: boolean;
  /**
   * How many birds have been tucked in so far. Each increment plays a subtle
   * one-shot glow pulse around the rim — the nest's own quiet "caught it" beat,
   * alongside the bird closing its eyes. Drives a keyed replay, so the value (not
   * the animation) is the signal. Decorative; not unit-asserted.
   */
  placedCount?: number;
}) {
  return (
    // Full-viewport positioning shell — fixed so the scene reads as the world
    // behind the birds and bleeds under the safe-area insets; `overflow: hidden`
    // clips the layers' bled edges, `zIndex: -1` parks it behind the Critters.
    <div
      className="dusk-backdrop"
      data-dusk-night={night}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {/* Layer 1 — dusk sky: a square viewBox + `slice` fills the viewport at any
       * aspect with the deepening dusk gradient. A vertical `<linearGradient>`
       * runs `skyDeep` (deeper indigo up high) → `sky` (the warmer dusk tone
       * lower down) so the sky reads as evening settling in; the slice #5 Outro
       * deepens the whole thing toward night. Both stops are palette tokens. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {/* The sky layer carries its own gradient so its `stop-color` stops are
         * descendants of the `data-dusk-layer="sky"` hook — the palette trace
         * follows the gradient (the rect's own `url(...)` fill is a structural
         * paint-server reference, not a colour). */}
        <g data-dusk-layer="sky">
          <linearGradient id="nestlings-dusk-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette.skyDeep} />
            <stop offset="1" stopColor={palette.sky} />
          </linearGradient>
          <rect x="0" y="0" width="100" height="100" fill="url(#nestlings-dusk-sky)" />
        </g>

        {/* The settle Outro's night deepen (slice #5) — a `skyDeep` wash that
         * fades in over the whole sky once `night` falls, sinking the dusk toward
         * night beneath the Shell's confetti. Opacity-only, so it SURVIVES the
         * app-root `reducedMotion="user"` gate (which drops transforms): under
         * reduced motion the sky still arrives deepened — the scene reads as
         * finished, not broken. The fade duration tracks `SETTLE_MS`; the target
         * opacity is on-device-tuned. Only mounted at settle, so it never touches
         * the daytime palette sweep (which renders the backdrop without `night`). */}
        {night && (
          <motion.rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill={palette.skyDeep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.82 }}
            transition={{ duration: SETTLE_MS / 1000, ease: 'easeInOut' }}
          />
        )}

        {/* The first stars (slice #5) — `sparkle` glints twinkled into the
         * deepened sky once `night` falls, drawn AFTER the wash so they glint on
         * top of it. Opacity twinkle (per-star staggered), so they survive the
         * reduced-motion gate and still come out — gently — when transforms are
         * disabled. Positions/sizes/timings are on-device-tuned (slice Notes). */}
        {night &&
          STARS.map(({ cx, cy, r, delay }, i) => (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill={palette.sparkle}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.55, 1] }}
              transition={{
                duration: 2.4,
                delay,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            />
          ))}
      </svg>

      {/* Layer 2 — ground: a bottom-anchored band whose height is the shared
       * `--nestlings-ground` length, so the dusk horizon sits at a fixed
       * fraction of the viewport at every aspect ratio (ADR-0005 — the analog of
       * the meadow's ground / balloons' grassy rise). `preserveAspectRatio="none"`
       * maps the viewBox straight onto the band so the gentle rise stretches
       * horizontally, which reads fine for a flat ground band. The branch + nest
       * are NOT in this stretched layer (they used to be, which squashed the nest
       * on wide/desktop viewports) — they live in their own aspect-locked layer
       * below. The tall dusk sky above is the mood space. */}
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
          height: 'var(--nestlings-ground)',
          pointerEvents: 'none',
        }}
      >
        <path
          data-dusk-layer="ground"
          d="M 0 32 Q 25 24 50 28 T 100 26 L 100 100 L 0 100 Z"
          fill={palette.ground}
        />
      </svg>

      {/* Layer 3 — the branch + nest, aspect-LOCKED so they never stretch. The
       * SVG keeps its viewBox aspect (`width` capped, `height: auto`) and is
       * centred over the horizon, so the nest reads as the same round bowl on a
       * phone and a wide desktop alike (the previous version drew them inside the
       * `none`-stretched ground band, which smeared them sideways on desktop and
       * threw off the measured drop-zone). It's the reachable lower anchor; the
       * snap target's rect is read from the `data-dusk-layer="nest"` hook here. */}
      <svg
        viewBox="0 0 200 120"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'calc(var(--nestlings-ground) - 92px)',
          transform: 'translateX(-50%)',
          width: 'min(380px, 88vw)',
          height: 'auto',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        {/* The branch the nest is built on — a natural limb crossing under the
         * nest with a small offshoot twig, NOT a vertical pole. Drawn behind the
         * nest so the bowl sits cradled on it. Keeps the `data-dusk-layer="branch"`
         * hook; exact limb shape is on-device-tuned. */}
        <path
          data-dusk-layer="branch"
          d="M0 96 Q60 88 100 92 Q150 95 200 90"
          fill="none"
          stroke={palette.branch}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M148 92 Q162 82 176 77"
          fill="none"
          stroke={palette.branch}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* The nest bobs once the nestful is asleep (slice #5) — a small, slow
         * up-and-down that reads as the cozy breathing of a full nest. A TRANSFORM
         * bob, so the app-root `reducedMotion="user"` gate drops it to near-static
         * (the deepened sky + stars still read as "everyone's asleep" — finished,
         * not broken). Only animates at settle; the bob is a wrapper transform, so
         * the once-measured nest rect (slice #3's snap target) is untouched. */}
        <motion.g
          animate={night ? { y: [0, -1.4, 0] } : undefined}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* The nest swells a touch while a carried bird hovers over the drop zone
           * — the wordless "yes, drop it here" nudge. A spring so it feels soft and
           * alive; scaled from the nest's own centre (`fill-box`) so the bowl grows
           * in place without shifting sideways. */}
          <motion.g
            animate={{ scale: hovered ? 1.07 : 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
          {/* The woven bowl, built back-to-front to read unmistakably as a NEST: a
           * deep cup, a ring of twig-ends radiating out past the rim, a dark
           * opening, woven rows down the front, and a bumpy woven lip. The dark
           * opening carries the `data-dusk-layer="nest"` hook and is FIRST, because
           * Nestlings reads the first nest rect as the drop-zone centre (slice #3)
           * — and the opening IS where a bird drops in, so it's the right centre. */}
          {/* 1 — twig-ends radiating out past the rim (drawn first, behind the
           * bowl) — the single clearest "this is a nest" cue */}
          <g fill="none" strokeLinecap="round" strokeWidth="2">
            <path d="M50 60 L38 56" stroke={palette.branch} />
            <path d="M48 68 L36 68" stroke={palette.nestRim} />
            <path d="M50 76 L39 81" stroke={palette.branch} />
            <path d="M58 84 L50 92" stroke={palette.nestRim} />
            <path d="M70 52 L65 42" stroke={palette.branch} />
            <path d="M90 48 L87 38" stroke={palette.nestRim} />
            <path d="M110 48 L113 38" stroke={palette.branch} />
            <path d="M130 52 L135 42" stroke={palette.nestRim} />
            <path d="M150 60 L162 56" stroke={palette.branch} />
            <path d="M152 68 L164 68" stroke={palette.nestRim} />
            <path d="M150 76 L161 81" stroke={palette.branch} />
            <path d="M142 84 L150 92" stroke={palette.nestRim} />
          </g>
          {/* 2 — bowl body: a deep rounded cup */}
          <path d="M46 58 Q54 92 100 93 Q146 92 154 58 Z" fill={palette.nest} />
          {/* 3 — woven rows sagging down the front wall, lit + dark alternating */}
          <g fill="none" strokeLinecap="round">
            <path d="M52 64 Q100 80 148 64" stroke={palette.nestRim} strokeWidth="2.4" />
            <path d="M56 71 Q100 85 144 71" stroke={palette.branch} strokeWidth="2.2" />
            <path d="M64 78 Q100 88 136 78" stroke={palette.nestRim} strokeWidth="2" />
          </g>
          {/* 4 — cross-weave verticals tying the rows (the basket over-under) */}
          <g fill="none" stroke={palette.nestShadow} strokeWidth="1.4" strokeLinecap="round">
            <path d="M74 62 L72 80" />
            <path d="M100 63 L100 84" />
            <path d="M126 62 L128 80" />
          </g>
          {/* 5 — the dark opening (snap anchor) + a dusk-lit back rim, so the mouth
           * of the cup reads as round and open */}
          <ellipse data-dusk-layer="nest" cx="100" cy="56" rx="46" ry="13" fill={palette.nestShadow} />
          <path d="M56 53 Q100 36 144 53" fill="none" stroke={palette.nestRim} strokeWidth="3" strokeLinecap="round" />
          {/* 6 — bumpy woven lip along the near rim — little twig loops */}
          <g fill="none" stroke={palette.nestRim} strokeWidth="2.2" strokeLinecap="round">
            <path d="M58 60 Q64 53 70 60" />
            <path d="M72 62 Q79 55 86 62" />
            <path d="M90 63 Q97 56 104 63" />
            <path d="M108 62 Q115 55 122 62" />
            <path d="M126 60 Q132 53 138 60" />
          </g>
          </motion.g>

          {/* A subtle one-shot glow ring on each placement — the nest's own quiet
           * "caught it" beat, alongside the bird closing its eyes. Keyed on the
           * placement count so it REPLAYS each time a bird is tucked in; opacity-led
           * so it still reads (gently) under reduced motion. A sibling of the swell
           * group so it never shifts that group's measured box. */}
          {placedCount > 0 && (
            <motion.ellipse
              key={placedCount}
              cx="100"
              cy="56"
              rx="54"
              ry="17"
              fill="none"
              stroke={palette.sparkle}
              strokeWidth="2.5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: [0, 0.5, 0], scale: [0.9, 1.2] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          )}
        </motion.g>
      </svg>
    </div>
  );
}
