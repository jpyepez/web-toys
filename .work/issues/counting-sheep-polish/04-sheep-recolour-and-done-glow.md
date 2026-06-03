---
slice: 4
title: Sheep recolour to dawn palette + done-state warm-gold glow
status: done
type: afk
blocked_by: [1]
parent_prd: counting-sheep-polish
stories: [2]
---

## What to build

The Sheep stop reading as bright cartoon stickers on the new dawn backdrop and
start sharing its palette family. Structurally they don't change; only their
fills do, and their done state stops being a flat colour swap and becomes a
warm-gold glow.

End-to-end through one vertical:

- Sheep retain their existing structural primitives — six-circle wool body,
  head ellipse, ears, eye dots, leg rects. The shape work from the parent PRD
  is not redone.
- Fills swap to the dawn palette: wool uses `sheep-wool`, silhouette parts use
  `sheep-silhouette`, both pulled from the design-tokens module.
- Done state becomes a warm-gold radial gradient blooming inside the wool
  circles, using the `done-state-glow` token. Critically, the glow is layered
  inside the existing wool fill, not a replacement colour — tapping a Sheep
  should read as "warm light caught it", not "the colour changed".
- Sheep get scattered along the foreground grass line (from slice #3) with
  small x-variation and scale jitter for depth.

## Acceptance criteria

- [x] All fills in the Sheep components route through the design-tokens module
      — no hardcoded colour strings.
- [x] Existing Sheep tap → done-state toggle test still passes; extend if the
      new SVG structure needs it (the structural toggle remains
      unit-testable; the glow itself is on-device only).
- [x] Goal → `onComplete` test still passes — tapping all 5 Sheep still fires
      Completion correctly.
- [ ] On-device check: tapping a Sheep reads as warm light catching the wool,
      not as a flat colour swap. Story 2 is whether the child can see they made
      it happen without a hard graphic change.

## Notes

- Pure-silhouette and fully-redrawn Sheep are explicitly rejected — see PRD
  Out of Scope. 3-year-old recognition wins over Gris silhouette discipline.
- Glow rendering uses SVG features jsdom doesn't compute — visual correctness
  is on-device per the PRD's Testing Decisions.
- Spec for the recolour and the glow is in PRD Implementation Decisions →
  "Counting Sheep meadow" (`../../prds/counting-sheep-polish.md`).
- The Outro choreography (the staggered jump) is slice #5, not here. This
  slice's Sheep stand still after they're tapped.
