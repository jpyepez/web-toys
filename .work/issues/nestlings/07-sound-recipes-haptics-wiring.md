---
slice: 7
title: Sound recipes + haptics wiring — chirp / throttled flutter / coo / plip / ticks
status: done
type: afk
blocked_by: [4]
parent_prd: nestlings
stories: [9]
---

## What to build

The Toy's own local sound recipes (per ADR-0004), consumed via the Shell's
`play(voice)`, plus the haptic ticks — wired into the mechanic's existing
call-sites (slices #3/#4). The Toy never imports Web Audio directly (ADR-0003).
See the PRD for full context.

A local `sounds.ts` defining the voices, wired at the lifecycle events:

- **Pickup chirp** — a rising voice on pickup.
- **Wing-flutter** — a soft voice while carried, **throttled** (a min interval)
  so a fast drag isn't a machine-gun stream (mirrors Balloons' pips / Muddy
  Puddle's squelch).
- **Nestle coo** — a cozy descending voice on a **nest drop**.
- **Loose plip** — a soft, neutral voice on a **loose drop** (never a
  failure/error tone — ADR-0001).
- **Haptics**: `haptics?.tick()` fires on **pickup** and on **nestle**.

All voices are defined locally and played through the injected `sound.play(...)`
contract; the Toy adds nothing to the shared audio module.

## Acceptance criteria

- [x] The Toy calls `sound.play(...)` for the **pickup chirp**, the **nestle
      coo**, and the **loose-drop plip** at their respective lifecycle events.
- [x] The carry **wing-flutter** is **throttled** (rate-limited, not one-per-move
      unbounded) — asserted as rate-limited under a burst of moves.
- [x] `haptics.tick()` fires on **pickup** and on **nestle** — via injected fakes
      through the contract.
- [x] At the Web Audio boundary (fake `AudioContext` via the engine's
      `contextFactory`): an oscillator starts when a voice plays; `play` no-ops
      when **muted** and when **no context exists** (jsdom).
- [x] The Toy never imports Web Audio directly (ADR-0003) — only the injected
      `sound` contract.
- [x] Public-interface tests pass; shim only the Web Audio boundary; inject
      fakes through the contract; never mock our own components.
- [ ] On-device check (mine, before marking done): pickup chirps + ticks, carry
      flutters gently (no machine-gun on a fast drag), a nest drop coos + ticks,
      a loose drop plips softly (never reads as an error); all respect mute.

## Notes

- Mirror `src/toys/balloons/sounds.ts` + `sounds.test.ts` +
  `sound-haptics-wiring.test.tsx` for the recipe shape and the
  `contextFactory`/mute/no-context boundary tests.
- Do **not** unit-assert sound frequencies/pitches — on-device-tuned. Assert the
  call happens, the flutter is throttled, the ticks fire, and the muted/no-context
  no-ops hold.
- The call-sites were left obvious in slices #3/#4; this slice fills them in. No
  new Shell↔Toy surface — the `sound?` / `haptics?` props are the existing
  contract.
