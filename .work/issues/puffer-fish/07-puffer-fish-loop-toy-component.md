---
slice: 7
title: Puffer Fish loop + Toy component (5-state machine, onComplete)
status: done
type: afk
blocked_by: [5, 6]
parent_prd: puffer-fish
stories: [1, 2, 3, 4]
---

## What to build

The playable Puffer Fish Toy: a `PufferFish` component that owns its **own copy**
of the five-state loop (duplicated from Counting Sheep, not shared — the
deliberate cost of Toy independence per the out-of-scope shared-loop rejection),
mounts the Critter on stage over the underwater backdrop, and fires
`onComplete()` once when the Goal is met. This is the heart of the Toy — it
plays end-to-end through the standard Shell↔Toy contract.

End-to-end through the loop vertical:

- The fish's own five-state machine: `arriving → waiting → dismissing → idle →
  completed`. The only user-driven transition is the tap (`waiting →
  dismissing`); the rest are time-driven beats (own copies of the named
  durations, on-device-tuned).
- Signature beat on tap: the fish flips to the puffed art (slice #05's `puffed`
  prop), scales up in place (a balloon ~1.6×, on-device-tuned) with a wobble,
  then translates **upward off the top of the screen with a fade** — buoyant,
  not a sideways slide, not a pop/destroy. Arrival is a swim-in from the side.
  Choreography consumes shared `timing` eases; exact tuples/offsets are
  on-device-tuned.
- One fish on stage at a time, composed over `<UnderwaterBackdrop/>`.
- Goal: pop ~5 fish (on-device-tuned to ~15–30s). `onComplete` fires once,
  ref-guarded, at the start of the Nth `waiting → dismissing` so the Shell's
  Completion overlay runs concurrently with the last fish's float-away (the
  layered-concurrent rule, ADR-0001 amendment). The Nth dismiss lands in
  terminal `completed` — no further fish mount.
- The component takes the standard `{ onComplete, sound?, haptics? }` props.
  Sound/haptics wiring on tap is slice #08 — this slice may leave the tap
  handler calling only the state advance (and the optional utilities unwired or
  stubbed) so the loop contract is the focus here.

Observables for tests (mirror the Sheep contract):

- `data-toy-state` on the Toy root exposes the current state.
- The on-stage fish is an accessible button labelled "Fish".

## Acceptance criteria

- [x] At most one fish is on stage at any time (`queryAllByRole('button', {
      name: 'Fish' })` length ≤ 1 across all states; zero during `idle`).
- [x] Tapping the fish in `waiting` advances to `dismissing` and increments the
      popped count; after the dismiss + intermission beats the next fish is
      queryable (assert via `data-toy-state` + fake timers).
- [x] Taps during `arriving` and `dismissing` are non-destructive no-ops — no
      count advance, no early arrival, no `onComplete`.
- [x] After N pops the state is terminal `completed` and no further fish mount.
- [x] `onComplete` fires exactly once — ref-guarded against the Shell
      re-rendering a new `onComplete` reference at Completion (assert a single
      call settling well past the Nth tap, the Sheep test's pattern).
- [x] The fish loop owns its own state machine in the Puffer Fish folder — no
      shared loop hook/module is introduced or imported.
- [x] On-device check (mine, before marking done): on a 390×844 phone the fish
      swims in, balloons + floats up off the top on tap, the next swims in, and
      ~5 fish reads as ~15–30s of play.

## Notes

- Loop duplication is intentional — a shared/extracted Toy-loop hook is
  explicitly rejected (`../../out-of-scope/shared-toy-loop-abstraction.md`).
  Duplicate the Sheep's machine structure; do not refactor the two into one.
- ADR-0001 amendment (layered-concurrent): `onComplete` fires at the *start* of
  the Nth dismiss so the Shell's Completion overlay layers over the last fish's
  float-away; the Toy stays mounted through both. See
  `../../adr/0001-finite-success-only-toy-lifecycle.md`.
- Motion transform-ownership gotcha (user-memory `motion-transform-ownership`,
  caught on the Sheep): the on-stage critter's centring `translateX(-50%)` must
  live on a static non-Motion wrapper, while the `motion` element carries only
  its `x`/`y`/`scale` deltas — variant transforms clobber inline centring. The
  fish's upward float is a `y` translate on the Motion element; keep centring on
  the wrapper.
- Time-driven transitions tested with `vi.useFakeTimers()`; use `fireEvent.click`
  (not `userEvent.click`, which hangs under fake timers in Vitest 4) — same
  posture as the Sheep loop tests.
- Don't unit-assert the puff scale, float-up path, swim-in offsets, or timing
  tuples — those are on-device-tuned per the PRD Testing Decisions. Assert the
  observable loop contract only.
- No fail/lose/pop-destroy beat and no timer cutoff — the fish always floats
  away happy (ADR-0001; PRD Out of Scope).

## Implementation decisions (slice #07)

- `PufferFish.tsx` owns its **own** five-state machine — duplicated from the
  Sheep's structure, no shared loop hook/module imported (only React,
  `ToyProps`, `timing`, and the local `FishDrawing` / `UnderwaterBackdrop`).
  AC #6 verified by import inspection.
- Tap handler is intentionally **unwired for sound/haptics** — slice #08 owns
  that. The component types its props as `ToyProps` (so it *takes* the standard
  `{ onComplete, sound?, haptics? }`) but only destructures `onComplete`; the
  tap does just the state advance + popped increment. Both optional utilities
  stay untouched here.
- Beat durations are placeholders pending the on-device tune (AC #7):
  `TIMING_ARRIVAL_MS=500`, `TIMING_DISMISS_MS=800`, `TIMING_INTERMISSION_MS=250`.
- Choreography (`fishVariants`): swim-in from the left (`initial x:-280`),
  balloon `scale` keyframe to ~1.6× with a wobble, then `y:-900` float up off
  the top with a fade — buoyant, not a sideways slide. Sources `timing.entrance`.
  Tuples/offsets NOT unit-asserted (on-device-tuned); only the observable loop
  contract (role button, `data-toy-state`, puffed-art swap) is tested.
- Transform-ownership gotcha applied: centring `translateX(-50%)` on a static
  wrapper `<div>`; the `motion.button` carries only `x`/`y`/`scale` deltas.
  `key={popped}` gives each fish a fresh identity so `initial` (swim-in) runs
  at every arrival.
- Not in this slice: registering the Toy in the Shell registry (no AC for it);
  the component is built and tested standalone.
