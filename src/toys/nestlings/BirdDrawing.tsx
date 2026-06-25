import { motion, useReducedMotion } from 'motion/react';
import { palette } from './palette';

/**
 * The Nestlings Critter — a faced, code-drawn SVG fledgling songbird (ADR-0002,
 * primitives only). Its appearance is a PURE FUNCTION of props: `species` picks
 * the body/wing/beak colours from slice #1's palette AND a distinct silhouette
 * cue (crest / wing-bars / cocked tail / breast streaks) so the five read as five
 * real birds, not recolours. The carry/snap logic lives in slice #3; this art
 * only owns its looks + a little idle life.
 *
 * Cute-chibi proportions, matching the rest of the cast's "house style": a big
 * round head over a chubby body, a pale belly, large dark eyes each with a white
 * catchlight (the cast's single biggest alive-and-friendly lever), round blush
 * cheeks, a tiny stubby beak dropped low between the eyes, soft folded wings and
 * a tail tucked behind, and little feet (shown awake, tucked away once nestled).
 *
 * Idle life: the wings flap on a gentle loop while the bird is awake — a faster,
 * excited flap while it's carried — and go still once nestled asleep. The flap is
 * gated on `useReducedMotion()` so it drops to a static pose for users who ask for
 * less motion (mirrors the Sheep's gated breathe/blink).
 *
 * Structural pieces are tagged `data-bird-part` so tests address them without
 * coupling to which primitive draws each one (mirrors `data-balloon-part` /
 * `data-piglet-part`).
 */
export type BirdSpecies = 'robin' | 'bluebird' | 'sparrow' | 'wren' | 'goldfinch';

/**
 * Per-species colour triplet, each pointing at the named palette tokens slice #1
 * declared for that fledgling. The five differ so the cast reads as variety
 * (PRD) — there is no hidden identity, the species only colour the set.
 */
const SPECIES_COLOURS: Record<BirdSpecies, { body: string; wing: string; beak: string }> = {
  robin: { body: palette.robinBody, wing: palette.robinWing, beak: palette.robinBeak },
  bluebird: { body: palette.bluebirdBody, wing: palette.bluebirdWing, beak: palette.bluebirdBeak },
  sparrow: { body: palette.sparrowBody, wing: palette.sparrowWing, beak: palette.sparrowBeak },
  wren: { body: palette.wrenBody, wing: palette.wrenWing, beak: palette.wrenBeak },
  goldfinch: { body: palette.goldfinchBody, wing: palette.goldfinchWing, beak: palette.goldfinchBeak },
};

/**
 * Per-species silhouette cue — the one iconic feature that makes each fledgling
 * read as its own bird beyond colour: the bluebird's perky crest, the goldfinch's
 * pale wing-bars, the wren's famously cocked-up tail, the sparrow's streaky
 * breast. The robin stays the plain round classic. On-device-tuned shapes; the
 * cue (not the geometry) is the contract.
 */
const SPECIES_TRAITS: Record<
  BirdSpecies,
  { crest?: boolean; wingBars?: boolean; tailUp?: boolean; streaks?: boolean }
> = {
  robin: {},
  bluebird: { crest: true },
  sparrow: { streaks: true },
  wren: { tailUp: true },
  goldfinch: { wingBars: true },
};

export function BirdDrawing({
  species = 'robin',
  asleep = false,
  carried = false,
  interactive = false,
}: {
  /** Which fledgling — selects its body/wing/beak colours + silhouette cue. */
  species?: BirdSpecies;
  /**
   * The nestled-in look: head tucked, eyes closed, wings still. Drives the
   * placed/Outro states (slices #4/#5). Awake (false) draws open eyes with
   * catchlights and flapping wings; asleep draws closed lids and tucks the feet
   * away. The exact tuck geometry is on-device-tuned.
   */
  asleep?: boolean;
  /**
   * The carried lift cue — the bird lifts and scales slightly toward the finger
   * (mirrors Balloons' which-one cue) and its wings flap faster, excited, so
   * slice #3's carry reads as "picked up". The exact lift/scale + flap tuples are
   * on-device-tuned; the cue is just present when carried, absent at rest.
   */
  carried?: boolean;
  /**
   * Shape-accurate hit target for a carriable bird (slice #3, ADR-0007): when the
   * positioning wrapper is `pointer-events: none` (so its large rectangle can't
   * steal taps from an overlapping neighbour), this re-enables the press on the
   * painted bird only (`pointer-events: visiblePainted`). A decorative bird leaves
   * it inherited (untappable) — mirrors `BalloonDrawing`'s `interactive`.
   */
  interactive?: boolean;
}) {
  const colours = SPECIES_COLOURS[species];
  const traits = SPECIES_TRAITS[species];

  // Idle wing-flap — gentle while awake, faster/wider while carried (excited),
  // still once nestled asleep, and dropped entirely under reduced-motion.
  const reducedMotion = useReducedMotion();
  const flapping = !asleep && !reducedMotion;
  const amp = carried ? 26 : 13;
  const flapTransition = {
    duration: carried ? 0.42 : 0.85,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };
  // Each wing pivots at the shoulder (its inner edge, nearest the body) so the
  // tip sweeps up and down — `fill-box` makes the origin the wing's own bbox.
  const leftWingStyle = { transformBox: 'fill-box' as const, transformOrigin: 'right center' };
  const rightWingStyle = { transformBox: 'fill-box' as const, transformOrigin: 'left center' };

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ width: 'min(140px, 36vw)', height: 'auto', display: 'block' }}
    >
      {/* the whole bird — lifts and scales toward the finger while carried,
       * sits untransformed at rest. Lift tuple is on-device-tuned. */}
      <g
        data-bird-part="bird"
        {...(carried ? { transform: 'translate(0 -6) scale(1.06)' } : {})}
        style={{
          transformOrigin: '50px 64px',
          // Only the painted bird takes the press, never the empty corners of the
          // SVG box (see `interactive`). Decorative birds leave it inherited.
          ...(interactive ? { pointerEvents: 'visiblePainted' as const } : {}),
        }}
      >
        {/* little feet — shown awake (loose/carried); tucked away once nestled
         * asleep, so a sleeping bird sits feet-hidden in the nest. */}
        {!asleep && (
          <g data-bird-part="foot" fill="none" stroke={palette.birdFoot} strokeWidth="2" strokeLinecap="round">
            <path d="M44 86 L44 92 M40 92 L44 92 L48 92" />
            <path d="M56 86 L56 92 M52 92 L56 92 L60 92" />
          </g>
        )}

        {/* tail tucked behind the body — cocked UP for the wren (its signature),
         * a soft down-fan for everyone else. Drawn first so it sits behind. */}
        {traits.tailUp ? (
          <path data-bird-part="tail" d="M70 64 Q90 50 96 40 Q94 54 78 70 Z" fill={colours.wing} />
        ) : (
          <path data-bird-part="tail" d="M68 78 Q88 82 94 92 Q80 90 66 84 Z" fill={colours.wing} />
        )}

        {/* far (left) wing — flaps behind the body */}
        <motion.g
          style={leftWingStyle}
          animate={flapping ? { rotate: [0, -amp, 0] } : { rotate: 0 }}
          transition={flapTransition}
        >
          <ellipse data-bird-part="wing" cx="27" cy="66" rx="8" ry="13" fill={colours.wing} />
          {traits.wingBars && (
            <g fill="none" stroke={palette.birdBelly} strokeWidth="1.4" strokeLinecap="round">
              <path d="M22 63 L32 63" />
              <path d="M22 68 L32 68" />
            </g>
          )}
        </motion.g>

        {/* chubby round body */}
        <ellipse data-bird-part="body" cx="50" cy="66" rx="26" ry="23" fill={colours.body} />
        {/* pale belly patch — the soft tummy every fledgling shares */}
        <ellipse data-bird-part="belly" cx="50" cy="71" rx="16" ry="15" fill={palette.birdBelly} />

        {/* sparrow's streaky breast — its silhouette cue */}
        {traits.streaks && (
          <g fill="none" stroke={colours.wing} strokeWidth="1.4" strokeLinecap="round">
            <path d="M46 66 L46 73" />
            <path d="M50 64 L50 72" />
            <path d="M54 66 L54 73" />
          </g>
        )}

        {/* near (right) wing — flaps in front of the body, the visible one */}
        <motion.g
          style={rightWingStyle}
          animate={flapping ? { rotate: [0, amp, 0] } : { rotate: 0 }}
          transition={flapTransition}
        >
          <ellipse data-bird-part="wing" cx="73" cy="66" rx="8" ry="13" fill={colours.wing} />
          {traits.wingBars && (
            <g fill="none" stroke={palette.birdBelly} strokeWidth="1.4" strokeLinecap="round">
              <path d="M68 63 L78 63" />
              <path d="M68 68 L78 68" />
            </g>
          )}
        </motion.g>

        {/* big round head over the body (chibi proportions) */}
        <circle data-bird-part="head" cx="50" cy="37" r="22" fill={colours.body} />

        {/* bluebird's perky crest — little peaks rising off the crown */}
        {traits.crest && (
          <path
            data-bird-part="crest"
            d="M42 17 L45 6 L49 16 L52 5 L55 16 L58 8 L60 18 Z"
            fill={colours.wing}
          />
        )}

        {/* round blush cheeks flanking the face */}
        <circle data-bird-part="cheek" cx="34" cy="42" r="5" fill={palette.birdCheek} />
        <circle data-bird-part="cheek" cx="66" cy="42" r="5" fill={palette.birdCheek} />

        {/* small stubby beak dropped low between the eyes */}
        <path data-bird-part="beak" d="M44 41 L56 41 L50 50 Z" fill={colours.beak} />

        {/* eyes — big dark dots each with a white catchlight while awake; closed
         * curved lids once nestled asleep (a different primitive at the eye hook,
         * so the face genuinely changes). The catchlight is the cast's biggest
         * alive-and-friendly lever, dropped while asleep. */}
        {asleep ? (
          <>
            <path
              data-bird-part="eye"
              d="M37 36 Q42 40 47 36"
              fill="none"
              stroke={palette.birdEye}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              data-bird-part="eye"
              d="M53 36 Q58 40 63 36"
              fill="none"
              stroke={palette.birdEye}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <circle data-bird-part="eye" cx="42" cy="35" r="4.5" fill={palette.birdEye} />
            <circle data-bird-part="eye" cx="58" cy="35" r="4.5" fill={palette.birdEye} />
            <circle data-bird-part="eye-shine" cx="40.4" cy="33.4" r="1.6" fill={palette.birdEyeShine} />
            <circle data-bird-part="eye-shine" cx="56.4" cy="33.4" r="1.6" fill={palette.birdEyeShine} />
          </>
        )}
      </g>
    </svg>
  );
}
