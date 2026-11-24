/**
 * The kitchen's frame view — the Soup Pot scene at a real viewport aspect, with
 * the three mice on the rim points the generator emitted and the soup cooked as
 * far as the `soup cooked` knob says.
 *
 * Like the floe view it imports the Toy's palette, layers and figure verbatim:
 * they are already derived and asserted, so what is left to tune here is
 * COMPOSITION. Judge it at BOTH aspects — a phone has the pot filling its width
 * with counter above and below, a 16:10 frame has the pot filling its height
 * with counter either side, and those differ in kind, not just in scale.
 */

import { useMemo } from 'react';
import { buildKitchen, check } from '../toys/soup-pot/kitchen';
import { KitchenPlates, LadleLayer, SoupLayer, SteamLayer } from '../toys/soup-pot/KitchenScene';
import { MouseFigure, VB, PAW_FRACTION, mousePx } from '../toys/soup-pot/MouseDrawing';
import { palette } from '../toys/soup-pot/palette';
import { GOAL_ANGLE, stageFor } from '../toys/soup-pot/stir';
import { ASPECTS, type Config } from './config';

export function KitchenFrameView({ config }: { config: Config }) {
  const px = ASPECTS[config.mode.aspect];
  const frame = { w: 100, h: (px.h / px.w) * 100 };
  const mw = (mousePx(px.w, px.h) / px.w) * 100;
  const cfg = config.scenery.kitchen;
  const fraction = config.scenery.kitchenView.progress;

  const art = useMemo(
    () => buildKitchen(cfg, frame, mw, config.seed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg, config.seed, frame.h, mw],
  );
  const violations = useMemo(() => check(cfg, mw, frame), [cfg, mw, frame]);
  const stage = stageFor(fraction * GOAL_ANGLE);

  return (
    <div className="frameView" style={{ aspectRatio: `${px.w} / ${px.h}`, background: palette.counter }}>
      <svg
        viewBox={`0 0 ${frame.w} ${frame.h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <KitchenPlates art={art} />
        <SoupLayer art={art} fraction={fraction} stage={stage} swirl={0.6} still />
        <LadleLayer art={art} angle={-0.5} />
        {stage >= 3 && <SteamLayer art={art} still />}
        {config.mode.showCritter &&
          art.mice.map((m) => (
            <g
              key={m.kind}
              data-lab-mouse=""
              transform={`translate(${m.at[0] - mw / 2} ${m.at[1] - mw * PAW_FRACTION}) scale(${mw / VB})`}
            >
              <MouseFigure kind={m.kind} />
            </g>
          ))}
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
        {px.label} · {px.w}x{px.h} · mouse {mw.toFixed(1)}u · pot {((art.potR * 2) / mw).toFixed(1)} mice · stage {stage}
        {violations.length > 0 && ` · ⚠ ${violations.join('; ')}`}
      </span>
    </div>
  );
}
