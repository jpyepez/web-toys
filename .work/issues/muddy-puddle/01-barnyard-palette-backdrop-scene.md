---
slice: 1
title: Barnyard palette + backdrop scene
status: in-progress
type: afk
blocked_by: []
parent_prd: muddy-puddle
stories: [1, 9]
---

## What to build

The Toy's own local palette and its barnyard backdrop — the foundational scenery
every later slice composes over. End-to-end: token names → SVG scene → a `tint`
color string ready for the registry.

- A local `palette.ts` for this Toy (per ADR-0004 — the Toy ships its **own**
  palette, it does **not** add keys to the shared tokens). Barnyard scene tokens:
  sky, barn, fence, grass, mud, puddle, sparkle. Also include the **piglet**
  body/feature colors here (the first Critter, slice #2, needs them); the other
  four animals' colors land additively in slice #5. Concrete tuples are
  on-device-tuned — the token **names** are the load-bearing contract.
- A `BarnyardBackdrop` component (analog to `UnderwaterBackdrop` /
  the meadow): code-drawn SVG, layered and **bottom-anchored** per
  [[0005-toy-backdrops-bottom-anchored-layered-scenes]] — sky, a distant
  barn/fence silhouette, and a **mud puddle** in the lower third the critters
  emerge from (and the last one will splash in, slice #4). Backdrop layers
  tagged with `data-*` layer hooks (mirrors the existing backdrops).
- A `tint` color string derived from this palette (barnyard surface) for the
  Home Card — declared here, consumed by the registry in slice #8.

## Acceptance criteria

- [x] `palette.ts` exports the barnyard scene tokens (sky, barn, fence, grass,
      mud, puddle, sparkle) and the piglet body/feature colors, by name.
- [ ] `BarnyardBackdrop` renders an all-SVG, layered, bottom-anchored scene
      (sky / barn-fence silhouette / mud puddle) with `data-*` layer hooks
      queryable in a render test.
- [ ] The palette adds **no** keys to the shared `src/shell/tokens.ts` (ADR-0004).
- [ ] No `<canvas>`, no binary assets — SVG primitives only (ADR-0002).
- [ ] Public-interface tests pass; no internal mocks; never mock our own components.
- [ ] On-device check (mine, before marking done): on a 390×844 phone the scene
      reads as a barnyard with the puddle anchored to the lower third across
      aspect ratios.

## Notes

- Mirror `src/toys/puffer-fish/palette.ts` + `UnderwaterBackdrop.tsx` structure
  and their tests (`palette.test.ts`, `underwater-backdrop.test.tsx`).
- Do **not** unit-assert colors, `dvh`/`env()` values, or backdrop geometry —
  those are on-device-tuned per the PRD Testing Decisions. Assert token names
  exist and that the layer hooks render.
- Bottom-anchored layering follows the same `--*-floor` clamp pattern Puffer
  Fish uses for its seabed band; the puddle is the analog ground anchor.
