---
slice: 5
title: Variety cast — five animals, shuffled, no repeats
status: ready
type: afk
blocked_by: [4]
parent_prd: muddy-puddle
stories: [3, 5, 9]
---

## What to build

Turn the single-piglet loop into the **surprise cast**: each round is a
**different** animal, the cast is fixed at five (piglet, duckling, lamb, chick,
calf — **one each, no repeats**), and the **order is shuffled per play** so
"Play again" feels fresh. Each new animal is a fresh reveal under the mud.

- Add the remaining four Critter drawings — duckling, lamb, chick, calf — each
  from SVG primitives only (ADR-0002), warm/round/kawaii, legible at the clean
  reveal, with `data-*` part hooks and its own **tease extremity** (a beak, a
  tail, an ear…) poking out of the mud. Mirror the piglet from slice #2.
- Extend `palette.ts` **additively** with each animal's body/feature colors
  (the barnyard scene tokens + piglet colors already exist from slice #1).
- The loop draws from a five-element cast, **one each no repeats**, **shuffled**
  at the start of each play, so the five cleaned Critters are five distinct
  animals in a fresh order each time. Each gets its own mud blob layer + reveal,
  reusing the slice #3 wipe mechanic unchanged.
- The ~15–30s duration is still tuned via **blobs-per-critter + threshold**
  (slice #3 levers), **not** by changing the count — the five-animal cast and
  the count are the same number by construction.

## Acceptance criteria

- [ ] All five Critters (piglet, duckling, lamb, chick, calf) render from SVG
      primitives with `data-*` part hooks; each has a distinct tease extremity.
- [ ] `palette.ts` gains each animal's colors additively — still **no** keys
      added to the shared `src/shell/tokens.ts` (ADR-0004).
- [ ] A single play cleans five **distinct** animals (one each, no repeats).
- [ ] The cast order is **shuffled per play** — two plays can differ in order
      (assert the shuffle is applied; the exact order is non-deterministic).
- [ ] The loop contract from slice #4 still holds (≤ 1 on stage, `onComplete`
      once at the fifth clean, terminal `completed`).
- [ ] Public-interface tests pass; no internal mocks.
- [ ] On-device check (mine): across a play five different animals arrive, each a
      legible surprise at the reveal; "Play again" feels like a fresh order.

## Notes

- The surprise cast is **not** a "collection" to track — no progress/score/reward
  meta-layer ([[progress-and-gamification]]). The Completion is the entire reward.
- Don't unit-assert which animal appears when (shuffle is non-deterministic) or
  blob counts/colors — on-device-tuned. Assert the cast is five-distinct and that
  a shuffle is applied.
- The shuffle has no seeding requirement; keep it simple. (Note: `Math.random()`
  is fine in app code — the test posture asserts *distinctness/shuffle-applied*,
  not a specific order.)
