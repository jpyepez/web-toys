/**
 * The meadow's frame view — the Counting Sheep scene at a real viewport aspect,
 * with the Sheep standing on the walking line the generator produced.
 *
 * WHY IT IS A SECOND FRAME VIEW RATHER THAN A MODE OF THE FIRST. The canopy
 * frame view derives its colours from the lab's own knobs, because the Nestlings
 * palette was being invented at the time. The meadow's palette is already
 * DERIVED and asserted (`toys/counting-sheep/palette.ts`), and so is the Sheep,
 * so re-deriving either here would mean tuning a picture the Toy does not paint
 * — a lab that composes against different colours from the ones that ship is a
 * lab that lies. This view therefore imports both verbatim, and what is left to
 * tune is the thing that is genuinely unsettled: the COMPOSITION.
 *
 * Judge it at BOTH aspects. The scene it replaced read as acceptable on a phone
 * and fell apart at 16:10, which is exactly what a single-aspect preview hides —
 * and here the two frames differ in KIND, not just in scale: a phone is ~2.2
 * Sheep across and cannot legally hold a single free-standing mass, so its banks
 * are absent rather than smaller.
 */

import { useMemo } from 'react';
import { buildMeadow, check } from '../toys/counting-sheep/meadow';
import {
  SHEEP_MAX_PX,
  SHEEP_MIN_PX,
  SHEEP_VW,
  SheepDrawing,
  FOOT_FRACTION,
  SHEEP_ASPECT,
} from '../toys/counting-sheep/SheepDrawing';
import { FLEECES, palette } from '../toys/counting-sheep/palette';
import { ASPECTS, type Config } from './config';

/**
 * A Sheep's width as a fraction of the viewport width, mirroring the shipped
 * `SHEEP_WIDTH` clamp exactly. The meadow's whole size discipline is expressed
 * against this number, so the lab has to compute it the way the Toy does.
 */
export function sheepWidthInFrame(px: { w: number; h: number }): number {
  const sheepPx = Math.min(SHEEP_MAX_PX, Math.max(SHEEP_MIN_PX, px.w * SHEEP_VW));
  return (sheepPx / px.w) * 100;
}

/** The frame in meadow units: 100 wide, height following the viewport aspect. */
export function meadowFrameFor(px: { w: number; h: number }) {
  return { w: 100, h: (px.h / px.w) * 100 };
}

export function MeadowFrameView({ config }: { config: Config }) {
  const px = ASPECTS[config.mode.aspect];
  const frame = meadowFrameFor(px);
  const sheepW = sheepWidthInFrame(px);
  const cfg = config.scenery.meadow;

  const art = useMemo(
    () => buildMeadow(cfg, frame, sheepW, config.seed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg, config.seed, frame.h, sheepW],
  );
  const violations = useMemo(() => check(cfg, sheepW), [cfg, sheepW]);

  // The Sheep's feet land on the walking line. Both numbers come out of the
  // drawing's own box rather than being measured off a screenshot, so the
  // arithmetic survives the box changing.
  const footDrop = sheepW * SHEEP_ASPECT * FOOT_FRACTION;

  return (
    <div className="frameView" style={{ aspectRatio: `${px.w} / ${px.h}`, background: palette.sky }}>
      <svg
        viewBox={`0 0 ${frame.w} ${frame.h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        {/* Paint order IS depth order, and every adjacent pair overlaps rather
            than abutting. Sky, the cropped sun, the bough that crops it, the
            banks, the walking line, what stands on it, then the corner grass in
            front of everything. */}
        <linearGradient id="lab-meadow-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.skyHigh} />
          <stop offset="1" stopColor={palette.sky} />
        </linearGradient>
        <rect x="0" y="0" width={frame.w} height={frame.h} fill="url(#lab-meadow-sky)" />

        {art.sun && <circle cx={art.sun.cx} cy={art.sun.cy} r={art.sun.r} fill={palette.sun} />}

        {art.bough && (
          <g>
            {art.bough.leaves && <path d={art.bough.leaves} fill={palette.boughLeaf} />}
            <path d={art.bough.ink} fill={palette.contour} />
            <path d={art.bough.body} fill={palette.bough} />
          </g>
        )}

        {art.banks.map((b, i) => (
          <g key={`bank-${i}`}>
            <path d={b.fill} fill={palette.bankFar} />
            <path d={b.relief} fill={palette.bankShade} opacity={0.4} />
          </g>
        ))}

        <path d={art.ground.fill} fill={palette.bankNear} />
        <path d={art.ground.relief} fill={palette.bankShade} opacity={0.3} />

        {art.tufts.map((t, i) => (
          <g key={`tuft-${i}`} fill={i % 2 === 0 ? palette.tuft : palette.tuftShade}>
            {t.blades.map((d, k) => (
              <path key={k} d={d} />
            ))}
          </g>
        ))}

        {art.flowers.map((f, i) => (
          <g key={`flower-${i}`}>
            <path d={f.stem} fill={palette.tuftShade} />
            {f.lobes.map((l, k) => (
              <circle key={k} cx={l.cx} cy={l.cy} r={l.r} fill={palette.flower} />
            ))}
            <circle cx={f.heart[0]} cy={f.heart[1]} r={f.lobes[0].r * 0.5} fill={palette.flowerHeart} />
          </g>
        ))}

        {art.motes.map((m, i) => (
          <circle key={`mote-${i}`} cx={m.cx} cy={m.cy} r={m.r} fill={palette.paper} opacity={0.75} />
        ))}

        {art.fore && (
          <g>
            <path d={art.fore.base} fill={palette.foreGrass} />
            {art.fore.blades.map((d, i) => (
              <path key={i} d={d} fill={i % 3 === 0 ? palette.foreGrassShade : palette.foreGrass} />
            ))}
          </g>
        )}
      </svg>

      {/*
       * As much of the flock as the frame can hold WITHOUT overlapping.
       *
       * The Toy only ever shows one Sheep at a time, but five side by side is
       * the only way to check the claim the palette actually makes — that five
       * hues at one shared lightness read as five different animals. A phone is
       * only ~2.2 Sheep across, so five of them there pile into one another and
       * you can see neither the flock nor the scene; the desktop tab is where
       * that comparison is legible. Same rule as the scene itself: counts follow
       * the frame, sizes follow the Sheep.
       */}
      {config.mode.showCritter &&
        FLEECES.slice(0, Math.max(1, Math.min(FLEECES.length, Math.floor(frame.w / sheepW / 1.15)))).map((fleece, i, shown) => {
          const x = ((i + 0.5) / shown.length) * frame.w;
          const y = art.walk.reduce((best, p) =>
            Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best,
          )[1];
          return (
            <div
              key={fleece}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${((y - footDrop) / frame.h) * 100}%`,
                width: `${sheepW}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <SheepDrawing fleece={fleece} />
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
        {px.label} · {px.w}x{px.h} · sheep {sheepW.toFixed(0)}u · frame 100x{frame.h.toFixed(0)} ·{' '}
        {(frame.w / sheepW).toFixed(1)} sheep wide
        {violations.length > 0 && ` · ⚠ ${violations.map((v) => v.rule).join(', ')}`}
      </span>
    </div>
  );
}
