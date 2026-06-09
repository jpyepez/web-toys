---
slice: 2
title: Shell-owned `ink` token; Card title consumes it
status: done
type: afk
blocked_by: []
parent_prd: puffer-fish
stories: []
---

## What to build

Add a Shell-owned neutral **ink** token to the shared tokens module and point
the Home Card title at it, so the Card no longer borrows the meadow
`sheepSilhouette` token for its type colour. This removes one of the Card's two
dependencies on the meadow palette ahead of the palette move (slice #04), per
ADR-0004.

End-to-end through the chrome/Card vertical:

- Add an `ink` token to `tokens.ts` — a Shell-owned neutral dark for editorial
  type on Card surfaces, alongside `font`, `timing`, `chrome`, `card` (the
  cross-Toy primitives the shared module keeps). A concrete value close to the
  current `sheepSilhouette` dark-brown is fine; the *name* is load-bearing, the
  tuple is on-device-tunable.
- `Card.tsx` title `color` sources `ink` instead of `palette.sheepSilhouette`.

## Acceptance criteria

- [x] `tokens.ink` exists and is a Shell-owned token (not in any Toy palette).
- [x] The Card title renders its colour from `tokens.ink`, with no reference to
      `palette.sheepSilhouette` (or any meadow token) left in `Card.tsx`.
- [x] Existing Card / Home tests still pass — the title still renders, the tint
      surface is unchanged by this slice.
- [x] On-device check (mine, before marking done): the Card title still reads
      as dark editorial type over the cream tint on a 390×844 phone viewport.

## Notes

- This is one of two slices that strip the Card's meadow-palette coupling;
  slice #03 strips the other (`tint`). The palette move (slice #04) is gated on
  both so it lands with zero Shell→meadow references remaining.
- ADR-0004: shared modules expose cross-Toy primitives; `ink` is a Shell chrome
  primitive (Card type colour), so it belongs in the shared module, not in a
  Toy palette. See
  `../../adr/0004-shared-modules-expose-primitives-toys-own-assets.md`.
- The exact ink tuple is on-device-tuned per the project's standing slice DoD;
  don't unit-assert the colour value, only that the title sources the token.
