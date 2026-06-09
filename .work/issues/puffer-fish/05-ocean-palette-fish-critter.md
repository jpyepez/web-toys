---
slice: 5
title: Ocean palette + Fish Critter (rest ↔ puffed SVG)
status: done
type: afk
blocked_by: []
parent_prd: puffer-fish
stories: [1, 2]
---

## What to build

The Puffer Fish Toy's own local ocean palette and its Critter — a smooth, round
kawaii puffer fish drawn from SVG primitives, with a rest state and a puffed
state. This is the Toy's first vertical: the local token layer (per ADR-0004,
the fish never adds keys to the shared palette) plus the art that consumes it.

End-to-end through the Critter vertical:

- Local ocean palette (e.g. `toys/puffer-fish/palette.ts`) with load-bearing
  token names for the scene + Critter: water, light-ray, coral, sand, bubble,
  and fish body/fin/cheek/eye. Concrete tuples are on-device-tuned; names are
  load-bearing. White body; pink fins/tail/cheeks.
- A `FishDrawing` component drawn from SVG primitives only (ADR-0002): smooth
  round body, fins, tail, large eyes, small smile — **no spikes, including when
  puffed**. A `puffed` prop swaps the art: rest → puffed (cheeks puff out, eyes
  squint to a happy `^w^`, fins splay). The body stays smooth and round in both
  states; puffed reads as bigger/rounder, not spiky.
- Structural pieces tagged with `data-*` part hooks (e.g. `data-fish-part`) so
  tests address them without coupling to which primitive draws each — mirrors
  `data-sheep-part`.
- All fills source the local ocean palette; no hardcoded HSLs.

## Acceptance criteria

- [x] A local ocean palette exists in the Puffer Fish folder with the named
      tokens above; the shared tokens module gains no fish keys.
- [x] `FishDrawing` renders the structural fish parts (body, fins/tail, eyes,
      cheeks, smile), each addressable via its `data-fish-part` hook.
- [x] `puffed` swaps rest ↔ puffed art: the puffed state exposes the squint
      `^w^` eyes / puffed cheeks / splayed fins; the rest state does not.
- [x] No spike/triangle part appears in either state — the silhouette stays
      round (assert the puffed state renders no spike part hook).
- [x] Every fill comes from the ocean palette — no hardcoded HSL strings in
      `FishDrawing`.
- [x] On-device check (mine, before marking done): the fish reads as a smooth,
      round, kawaii white/pink puffer in both rest and puffed states.

## Notes

- Pairing the palette with its first consumer keeps this a vertical slice — a
  palette-only slice would be horizontal and not demoable.
- Bundling the rest + puffed art here (rather than splitting) means the
  signature balloon beat in slice #07 only has to flip the `puffed` prop and
  drive the scale/float choreography — the art swap is already built.
- ADR-0002 (code-drawn SVG, no binary assets) and ADR-0004 (per-Toy assets live
  with the Toy) both bind here. See `../../adr/`.
- The exact body geometry, puff proportions, and palette tuples are
  on-device-tuned per the project's standing slice DoD — don't unit-assert
  shapes, colours, or the puff scale; assert the part hooks and the rest/puffed
  art swap through the public interface.
- Visual reference: the smooth round white/pink kawaii puffer from the grill
  session (PRD Further Notes).
