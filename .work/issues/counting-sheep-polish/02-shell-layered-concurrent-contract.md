---
slice: 2
title: Shell layered-concurrent lifecycle — Toy stays mounted through Completion
status: done
type: afk
blocked_by: []
parent_prd: counting-sheep-polish
stories: [3]
---

## What to build

The Shell lifecycle change recorded in the ADR-0001 amendment
(`../../adr/0001-finite-success-only-toy-lifecycle.md`). Before this slice, the
Toy is unmounted the moment `onComplete` fires and the Shell renders its
celebration alone. After this slice, the Toy remains mounted; the Shell's
celebration overlay renders as a sibling above it. `onComplete` stays a one-shot
signal — no new contract surface on the Toy side.

End-to-end through one vertical:

- ToyHost (or whatever currently owns Toy mount/unmount around `onComplete`) is
  modified so the Toy's render output stays in the tree through the celebration
  window and is only removed when the user chooses replay or back.
- The Shell celebration overlay (existing confetti burst + heading) now renders as
  a sibling layered above the still-mounted Toy.
- Toys that don't react to their own goal-met state continue to "just work" —
  they render their final frame underneath the overlay. No required new behaviour
  on the Toy contract.

## Acceptance criteria

- [x] Test through the `createAppRouter` boundary: after a Toy fires `onComplete`,
      the DOM contains both the Toy's content **and** the Shell's celebration
      overlay simultaneously. This is the architectural assertion slice #5 (Outro)
      depends on.
- [x] Existing Completion tests still pass: end state (replay / home) still
      appears after `CELEBRATION_MS`; mute, navigation, and chrome are unaffected.
- [x] No Toy code change is required for a Toy to remain working under the new
      contract — verify by leaving Counting Sheep's current behaviour untouched in
      this slice and watching it still complete cleanly.

## Notes

- This slice ships a contract change with no new visuals. It's vertical because
  it asserts end-to-end through the router boundary and unblocks Outro work.
- Don't mock internal Shell collaborators. Render through `createAppRouter` per
  the parent PRD's mocking-policy rule.
- The PRD calls this out in Implementation Decisions → "Shell lifecycle"
  (`../../prds/counting-sheep-polish.md`).
- `CELEBRATION_MS` extension belongs in slice #6, not here. This slice keeps the
  current duration — only *who is mounted* changes.
- **On-device regression caught + fixed during the mobile-rethink PRD's
  kid-handoff DoD** (commit `6b44dc4`, `fix(shell): Completion as viewport
  overlay …`). This slice's layered-concurrent refactor turned `Completion`
  from "the only thing in `.shell-frame`" into "a sibling rendered AFTER
  the Toy's `<main minHeight: 100dvh>`" — but `Completion.tsx`'s outer
  container stayed at `position: relative` with no dimensions. That
  combination landed the celebration below the visible viewport on phone
  (Confetti's `inset: 0` then covered only the content-sized box, also
  invisible). Tests passed because `findByText('You did it!')`
  returns a DOM node whether onscreen or 1500px below the fold — jsdom
  doesn't compute layout. Fix: outer container to `position: fixed;
  inset: 0`, flex-centred. Stacking holds against the existing layered-
  concurrent contract (Completion above the Toy at z=-1 backdrop, below
  the ChromePills at z-index: 10).
