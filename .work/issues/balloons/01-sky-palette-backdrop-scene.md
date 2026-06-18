---
slice: 1
title: Sky palette + backdrop scene
status: done
type: afk
blocked_by: []
parent_prd: balloons
stories: [1, 6]
---

## What to build

The Toy's own local palette and its sky/grass/peg backdrop — the foundational
scenery every later slice composes over, and the new **vertical** play space the
balloons rise into. End-to-end: token names → SVG scene → a `tint` color string
ready for the registry. See the PRD (`.work/prds/balloons.md`) for full context.

- A local `palette.ts` for this Toy (per [[0004-shared-modules-expose-primitives-toys-own-assets]]
  — the Toy ships its **own** palette, it does **not** add keys to the shared
  tokens). Scene tokens: sky, cloud, grass, peg/fence, string, sparkle. Also
  include the **per-balloon body/face colours** here (the Critter art, slice #2,
  needs them) — five distinct balloon colours for variety. Concrete tuples are
  on-device-tuned; the token **names** are the load-bearing contract.
- A `SkyBackdrop` component (analog to `BarnyardBackdrop` / `UnderwaterBackdrop`
  / the meadow): code-drawn SVG, layered and **bottom-anchored** per
  [[0005-toy-backdrops-bottom-anchored-layered-scenes]] — a **deliberately tall
  sky** (with a cloud or two) above, a grassy rise, and a low peg/fence in the
  lower third the balloons are tied to. Backdrop layers tagged with `data-*`
  layer hooks (mirrors the existing backdrops). The tall sky gives the balloons
  somewhere to rise and gather (slices #3, #5).
- A `tint` color string derived from this palette (the sky tone the live scene
  sits in) for the Home Card — declared here, consumed by the registry in
  slice #8, matching the fish/puddle tint→color-string contract.

## Acceptance criteria

- [x] `palette.ts` exports the scene tokens (sky, cloud, grass, peg/fence,
      string, sparkle) and the five per-balloon body/face colours, by name.
- [x] `SkyBackdrop` renders an all-SVG, layered, bottom-anchored scene (tall sky
      / cloud / grass rise / low peg-fence) with `data-*` layer hooks queryable
      in a render test.
- [x] The palette adds **no** keys to the shared `src/shell/tokens.ts` (ADR-0004).
- [x] No `<canvas>`, no binary assets — SVG primitives only (ADR-0002).
- [x] Public-interface tests pass; no internal mocks; never mock our own components.
- [ ] On-device check (mine, before marking done): on a 390×844 phone the scene
      reads as open sky over a grassy rise with the peg anchored to the lower
      third, and the sky reads as tall/reachable across aspect ratios.

## Notes

- Mirror `src/toys/muddy-puddle/palette.ts` + `BarnyardBackdrop.tsx` and their
  tests (`palette.test.ts`, `barnyard-backdrop.test.tsx`).
- Do **not** unit-assert colours, `dvh`/`env()` values, or backdrop geometry —
  on-device-tuned per the PRD Testing Decisions. Assert token names exist and
  the layer hooks render.
- Bottom-anchored layering follows the same floor-clamp pattern the prior Toys
  use; the peg/grass rise is the ground anchor, but note the **inversion of
  emphasis** vs the prior Toys — here the *sky above* is the load-bearing space,
  not the ground band. The Card `tint` (slice #8) is the sky tone.
