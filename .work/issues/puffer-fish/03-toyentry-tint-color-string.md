---
slice: 3
title: ToyEntry.tint → concrete CSS color string (Card + registry)
status: done
type: afk
blocked_by: []
parent_prd: puffer-fish
stories: []
---

## What to build

Change `ToyEntry.tint` from a key into the shared palette to a concrete CSS
color string, and have each registry entry supply its own tint. This removes
the Card's second dependency on the meadow palette (the `palette[toy.tint]`
lookup) ahead of the palette move (slice #04), per ADR-0004 — each Toy's tint
comes from its own world, not a shared grab-bag.

End-to-end through the registry/Card vertical:

- `ToyEntry.tint` type changes from `keyof typeof palette` to a CSS color
  `string` (still optional — synthetic fixtures render a Card without a tint).
- `Card.tsx` consumes `toy.tint` directly as the surface `backgroundColor`
  (drop the `palette[toy.tint]` indirection and the `palette` import if it's no
  longer used there).
- The Counting Sheep registry entry supplies its tint as the concrete value
  that `palette.sheepWool` currently resolves to (imported from the tokens
  module for now — slice #04 repoints it at the Sheep-local palette).

## Acceptance criteria

- [x] `ToyEntry.tint` is typed as an optional CSS color `string`.
- [x] `Card.tsx` paints the surface from `toy.tint` directly, with no
      `palette[...]` lookup and no meadow-token reference remaining.
- [x] The Counting Sheep Card still renders its cream tint (now from a color
      string) — existing Card / Home tests pass, updated for the new shape.
- [x] A registry entry with no `tint` still renders a Card without a surface
      tint (the optional path is preserved).
- [x] On-device check (mine, before marking done): the Sheep Card surface is
      visually unchanged on a 390×844 phone viewport.

## Notes

- Pairs with slice #02 (`ink`): together they leave the Card with zero
  meadow-palette references, which is the precondition slice #04 needs.
- After slice #04, the Sheep entry imports its tint value from the Sheep-local
  palette rather than the shared tokens module; this slice just changes the
  *shape* (key → string), keeping the source as shared tokens for now.
- The Puffer Fish registry entry (slice #09) supplies its tint as a concrete
  ocean-palette color string — this slice is the contract change that makes
  that possible without adding a fish key to the shared palette.
- ADR-0004: see
  `../../adr/0004-shared-modules-expose-primitives-toys-own-assets.md`.
