---
slice: 2
title: Fledgling songbird Critters — five distinct faced birds
status: done
type: afk
blocked_by: [1]
parent_prd: nestlings
stories: [1, 9]
---

## What to build

The bird **Critters** — five visually distinct, faced, code-drawn fledgling
songbirds (e.g. robin, bluebird, sparrow, wren, goldfinch), each a pure function
of its props. No interaction yet (slice #3 drives the carry); this slice proves
the art reads correctly across the bird's display states, statically. See the
PRD for full context.

- A bird drawing component (analog to `BalloonDrawing` / `PigletDrawing`): each
  bird is its own faced SVG drawn from primitives only
  ([[0002-no-binary-assets-everything-code-generated]]), pulling its
  body/wing/beak colours from the slice #1 palette. Five distinct species for
  variety — deliberately unlike Muddy Puddle's round yellow chick (ADR-0004
  per-Toy assets). There is **no hidden identity / reveal** — the play is the
  carrying, not "who is it".
- Structural pieces tagged with `data-*` part hooks (mirrors `data-sheep-part` /
  `data-fish-part` / the balloon parts) so later slices and tests can address
  the body, wing, beak, eyes.
- The art expresses the bird's display states as a function of props, ready for
  the mechanic to drive them: an awake/loose look, a "carried" lift cue (lifts /
  scales slightly — mirrors Balloons' which-one cue), and an **asleep** look
  (head tucked under wing, eyes closed) for the placed/Outro states. The exact
  lift/scale is on-device-tuned and not asserted.

## Acceptance criteria

- [x] A bird drawing renders an all-SVG faced fledgling from primitives, with
      `data-*` part hooks (body, wing, beak, eyes) queryable in a render test.
- [x] Five visually distinct species are selectable (by a `species`/variant prop
      or equivalent), each sourcing its colours from the slice #1 palette.
- [x] The asleep state (head tucked, eyes closed) is expressible as a prop —
      proven statically, queryable via the part hooks.
- [x] No `<canvas>`, no binary assets — SVG primitives only (ADR-0002).
- [x] Public-interface tests pass; no internal mocks; never mock our own components.
- [x] On-device check (mine, before marking done): the five birds read as
      distinct and cute at carry size on a 390×844 phone; the asleep look reads
      as sleepy, not dead. _(Deferred — author opted to proceed to slice #3 on
      green automated tests; will eyeball the cast on-device alongside the carry.)_

## Notes

- Mirror `src/toys/balloons/BalloonDrawing.tsx` + `balloon-drawing.test.tsx`.
- Do **not** unit-assert colours, the lift/scale tuple, or path geometry —
  on-device-tuned. Assert the part hooks render and the state props switch the
  structure (e.g. eyes open vs tucked).
- This slice is art only — the pickup/carry/snap wiring is slice #3, the
  free-order cast is slice #4. Keep the component a pure function of props.
