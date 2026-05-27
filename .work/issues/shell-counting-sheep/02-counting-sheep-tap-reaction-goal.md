---
slice: 2
title: Counting Sheep — tappable SVG sheep, per-tap reaction, all-5 fires onComplete
status: in-progress
type: afk
blocked_by: [1]
parent_prd: shell-counting-sheep
stories: [3, 4]
---

## What to build

Replace the placeholder with the real **Counting Sheep** Toy — the core interaction and its
Goal logic. End-to-end: SVG world → tap interaction → animated reaction → Goal detection →
the single `onComplete()` signal.

- A meadow of **5 Sheep**, each drawn from code SVG primitives (no images — ADR-0002).
- Tapping a Sheep gives an immediate reaction: hop + squash/stretch + a happy color shift,
  and marks that Sheep **done**. (Add Motion / Framer Motion here.)
- Re-tapping an already-done Sheep gives a small playful reaction — no double-count, no
  penalty, no fail state.
- **Goal**: all 5 distinct Sheep tapped → call `onComplete()` **exactly once**.

Sound and haptics are intentionally NOT in this slice (visual reaction only) — the shared
sound/haptics utility arrives in #5. The Shell's celebration/end state arrives in #3; for
this slice, observe `onComplete` via a temporary handler (e.g. console/log or a stub prop).

## Acceptance criteria

- [x] Five distinct Sheep render as code-drawn SVG; no binary/image assets introduced.
- [x] Tapping a not-done Sheep marks it done and triggers its reaction animation.
- [ ] Tapping all 5 distinct Sheep fires `onComplete` exactly once.
- [ ] Tapping fewer than 5 distinct Sheep does NOT fire `onComplete`.
- [ ] Re-tapping a done Sheep does not double-count and does not fire `onComplete` early;
      it still produces a playful reaction.
- [ ] Goal-logic tests drive the component's public interaction surface (simulated taps),
      not internal state.

## Notes

- Goal-sizing: 5 Sheep is a starting guess for ~15–30s — tune count/pacing on a real device
  with a child (PRD Further Notes). Keep the count easy to change.
- Manual validation (not unit-asserted): multi-touch (several simultaneous taps all
  registering) and `prefers-reduced-motion` behavior — see PRD Testing Decisions.
- Per ADR-0001 there is no timer and no fail path; the only exit signal is `onComplete`.
