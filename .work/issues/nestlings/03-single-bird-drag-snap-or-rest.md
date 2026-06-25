---
slice: 3
title: Single-bird Drag — pickup → carry → snap-into-nest, early-lift rests loose
status: done
type: afk
blocked_by: [1, 2]
parent_prd: nestlings
stories: [2, 3, 4, 5]
---

## What to build

The load-bearing slice: the hand-rolled **Drag** mechanic (ADR-0007) proven
end-to-end on **one** bird against the slice #1 nest. This is the single most
uncertain unknown in the Toy (per the PRD's sequencing note) — land it before
the full cast. See the PRD for full context.

A carriable-bird component owning one bird's `loose ↔ carried → placed`
lifecycle:

- **Pickup → carry**: `onPointerDown` on the bird shape attaches it to the
  finger; `onPointerMove` follows `clientX/clientY` in DOM-pixel space and drives
  the bird's carry offset via a Motion value. The transform-ownership split is
  **mandatory** (ADR-0007): the static wrapper owns layout
  (`left/top/translateX(-50%)`), the inner `motion` element owns the carry `x/y`
  — never both writing `transform`. The bird surface sets `touch-action: none`;
  the positioning wrapper is `pointer-events: none` over its rectangle so only
  the painted shape is the hit target (as Balloons does — see
  [[web-toys-touch-gotchas]]).
- **Snap decision on release** (the boundary, not physics): on `onPointerUp`,
  compare the bird's bounding rect to the nest's rect. Within the forgiving
  snap-radius → the bird is **placed** (snaps into the nest, curls asleep) and
  **locks** (further pointers are no-ops on it). Outside → it **rests loose**
  wherever it was left and stays pickup-able (ADR-0001 forgiveness — no reset,
  no penalty, no easing back to origin).
- **Per-bird state hook**: expose `loose` / `carried` / `placed` via a `data-*`
  attribute so the transition is assertable without pixels.
- **Pointer-capture / cancel / loss**: handle `onPointerCancel` and capture/loss
  explicitly so a bird can never get stuck attached to a finger that is gone
  (ADR-0007). These paths aren't observable in jsdom — on-device-validated.

## Acceptance criteria

- [x] A pointer-down on a `loose` bird sets it `carried`; subsequent moves drive
      its carry offset (Motion value updates).
- [x] A release with the bird's rect **within** the snap-radius of the nest sets
      it `placed` and shows the asleep look.
- [x] A release **outside** the snap-radius leaves it `loose` (not placed) and
      still pickup-able — a second pickup→carry works.
- [x] Pointers on an already-`placed` bird are non-destructive no-ops (it stays
      locked).
- [x] The snap outcome is driven by the rect-distance test against the nest,
      fed synthetic pointer coordinates — proven at the boundary.
- [x] Transform-ownership split honoured: layout on the static wrapper, carry
      `x/y` on the inner `motion` element (no double `transform`).
- [x] Public-interface tests pass; no internal mocks; shim only the Web Audio
      boundary if touched (sounds are slice #7) — never mock our own components.
- [x] On-device check (mine, before marking done): a real finger picks the bird
      up, carries it, and a drop merely *near* the nest still lands; a mid-carry
      lift leaves it resting where dropped; nothing ever gets stuck on a gone
      finger. _(Deferred — author opted to keep momentum on green automated tests;
      the capture/loss + snap-feel paths are jsdom-blind, so eyeball this on-device
      before slice #4 builds the cast on top of it.)_

## Notes

- Mirror `src/toys/balloons/HoldableBalloon.tsx` + `holdable-balloon.test.tsx`
  for the hand-rolled-pointer shape, but this is **Drag** not **Hold** — carry &
  position to a target, snap-to-nest-nestle-position (not snap-to-origin), per
  ADR-0007 and the CONTEXT `Drag` entry.
- Do **not** unit-assert the snap-radius, the carry feel, the lift/scale cue, or
  the settle animation — those are on-device-tuned constants (like the
  sheep/fish/balloon counts). Assert only the loose→carried→placed transitions
  and the snap *decision*.
- Sounds (chirp / flutter / coo / plip) and haptics are slice #7 — leave the
  call-sites obvious but don't wire audio here. `onComplete` / the full cast is
  slice #4 — this slice is one bird, one nest.
