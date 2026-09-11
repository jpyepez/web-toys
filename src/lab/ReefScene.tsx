/**
 * The reef's frame view — the Puffer Fish scene at a real viewport aspect, with
 * the Fish hovering on the point the generator produced.
 *
 * WHY IT IS A THIRD FRAME VIEW RATHER THAN A MODE OF THE FIRST. The canopy frame
 * view derives its colours from the lab's own knobs, because the Nestlings
 * palette was being invented at the time. The reef's palette is already DERIVED
 * and asserted (`toys/puffer-fish/palette.ts`), and so is the Fish, so
 * re-deriving either here would mean tuning a picture the Toy does not paint — a
 * lab that composes against different colours from the ones that ship is a lab
 * that lies. This view therefore imports both verbatim, and what is left to tune
 * is the thing that is genuinely unsettled: the COMPOSITION.
 *
 * Judge it at BOTH aspects. The scene it replaced read as acceptable on a phone
 * and fell apart at 16:10 — literally, since its three layers used three
 * different `preserveAspectRatio` settings — and here the two frames differ in
 * KIND, not just in scale: a phone is ~2.3 Fish across and cannot legally hold a
 * single free-standing mass, so its ridges are absent rather than smaller.
 */

import { useMemo } from 'react';
import { buildReef, check } from '../toys/puffer-fish/reef';
import {
  FISH_MAX_PX,
  FISH_MIN_PX,
  FISH_VW,
  FishFigure,
  BODY_FRACTION,
  FISH_ASPECT,
} from '../toys/puffer-fish/FishDrawing';
import { palette } from '../toys/puffer-fish/palette';
import { ASPECTS, type Config } from './config';

/**
 * A Fish's width as a fraction of the viewport width, mirroring the shipped
 * `FISH_WIDTH` clamp exactly. The reef's whole size discipline is expressed
 * against this number, so the lab has to compute it the way the Toy does.
 */
export function fishWidthInFrame(px: { w: number; h: number }): number {
  const fishPx = Math.min(FISH_MAX_PX, Math.max(FISH_MIN_PX, px.w * FISH_VW));
  return (fishPx / px.w) * 100;
}

/** The frame in reef units: 100 wide, height following the viewport aspect. */
export function reefFrameFor(px: { w: number; h: number }) {
  return { w: 100, h: (px.h / px.w) * 100 };
}

export function ReefFrameView({ config }: { config: Config }) {
  const px = ASPECTS[config.mode.aspect];
  const frame = reefFrameFor(px);
  const fishW = fishWidthInFrame(px);
  const cfg = config.scenery.reef;

  const art = useMemo(
    () => buildReef(cfg, frame, fishW, config.seed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg, config.seed, frame.h, fishW],
  );
  const violations = useMemo(() => check(cfg, fishW), [cfg, fishW]);

  // The Fish's body centre lands on the hover point. Both numbers come out of
  // the drawing's own box rather than being measured off a screenshot, so the
  // arithmetic survives the box changing.
  const bodyDrop = fishW * FISH_ASPECT * BODY_FRACTION;

  return (
    <div className="frameView" style={{ aspectRatio: `${px.w} / ${px.h}`, background: palette.water }}>
      <svg
        viewBox={`0 0 ${frame.w} ${frame.h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        {/* Paint order IS depth order, and every adjacent pair overlaps rather
            than abutting. Water, the cropped sun, the shafts falling through it,
            the ridges, the seabed, the kelp rooted in it, what stands on it,
            then the corner reef in front of everything. */}
        <linearGradient id="lab-reef-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.waterSurface} />
          <stop offset="1" stopColor={palette.water} />
        </linearGradient>
        <rect x="0" y="0" width={frame.w} height={frame.h} fill="url(#lab-reef-water)" />

        {art.sun && <circle cx={art.sun.cx} cy={art.sun.cy} r={art.sun.r} fill={palette.sun} />}

        {art.rays.map((d, i) => (
          <path key={`ray-${i}`} d={d} fill={palette.lightRay} opacity={0.32} />
        ))}

        {art.ridges.map((r, i) => (
          <g key={`ridge-${i}`}>
            <path d={r.fill} fill={palette.ridge} />
            <path d={r.relief} fill={palette.bedShade} opacity={0.4} />
          </g>
        ))}

        <path d={art.floor.fill} fill={palette.bed} />
        <path d={art.floor.relief} fill={palette.bedShade} opacity={0.3} />

        {art.kelps.map((k, i) => (
          <g key={`kelp-${i}`}>
            {k.leaves && <path d={k.leaves} fill={palette.kelpLeaf} />}
            <path d={k.ink} fill={palette.contour} />
            <path d={k.body} fill={palette.kelpStipe} />
          </g>
        ))}

        {art.fronds.map((f, i) => (
          <g key={`frond-${i}`} fill={i % 2 === 0 ? palette.frond : palette.frondShade}>
            {f.blades.map((d, k) => (
              <path key={k} d={d} />
            ))}
          </g>
        ))}

        {art.polyps.map((p, i) => (
          <g key={`polyp-${i}`}>
            <path d={p.stem} fill={palette.frondShade} />
            {p.lobes.map((l, k) => (
              <circle key={k} cx={l.cx} cy={l.cy} r={l.r} fill={palette.polyp} />
            ))}
            <circle cx={p.heart[0]} cy={p.heart[1]} r={p.lobes[0].r * 0.5} fill={palette.polypHeart} />
          </g>
        ))}

        {art.bubbles.map((b, i) => (
          <circle key={`bubble-${i}`} cx={b.cx} cy={b.cy} r={b.r} fill={palette.paper} opacity={0.75} />
        ))}

        {art.fore && (
          <g>
            <path d={art.fore.base} fill={palette.foreReef} />
            {art.fore.blades.map((d, i) => (
              <path key={i} d={d} fill={i % 3 === 0 ? palette.foreReefShade : palette.foreReef} />
            ))}
          </g>
        )}
      </svg>

      {/*
       * ONE Fish, at rest and puffed, side by side where the frame can hold both
       * without overlapping.
       *
       * The Toy only ever shows one at a time, but the two states beside each
       * other are the only way to check the claim the drawing actually makes —
       * that "puffed" reads as bigger and rounder rather than as a different
       * animal, and that neither state grows a spike. On a phone at ~2.3 Fish
       * across the pair collides, so the narrow tab shows the rest state alone
       * and the desktop tab is where the comparison is legible.
       */}
      {config.mode.showCritter &&
        (frame.w / fishW > 2.6 ? [false, true] : [false]).map((puffed, i, shown) => {
          const x = ((i + 0.5) / shown.length) * frame.w;
          return (
            <div
              key={String(puffed)}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${((art.float[1] - bodyDrop) / frame.h) * 100}%`,
                width: `${fishW}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {/*
               * `FishFigure`, not `FishDrawing`. The shipped wrapper sizes
               * itself with the viewport clamp, which is right in the Toy and
               * wrong here — inside a frame view standing in for a 1440px
               * desktop, a clamp read against the LAB's own window renders the
               * Fish at whatever size the browser happens to be, and the one
               * thing this view exists to judge is the cast's size relative to
               * the scene. Filling the wrapper makes it exactly `fishW` of the
               * frame, which is what the generator was handed.
               */}
              <svg viewBox="0 0 100 92" width="100%" style={{ display: 'block', overflow: 'visible' }}>
                <FishFigure puffed={puffed} />
              </svg>
            </div>
          );
        })}

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
        {px.label} · {px.w}x{px.h} · fish {fishW.toFixed(0)}u · frame 100x{frame.h.toFixed(0)} ·{' '}
        {(frame.w / fishW).toFixed(1)} fish wide
        {violations.length > 0 && ` · ⚠ ${violations.map((v) => v.rule).join(', ')}`}
      </span>
    </div>
  );
}
