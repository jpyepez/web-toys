---
slice: 1
title: Barnyard palette + backdrop scene
status: done
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
- [x] `BarnyardBackdrop` renders an all-SVG, layered, bottom-anchored scene
      (sky / barn-fence silhouette / mud puddle) with `data-*` layer hooks
      queryable in a render test.
- [x] The palette adds **no** keys to the shared `src/shell/tokens.ts` (ADR-0004).
- [x] No `<canvas>`, no binary assets — SVG primitives only (ADR-0002).
- [x] Public-interface tests pass; no internal mocks; never mock our own components.
- [x] On-device check (mine, before marking done): on a 390×844 phone the scene
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
- Resolved: the ground length is `--barnyard-floor` (`clamp(170px, 30dvh, 380px)`);
  the Toy's `<main>` will set it in slice #02. Layers: `data-barnyard-layer` =
  `sky` (slice-fill square) / `barn` + `fence` (bottom-anchored silhouette) /
  `grass` (bottom-anchored ground band) / `puddle` (mud base + wet sheen +
  sparkle glints, lower third). The Card `tint` (slice #08) is `palette.sky`
  (the barnyard surface) — no separate export, mirroring how Puffer Fish reuses
  `oceanPalette.water`.
- On-device check done headless via SSR + system-Chrome screenshot at 390×844
  (portrait) and 844×390 (landscape): the scene reads as a barnyard and the
  puddle stays anchored to the lower third across both aspect ratios (no
  ADR-0005 horizon/critter drift). Colour/geometry tuples remain on-device-tuned
  at the kid-handoff DoD per the project posture.
