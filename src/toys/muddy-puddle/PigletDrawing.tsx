import { palette } from './palette';
import { MudBlobs, type MudBlob } from './MudBlobs';

/**
 * The left ear's geometry, named once so the structural ear (drawn under the
 * mud) and the tease ear (re-drawn on top of the mud, the bit poking out) stay
 * pixel-identical — otherwise the ear would visibly jump at the clean-snap when
 * slice #3 drops the tease. Shape is on-device-tuned; the invariant is that the
 * two references coincide.
 */
const LEFT_EAR_OUTER = 'M34 30 L30 12 L46 24 Z';
const LEFT_EAR_INNER = 'M35 27 L33 17 L43 24 Z';

/**
 * Deterministic mud-blob smudges (in the piglet's `0 0 100 100` viewBox), caked
 * over the clean piglet to obscure it. Stable across re-renders by construction
 * (no `Math.random()`, no per-render jitter), like the backdrop's fence posts.
 * Each entry becomes its OWN `data-mud-blob` SVG node so coverage is observable
 * by COUNTING remaining nodes — never reading pixels — per ADR-0006; slice #3
 * removes blobs from this layer as the child Wipes. Count/positions/radii are
 * on-device-tuned (slice Notes); the contract is that the blobs are discrete,
 * countable nodes blanketing the Critter. They blanket the body AND the ear
 * zone — caking over BOTH structural ears — so the only bit left legible is the
 * single tease ear, redrawn on top of the mud (below).
 */
export const MUD_BLOBS: readonly MudBlob[] = [
  // ear zone — caked over both structural ears so neither pokes out on its own;
  // the left tease ear is redrawn on top, so it alone stays visible.
  { cx: 38, cy: 24, r: 10 },
  { cx: 50, cy: 22, r: 12 },
  { cx: 62, cy: 22, r: 11 },
  { cx: 68, cy: 18, r: 8 },
  // body + snout
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
 * The clean piglet is drawn first, then (while muddy) caked in a layer of
 * discrete `data-mud-blob` smudges that obscure who it is (ADR-0006), with one
 * tease ear poking out on top. `cleaned` swaps mud-on → the fully-clean reveal
 * art by dropping the mud layer + tease — mirrors the Fish's single-component
 * `puffed` art-state pattern. This slice just wires the prop; slice #3's
 * threshold logic flips it. Muddy is the default (the Toy starts muddy).
 */
export function PigletDrawing({
  cleaned = false,
  remainingBlobIndices,
}: {
  cleaned?: boolean;
  /**
   * Which mud blobs (by index into `MUD_BLOBS`) are still caked on. Defaults to
   * all of them — the static fully-muddy art of slice #2. The Wipe mechanic
   * (slice #3's `WipeableCritter`) drives this down as the child clears blobs;
   * each rendered blob carries `data-blob-index` so the wipe surface can tell
   * which one a touch point crossed. Ignored when `cleaned` (the reveal drops
   * the whole mud layer at the clean-snap).
   */
  remainingBlobIndices?: readonly number[];
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ width: 'min(220px, 55vw)', height: 'auto', display: 'block' }}
    >
      {/* ears — upright soft triangles behind the body, deeper-pink inners. The
       * left ear's geometry is shared with the tease (below) so they coincide. */}
      <path data-piglet-part="ear" d={LEFT_EAR_OUTER} fill={palette.pigletBody} />
      <path data-piglet-part="ear" d="M66 30 L70 12 L54 24 Z" fill={palette.pigletBody} />
      <path data-piglet-part="ear" d={LEFT_EAR_INNER} fill={palette.pigletSnout} />
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

      {!cleaned && (
        <>
          {/* mud layer — discrete smudge blobs caked over the clean piglet, each
           * its own node so coverage is countable (ADR-0006). Drawn last so it
           * sits on top of every piglet part, obscuring who it is. The same
           * shared `MudBlobs` layer the rest of the cast uses (slice #05). */}
          <MudBlobs blobs={MUD_BLOBS} remaining={remainingBlobIndices} />

          {/* tease — one extremity (the left ear) re-drawn ON TOP of the mud so
           * it pokes out of the smudges: the only legible bit of the Critter
           * while muddy, sparking "who's that?". The full reveal lands at the
           * clean-snap (slice #3). Tagged `data-piglet-tease` so the "obscured
           * except one bit" contract is assertable without reading pixels. */}
          <g data-piglet-tease="ear">
            <path d={LEFT_EAR_OUTER} fill={palette.pigletBody} />
            <path d={LEFT_EAR_INNER} fill={palette.pigletSnout} />
          </g>
        </>
      )}
    </svg>
  );
}
