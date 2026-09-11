import { buildReef, type Frame } from './reef';
import { REEF, REEF_SEED } from './reef-config';
import { FishFigure, FISH_ASPECT, BODY_FRACTION } from './FishDrawing';
import { palette } from './palette';

/**
 * Puffer Fish's Card preview — the miniature reef the Home Card carries above
 * its title.
 *
 * IT IS THE REAL SCENE, DRAWN BY THE REAL COMPONENTS. The scene comes from
 * `buildReef` — the same generator, config and seed the live Toy runs —
 * evaluated into a Card-shaped frame, and the Fish is `FishFigure`, the very
 * component the Toy mounts. Nothing here is a miniature *of* the Toy; it is the
 * Toy's own art at a smaller size.
 *
 * WHY THAT MATTERS MORE THAN IT LOOKS. This file used to carry a hand-drawn
 * `MiniFish` built from four `<ellipse>`s and a `stroke`d smile, plus its own
 * hand-placed sand curve and its own single coral clump — a second drawing of a
 * scene that already existed, kept in agreement with the first by nobody. Two
 * hand-maintained drawings of one scene cannot be kept in step, which is the
 * same reason the Fish once hovered at a percentage the seabed knew nothing
 * about. One generator read by both cannot fall out of step, and now a lab
 * harvest updates the Card for free.
 *
 * The frame is 100x60 and a Fish is 20 units of it, so the Card composes as a
 * WIDE viewport — about five Fish across, which is roughly the desktop
 * proportion. That is deliberate: at a phone's 2.3 Fish the generator correctly
 * refuses to draw any far ridge at all, and a Card is a landscape window.
 *
 * Decorative for accessibility — the Card's title and `<Link>` carry the
 * semantic load; the SVG is `aria-hidden` so screen readers skim past it.
 */

const CARD: Frame = { w: 100, h: 60 };
/**
 * A Fish's width in Card units — just under four Fish across, a landscape
 * proportion. Wider than the Sheep Card's five because this Critter fills less
 * of its own box: the puffer's body is ~56 units of a 100-wide drawing with the
 * rest given to the tail's reach, so at the Sheep's number it came out visibly
 * smaller on the shelf than the Toy beside it. Fewer Fish across also means the
 * generator gives the Card fewer, larger elements, which is calmer.
 */
const CARD_FISH = 26;
/** Computed once at module scope: the generator is pure, so this never changes. */
const ART = buildReef(REEF, CARD, CARD_FISH, REEF_SEED);

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
      {/* Paint order IS depth order, exactly as in `UnderwaterBackdrop`: water,
          the cropped sun, the shafts, the far ridges, the seabed, the kelp
          rooted in it, what stands on it, the Fish, then the corner reef in
          front. */}
      <linearGradient id="puffer-fish-preview-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={palette.waterSurface} />
        <stop offset="1" stopColor={palette.water} />
      </linearGradient>
      <rect x="0" y="0" width={CARD.w} height={CARD.h} fill="url(#puffer-fish-preview-water)" />

      {ART.sun && <circle cx={ART.sun.cx} cy={ART.sun.cy} r={ART.sun.r} fill={palette.sun} />}

      {ART.rays.map((d, i) => (
        <path key={`ray-${i}`} d={d} fill={palette.lightRay} opacity={0.32} />
      ))}

      {ART.ridges.map((r, i) => (
        <g key={`ridge-${i}`}>
          <path d={r.fill} fill={palette.ridge} />
          <path d={r.relief} fill={palette.bedShade} opacity={0.4} />
        </g>
      ))}

      <path d={ART.floor.fill} fill={palette.bed} />
      <path d={ART.floor.relief} fill={palette.bedShade} opacity={0.3} />

      {ART.kelps.map((k, i) => (
        <g key={`kelp-${i}`}>
          {k.leaves && <path d={k.leaves} fill={palette.kelpLeaf} />}
          <path d={k.ink} fill={palette.contour} />
          <path d={k.body} fill={palette.kelpStipe} />
        </g>
      ))}

      {ART.fronds.map((f, i) => (
        <g key={`frond-${i}`} fill={i % 2 === 0 ? palette.frond : palette.frondShade}>
          {f.blades.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </g>
      ))}

      {ART.polyps.map((p, i) => (
        <g key={`polyp-${i}`}>
          <path d={p.stem} fill={palette.frondShade} />
          {p.lobes.map((l, k) => (
            <circle key={k} cx={l.cx} cy={l.cy} r={l.r} fill={palette.polyp} />
          ))}
          <circle cx={p.heart[0]} cy={p.heart[1]} r={p.lobes[0].r * 0.5} fill={palette.polypHeart} />
        </g>
      ))}

      {ART.bubbles.map((b, i) => (
        <circle key={`bubble-${i}`} cx={b.cx} cy={b.cy} r={b.r} fill={palette.paper} opacity={0.75} />
      ))}

      {/* The Fish, hovering on the point the generator emitted — the same
          `float` point the live Toy anchors to, and the same figure it draws
          there. Its own box is 100 wide with the body's centre at
          `BODY_FRACTION` of its height, so the placement is derived rather than
          nudged into looking right. */}
      <g
        transform={`translate(${ART.float[0] - CARD_FISH / 2} ${ART.float[1] - CARD_FISH * FISH_ASPECT * BODY_FRACTION}) scale(${CARD_FISH / 100})`}
      >
        <FishFigure />
      </g>

      {ART.fore && (
        <g>
          <path d={ART.fore.base} fill={palette.foreReef} />
          {ART.fore.blades.map((d, i) => (
            <path key={i} d={d} fill={i % 3 === 0 ? palette.foreReefShade : palette.foreReef} />
          ))}
        </g>
      )}
    </svg>
  );
}
