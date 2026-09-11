import { buildSky, type Frame } from './sky';
import { SKY, SKY_SEED } from './sky-config';
import { BalloonFigure } from './BalloonDrawing';
import { KNOT_FRACTION, BALLOON_ASPECT, VB_W } from './balloon-metrics';
import { BALLOONS, palette } from './palette';

/**
 * Up & Away's Card preview — the miniature sky the Home Card carries above its
 * title.
 *
 * IT IS THE REAL SCENE, DRAWN BY THE REAL COMPONENTS. The scene comes from
 * `buildSky` — the same generator, config and seed the live Toy runs — evaluated
 * into a Card-shaped frame, and the balloons are `BalloonFigure`, the very
 * component the Toy mounts, hanging off the anchors the generator emitted.
 * Nothing here is a miniature *of* the Toy; it is the Toy's own art at a smaller
 * size.
 *
 * WHY THAT MATTERS MORE THAN IT LOOKS. This file was a hand-drawn vignette, and
 * it had already drifted off the Toy it advertises: the Card showed one plump
 * happy balloon that had ALREADY lifted off, on a string trailing to a peg it
 * was no longer attached to, over two flat cloud ellipses — while the live scene
 * had five limp sad ones tied down and waiting to be filled. It advertised the
 * ending rather than the activity, which is the one thing a launcher Card must
 * not do. Two hand-maintained drawings of one scene cannot be kept in agreement;
 * one generator read by both cannot fall out of step, and now a lab harvest
 * updates the Card for free.
 *
 * The bunch is drawn PART-FILLED rather than limp or floating, because that is
 * what the Card is advertising: the activity, mid-hold. The fills differ per
 * balloon so the Card shows the sad→happy range in one still — which is the
 * whole mechanic, and it cannot be shown by a single balloon at any one value.
 *
 * The frame is 100x60 and a balloon is 17 units of it, so the Card composes as a
 * WIDE viewport — about six balloons across, which is roughly the desktop
 * proportion. That is deliberate: a Card is a landscape window, and at a phone's
 * 3.6 balloons the generator correctly refuses to draw a second cloud bank.
 *
 * Decorative for accessibility — the Card's title and `<Link>` carry the
 * semantic load; the SVG is `aria-hidden` so screen readers skim past it.
 */

const CARD: Frame = { w: 100, h: 60 };
/** A balloon's width in Card units — about six across, a landscape proportion. */
const CARD_BALLOON = 17;
/** Computed once at module scope: the generator is pure, so this never changes. */
const ART = buildSky(SKY, CARD, CARD_BALLOON, SKY_SEED, BALLOONS.length);

/**
 * How full each balloon in the Card's bunch is. Spread across the range so one
 * still shows the sad→happy arc the Toy is about; none of them at 1, because a
 * capped balloon has already detached and the Card would again be advertising
 * the ending.
 */
const CARD_FILLS = [0.72, 0.34, 0.9, 0.15, 0.55];

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
      {/* Paint order IS depth order, exactly as in `SkyBackdrop`: sky, the
          cropped cloud banks, the far banks, the ground line, the peg, the
          grass in front of its foot, the bunch, then the corner grass. */}
      <linearGradient id="balloons-preview-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={palette.skyHigh} />
        <stop offset="0.52" stopColor={palette.skyMid} />
        <stop offset="1" stopColor={palette.sky} />
      </linearGradient>
      <rect x="0" y="0" width={CARD.w} height={CARD.h} fill="url(#balloons-preview-sky)" />

      {ART.clouds.map((c, i) => (
        <g key={`cloud-${i}`}>
          <path d={c.fill} fill={palette.cloud} />
          <path d={c.relief} fill={palette.cloudShade} />
        </g>
      ))}

      {ART.banks.map((b, i) => (
        <g key={`bank-${i}`}>
          <path d={b.fill} fill={palette.groundFar} />
          <path d={b.relief} fill={palette.groundShade} opacity={0.4} />
        </g>
      ))}

      <path d={ART.ground.fill} fill={palette.ground} />
      <path d={ART.ground.relief} fill={palette.groundShade} opacity={0.3} />

      <path d={ART.peg.ink} fill={palette.contour} />
      <path d={ART.peg.body} fill={palette.peg} />

      {ART.tufts.map((t, i) => (
        <g key={`tuft-${i}`} fill={i % 2 === 0 ? palette.tuft : palette.tuftShade}>
          {t.blades.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </g>
      ))}

      {/* The bunch, hanging off the anchors the generator emitted and tied to
          the peg it drew — the same points the live Toy places its balloons on,
          and the same figure it draws there. Each one's box is `VB_W` wide with
          its knot at `KNOT_FRACTION` of its height, so the placement is derived
          rather than nudged into looking right. */}
      {BALLOONS.map((color, i) => {
        const [ax, ay] = ART.anchors[i] ?? ART.tether;
        const unit = VB_W / CARD_BALLOON;
        return (
          <g
            key={color}
            transform={`translate(${ax - CARD_BALLOON / 2} ${ay - CARD_BALLOON * BALLOON_ASPECT * KNOT_FRACTION}) scale(${CARD_BALLOON / VB_W})`}
          >
            <BalloonFigure
              fill={CARD_FILLS[i % CARD_FILLS.length]}
              color={color}
              tail={{ dx: (ART.tether[0] - ax) * unit, dy: (ART.tether[1] - ay) * unit }}
            />
          </g>
        );
      })}

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
