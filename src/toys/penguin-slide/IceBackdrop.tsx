import { memo } from 'react';
import type { FloeArt } from './floe';
import { palette } from './palette';

/**
 * The scene's static plates, shared by the live backdrop and the Card preview so
 * the two can never be two drawings of one place.
 *
 * Paint order IS depth order: the sea, the ripples on it, the far shelves cropped
 * by the top edge, the floe's shadow on the water, its shaded face, then its
 * top. One light direction — the upper left — so every slab shows its lower
 * edge and casts down and to the right. Every fill is a palette token and every
 * line is a filled path; there is no `stroke` anywhere in the scene.
 */
export const FloePlates = memo(function FloePlates({ art, idPrefix }: { art: FloeArt; idPrefix: string }) {
  const { frame, floe } = art;
  return (
    <>
      <g data-ice-layer="water">
        <linearGradient id={`${idPrefix}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.water} />
          <stop offset="1" stopColor={palette.waterDeep} />
        </linearGradient>
        <rect x={-2} y={-2} width={frame.w + 4} height={frame.h + 4} fill={`url(#${idPrefix}-water)`} />
      </g>

      <g data-ice-layer="ripples">
        {art.ripples.map((r, i) => (
          <path key={i} d={r.d} fill={r.light ? palette.waterLight : palette.waterDeep} />
        ))}
      </g>

      {art.shelves.map((s, i) => (
        <g key={i} data-ice-layer="shelf">
          <path d={s.ink} fill={palette.contour} />
          <path d={s.face} fill={palette.shelfFace} />
          <path d={s.topInk} fill={palette.contour} />
          <path d={s.top} fill={palette.shelf} />
        </g>
      ))}

      <g data-ice-layer="floe">
        <path d={floe.shadow} fill={palette.waterDeep} />
        <path d={floe.faceInk} fill={palette.contour} fillRule="evenodd" />
        <path d={floe.face} fill={palette.iceFace} />
        <path d={floe.ink} fill={palette.contour} fillRule="evenodd" />
        <path d={floe.top} fill={palette.ice} />
      </g>
    </>
  );
});

/** The live scene behind the cast — absolute, full-bleed, never a hit target. */
export function IceBackdrop({ art }: { art: FloeArt }) {
  return (
    <div
      className="ice-backdrop"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <svg
        viewBox={`0 0 ${art.frame.w} ${art.frame.h}`}
        // The viewBox aspect IS the viewport aspect, so `none` distorts nothing;
        // it only guarantees an exact fill.
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <FloePlates art={art} idPrefix="penguin-slide" />
      </svg>
    </div>
  );
}
