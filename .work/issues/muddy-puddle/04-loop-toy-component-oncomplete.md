---
slice: 4
title: Loop + Toy component (5-state machine, onComplete, splash Outro)
status: done
type: afk
blocked_by: [3]
parent_prd: muddy-puddle
stories: [1, 4, 5, 8]
---

## What to build

The playable `MuddyPuddle` Toy: it owns its **own copy** of the five-state loop
(duplicated from the tap toys, **not** shared — the deliberate cost of Toy
independence, [[shared-toy-loop-abstraction]]), composes the slice #3 wipe
mechanic over the slice #1 backdrop, and fires `onComplete()` once when the Goal
is met. The heart of the Toy — it plays end-to-end through the standard
Shell↔Toy contract. Uses the **single piglet** ×5 here; the variety cast is
slice #5 (mirrors how Puffer Fish's loop reused one fish drawing).

- The Toy's own five-state machine: `arriving → wiping → dismissing → idle →
  completed` (the user-driven beat is named `wiping` in this Toy's private copy,
  vs the tap toys' `waiting`). The **only** user-driven transition is the wipe
  crossing the threshold (`wiping → dismissing`, consuming slice #3's
  "clean reached" observable); the rest are time-driven beats (own copies of the
  named durations, on-device-tuned).
- Arrival is a muddy **trot-in from the side**; dismiss is a happy **trot-off**.
- One Critter on stage at a time, composed over `<BarnyardBackdrop/>`. Critter
  sits **upper-center** (clear of the bottom palm-rest dead zone), target large
  (≥ ~2cm).
- Goal: clean **five** Critters. `onComplete` fires **once**, ref-guarded, at
  the clean-snap of the **fifth** Critter, so the Shell's Completion overlay runs
  concurrently with the last Critter's exit (layered-concurrent rule, ADR-0001
  amendment). The fifth dismiss lands in terminal `completed` — no further
  Critters mount.
- **Splash Outro** (folded in here): the fifth/last Critter's goal-met dismiss is
  a **splash for joy in the now-clean puddle** — the on-stage-only Outro, layered
  under the Shell's Completion (matches Puffer Fish putting its float-up Outro in
  the loop slice). Honour reduced-motion for the splash (as Sheep/Fish do).
- Takes the standard `{ onComplete, sound?, haptics? }` props. Sound/haptics
  wiring is slice #7 — this slice may leave those utilities unwired/stubbed so
  the loop contract is the focus.

Observables for tests:

- `data-toy-state` on the Toy root exposes the current state.
- The on-stage Critter is reachable as an accessible element.
- Wipe-progress exposed via the slice #3 `data-*` hook so tests drive progress to
  the threshold without reading pixels.

## Acceptance criteria

- [x] At most one Critter is on stage at any time (zero during `idle`).
- [x] Simulating wipes that cross the threshold during `wiping` advances to
      `dismissing` and increments the cleaned count; the clean-snap removes
      remaining blobs.
- [x] Wipes during `arriving` / `dismissing` are non-destructive **no-ops** — no
      count advance, no early arrival, no `onComplete`.
- [x] After the fifth clean the state is terminal `completed` and **no further
      Critters mount**.
- [x] `onComplete` fires **exactly once** — ref-guarded against the Shell
      re-rendering a new `onComplete` reference at Completion (assert a single
      call settling past the fifth clean).
- [x] The loop owns its own state machine in the muddy-puddle folder — no shared
      loop hook/module is introduced or imported.
- [ ] On-device check (mine): on a 390×844 phone a muddy piglet trots in, wipes
      clean + snaps, the next trots in, the fifth splashes in the puddle under the
      Completion, and ~5 critters reads as ~15–30s of play.

## Notes

- Loop duplication is intentional — a shared/extracted Toy-loop hook is
  explicitly rejected ([[shared-toy-loop-abstraction]]). Duplicate the structure
  from `src/toys/puffer-fish/PufferFish.tsx`; do not refactor the two into one.
- ADR-0001 amendment (layered-concurrent): `onComplete` fires at the clean-snap
  of the fifth Critter so the Completion overlay layers over the splash Outro;
  the Toy stays mounted through both.
- Motion transform-ownership gotcha (user-memory `motion-transform-ownership`):
  the on-stage Critter's centring `translateX(-50%)` lives on a static non-Motion
  wrapper; the `motion` element carries only its `x`/`y`/`scale` deltas — variant
  transforms clobber inline centring.
- Time-driven transitions tested with `vi.useFakeTimers()`; use `fireEvent`
  (not `userEvent`, which hangs under fake timers in Vitest 4) — same posture as
  the Sheep/Fish loop tests.
- Do **not** unit-assert the trot-in/splash paths, snap scale, or timing tuples —
  on-device-tuned. Assert the observable loop contract only.
- No fail/lose/stuck beat and no timer cutoff — the Critter always comes clean
  and trots off happy (ADR-0001; PRD Out of Scope).
- Still single-piglet here; the shuffled five-animal cast is slice #5.
