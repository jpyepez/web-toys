import { buildBarnyard, type Frame } from './barnyard';
import { BARNYARD, BARNYARD_SEED } from './barnyard-config';
import { PigletFigure, MUD_BLOBS } from './PigletDrawing';
import { CRITTER_ASPECT, FOOT_FRACTION } from './critter-metrics';
import { palette } from './palette';

/**
 * Muddy Puddle's Card preview — the miniature barnyard the Home Card carries
 * above its title.
 *
 * IT IS THE REAL SCENE, DRAWN BY THE REAL COMPONENTS. The yard comes from
 * `buildBarnyard` — the same generator, config and seed the live Toy runs —
 * evaluated into a Card-shaped frame, and the piglet is `PigletFigure`, the very
 * component the Toy mounts. Nothing here is a miniature *of* the Toy; it is the
 * Toy's own art at a smaller size.
 *
 * WHY THAT MATTERS MORE THAN IT LOOKS. This file was a hand-drawn vignette, and
 * it had already drifted off the Toy it advertises: the Card showed a gable barn
 * with a fence beside it and a tidy oval pool, none of which the live scene had
 * any longer, plus a piglet built from plain `<circle>`s — the exact clip-art
 * construction the cast was rebuilt away from, sitting on the Card that
 * advertises the rebuild. Two hand-maintained drawings of one scene cannot be
 * kept in agreement. One generator read by both cannot fall out of step, and now
 * a lab harvest updates the Card for free.
 *
 * IT SHOWS THE ACTIVITY, NOT JUST THE PLACE. The piglet is rendered MID-WIPE —
 * most of its mud still on, a diagonal band of it cleared — so the Card reads
 * "wipe me clean" at a glance rather than "here is a farm". That is what
 * distinguishes this Card from the two tap Toys on the same Home screen, and it
 * costs nothing but a filter on the blob indices, because the drawing already
 * takes exactly that as a prop.
 *
 * The frame is 100x60 and a Critter is 22 units of it, so the Card composes as a
 * WIDE viewport — about four and a half Critters across, roughly the desktop
 * proportion. That is deliberate: at a phone's 2.0 Critters the generator
 * correctly refuses to draw any far bank at all, and a Card is a landscape
 * window.
 *
 * Decorative for accessibility — the Card's title and `<Link>` carry the
 * semantic load; the SVG is `aria-hidden` so screen readers skim past it.
 */

const CARD: Frame = { w: 100, h: 60 };
/** A Critter's width in Card units — a landscape proportion. */
const CARD_CRITTER = 22;
/** Computed once at module scope: the generator is pure, so this never changes. */
const ART = buildBarnyard(BARNYARD, CARD, CARD_CRITTER, BARNYARD_SEED);

/**
 * The mud still caked on in the preview: everything outside a diagonal band
 * swept from the lower left to the upper right. Derived from the blob
 * coordinates rather than hand-listed, so it stays a believable wipe stroke if
 * the blanket is ever re-authored.
 */
const WIPED_BAND = MUD_BLOBS.map((_, i) => i).filter((i) => {
  const b = MUD_BLOBS[i];
  return Math.abs(b.cx - b.cy - 6) > 17;
});

export function Preview() {
  return (
    <svg
      viewBox={`0 0 ${CARD.w} ${CARD.h}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Paint order IS depth order, exactly as in `BarnyardBackdrop`: sky, the
          cropped barn, the far banks, the trotting line, the fence and straw
          standing on it, the pool, the Critter, then the corner clay in front. */}
      <linearGradient id="muddy-puddle-preview-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={palette.skyHigh} />
        <stop offset="1" stopColor={palette.sky} />
      </linearGradient>
      <rect x="0" y="0" width={CARD.w} height={CARD.h} fill="url(#muddy-puddle-preview-sky)" />

      {ART.barn && (
        <g>
          <path d={ART.barn.ink} fill={palette.contour} />
          <path d={ART.barn.wall} fill={palette.barn} />
          {/* The eave's own shadow, following the roofline it falls from. */}
          <path d={ART.barn.shade} fill={palette.barnShade} opacity={0.45} />
          {/* Board seams — the evidence a hand drew the wall rather than filled
              a rectangle. Held well under the cast's contour weight. */}
          <g fill={palette.barnShade} opacity={0.55}>
            {ART.barn.boards.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <path d={ART.barn.roof} fill={palette.barnRoof} />
        </g>
      )}

      {ART.banks.map((b, i) => (
        <g key={`bank-${i}`}>
          <path d={b.fill} fill={palette.fieldFar} />
          <path d={b.relief} fill={palette.fieldShade} opacity={0.4} />
        </g>
      ))}

      <path d={ART.ground.fill} fill={palette.field} />
      <path d={ART.ground.relief} fill={palette.fieldShade} opacity={0.3} />

      {ART.fence && (
        <g>
          {ART.fence.railInk.map((d, i) => (
            <path key={`rail-ink-${i}`} d={d} fill={palette.contour} />
          ))}
          {ART.fence.rails.map((d, i) => (
            <path key={`rail-${i}`} d={d} fill={i === 0 ? palette.fence : palette.fenceShade} />
          ))}
          {ART.fence.ink.map((d, i) => (
            <path key={`ink-${i}`} d={d} fill={palette.contour} />
          ))}
          {ART.fence.posts.map((d, i) => (
            <path key={`post-${i}`} d={d} fill={i % 3 === 0 ? palette.fenceShade : palette.fence} />
          ))}
        </g>
      )}

      {ART.straw.map((t, i) => (
        <g key={`straw-${i}`} fill={i % 2 === 0 ? palette.straw : palette.strawShade}>
          {t.blades.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </g>
      ))}

      {ART.puddle && (
        <g>
          <path d={ART.puddle.fill} fill={palette.puddle} />
          <path d={ART.puddle.rim} fill={palette.puddleShade} opacity={0.45} />
          <path d={ART.puddle.sheen} fill={palette.puddleSheen} opacity={0.75} />
          {ART.puddle.ripples.map((d, i) => (
            <path key={i} d={d} fill={palette.puddleShade} opacity={0.5} />
          ))}
        </g>
      )}

      {/* The piglet, standing on the line the generator emitted — the same
          `stand` point the live Toy anchors its feet to, and the same figure it
          draws there. Its own box is 100 wide with the feet at `FOOT_FRACTION`
          of its height, so the placement is derived rather than nudged into
          looking right. Mid-wipe, so the Card advertises the activity. */}
      <g
        transform={`translate(${ART.stand[0] - CARD_CRITTER / 2} ${ART.stand[1] - CARD_CRITTER * CRITTER_ASPECT * FOOT_FRACTION}) scale(${CARD_CRITTER / 100})`}
      >
        <PigletFigure remainingBlobIndices={WIPED_BAND} />
      </g>

      {/* the wiped streak's glint — the same `sparkle` the clean-snap fires,
          sitting on the freshly cleared band so the Card says a wipe just
          happened rather than that a pig is dirty */}
      <path
        d={`M ${ART.stand[0] + 3} ${ART.stand[1] - 14} l 1.1 2.6 l 2.6 1.1 l -2.6 1.1 l -1.1 2.6 l -1.1 -2.6 l -2.6 -1.1 l 2.6 -1.1 Z`}
        fill={palette.sparkle}
      />

      {ART.fore && (
        <g>
          <path d={ART.fore.base} fill={palette.foreClay} />
          {ART.fore.clods.map((c, i) => (
            <circle
              key={i}
              cx={c.cx}
              cy={c.cy}
              r={c.r}
              fill={i % 3 === 0 ? palette.foreClayShade : palette.foreClay}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
