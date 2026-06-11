---
slice: 3
title: Wipe-coverage mechanic + clean-snap reveal
status: in-progress
type: afk
blocked_by: [2]
parent_prd: muddy-puddle
stories: [2, 3, 4]
---

## What to build

The **Wipe** — the first non-tap core interaction in the collection, and the
load-bearing mechanic of this Toy. Operating on the static muddy piglet from
slice #2: a sustained finger drag removes the mud blobs it crosses, and once
enough are gone the Critter **auto-snaps clean** and reveals. End-to-end on a
single Critter; no loop yet (slice #4).

- A wipe surface over the Critter that **accepts all touch points**: any finger
  or palm crossing a blob clears that blob (so multi-finger / whole-hand mashing
  just cleans faster — forgiving, not broken). Continuous + accumulative: blobs
  removed by earlier strokes **stay** removed when the finger lifts (the Wipe
  per CONTEXT, distinct from a tap).
- The surface sets `touch-action: none` so the browser does not hijack the drag
  for scroll/zoom.
- **Coverage is observed by counting remaining blob nodes** (ADR-0006) — expose
  remaining-blob count (or equivalent) via a `data-*` hook so tests can drive
  progress to the threshold **without reading pixels**.
- **Clean-snap**: when blobs-remaining crosses the clean threshold (~80% wiped,
  on-device-tuned), the Critter auto-snaps clean — any leftover blobs vanish at
  once, the reveal art (slice #2's `cleaned` prop) shows, and it signals
  "clean" (the transition consumer is slice #4's `wiping → dismissing`). The
  child **never** has to wipe the final bit — partial completion is by design.
- No fail/stuck/timeout state; the only path is success (ADR-0001).

## Acceptance criteria

- [x] A pointer/touch crossing a blob removes **that** blob; the remaining-blob
      count (via the `data-*` hook) decrements.
- [ ] Crossing the clean **threshold** triggers the clean-snap: leftover blobs
      are removed at once and the Critter flips to the revealed-clean art.
- [ ] Multiple simultaneous touch points each clear blobs they cross (accept-all-
      touch-points); no crash, no special-casing — just cleans faster.
- [ ] The wipe surface carries `touch-action: none`.
- [ ] Coverage is asserted by **node count**, never by pixel/canvas reads (ADR-0006).
- [ ] Public-interface tests pass; shim only the Web Audio boundary (no sound in
      this slice yet); never mock our own components.
- [ ] On-device check (mine): wiping the piglet clears mud under the finger with
      clear cause-and-effect and snaps clean at ~80% without chasing the last bit.

## Notes

- Test the wipe-coverage contract **at the blob boundary** (the assertable half
  of ADR-0006): crossing a blob removes it; *that* crossing the threshold
  triggers the clean-snap. Do **not** unit-assert the exact blob count or the
  exact threshold percentage — on-device-tuned constants, like the sheep/fish
  counts.
- Sound (throttled squelch / sparkle), haptics, and the idle demo are NOT in
  this slice — see #7 and #6. The clean-snap's sparkle *sound* is slice #7; this
  slice only flips the art + removes blobs + signals clean.
- The `wiping → dismissing` state transition lives in slice #4; here, expose
  "clean reached" as an observable the loop will consume.
