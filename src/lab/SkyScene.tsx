/**
 * The sky's frame view — the Up & Away scene at a real viewport aspect, with the
 * bunch hanging off the peg the generator produced.
 *
 * Like the meadow's and the barnyard's, this imports the Toy's palette and
 * drawing VERBATIM rather than re-deriving either from the lab's own knobs. Both
 * are already derived and asserted, so re-deriving them here would mean tuning a
 * picture the Toy does not paint — a lab that composes against different colours
 * from the ones that ship is a lab that lies. What is left to tune is the thing
 * that is genuinely unsettled: the COMPOSITION.
 *
 * Judge it at BOTH aspects. The two frames differ in KIND here, not just in
 * scale: a phone is ~3.6 balloons across and gets one cloud bank and no far
 * banks at all, while a wide frame gets a bank in each top corner with sky
 * between them.
 *
 * THE BUNCH IS NOT DECORATION IN THIS VIEW. The generator emits the knot each
 * balloon hangs from and the tether every string ties to, and they are drawn
 * here because they are the one thing in this scene that can be wrong in a way
 * no empty backdrop shows: a sky that looks fine can still have its bunch
 * floating beside a peg rather than tied to it. If the strings do not converge
 * on the stake at both aspects, the Toy's whole premise is broken.
 */

import { useMemo } from 'react';
import { buildSky, check } from '../toys/balloons/sky';
import {
  BALLOON_ASPECT,
  KNOT_FRACTION,
  VB_W,
  balloonWidthInFrame,
} from '../toys/balloons/balloon-metrics';
import { BalloonFigure } from '../toys/balloons/BalloonDrawing';
import { BALLOONS, palette } from '../toys/balloons/palette';
import { ASPECTS, type Config } from './config';

/** The frame in sky units: 100 wide, height following the viewport aspect. */
export function skyFrameFor(px: { w: number; h: number }) {
  return { w: 100, h: (px.h / px.w) * 100 };
}

/**
 * How full each balloon is drawn. Spread across the range so one still shows the
 * sad→happy arc — which is the mechanic, and the thing a composition pass has to
 * judge against, because a bunch of limp balloons and a bunch of plump ones are
 * different pictures at different sizes.
 */
const FILLS = [0.72, 0.34, 0.9, 0.15, 0.55];

export function SkyFrameView({ config }: { config: Config }) {
  const px = ASPECTS[config.mode.aspect];
  const frame = skyFrameFor(px);
  const balloonW = balloonWidthInFrame(px);
  const cfg = config.scenery.sky;

  const art = useMemo(
    () => buildSky(cfg, frame, balloonW, config.seed, BALLOONS.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg, config.seed, frame.h, balloonW],
  );
  const violations = useMemo(() => check(cfg, balloonW), [cfg, balloonW]);

  return (
    <div className="frameView" style={{ aspectRatio: `${px.w} / ${px.h}`, background: palette.sky }}>
      <svg
        viewBox={`0 0 ${frame.w} ${frame.h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        {/* Paint order IS depth order, and every adjacent pair overlaps rather
            than abutting. Sky, the cropped cloud banks, the far banks, the
            ground line, the peg driven into it, the grass in front of its foot,
            the bunch, then the corner grass. */}
        <linearGradient id="lab-balloons-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.skyHigh} />
          <stop offset="0.52" stopColor={palette.skyMid} />
          <stop offset="1" stopColor={palette.sky} />
        </linearGradient>
        <rect x="0" y="0" width={frame.w} height={frame.h} fill="url(#lab-balloons-sky)" />

        {art.clouds.map((c, i) => (
          <g key={`cloud-${i}`}>
            <path d={c.fill} fill={palette.cloud} />
            <path d={c.relief} fill={palette.cloudShade} />
          </g>
        ))}

        {art.banks.map((b, i) => (
          <g key={`bank-${i}`}>
            <path d={b.fill} fill={palette.groundFar} />
            <path d={b.relief} fill={palette.groundShade} opacity={0.4} />
          </g>
        ))}

        <path d={art.ground.fill} fill={palette.ground} />
        <path d={art.ground.relief} fill={palette.groundShade} opacity={0.3} />

        <path d={art.peg.ink} fill={palette.contour} />
        <path d={art.peg.body} fill={palette.peg} />

        {art.tufts.map((t, i) => (
          <g key={`tuft-${i}`} fill={i % 2 === 0 ? palette.tuft : palette.tuftShade}>
            {t.blades.map((d, k) => (
              <path key={k} d={d} />
            ))}
          </g>
        ))}

        {art.motes.map((m, i) => (
          <circle key={`mote-${i}`} cx={m.cx} cy={m.cy} r={m.r} fill={palette.paper} opacity={0.75} />
        ))}

        {/* The bunch, on the anchors the generator emitted, drawn with the Toy's
            own figure. Rendered inside the same viewBox as the scene rather than
            floated over it in CSS, which is what lets the strings be checked
            against the stake at a glance. */}
        {config.mode.showCritter &&
          BALLOONS.map((color, i) => {
            const [ax, ay] = art.anchors[i] ?? art.tether;
            const unit = VB_W / balloonW;
            return (
              <g
                key={color}
                transform={`translate(${ax - balloonW / 2} ${ay - balloonW * BALLOON_ASPECT * KNOT_FRACTION}) scale(${balloonW / VB_W})`}
              >
                <BalloonFigure
                  fill={FILLS[i % FILLS.length]}
                  color={color}
                  tail={{ dx: (art.tether[0] - ax) * unit, dy: (art.tether[1] - ay) * unit }}
                />
              </g>
            );
          })}

        {art.fore && (
          <g>
            <path d={art.fore.base} fill={palette.foreGrass} />
            {art.fore.blades.map((d, i) => (
              <path key={i} d={d} fill={i % 3 === 0 ? palette.foreGrassShade : palette.foreGrass} />
            ))}
          </g>
        )}
      </svg>

      {/* The squint test, as a switch rather than as an intention: collapse the
          frame to two values and see whether the background still competes with
          the cast. It is the only check that catches an AREA failure, which no
          per-colour rule can. */}
      {config.mode.silhouetteTest && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'grayscale(1) blur(3px) contrast(1.4)',
            pointerEvents: 'none',
          }}
        />
      )}

      <span className="frameTag">
        {px.label} · {px.w}x{px.h} · balloon {balloonW.toFixed(0)}u · frame 100x{frame.h.toFixed(0)} ·{' '}
        {(frame.w / balloonW).toFixed(1)} balloons wide
        {violations.length > 0 && ` · ⚠ ${violations.map((v) => v.rule).join(', ')}`}
      </span>
    </div>
  );
}
