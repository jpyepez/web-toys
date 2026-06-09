---
slice: 9
title: Registry entry + Card preview — fish on Home
status: done
type: afk
blocked_by: [7, 3, 5]
parent_prd: puffer-fish
stories: [6]
---

## What to build

Put the Puffer Fish on the Home screen: add its registry entry and ship its tiny
inline SVG preview-scene so the Home now reads as a small *collection* of two
visually distinct Toys rather than a single experience. This is the slice that
makes the whole Toy reachable and delivers the parent-facing story.

End-to-end through the registry/Home vertical:

- Add the `puffer-fish` entry to the Toy registry — `id`, `title`, `component`
  (the `PufferFish` from slice #07), `tint` (a concrete ocean-palette color
  string per slice #03's contract), and `preview`. Additive only: nothing else
  in the Shell changes (the registry contract).
- A Puffer Fish `Preview` component — a miniature underwater scene with the
  round fish, drawn inline from SVG primitives, the way Counting Sheep ships its
  meadow `Preview`. Sourced from the ocean palette (slice #05) and reusing the
  Critter/scene vocabulary so the Card art coheres with the live Toy.

## Acceptance criteria

- [x] The registry has a `puffer-fish` entry with `id`, `title`, `component`,
      a `tint` color string from the ocean palette, and a `preview`.
- [x] Home renders two Cards (Counting Sheep + Puffer Fish), and tapping the
      Puffer Fish Card routes to its Toy (assert via the Home/router test
      pattern).
- [x] The Puffer Fish `Preview` renders a miniature underwater scene with the
      round fish, from SVG primitives, sourced from the ocean palette.
- [x] The Puffer Fish Card tint comes from a color string (no shared-palette
      key), confirming the slice #03 contract end-to-end with a real second Toy.
- [x] On-device check (mine, before marking done): on a 390×844 phone the two
      Cards read as a varied collection — the fish Card is unmistakably a
      different world from the sheep Card (water vs meadow).

## Notes

- This is the slice that exercises the ADR-0004 migrations against a real second
  Toy: the fish declares its `tint` as its own color string (slice #03) and
  ships its own palette + preview (slices #05/#06), adding nothing to the shared
  modules — exactly the independence the ADR pins.
- Blocked by #07 (needs the `PufferFish` component to register), #03 (the
  `tint` → color-string contract), and #05 (the ocean palette + Critter the
  preview draws from).
- The preview is a static inline SVG, not the live loop — same posture as the
  Sheep preview; visual coherence with the live Toy is on-device per the PRD
  Testing Decisions.
- Adding the entry must not touch the Shell, the Completion overlay, or the
  Sheep mechanic beyond what the migrations already changed (PRD Out of Scope).
