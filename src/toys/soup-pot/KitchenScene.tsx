import { memo, useId } from 'react';
import { motion } from 'motion/react';
import type { KitchenArt } from './kitchen';
import { palette } from './palette';

/**
 * The kitchen's layers, shared by the live Toy, the lab and the Card preview so
 * they can never be three drawings of one place. All of them draw in the
 * generator's frame units; pot-local layers are placed at the pot's centre.
 *
 * Paint order IS depth order: counter, grain, towel, the pot's shadow, its
 * handles, the rim, the inner wall, the soup and what floats on it, the ladle,
 * then steam rising above everything. One light direction — the upper left.
 * Every fill is a palette token; there is no `stroke` anywhere.
 */

/** The static plates: counter, towel, and the pot itself. */
export const KitchenPlates = memo(function KitchenPlates({ art }: { art: KitchenArt }) {
  const { frame, pot, towel } = art;
  const clip = `towel-${useId().replace(/:/g, '')}`;
  return (
    <>
      <g data-kitchen-layer="counter">
        <rect x={-2} y={-2} width={frame.w + 4} height={frame.h + 4} fill={palette.counter} />
        {art.counter.grain.map((d, i) => (
          <path key={i} d={d} fill={palette.grain} />
        ))}
      </g>

      <g data-kitchen-layer="towel">
        <path d={towel.ink} fill={palette.contour} fillRule="evenodd" />
        <clipPath id={clip}>
          <path d={towel.d} />
        </clipPath>
        <path d={towel.d} fill={palette.towel} />
        {/* Stripes run edge to edge of the cloth and end on its own outline. */}
        <g clipPath={`url(#${clip})`}>
          {towel.stripes.map((d, i) => (
            <path key={i} d={d} fill={palette.towelStripe} />
          ))}
        </g>
      </g>

      <g data-kitchen-layer="pot">
        <path d={pot.shadow} fill={palette.counterShadow} />
        {pot.handles.map((h, i) => (
          <g key={i}>
            <path d={h.ink} fill={palette.contour} />
            <path d={h.d} fill={palette.potShade} />
          </g>
        ))}
        <path d={pot.ink} fill={palette.contour} fillRule="evenodd" />
        <path d={pot.rim} fill={palette.pot} fillRule="evenodd" />
        <path d={pot.rimShade} fill={palette.potShade} fillRule="evenodd" opacity={0.7} />
        <path d={pot.inner} fill={palette.potInner} />
        <path d={pot.innerShade} fill={palette.potInnerShade} fillRule="evenodd" />
        <path d={pot.innerInk} fill={palette.contour} fillRule="evenodd" />
      </g>
    </>
  );
});

const SOUP_KEYS = ['soup0', 'soup1', 'soup2', 'soup3'] as const;
const SWIRL_KEYS = ['swirl0', 'swirl1', 'swirl2', 'swirl3'] as const;

/**
 * How visible each soup stage's colour is at a progress `f` in 0–1. The four
 * stage colours cross-fade over the whole Stir, so the soup changes with every
 * turn, not only at the beats — and every fill is still a palette token.
 */
export function soupOpacities(f: number): number[] {
  const s = Math.max(0, Math.min(1, f)) * 3;
  return [1, ...[1, 2, 3].map((k) => Math.max(0, Math.min(1, s - (k - 1))))];
}

/**
 * The soup, its swirl marks and its bubbles. `fraction` is progress toward the
 * Goal (0–1); `stage` gates the bubbles; `swirl` turns the swirl marks (radians)
 * so the surface follows the ladle round.
 */
export function SoupLayer({
  art,
  fraction,
  stage,
  swirl,
  still = false,
}: {
  art: KitchenArt;
  fraction: number;
  stage: number;
  swirl: number;
  /** A still frame (Card, lab): no looping motion. */
  still?: boolean;
}) {
  const [cx, cy] = art.centre;
  const ops = soupOpacities(fraction);
  const swirlKey = SWIRL_KEYS[Math.max(0, Math.min(3, stage))];
  return (
    <g data-kitchen-layer="soup" data-soup-stage={stage} transform={`translate(${cx} ${cy})`}>
      {SOUP_KEYS.map((k, i) =>
        ops[i] > 0 ? <path key={k} d={art.soup.d} fill={palette[k]} opacity={ops[i]} /> : null,
      )}
      <g transform={`rotate(${(swirl * 180) / Math.PI})`}>
        {art.soup.swirls.map((d, i) => (
          <path key={i} d={d} fill={palette[swirlKey]} />
        ))}
      </g>
      {stage >= 2 && (
        <g data-soup-bubbles="">
          {art.soup.bubbles.map((b, i) =>
            still ? (
              <path key={i} d={b.d} fill={palette.paper} opacity={0.75} />
            ) : (
              <motion.path
                key={i}
                d={b.d}
                fill={palette.paper}
                style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1, 1.25, 0], opacity: [0, 0.8, 0.8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: b.delay * 1.6, ease: 'easeOut' }}
              />
            ),
          )}
        </g>
      )}
      <path d={art.soup.edge} fill={palette.contour} fillRule="evenodd" opacity={0.5} />
    </g>
  );
}

/** The ladle, pivoting on the pot's centre so its handle points at `angle` (radians). */
export function LadleLayer({ art, angle }: { art: KitchenArt; angle: number }) {
  const [cx, cy] = art.centre;
  return (
    <g data-kitchen-layer="ladle" transform={`translate(${cx} ${cy}) rotate(${(angle * 180) / Math.PI})`}>
      <path d={art.ladle.bowlInk} fill={palette.contour} />
      <path d={art.ladle.bowl} fill={palette.ladle} />
      <path d={art.ladle.handleInk} fill={palette.contour} />
      <path d={art.ladle.handle} fill={palette.ladle} />
    </g>
  );
}

/** Steam rising from the ready soup. Loops gently; a still frame shows it at rest. */
export function SteamLayer({ art, still = false }: { art: KitchenArt; still?: boolean }) {
  const [cx, cy] = art.centre;
  return (
    <g data-kitchen-layer="steam" transform={`translate(${cx} ${cy})`}>
      {art.steam.map((d, i) =>
        still ? (
          <path key={i} d={d} fill={palette.steam} opacity={0.8} />
        ) : (
          <motion.path
            key={i}
            d={d}
            fill={palette.steam}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [0, -art.mw * 0.5], opacity: [0, 0.85, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
          />
        ),
      )}
    </g>
  );
}

/** The Outro's blorp: one big burst of steam wisps flying out past the frame. */
export function BlorpLayer({ art }: { art: KitchenArt }) {
  const [cx, cy] = art.centre;
  return (
    <g data-kitchen-layer="blorp" transform={`translate(${cx} ${cy})`}>
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1, 1.5], opacity: [0, 0.95, 0] }}
        transition={{ duration: 1.4, ease: [0.2, 0.7, 0.3, 1] }}
      >
        {art.blorp.map((d, i) => (
          <path key={i} d={d} fill={palette.steam} />
        ))}
      </motion.g>
    </g>
  );
}
