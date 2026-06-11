---
slice: 2
title: First Critter art (piglet) + mud blob layer
status: in-progress
type: afk
blocked_by: [1]
parent_prd: muddy-puddle
stories: [1, 3]
---

## What to build

The first muddy Critter as a **static** drawing — no interaction yet. A clean
piglet SVG with a mud layer over it, so by the end of this slice a muddy piglet
renders with one extremity teasing out. The wipe interaction is slice #3.

- A piglet drawing from SVG primitives only (ADR-0002), warm/round/kawaii and
  legible at the clean reveal, using the piglet palette tokens from slice #1.
  Structural pieces tagged with `data-*` part hooks (mirrors `data-sheep-part`
  / `data-fish-part`).
- A separate **earthy-brown mud layer** painted over the clean piglet: a set of
  **discrete SVG smudge blobs** (~12–20, on-device-tuned) per
  [[0006-wipe-coverage-as-discrete-svg-blobs]]. Each blob is its own SVG node so
  coverage is later observable by **counting nodes**, not reading pixels.
- The mud **fully obscures** who it is **except one tease extremity** (an ear, a
  tail, or a beak — here the piglet's, e.g. an ear or curly tail) poking out to
  spark "who's that?" anticipation. The reveal itself lands at the clean-snap
  (slice #3).
- A `cleaned`/`revealed` prop (or equivalent) that swaps mud-on → fully-clean,
  so slice #3 can drive the reveal. This slice just wires the prop; the
  threshold logic that flips it is slice #3.

## Acceptance criteria

- [x] The piglet renders from SVG primitives with `data-*` part hooks queryable
      in a render test; no image/sprite assets (ADR-0002).
- [x] The mud layer renders as **discrete** blob nodes (countable in a test),
      layered over the clean piglet — not one merged shape, not a `<canvas>`.
- [x] With mud on, the piglet is obscured except a single tease extremity node.
- [x] A `cleaned`/`revealed` prop swaps to the fully-clean piglet (the reveal art).
- [ ] Public-interface tests pass; no internal mocks.
- [ ] On-device check (mine): the muddy piglet reads as "a muddy mystery animal
      with one bit poking out", and the clean reveal reads clearly as a piglet.

## Notes

- Do **not** unit-assert the exact blob count, blob positions, or colors — those
  are on-device-tuned (PRD Testing Decisions). Assert that blobs are discrete,
  countable nodes and that the part/tease hooks render.
- The blob-removal mechanic, threshold, and clean-snap are intentionally NOT in
  this slice — see #3.
- Mirror `FishDrawing.tsx` (and its `puffed` prop swap) for the clean↔dressed
  art-state pattern; here the swapped state is mud-on vs revealed-clean.
