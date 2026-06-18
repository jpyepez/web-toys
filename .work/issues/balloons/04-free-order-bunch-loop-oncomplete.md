---
slice: 4
title: Free-order bunch loop + onComplete (five balloons, terminal)
status: done
type: afk
blocked_by: [3]
parent_prd: balloons
stories: [5, 6, 9]
---

## What to build

The **bunch** and the Toy's **own loop logic** — the first Toy to break the
sequential one-at-a-time conveyor. Five balloons present from the start, each
owning its **own independent lifecycle**, fillable in **any order**; when the
fifth detaches, the Shell's Completion runs. End-to-end: the full `MyBalloons`
Toy component wired to the Shell↔Toy contract.

- A `Balloons` Toy component taking the standard contract only:
  `{ onComplete, sound?, haptics? }` (sound/haptics wired in slice #7) — **no new
  Shell↔Toy surface**. It renders `SkyBackdrop` (slice #1) plus **five** holdable
  balloons (slice #3), in five distinct colours, placed in the reachable mid-zone
  clear of the bottom palm-rest dead zone.
- **Free-order, multi-active loop**: all five present from the start, each in its
  own lifecycle (`limp → filling/leaking → floating`; `gathered` is slice #5).
  Each balloon tracks its **own** held-state, so resting fingers on two balloons
  fills both (forgiving multi-touch — harmless, never required). There is **no**
  `arriving → waiting → dismissing` queue.
- **Goal = float all five.** `onComplete` fires **exactly once**, ref-guarded,
  when the **fifth** balloon detaches — so the Shell's Completion overlay runs
  concurrently with the last float-up (layered-concurrent rule, ADR-0001
  amendment). Once all five are floating the state is **terminal**: no balloon
  re-arrives.
- This Toy owns its loop logic — **not** a shared hook
  ([[shared-toy-loop-abstraction]]); its shape is deliberately different from the
  tap toys' conveyor.

## Acceptance criteria

- [x] Five balloons render from the start, each independently holdable; filling
      any one to the cap floats **that** one and increments the floated count,
      regardless of order.
- [x] Holds on an already-`floating` balloon are non-destructive no-ops.
- [x] After the **fifth** detach the state is terminal — no balloon re-arrives.
- [x] `onComplete` fires **exactly once**, ref-guarded against the Shell
      re-rendering a new `onComplete` at Completion.
- [x] Two balloons held simultaneously both fill (incidental multi-touch is
      harmless and never required).
- [x] Public-interface tests pass; shim only the Web Audio boundary; never mock
      our own components.
- [ ] On-device check (mine): all five are reachable and tappable-in-any-order on
      a 390×844 phone, clear of the palm-rest zone.

## Notes

- Mirror the loop-test posture of `muddy-puddle-loop.test.tsx`: assert the
  observable contract (per-balloon state via `data-*`, floated count, terminal
  state, once-only ref-guarded `onComplete`) — **not** the choreography.
- Do **not** unit-assert the balloon **count** magic number (5) — it's the
  on-device-tuned duration lever, like the sheep/fish counts.
- The gather/bob Outro is slice #5; here, a detached balloon simply floats up.
  The idle demo and sound/haptics are slices #6 and #7.
- Resolve the Toy's `<main>` sky/floor CSS vars here (analog to the prior Toys'
  floor-clamp setup in their loop slice).
