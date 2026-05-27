---
slice: 4
title: Always-visible Home control — ungated, non-destructive mid-play exit
status: in-progress
type: afk
blocked_by: [1]
parent_prd: shell-counting-sheep
stories: [6]
---

## What to build

A persistent **Home control** the Shell renders whenever a Toy is mounted, so the child can
leave at any time mid-play. End-to-end: Shell chrome → tap → navigate to launcher → re-entry
is fresh.

- While any Toy is mounted (during play, before Completion), an always-visible Home control
  is present.
- Tapping it returns to the home launcher immediately — **no gate, no confirmation dialog**
  (decided against a parental gate; PRD Out of Scope).
- Abandoning is **non-destructive**: re-entering the Toy starts it fresh (re-entry is free).

## Acceptance criteria

- [x] The Home control is visible while a Toy is mounted, before Completion.
- [x] Tapping it returns to the launcher with no intermediate confirmation/gate.
- [x] Re-entering the Toy after a mid-play exit starts from a clean state (no carried-over
      done Sheep).
- [x] Tests drive the public surface: launch a Toy, tap some Sheep, tap Home → assert
      launcher; re-enter → assert fresh state. No internal mocks.

## Notes

- Structurally this only needs a mounted Toy route (slice #1), but it's most meaningful to
  validate against the real playable Sheep (#2). Sequence it after #2/#3.
- Placement should not overlap the Sheep tap targets — it's reachable by the parent/child
  but shouldn't steal taps meant for Sheep. Final placement is design polish.
- Distinct from the end-state Home button (#3): that one appears *after* Completion; this
  one is available *during* play.
- Non-destructive exit is part of the CONTEXT lifecycle definition.
