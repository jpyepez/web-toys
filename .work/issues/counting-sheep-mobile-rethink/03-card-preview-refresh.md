---
slice: 3
title: Card preview refresh to match the redesigned live Toy
status: in-progress
type: afk
blocked_by: [2]
parent_prd: counting-sheep-mobile-rethink
stories: []
---

## What to build

Update Counting Sheep's Home Card preview so the miniature scene reads as
coherent with the redesigned live meadow (slice #02): two-tone hills, a
couple of stars in the upper sky, one centred Sheep in place of the two
side-by-side miniatures the polish PRD shipped. The Card mechanism itself
(slice #07 of the polish PRD) is unchanged — only the SVG inside the
preview slot updates.

End-to-end through one vertical:

- `src/toys/counting-sheep/Preview.tsx` rewritten:
  - Solid sky band (`palette.skyUpper`) — same as today
  - Two-to-three small stars in the upper sky (`palette.sheepWool`) —
    mirrors slice #02's live meadow stars at miniature scale
  - Half-moon — kept (single atmospheric detail at miniature scale)
  - Distant hill in `palette.hillDistant`, scenery silhouette in
    `palette.scenery`, foreground hill in `palette.hillNear` —
    layered identically to slice #02's live MeadowBackdrop
  - One centred miniature Sheep on the foreground hill line (not two
    side-by-side) — same `MiniSheep` two-tone primitive (wool body +
    silhouette head), positioned at viewBox centre
- ViewBox stays `0 0 100 60` so the slot dimensions in `Card.tsx` and
  the `aspect-ratio: 5 / 3` rule are unchanged
- Component API stays the same — `export function Preview()` from the
  same path; the registry entry needs no change

## Acceptance criteria

- [ ] `Preview` still exports from `src/toys/counting-sheep/Preview.tsx`
      with no prop changes (the registry entry from the polish PRD's
      slice #07 still imports it unchanged).
- [ ] The existing slice-#07 (polish PRD) Card test
      `renders the Toy's declared preview-scene inside its Card` still
      passes — Preview mounts inside the Card slot.
- [ ] On-device check (mine, before re-marking done): the Card's
      preview vignette reads as a believable miniature of the
      redesigned live meadow — two-tone hills, stars, one centred
      Sheep — on a 390×844 phone viewport.

## Notes

- No new unit tests required. The Preview's visual coherence with the
  live Toy is on-device per the PRD's Testing Decisions ("the visual
  coherence of the Card preview against the redesigned live Toy" is
  listed as on-device-only).
- Smallest slice in the PRD — depends on #2 because the visual
  language (two-tone hills + scenery + stars) comes from there. If
  this slice ships before #2's live meadow lands, the Card would
  preview a scene the kid then meets *differently* in the Toy, which
  is the exact coherence gap the polish PRD's slice #07 Testing
  Decisions warned against.
- After this slice the PRD-level DoD kicks in: the child plays the
  redesigned Counting Sheep at least once and reaches Completion, on
  the actual phone, without confusion (PRD Testing Decisions).
- The deferred shared `renderApp` test-helper extraction
  (`../../notes/shared-render-app-test-helper.md`) is still on the
  list of follow-up debt — slice #01 in this PRD likely adds another
  clone too. Treat as a tiny post-PRD refactor pass once both PRDs
  wrap.
- Spec for the Card preview's composition is in PRD Implementation
  Decisions → "Counting Sheep preview"
  (`../../prds/counting-sheep-mobile-rethink.md`).
- **Preview rewritten twice during slice #02's on-device journey**
  (commit `869782d`, `refactor(preview): mirror redesigned day
  meadow`). The slice originally landed as a miniature dusk meadow
  (two-tone hills + stars + half-moon + one centred MiniSheep,
  replacing the polish PRD's two side-by-side miniatures). Slice #02's
  on-device review then rebuilt the live meadow to a cottage + fir
  cluster scenery, and the preview followed (mini cottage + small
  firs + warm-lit window). Slice #02's *second* on-device round
  pivoted dusk → day; the preview followed again (cyan sky + 2 small
  cloud clusters + tree + day palette). The slice's own AC #1 (export
  shape unchanged) + AC #2 (slice-#07 Card sentinel test still
  passes) held through every rebuild — only the SVG body inside the
  same `export function Preview()` changed. Visual coherence with the
  live Toy at each stage was the on-device test (AC #3), which is
  exactly the loop the PRD's Testing Decisions designed.
