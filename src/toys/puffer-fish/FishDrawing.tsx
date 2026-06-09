import { palette } from './palette';

/**
 * The Puffer Fish Critter, drawn from SVG primitives only — no image assets
 * (ADR-0002). Every fill sources the local ocean palette. Structural pieces
 * are tagged `data-fish-part` so tests address them without coupling to which
 * primitive draws each one (mirrors `data-sheep-part` on the Sheep).
 *
 * A smooth, round, kawaii white/pink puffer: round body, pink fins + tail,
 * large dark eyes, blushy cheeks, a small smile. The silhouette stays smooth
 * and round in BOTH states — there are no spikes, ever.
 *
 * `puffed` swaps the art (the signature balloon beat lives in slice #07; here
 * we just build both frames so #07 only flips the prop):
 *   - rest   → large round eyes (`eye`), tucked cheeks, fins held in
 *   - puffed → happy `^w^` squint (`eye-squint`), cheeks puffed out, fins
 *              splayed, body reads bigger/rounder
 *
 * Geometry and the exact tuples are on-device-tuned per the slice DoD; the
 * load-bearing contract is the part hooks and the rest ↔ puffed art swap.
 */
export function FishDrawing({ puffed = false }: { puffed?: boolean }) {
  // Puffed reads bigger and rounder — same smooth circle, larger radius — and
  // the cheeks/fins splay outward. Exact proportions are on-device-tuned.
  const bodyR = puffed ? 38 : 32;
  const finOffset = puffed ? 8 : 0;
  const cheekR = puffed ? 8 : 6;

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ width: 'min(220px, 55vw)', height: 'auto', display: 'block' }}
    >
      {/* tail — a soft rounded fan behind the body */}
      <ellipse data-fish-part="tail" cx="20" cy="50" rx="14" ry="16" fill={palette.fishFin} />
      {/* pectoral fins — rounded, never pointed; splay outward when puffed */}
      <ellipse data-fish-part="fin" cx="42" cy={70 + finOffset} rx="11" ry="8" fill={palette.fishFin} />
      <ellipse data-fish-part="fin" cx="42" cy={30 - finOffset} rx="11" ry="8" fill={palette.fishFin} />
      {/* smooth round body — bigger/rounder when puffed, still a circle */}
      <circle data-fish-part="body" cx="56" cy="50" r={bodyR} fill={palette.fishBody} />
      {/* blushy cheeks — puff out when puffed */}
      <circle data-fish-part="cheek" cx="46" cy="58" r={cheekR} fill={palette.fishCheek} />
      <circle data-fish-part="cheek" cx="70" cy="58" r={cheekR} fill={palette.fishCheek} />
      {puffed ? (
        <>
          {/* happy ^w^ squint — each eye an upward arc */}
          <path
            data-fish-part="eye-squint"
            d="M43 45 Q48 40 53 45"
            fill="none"
            stroke={palette.fishEye}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            data-fish-part="eye-squint"
            d="M63 45 Q68 40 73 45"
            fill="none"
            stroke={palette.fishEye}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* large round eyes */}
          <circle data-fish-part="eye" cx="48" cy="44" r="5" fill={palette.fishEye} />
          <circle data-fish-part="eye" cx="68" cy="44" r="5" fill={palette.fishEye} />
        </>
      )}
      {/* small smile */}
      <path
        data-fish-part="smile"
        d="M52 58 Q58 64 64 58"
        fill="none"
        stroke={palette.fishEye}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
