---
slice: 4
title: Full cast + free-order loop + placed-lock + onComplete once
status: done
type: afk
blocked_by: [3]
parent_prd: nestlings
stories: [6, 7, 10]
---

## What to build

Scale the single-bird mechanic (slice #3) to the full **concurrent, free-order**
cast and wire the Goal. This is the second load-bearing unknown the PRD flags:
the all-present, any-order loop with placed-lock — the Balloons-style concurrent
shape, **not** the conveyor. The Toy owns its own loop logic, **not** a shared
hook ([[shared-toy-loop-abstraction]]). See the PRD for full context.

The top-level Toy component (`Nestlings`, taking `{ onComplete, sound?,
haptics? }`):

- **All five birds present from the start**, scattered across the reachable
  mid-zone clear of the bottom palm-rest dead zone — each a distinct species
  (slice #2), each owning its own `loose ↔ carried → placed` lifecycle (slice
  #3). No `arriving → waiting → dismissing` queue.
- **Free order**: any bird is pickup-able at any time; tucking one doesn't gate
  the others. The carried bird stacks above its neighbours (the which-one cue).
- **Placed-lock + nestle positions**: a bird dropped into the nest settles into
  a nestle position **beside** the others (the growing cuddle-pile) and locks —
  so the placed count only ever rises and the pile can't be undone. Placed
  positions are observable via the per-bird `data-*` state hook from slice #3.
- **Goal + `onComplete`**: when the **fifth** bird is placed, fire `onComplete`
  **exactly once**, **ref-guarded** against the Shell re-rendering a new
  `onComplete` at Completion (mirrors the prior Toys). After the fifth placement
  the state is **terminal** — no bird re-arrives, no further placements.
- Touch handling per ADR-0007 / [[web-toys-touch-gotchas]]: overlapping
  absolute wrappers are `pointer-events: none` so birds don't steal each other's
  presses; only the painted shapes are hit targets.

## Acceptance criteria

- [x] Five birds render `loose` from the start; each can be carried and placed
      independently, in any order.
- [x] Each placement increments the placed count; a release outside the
      snap-radius does not (leaves that bird `loose`).
- [x] Placing the fifth bird fires `onComplete` **exactly once** — assert it is
      not re-fired when the Shell re-renders a new `onComplete` (ref-guard).
- [x] After the fifth placement the loop is terminal: no bird re-arrives and
      pointers on placed birds stay no-ops.
- [x] Placing birds out of order reaches the same terminal Goal (free-order).
- [x] Public-interface tests pass; no internal mocks; never mock our own
      components.
- [x] On-device check (mine, before marking done): on a 390×844 phone all five
      are reachable and tuckable in any order; the nest fills into a believable
      cuddle-pile; the five-bird count + scatter/nestle positions feel right for
      a ~15–30s play (the **bird count is the duration lever**).

## Notes

- Mirror `src/toys/balloons/Balloons.tsx` + `balloons-loop.test.tsx` for the
  free-order concurrent loop and the ref-guarded once-only `onComplete`.
- The five-bird count, scatter positions, and in-nest nestle positions are
  **on-device-tuned**, not unit-asserted magic numbers (like the sheep/fish/
  balloon counts).
- The settle & sleep Outro is slice #5, the idle DRAG demo slice #6, sounds
  slice #7, registry/preview slice #8 — keep those out of here. This slice ends
  at: five placed → `onComplete` once → terminal.
