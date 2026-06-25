---
slice: 6
title: Idle DRAG demo — ghost-hand pick-up-and-carry
status: in-progress
type: afk
blocked_by: [4]
parent_prd: nestlings
stories: [8]
---

## What to build

The wordless-teaching beat: if no pickup happens within the idle delay (~2–3s),
a translucent **ghost-hand** presses a bird, **carries** it along a path to the
nest, and releases — demonstrating that the gesture is a *pick-up-and-carry*,
not a tap. This is **load-bearing**, not decorative: a child who only *taps* a
bird never carries it anywhere, so the demo must teach the **carry**. See the
PRD for full context.

- An idle timer at the loop level: after ~2–3s with **no real pickup**, activate
  the demo. A real pickup **cancels and suppresses** it.
- The demo acts on its **own faint demo bird** (or a ghosted stand-in) and gives
  **no real progress** — it does not advance the placed count or touch a real
  bird's lifecycle.
- A ghost-hand component performing pick-up → carry-along-a-path-to-the-nest →
  release. It must show the **carry**, not a tap or a dwell — distinct from the
  Wipe sweep and the Hold dwell demos. **Copy** the existing ghost-finger
  pattern rather than abstracting it ([[shared-toy-loop-abstraction]] — don't
  pre-abstract a wordless-teaching helper on its third appearance).
- Reduced-motion honoured (the demo is gentle / honours `prefers-reduced-motion`
  via the app-root `MotionConfig`).

## Acceptance criteria

- [x] After the idle delay with no pickup, the demo is **active** (observable via
      a state/flag, not pixels).
- [x] A real pickup **cancels/suppresses** the demo.
- [x] The demo gives **no real progress**: the placed count does not advance
      while it runs, and no real bird is consumed.
- [ ] The demo shows a pick-up-**and-carry** to the nest (a carry path), not a
      tap — verified on-device.
- [x] Public-interface tests pass; no internal mocks; never mock our own
      components.
- [ ] On-device check (mine, before marking done): an idle child sees the
      ghost-hand pick a bird up and carry it to the nest; touching a real bird
      stops the demo at once; the demo never appears to "use up" a real bird.

## Notes

- Mirror `src/toys/balloons/GhostHoldFinger.tsx` + `idle-hold-demo.test.tsx`,
  but the motion is a **carry path** (Drag), not a dwell (Hold) — copy, don't
  abstract.
- Test by **observable effect, not visuals** (PRD Testing Decisions): the
  active flag, the cancel-on-pickup, and the no-progress invariant. The
  ghost-hand animation itself is on-device-tuned; the ~2–3s idle delay is
  on-device-tunable, not a unit-asserted number.
