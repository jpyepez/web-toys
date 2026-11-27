/**
 * The pond's frame view — the Pond Leap scene at a real viewport aspect, with
 * the pads where the Toy puts them and the frog waiting on the first one.
 *
 * Like the floe view it imports the Toy's palette, plates and figures verbatim:
 * they are already derived and asserted, so what is left to tune here is
 * COMPOSITION. Judge it at BOTH aspects — a phone is all pond with the banks
 * shaved to its edges, a 16:10 frame has the pad column in the middle with pond
 * and bank either side, and those differ in kind, not just in scale.
 */

import { useMemo } from 'react';
import { buildPond, check } from '../toys/pond-leap/pond-scene';
import { PondPlates } from '../toys/pond-leap/PondBackdrop';
import { PadFigure } from '../toys/pond-leap/PadDrawing';
import { FOOT_FRACTION, FrogFigure } from '../toys/pond-leap/FrogDrawing';
import { palette } from '../toys/pond-leap/palette';
import { ASPECTS, frameBox, type Config } from './config';

export function PondFrameView({ config }: { config: Config }) {
  const px = ASPECTS[config.mode.aspect];
  const cfg = config.scenery.pond;
  const art = useMemo(() => buildPond(cfg, px.w, px.h, config.seed), [cfg, px.w, px.h, config.seed]);
  const violations = useMemo(() => check(art, cfg), [art, cfg]);
  const [fx, fy] = art.pads[0];

  return (
    <div className="frameView" style={{ ...frameBox(px), background: palette.water }}>
      <svg
        viewBox={`0 0 ${art.frame.w} ${art.frame.h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <PondPlates art={art} />
        {art.pads.map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${(art.padR * 2) / 100})`}>
            <PadFigure index={i} bloom={i === art.pads.length - 1} />
          </g>
        ))}
        {config.mode.showCritter && (
          <g data-lab-frog="" transform={`translate(${fx - art.fw / 2} ${fy - art.fw * (FOOT_FRACTION + 0.05)}) scale(${art.fw / 100})`}>
            <FrogFigure />
          </g>
        )}
      </svg>

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
        {px.label} · {px.w}x{px.h} · frog {art.fw.toFixed(1)}u · {(art.frame.w / art.fw).toFixed(1)} wide
        {violations.length > 0 && ` · ⚠ ${violations.join('; ')}`}
      </span>
    </div>
  );
}
