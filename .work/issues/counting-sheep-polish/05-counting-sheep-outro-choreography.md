---
slice: 5
title: Counting Sheep Outro — staggered wave-jump after Goal
status: done
type: afk
blocked_by: [2, 3, 4]
parent_prd: counting-sheep-polish
stories: [3]
---

## What to build

The Toy-side half of the celebration the parent PRD originally promised
("the Sheep line up and jump together with a confetti-style burst"). When the
Goal is met, the Toy enters an **Outro** phase: each Sheep performs a soft
rise-fall jump in place, staggered ~300ms left-to-right, and the done-glow
grows brighter on each as it lands. Total Outro length ~2s.

This is the slice the layered-concurrent contract (slice #2) was built for. The
Toy fires `onComplete` at the moment it enters the Outro phase; the Shell starts
its celebration overlay immediately on top; both play simultaneously.

End-to-end through one vertical:

- New Outro phase state inside the Counting Sheep Toy, entered the instant the
  fifth Sheep is tapped.
- Per-Sheep rise-fall jump using Motion, staggered left-to-right at ~300ms
  intervals (5 Sheep → roughly 1.2s of stagger start time, with the last
  Sheep's jump finishing around the ~2s mark).
- Done-glow intensity ramps as each Sheep lands.
- `onComplete` is still called once, at Outro entry — not at Outro end. The
  Shell's celebration overlay times the end state, not the Toy.
- Animation primitives (spring stiffness/damping, exact ease curves, linear
  vs. ease-in stagger) are picked at implementation time; the
  `web-animation-design` skill is the tier-2 reference for this slice (PRD
  Further Notes).

## Acceptance criteria

- [x] After the Goal is met, all 5 Sheep enter the Outro phase — assert via a
      data attribute or via Motion's exposed lifecycle, observable through the
      `createAppRouter` boundary.
- [x] Stagger is observable: the Sheep don't all flip into Outro on the same
      tick; their entry times step left-to-right. Test the ordering and rough
      spacing; do not assert exact ms (Motion timing is on-device).
- [x] `onComplete` is called exactly once, at Outro entry, per the ADR-0001
      amendment.
- [x] Combined with slice #2: the Shell's celebration overlay and the
      animating Sheep are both present in the DOM during the Outro window.
- [ ] On-device check: the ending feels like a shared moment between the
      celebrating Sheep and the Shell's confetti — not a sudden screen swap.
      Story 3 is the test.

## Notes

- Depends on the layered-concurrent contract (#2), the backdrop the Sheep
  jump against (#3), and the recoloured Sheep with the glow primitive (#4).
- The Shell's `CELEBRATION_MS` extension to ~2200ms lives in slice #6, not
  here. With the old 600ms `CELEBRATION_MS` the end state will appear before
  the Outro finishes — that's expected interim state, fixed by slice #6.
- Sky-shift during the Outro (dawn → sunrise warm wash) is explicitly out of
  scope at v1 — see PRD Out of Scope.
- Spec for the Outro is in PRD Implementation Decisions → "Counting Sheep
  Outro" (`../../prds/counting-sheep-polish.md`); architectural rule in
  `../../adr/0001-finite-success-only-toy-lifecycle.md`.
