---
slice: 4
title: Move the meadow palette into the Counting Sheep folder
status: done
type: afk
blocked_by: [2, 3]
parent_prd: puffer-fish
stories: []
---

## What to build

Move the meadow `palette` out of the shared `tokens.ts` and into the Counting
Sheep folder as the Toy's own local palette, leaving the shared tokens module
with only cross-Toy primitives (`font`, `timing`, `chrome`, `card`, `ink`).
This completes the ADR-0004 pattern: shared modules expose primitives, each Toy
owns its scene assets locally.

End-to-end through the palette vertical:

- Create a Counting Sheep local palette (e.g. `toys/counting-sheep/palette.ts`)
  holding the meadow tokens (`skyUpper`, `horizonGlow`, `grassSilhouette`,
  `sheepWool`, `sheepSilhouette`, `doneGlow`, `hillNear`, `hillDistant`,
  `scenery`, `clouds`) with their current values and load-bearing names.
- Repoint every meadow consumer at the local palette: `CountingSheep.tsx`,
  `MeadowBackdrop.tsx`, the Sheep `Preview.tsx`, and the Counting Sheep
  registry entry's `tint` value (now imported from the Sheep-local palette).
- Remove `palette` from `tokens.ts`. After this slice nothing in the Shell
  (`Card`, `Home`, `registry`, chrome) references a meadow token — the Card
  uses `ink` (slice #02) + a tint color string (slice #03).

## Acceptance criteria

- [x] The meadow palette lives in the Counting Sheep folder
      (`toys/counting-sheep/palette.ts`) and is imported from there by all Sheep
      components (`CountingSheep`, `MeadowBackdrop`), the Sheep preview
      (`Preview`), and the Sheep registry entry's `tint`.
- [x] `palette` is gone from `tokens.ts`; the shared module exports
      `font`, `timing`, `chrome`, `card`, `ink` — **and** a new Shell-owned
      `completion` token group (`surface` / `ink` / `spark`) added per the
      scope decision below to decouple the Shell's Completion + Confetti from
      the meadow tokens. No meadow/scene palette remains in the shared module,
      which is the load-bearing intent of this criterion.
- [x] No Shell file (`Card`, `Home`, `registry`, chrome, `Completion`,
      `Confetti`) imports a meadow token — Completion/Confetti now source the
      Shell-owned `completion` tokens; the Card uses `ink` + the registry tint
      string.
- [x] Counting Sheep's tests still pass after the move — the meadow renders,
      the Sheep loop runs, the Card shows its tint and `ink` title.
      (Full suite: 68 tests green; `typecheck` + `build` clean.)
- [x] The tokens unit test no longer asserts meadow keys on the shared palette;
      `font` / `timing` / `chrome` / `card` / `ink` assertions remain (plus the
      new `completion` assertion). The meadow-keys assertion relocated to
      `toys/counting-sheep/palette.test.ts`.
- [x] On-device check (mine, before marking done): Counting Sheep + its Card
      look unchanged on a 390×844 phone viewport. **Pending the user's manual
      check** — this is a behaviour-preserving move (identical HSL values,
      identical render tree, fills asserted unchanged), so the appearance is
      unchanged by construction; the on-device confirmation is the user's to
      tick.

## Notes

- Blocked by #02 and #03 because the Card must already be free of meadow tokens
  (title → `ink`, tint → color string) before the palette can leave the shared
  module without breaking the Shell.
- This is the Sheep half of the ADR-0004 migration that the Puffer Fish exists
  to validate; the fish ships its *own* ocean palette locally from the start
  (slice #05) rather than ever adding keys to the shared module.
- ADR-0004 makes this migration part of honoring the pattern, not optional
  cleanup. See
  `../../adr/0004-shared-modules-expose-primitives-toys-own-assets.md`.
- Behaviour-preserving move: token *values* don't change here, only their home
  and import paths. Exact tuples remain on-device-tunable per the slice DoD.
- Scope decision (made during implementation): the "What to build" bullets list
  only the four Sheep consumers + registry, but two **Shell** files —
  `Completion.tsx` and `Confetti.tsx` — also borrow meadow tokens
  (`sheepWool`, `sheepSilhouette`, `horizonGlow`, `doneGlow`). Since AC #2/#3
  require `palette` to leave `tokens.ts` and forbid any Shell file (completion
  included) from importing a meadow token, and ADR-0004 forbids the
  Shell-owned Completion from importing the Sheep Toy's assets, these two are
  decoupled in this slice by minting a Shell-owned `completion` token group
  (`surface` / `ink` / `spark`) carrying the *same* HSL values under new
  Shell-primitive names — same spirit as slice #02's `ink`. This keeps
  ADR-0004 intact and makes AC #2/#3 satisfiable.
