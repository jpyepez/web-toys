---
slice: 1
title: Dusk palette + backdrop scene (with empty nest)
status: done
type: afk
blocked_by: []
parent_prd: nestlings
stories: [1, 7]
---

## What to build

The Toy's own local palette and its dusk backdrop — the foundational scenery
every later slice composes over, including the single empty **nest** that is the
drop target and the diegetic progress meter. End-to-end: token names → layered
SVG scene → a `tint` color string ready for the registry. See the PRD
(`.work/prds/nestlings.md`) for full context.

- A local `palette.ts` for this Toy (per [[0004-shared-modules-expose-primitives-toys-own-assets]]
  — the Toy ships its **own** palette and adds **no** keys to the shared tokens).
  Scene tokens: dusk sky gradient, ground, tree/branch, nest, star/sparkle. Also
  include the **per-bird body / wing / beak colours** here (the Critter art,
  slice #2, needs them) — five distinct species' colours for variety. Concrete
  tuples are on-device-tuned; the token **names** are the load-bearing contract.
- A backdrop component (analog to `SkyBackdrop` / `BarnyardBackdrop`):
  code-drawn SVG, layered and **bottom-anchored** per
  [[0005-toy-backdrops-bottom-anchored-layered-scenes]] — a deepening **dusk
  sky** above, a low ground band and tree/branch anchoring the lower third, and
  the single empty **nest** sitting in that lower band as a generously large
  drop zone. Backdrop layers tagged with `data-*` layer hooks (mirrors the
  existing backdrops). Note the emphasis split: the dusk sky above is the mood
  space, the nest + ground band is the reachable lower anchor.
- A `tint` color string derived from this palette (the dusk sky tone the live
  scene sits in) for the Home Card — declared here, consumed by the registry in
  slice #8, matching the fish/puddle/balloon tint→color-string contract.

## Acceptance criteria

- [x] `palette.ts` exports the scene tokens (dusk sky, ground, tree/branch,
      nest, star/sparkle) and the five per-bird body/wing/beak colours, by name.
- [x] The backdrop renders an all-SVG, layered, bottom-anchored scene (dusk sky
      above / ground + tree-branch / empty nest in the lower band) with `data-*`
      layer hooks queryable in a render test.
- [x] The empty nest renders with a `data-*` hook so later slices can locate it.
- [x] The palette adds **no** keys to the shared `src/shell/tokens.ts` (ADR-0004).
- [x] No `<canvas>`, no binary assets — SVG primitives only (ADR-0002).
- [x] Public-interface tests pass; no internal mocks; never mock our own components.
- [x] On-device check (mine, before marking done): on a 390×844 phone the scene
      reads as a cozy dusk with the empty nest anchored in the reachable lower
      band, clear of the bottom palm-rest dead zone.

## Notes

- Mirror `src/toys/balloons/palette.ts` + `SkyBackdrop.tsx` and their tests
  (`palette.test.ts`, `sky-backdrop.test.tsx`).
- Do **not** unit-assert colours, `dvh`/`env()` values, or backdrop geometry —
  on-device-tuned per the PRD Testing Decisions. Assert token names exist and
  the layer + nest hooks render.
- The nest here is just scenery (an empty drop zone). Its rect / nestle
  positions become load-bearing in slice #3 when a bird snaps into it; the
  star-twinkle and sky-deepening become load-bearing in the slice #5 Outro.
