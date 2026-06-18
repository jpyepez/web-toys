---
slice: 6
title: Idle HOLD demo — ghost-finger dwell
status: done
type: afk
blocked_by: [3]
parent_prd: balloons
stories: [7]
---

## What to build

The **idle-triggered HOLD demo** — wordless teaching of the gesture. This is
**load-bearing, not decorative**: with the slow-leak rule (slice #3) a child who
only *taps* gets a sip of fill that leaks straight back and never completes a
balloon, so the demo must teach **duration**, not a tap.

- After an idle delay (~2–3s, on-device-tuned) with **no hold**, a translucent
  "ghost finger" presses a balloon and **dwells** while it visibly fills partway,
  then lifts — demonstrating a *sustained hold*, not a tap.
- The demo's fill **reforms** — it gives **no real progress**: it does **not**
  advance the floated count and does not detach a balloon. A **real hold cancels
  and suppresses** the demo.
- Keep the teaching at the **state/flag level** (demo active / suppressed) so it
  is testable without leaning on the ghost-finger animation, which is
  on-device-tuned.

## Acceptance criteria

- [x] After the idle delay with no hold, the demo becomes **active** (observable
      via a state/flag, not by inspecting the animation).
- [x] A real hold **cancels and suppresses** the demo.
- [x] The demo's fill **reforms** and does **not** advance the floated count or
      detach a balloon.
- [x] Public-interface tests pass; shim only the Web Audio boundary; never mock
      our own components.
- [ ] On-device check (mine): left alone, a ghost finger presses and **dwells**
      (clearly a hold, not a tap) on a balloon, fills it partway, lifts, and
      repeats; touching anything stops it.

## Notes

- The demo must show **dwell/duration**, not a sweep — it shares the *idea* of
  Muddy Puddle's `GhostFinger` but teaches a different gesture. **Default to
  copy** rather than lifting into a shared primitive
  ([[shared-toy-loop-abstraction]] precedent — don't pre-abstract a
  wordless-teaching helper on its second appearance); decide at build time, but
  copy is the default.
- Test the demo by its **observable effect** (active flag, cancel-on-hold, no
  count advance), not its visuals — per the PRD Testing Decisions. Mirror
  `idle-ghost-finger-demo.test.tsx`.
- Do **not** unit-assert the idle delay or the demo animation — on-device-tuned.
