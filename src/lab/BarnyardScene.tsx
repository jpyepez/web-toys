/**
 * The barnyard's frame view — the Muddy Puddle scene at a real viewport aspect,
 * with the cast standing on the trotting line the generator produced.
 *
 * Like the meadow's view, this imports the Toy's palette and drawings VERBATIM
 * rather than re-deriving either from the lab's own knobs. Both are already
 * derived and asserted, so re-deriving them here would mean tuning a picture the
 * Toy does not paint — a lab that composes against different colours from the
 * ones that ship is a lab that lies. What is left to tune is the thing that is
 * genuinely unsettled: the COMPOSITION.
 *
 * Judge it at BOTH aspects. The two frames differ in KIND here, not just in
 * scale: a phone is ~2.0 Critters across and cannot legally hold a single
 * free-standing mass, so its banks are absent rather than smaller, and the barn
 * and the pool are cropped far harder.
 *
 * THE SPLASH MARKER IS NOT DECORATION. The generator emits the point the last
 * Critter of a play lands on, and it is drawn here because it is the one thing
 * in this scene that can be wrong in a way no still frame shows: a pool that
 * looks fine can still have its splash point on the bank. If the marker is not
 * in the water at both aspects, the Toy's final beat is broken.
 */

import { useMemo } from 'react';
import { buildBarnyard, check } from '../toys/muddy-puddle/barnyard';
import {
  CRITTER_ASPECT,
  CRITTER_MAX_PX,
  CRITTER_MIN_PX,
  CRITTER_VW,
  FOOT_FRACTION,
} from '../toys/muddy-puddle/critter-metrics';
import { CRITTERS, palette } from '../toys/muddy-puddle/palette';
import { PigletDrawing } from '../toys/muddy-puddle/PigletDrawing';
import { DucklingDrawing } from '../toys/muddy-puddle/DucklingDrawing';
import { LambDrawing } from '../toys/muddy-puddle/LambDrawing';
import { ChickDrawing } from '../toys/muddy-puddle/ChickDrawing';
import { CalfDrawing } from '../toys/muddy-puddle/CalfDrawing';
import { ASPECTS, type Config } from './config';

const DRAWINGS = {
  piglet: PigletDrawing,
  duckling: DucklingDrawing,
  lamb: LambDrawing,
  chick: ChickDrawing,
  calf: CalfDrawing,
} as const;

/**
 * A Critter's width as a fraction of the viewport width, mirroring the shipped
 * `CRITTER_WIDTH` clamp exactly. The barnyard's whole size discipline is
 * expressed against this number, so the lab has to compute it the way the Toy
 * does.
 */
export function critterWidthInFrame(px: { w: number; h: number }): number {
  const critterPx = Math.min(CRITTER_MAX_PX, Math.max(CRITTER_MIN_PX, px.w * CRITTER_VW));
  return (critterPx / px.w) * 100;
}

/** The frame in barnyard units: 100 wide, height following the viewport aspect. */
export function barnyardFrameFor(px: { w: number; h: number }) {
  return { w: 100, h: (px.h / px.w) * 100 };
}

export function BarnyardFrameView({ config }: { config: Config }) {
  const px = ASPECTS[config.mode.aspect];
  const frame = barnyardFrameFor(px);
  const critterW = critterWidthInFrame(px);
  const cfg = config.scenery.barnyard;

  const art = useMemo(
    () => buildBarnyard(cfg, frame, critterW, config.seed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg, config.seed, frame.h, critterW],
  );
  const violations = useMemo(() => check(cfg, critterW), [cfg, critterW]);

  // A Critter's feet land on the trotting line. Both numbers come out of the
  // drawing's own box rather than being measured off a screenshot, so the
  // arithmetic survives the box changing.
  const footDrop = critterW * CRITTER_ASPECT * FOOT_FRACTION;

  return (
    <div className="frameView" style={{ aspectRatio: `${px.w} / ${px.h}`, background: palette.sky }}>
      <svg
        viewBox={`0 0 ${frame.w} ${frame.h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        {/* Paint order IS depth order, and every adjacent pair overlaps rather
            than abutting. Sky, the cropped barn, the banks, the trotting line,
            what stands on it, the pool, then the corner clay in front. */}
        <linearGradient id="lab-barnyard-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.skyHigh} />
          <stop offset="1" stopColor={palette.sky} />
        </linearGradient>
        <rect x="0" y="0" width={frame.w} height={frame.h} fill="url(#lab-barnyard-sky)" />

        {art.barn && (
          <g>
            <path d={art.barn.ink} fill={palette.contour} />
            <path d={art.barn.wall} fill={palette.barn} />
            {/* The eave's own shadow, following the roofline it falls from. */}
            <path d={art.barn.shade} fill={palette.barnShade} opacity={0.45} />
            {/* Board seams — the evidence a hand drew the wall rather than
                filled a rectangle. Held well under the cast's contour weight. */}
            <g fill={palette.barnShade} opacity={0.55}>
              {art.barn.boards.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <path d={art.barn.roof} fill={palette.barnRoof} />
          </g>
        )}

        {art.banks.map((b, i) => (
          <g key={`bank-${i}`}>
            <path d={b.fill} fill={palette.fieldFar} />
            <path d={b.relief} fill={palette.fieldShade} opacity={0.4} />
          </g>
        ))}

        <path d={art.ground.fill} fill={palette.field} />
        <path d={art.ground.relief} fill={palette.fieldShade} opacity={0.3} />

        {art.fence && (
          <g>
            {art.fence.railInk.map((d, i) => (
              <path key={`rail-ink-${i}`} d={d} fill={palette.contour} />
            ))}
            {art.fence.rails.map((d, i) => (
              <path key={`rail-${i}`} d={d} fill={i === 0 ? palette.fence : palette.fenceShade} />
            ))}
            {art.fence.ink.map((d, i) => (
              <path key={`ink-${i}`} d={d} fill={palette.contour} />
            ))}
            {art.fence.posts.map((d, i) => (
              <path key={`post-${i}`} d={d} fill={i % 3 === 0 ? palette.fenceShade : palette.fence} />
            ))}
          </g>
        )}

        {art.straw.map((t, i) => (
          <g key={`straw-${i}`} fill={i % 2 === 0 ? palette.straw : palette.strawShade}>
            {t.blades.map((d, k) => (
              <path key={k} d={d} />
            ))}
          </g>
        ))}

        {art.puddle && (
          <g>
            <path d={art.puddle.fill} fill={palette.puddle} />
            <path d={art.puddle.rim} fill={palette.puddleShade} opacity={0.45} />
            <path d={art.puddle.sheen} fill={palette.puddleSheen} opacity={0.75} />
            {art.puddle.ripples.map((d, i) => (
              <path key={i} d={d} fill={palette.puddleShade} opacity={0.5} />
            ))}
          </g>
        )}

        {art.motes.map((m, i) => (
          <circle key={`mote-${i}`} cx={m.cx} cy={m.cy} r={m.r} fill={palette.paper} opacity={0.75} />
        ))}

        {art.fore && (
          <g>
            <path d={art.fore.base} fill={palette.foreClay} />
            {art.fore.clods.map((c, i) => (
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

        {/* The emitted splash point. If this marker is not inside the pool at
            BOTH aspects, the last Critter of a play belly-flops onto grass —
            which is exactly what the hardcoded `y: 90` nudge did at 16:10, and
            which no amount of looking at a still of the scene reveals. */}
        <circle
          cx={art.splash[0]}
          cy={art.splash[1]}
          r={Math.max(0.6, critterW * 0.03)}
          fill={palette.contour}
          opacity={0.55}
        />
      </svg>

      {/*
       * As much of the cast as the frame can hold WITHOUT overlapping.
       *
       * The Toy only ever shows one Critter at a time, but five side by side is
       * the only way to check the two claims the cast actually makes — that five
       * hues at one shared lightness read as one family, and that five species
       * stay distinguishable by SILHOUETTE once colour is taken away. A phone is
       * only ~2.0 Critters across, so five of them there pile into one another;
       * the desktop tab is where that comparison is legible.
       */}
      {config.mode.showCritter &&
        CRITTERS.slice(0, Math.max(1, Math.min(CRITTERS.length, Math.floor(frame.w / critterW / 1.15)))).map(
          (name, i, shown) => {
            const Drawing = DRAWINGS[name];
            const x = ((i + 0.5) / shown.length) * frame.w;
            const y = art.walk.reduce((best, p) =>
              Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best,
            )[1];
            return (
              <div
                key={name}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${((y - footDrop) / frame.h) * 100}%`,
                  width: `${critterW}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {/* CLEAN, not muddy. The mud is the Toy's mechanic, and under it
                    every animal is the same brown mass — so the muddy state is
                    the one view in which the cast's colours and silhouettes
                    cannot be judged at all. */}
                <Drawing cleaned />
              </div>
            );
          },
        )}

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
        {px.label} · {px.w}x{px.h} · critter {critterW.toFixed(0)}u · frame 100x{frame.h.toFixed(0)} ·{' '}
        {(frame.w / critterW).toFixed(1)} critters wide
        {violations.length > 0 && ` · ⚠ ${violations.map((v) => v.rule).join(', ')}`}
      </span>
    </div>
  );
}
