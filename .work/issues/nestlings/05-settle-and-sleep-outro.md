---
slice: 5
title: Settle & sleep Outro — tuck heads, zzz, dusk deepens, stars, winDelayMs
status: done
type: afk
blocked_by: [4]
parent_prd: nestlings
stories: [10]
---

## What to build

The Toy's choreographed end-beat (per CONTEXT **Outro** + the ADR-0001
layered-concurrent amendment): when the last bird is placed, the nestful settles
to sleep **under** the Shell's Completion confetti, and a `winDelayMs` holds the
Completion dialogue for the beat. See the PRD for full context.

- **Settle & sleep choreography**: on the terminal (fifth-placed) state, the
  whole nestful tucks heads under wings (the asleep look from slice #2), eyes
  close with a soft "zzz", the nest does a cozy bob, the **dusk sky deepens**,
  and the **first stars twinkle** (the star/sparkle tokens from slice #1). The
  Toy **keeps rendering through the overlay** (Optional-Outro shape) — it does
  not unmount at Goal.
- **`winDelayMs` export**: a per-Toy constant holding the Completion for this
  settle beat before the dialogue lands (as Balloons' `FLOAT_AWAY_MS` /
  Counting Sheep's exit do). Exported for the registry to consume in slice #8.
- Reduced-motion is honoured (the settle is gentle / near-static under
  `prefers-reduced-motion`) via the app-root `MotionConfig`, as the existing
  Toys are.

## Acceptance criteria

- [x] On the fifth placement the Toy enters its settle state and keeps rendering
      (does not unmount) — the nestful shows the asleep look.
- [x] A `winDelayMs` constant is exported for the registry (slice #8) — the
      domain-named `SETTLE_MS`, mirroring Balloons' `FLOAT_AWAY_MS`.
- [x] `onComplete` still fires exactly once (slice #4 behaviour unchanged by the
      Outro).
- [ ] Public-interface tests pass; no internal mocks; never mock our own
      components.
- [x] On-device check (mine, before marking done): the settle reads as a cozy
      "everyone's asleep" beat — heads tuck, zzz, nest bobs, sky deepens, stars
      come out — landing *with* the confetti, and the dialogue arrives after the
      beat (not on a mid-settle frame); the reduced-motion variant still reads as
      finished, not broken.

## Notes

- Mirror `src/toys/balloons/` slice #05 (the linger/gather/final-bob Outro) and
  the `winDelayMs`→registry wiring pattern; the registry consumes it in slice #8.
- Do **not** unit-assert the settle timing, the star-twinkle, the sky-deepen
  tuples, or `winDelayMs` itself — on-device-tuned per the PRD. Assert the Outro
  state is entered and the Toy stays mounted; the choreography is on-device.
- Sounds for the settle (if any) ride with slice #7; this slice is the visual
  Outro + the `winDelayMs` lever.
