import { buildMeadow, type Frame } from './meadow';
import { MEADOW, MEADOW_SEED } from './meadow-config';
import { SheepFigure, SHEEP_ASPECT, FOOT_FRACTION } from './SheepDrawing';
import { palette } from './palette';

/**
 * Counting Sheep's Card preview — the miniature meadow the Home Card carries
 * above its title.
 *
 * IT IS THE REAL SCENE, DRAWN BY THE REAL COMPONENTS. The scene comes from
 * `buildMeadow` — the same generator, config and seed the live Toy runs —
 * evaluated into a Card-shaped frame, and the Sheep is `SheepFigure`, the very
 * component the Toy mounts. Nothing here is a miniature *of* the Toy; it is the
 * Toy's own art at a smaller size.
 *
 * WHY THAT MATTERS MORE THAN IT LOOKS. This file was a hand-drawn vignette, and
 * within a single afternoon of tuning it had drifted off the Toy it advertises:
 * the Card showed a fat plank of a bough with three lumpy leaf blobs and a sun
 * floating clear of every edge, while the live scene had a thin tapered limb
 * with a fine fringe and a sun cropped hard into the corner. Two hand-maintained
 * drawings of one scene cannot be kept in agreement — the same reason the Sheep
 * once floated above a hill it was positioned beside rather than on. One
 * generator read by both cannot fall out of step, and now a lab harvest updates
 * the Card for free.
 *
 * The frame is 100x60 and a Sheep is 20 units of it, so the Card composes as a
 * WIDE viewport — about five Sheep across, which is roughly the desktop
 * proportion. That is deliberate: at a phone's 2.2 Sheep the generator correctly
 * refuses to draw any far bank at all, and a Card is a landscape window.
 *
 * Decorative for accessibility — the Card's title and `<Link>` carry the
 * semantic load; the SVG is `aria-hidden` so screen readers skim past it.
 */

const CARD: Frame = { w: 100, h: 60 };
/** A Sheep's width in Card units — five Sheep across, a landscape proportion. */
const CARD_SHEEP = 20;
/** Computed once at module scope: the generator is pure, so this never changes. */
const ART = buildMeadow(MEADOW, CARD, CARD_SHEEP, MEADOW_SEED);

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
      {/* Paint order IS depth order, exactly as in `MeadowBackdrop`: sky, the
          cropped sun, the bough that crops it, the far banks, the walking line,
          what stands on it, the Sheep, then the corner grass in front. */}
      <linearGradient id="counting-sheep-preview-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={palette.skyHigh} />
        <stop offset="1" stopColor={palette.sky} />
      </linearGradient>
      <rect x="0" y="0" width={CARD.w} height={CARD.h} fill="url(#counting-sheep-preview-sky)" />

      {ART.sun && <circle cx={ART.sun.cx} cy={ART.sun.cy} r={ART.sun.r} fill={palette.sun} />}

      {ART.bough && (
        <g>
          {ART.bough.leaves && <path d={ART.bough.leaves} fill={palette.boughLeaf} />}
          <path d={ART.bough.ink} fill={palette.contour} />
          <path d={ART.bough.body} fill={palette.bough} />
        </g>
      )}

      {ART.banks.map((b, i) => (
        <g key={`bank-${i}`}>
          <path d={b.fill} fill={palette.bankFar} />
          <path d={b.relief} fill={palette.bankShade} opacity={0.4} />
        </g>
      ))}

      <path d={ART.ground.fill} fill={palette.bankNear} />
      <path d={ART.ground.relief} fill={palette.bankShade} opacity={0.3} />

      {ART.tufts.map((t, i) => (
        <g key={`tuft-${i}`} fill={i % 2 === 0 ? palette.tuft : palette.tuftShade}>
          {t.blades.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </g>
      ))}

      {ART.flowers.map((f, i) => (
        <g key={`flower-${i}`}>
          <path d={f.stem} fill={palette.tuftShade} />
          {f.lobes.map((l, k) => (
            <circle key={k} cx={l.cx} cy={l.cy} r={l.r} fill={palette.flower} />
          ))}
          <circle cx={f.heart[0]} cy={f.heart[1]} r={f.lobes[0].r * 0.5} fill={palette.flowerHeart} />
        </g>
      ))}

      {/* The Sheep, standing on the line the generator emitted — the same
          `stand` point the live Toy anchors its hooves to, and the same figure
          it draws there. Its own box is 100 wide with the hooves at
          `FOOT_FRACTION` of its height, so the placement is derived rather than
          nudged into looking right. */}
      <g
        transform={`translate(${ART.stand[0] - CARD_SHEEP / 2} ${ART.stand[1] - CARD_SHEEP * SHEEP_ASPECT * FOOT_FRACTION}) scale(${CARD_SHEEP / 100})`}
      >
        <SheepFigure fleece="terracotta" />
      </g>

      {ART.fore && (
        <g>
          <path d={ART.fore.base} fill={palette.foreGrass} />
          {ART.fore.blades.map((d, i) => (
            <path key={i} d={d} fill={i % 3 === 0 ? palette.foreGrassShade : palette.foreGrass} />
          ))}
        </g>
      )}
    </svg>
  );
}
