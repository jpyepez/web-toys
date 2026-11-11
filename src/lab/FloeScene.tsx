/**
 * The floe's frame view — the Penguin Slide scene at a real viewport aspect,
 * with the cast standing on the rests the generator emitted and two of them
 * already swimming where `landingFor` sends a Swipe.
 *
 * Like the reef view it imports the Toy's palette and figure verbatim: both are
 * already derived and asserted, so what is left to tune here is COMPOSITION.
 * Judge it at BOTH aspects — a phone stacks the cast in two rows on a short
 * floe, a 16:10 frame stands it in one line with far more sea around it, and
 * those differ in kind, not just in scale.
 */

import { useMemo } from 'react';
import { buildFloe, check, landingFor } from '../toys/penguin-slide/floe';
import { PenguinFigure, VB_H, VB_W, FOOT_FRACTION, penguinPx } from '../toys/penguin-slide/PenguinDrawing';
import { FloePlates } from '../toys/penguin-slide/IceBackdrop';
import { CAST, PENGUIN_COUNT } from '../toys/penguin-slide/PenguinSlide';
import { palette } from '../toys/penguin-slide/palette';
import { ASPECTS, type Config } from './config';

export function FloeFrameView({ config }: { config: Config }) {
  const px = ASPECTS[config.mode.aspect];
  const frame = { w: 100, h: (px.h / px.w) * 100 };
  const pw = (penguinPx(px.w, px.h) / px.w) * 100;
  const cfg = config.scenery.floe;

  const art = useMemo(
    () => buildFloe(cfg, frame, pw, config.seed, PENGUIN_COUNT),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg, config.seed, frame.h, pw],
  );
  const violations = useMemo(() => check(cfg, pw, frame), [cfg, pw, frame]);

  // Two penguins already swiped — left and up-right — to judge where landings go.
  const figures = useMemo(() => {
    const taken = new Set<number>();
    const swiped = new Map<number, [number, number]>();
    for (const [i, dir] of [[0, [-1, 0.2]], [PENGUIN_COUNT - 1, [0.7, -1]]] as const) {
      const s = landingFor(art, art.rests[i], dir as [number, number], 0.4, taken);
      if (s >= 0) {
        taken.add(s);
        swiped.set(i, art.slots[s]);
      }
    }
    return CAST.map((kind, i) => ({
      kind,
      i,
      at: swiped.get(i) ?? art.rests[i],
      pose: swiped.has(i) ? ('swimming' as const) : ('standing' as const),
    })).sort((a, b) => a.at[1] - b.at[1]);
  }, [art]);

  return (
    <div className="frameView" style={{ aspectRatio: `${px.w} / ${px.h}`, background: palette.water }}>
      <svg
        viewBox={`0 0 ${frame.w} ${frame.h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <FloePlates art={art} idPrefix="lab-floe" />
        {/* the landing slots, faint, so their coverage can be judged */}
        {art.slots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={pw * 0.04} fill={palette.contour} opacity={0.25} />
        ))}
      </svg>
      {config.mode.showCritter &&
        figures.map((f) => (
          <div
            key={f.i}
            data-lab-penguin=""
            style={{
              position: 'absolute',
              left: `${((f.at[0] - pw / 2) / frame.w) * 100}%`,
              top: `${((f.at[1] - pw * (VB_H / VB_W) * FOOT_FRACTION) / frame.h) * 100}%`,
              width: `${pw}%`,
            }}
          >
            <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
              <PenguinFigure kind={f.kind} pose={f.pose} />
            </svg>
          </div>
        ))}

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
        {px.label} · {px.w}x{px.h} · penguin {pw.toFixed(1)}u · {(frame.w / pw).toFixed(1)} wide ·{' '}
        {art.slots.length} slots
        {violations.length > 0 && ` · ⚠ ${violations.join('; ')}`}
      </span>
    </div>
  );
}
