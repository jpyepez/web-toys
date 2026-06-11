import { palette } from './palette';

/**
 * Deterministic mud-blob smudges (in the piglet's `0 0 100 100` viewBox), caked
 * over the clean piglet to obscure it. Stable across re-renders by construction
 * (no `Math.random()`, no per-render jitter), like the backdrop's fence posts.
 * Each entry becomes its OWN `data-mud-blob` SVG node so coverage is observable
 * by COUNTING remaining nodes — never reading pixels — per ADR-0006; slice #3
 * removes blobs from this layer as the child Wipes. Count/positions/radii are
 * on-device-tuned (slice Notes); the contract is that the blobs are discrete,
 * countable nodes blanketing the body. They cluster over the body and snout but
 * deliberately leave the tease ear (drawn on top) poking out.
 */
const MUD_BLOBS: readonly { cx: number; cy: number; r: number }[] = [
  { cx: 38, cy: 40, r: 11 },
  { cx: 52, cy: 36, r: 12 },
  { cx: 64, cy: 42, r: 10 },
  { cx: 30, cy: 52, r: 11 },
  { cx: 46, cy: 50, r: 13 },
  { cx: 60, cy: 52, r: 12 },
  { cx: 72, cy: 54, r: 9 },
  { cx: 34, cy: 64, r: 11 },
  { cx: 50, cy: 64, r: 13 },
  { cx: 66, cy: 64, r: 11 },
  { cx: 28, cy: 58, r: 8 },
  { cx: 42, cy: 74, r: 10 },
  { cx: 58, cy: 74, r: 10 },
  { cx: 50, cy: 78, r: 9 },
  { cx: 70, cy: 46, r: 8 },
  { cx: 32, cy: 44, r: 8 },
];

/**
 * The Muddy Puddle piglet Critter, drawn from SVG primitives only — no image
 * assets (ADR-0002). Every fill sources the local barnyard palette. Structural
 * pieces are tagged `data-piglet-part` so tests address them without coupling
 * to which primitive draws each one (mirrors `data-fish-part` on the Fish).
 *
 * A warm, round, kawaii pink piglet: round body, upright triangular ears, a big
 * snout with two nostrils, large dark eyes with catchlights, blushy cheeks, and
 * a small smile.
 *
 * The clean piglet is drawn first, then caked in a layer of discrete
 * `data-mud-blob` smudges that obscure who it is (ADR-0006). Mirrors the Fish's
 * single-component art-state pattern — slice #3 drives the mud-on ↔
 * revealed-clean swap.
 */
export function PigletDrawing() {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ width: 'min(220px, 55vw)', height: 'auto', display: 'block' }}
    >
      {/* ears — upright soft triangles behind the body, deeper-pink inners */}
      <path data-piglet-part="ear" d="M34 30 L30 12 L46 24 Z" fill={palette.pigletBody} />
      <path data-piglet-part="ear" d="M66 30 L70 12 L54 24 Z" fill={palette.pigletBody} />
      <path data-piglet-part="ear" d="M35 27 L33 17 L43 24 Z" fill={palette.pigletSnout} />
      <path data-piglet-part="ear" d="M65 27 L67 17 L57 24 Z" fill={palette.pigletSnout} />

      {/* smooth round body */}
      <circle data-piglet-part="body" cx="50" cy="54" r="32" fill={palette.pigletBody} />

      {/* blushy cheeks */}
      <circle data-piglet-part="cheek" cx="33" cy="58" r="7" fill={palette.pigletCheek} />
      <circle data-piglet-part="cheek" cx="67" cy="58" r="7" fill={palette.pigletCheek} />

      {/* large round eyes, each with a white catchlight for a friendly spark */}
      <circle data-piglet-part="eye" cx="40" cy="46" r="5" fill={palette.pigletEye} />
      <circle data-piglet-part="eye" cx="60" cy="46" r="5" fill={palette.pigletEye} />
      <circle data-piglet-part="eye-shine" cx="41.8" cy="44.2" r="1.6" fill={palette.pigletEyeShine} />
      <circle data-piglet-part="eye-shine" cx="61.8" cy="44.2" r="1.6" fill={palette.pigletEyeShine} />

      {/* snout — the signature feature: a deeper-pink oval with two nostrils */}
      <ellipse data-piglet-part="snout" cx="50" cy="62" rx="14" ry="10" fill={palette.pigletSnout} />
      <ellipse data-piglet-part="snout" cx="45" cy="62" rx="2.2" ry="3.2" fill={palette.pigletEye} />
      <ellipse data-piglet-part="snout" cx="55" cy="62" rx="2.2" ry="3.2" fill={palette.pigletEye} />

      {/* small smile under the snout */}
      <path
        data-piglet-part="smile"
        d="M43 74 Q50 80 57 74"
        fill="none"
        stroke={palette.pigletEye}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* mud layer — discrete smudge blobs caked over the clean piglet, each its
       * own node so coverage is countable (ADR-0006). Drawn last so it sits on
       * top of every piglet part, obscuring who it is. */}
      <g data-mud-layer="mud">
        {MUD_BLOBS.map((blob, i) => (
          <circle
            key={i}
            data-mud-blob=""
            cx={blob.cx}
            cy={blob.cy}
            r={blob.r}
            fill={palette.mud}
          />
        ))}
      </g>
    </svg>
  );
}
