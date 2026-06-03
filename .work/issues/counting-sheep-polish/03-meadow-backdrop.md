---
slice: 3
title: Counting Sheep meadow backdrop — dawn sky, half-moon, grass silhouettes
status: done
type: afk
blocked_by: [1]
parent_prd: counting-sheep-polish
stories: [1]
---

## What to build

The Counting Sheep Toy stops reading as "a white page with sheep on it" and starts
reading as a *place at dawn*. The Sheep themselves are out of scope here (slice
#4) — this slice is the world they stand in.

End-to-end through one vertical:

- Sky as a vertical linear gradient using the design tokens' `sky-upper` →
  `horizon-glow` palette values.
- One low-contrast pale half-moon in the upper sky.
- Two layered grass silhouettes — a distant one and a foreground one — covering
  the lower ~40% of the viewport, using the design tokens' `grass-silhouette`.
- Sheep continue to render in their current positions/structure for now; only the
  backdrop behind them changes. The reposition-along-the-foreground-grass-line
  work happens in slice #4 where the Sheep are already being touched.

Composition is mostly negative space. The grilled decision was stillness with one
atmospheric detail (the half-moon) over a busier scene.

## Acceptance criteria

- [x] Counting Sheep route renders the backdrop layers (sky, moon, grass) sourced
      entirely from the design-tokens module — no hardcoded HSLs in the scene.
- [x] Existing Sheep tap → done-state and Goal → `onComplete` tests still pass —
      the backdrop additions don't break anything underneath.
- [ ] On-device check: opening the Toy feels like arriving in a place at dawn,
      not loading a page. Per the PRD's slice-level DoD, this is the visual
      review that closes the slice.

## Notes

- Visual / CSS / SVG correctness is on-device per the PRD's Testing Decisions —
  jsdom's cssstyle parser drops gradients and filters, mirroring the lesson from
  parent PRD slice #07.
- Idle ambient motion (drifting clouds, pulsing moon, blinking Sheep) is
  explicitly out of scope — see PRD Out of Scope.
- Spec for the scene composition is in PRD Implementation Decisions →
  "Counting Sheep meadow" (`../../prds/counting-sheep-polish.md`).
- The Sheep don't get repositioned along the foreground grass line until slice
  #4 — until then they continue rendering where they currently do.
