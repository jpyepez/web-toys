---
slice: 6
title: Underwater backdrop scene
status: done
type: afk
blocked_by: [5]
parent_prd: puffer-fish
stories: [1]
---

## What to build

The Puffer Fish's own underwater backdrop component — the analog to
`MeadowBackdrop`, a single full-bleed code-drawn SVG scene behind the fish. A
*different world* from the meadow: water instead of sky, so the second Toy reads
as unmistakably its own place.

End-to-end through the scene vertical:

- An `UnderwaterBackdrop` component (e.g. `toys/puffer-fish/UnderwaterBackdrop.tsx`)
  drawing, from SVG primitives only (ADR-0002): top-lit light-blue water
  (lighter toward the surface), soft light rays, a few drifting bubbles,
  pale-cream coral silhouettes, and a soft sandy floor.
- All fills source the local ocean palette from slice #05 (extend it with any
  scene tokens still missing); no hardcoded HSLs.
- Backdrop layers tagged with `data-*` layer hooks (e.g. `data-ocean-layer`) so
  tests address the scene composition without coupling to which primitive draws
  each — mirrors `data-meadow-layer`.
- Full-bleed, decorative (`aria-hidden`), `pointer-events: none`, pinned behind
  the Critter — same positioning posture as `MeadowBackdrop` so the scene reads
  as the world behind the fish, not an inline tile.

## Acceptance criteria

- [x] `UnderwaterBackdrop` renders the named layers — water, light rays,
      bubbles, coral, sandy floor — each addressable via its `data-ocean-layer`
      hook.
- [x] Every fill comes from the ocean palette — no hardcoded HSL strings.
- [x] The backdrop is `aria-hidden` and does not intercept taps
      (`pointer-events: none`), so the Critter above stays reachable.
- [x] On-device check (mine, before marking done): the scene reads as a soft,
      top-lit underwater world — clearly a different world from the meadow — on
      a 390×844 phone viewport.

## Notes

- Starting atmospheric register is chosen deliberately (top-lit light-blue
  water, soft rays, drifting bubbles, pale-cream coral, sandy floor) to avoid
  repeating the Sheep palette churn — see PRD Implementation Decisions → Scene.
  Exact tuples and shapes are on-device-tuned per the slice DoD.
- Bubbles/rays are static composition like the meadow's clouds — no idle
  ambient drift animation (consistent with the project's standing posture; the
  PRD scopes motion to the fish's swim-in / balloon / float-up only).
- ADR-0002 (code-drawn SVG) and ADR-0004 (per-Toy assets local). The fish
  carries its own backdrop the way Counting Sheep carries the meadow.
- Don't unit-assert colours, shapes, or `dvh`/`env()` layout — assert the layer
  hooks and the palette-sourced fills; the rest is on-device.

### Implementation decisions (slice #06 build)

- **Palette extended with one token: `waterSurface`** (lighter top-lit shade).
  The deeper `water` already existed from slice #05; the surface shade was the
  only missing scene token, added under this slice's explicit "extend it with
  any scene tokens still missing" sanction. Driven test-first via
  `palette.test.ts` (the exact-key-set assertion gained the new key).
- **Water layer is a single vertical gradient** (`waterSurface` → `water`,
  surface → depth) — the one justified gradient in the scene, since a flat fill
  can't read as "lighter toward the surface". Its `<defs>` live inside the
  `<g data-ocean-layer="water">` group so the layer hook and its palette-sourced
  stops stay addressable together. The grade is asserted mechanism-agnostically
  ("water layer paints from both tokens"), so swapping gradient → stacked bands
  on-device keeps the tests green.
- **On-device gate (AC #4) is still open.** `UnderwaterBackdrop` is a standalone
  component (like `MeadowBackdrop`); it is not mounted in any route yet (no
  `PufferFish` toy / registry entry — later slices). Viewing it on a 390×844
  viewport needs a temporary mount. Status held at `in-progress` until that
  on-device check passes.
