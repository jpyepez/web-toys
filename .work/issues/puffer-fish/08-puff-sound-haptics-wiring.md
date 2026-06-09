---
slice: 8
title: Puff sound recipe + haptics wiring
status: done
type: afk
blocked_by: [7, 1]
parent_prd: puffer-fish
stories: [5]
---

## What to build

Give the tap its voice and buzz: a Puffer Fish local `puff` sound recipe — a
rising pitch-bend "inflate" — played through the shared `play(voice)` primitive
(slice #01), plus a `haptics.tick()` on the counting tap, matching how Counting
Sheep wires `baa()` + tick.

End-to-end through the audio/haptics vertical:

- A Puffer Fish local sounds module (e.g. `toys/puffer-fish/sounds.ts`)
  exporting the `puff` `Voice` — a rising pitch-bend (`bendTo` above `freq`)
  that reads as inflating, with a short envelope. Concrete frequency / bend /
  decay are on-device-tuned; the shape (rising bend) is load-bearing.
- The `PufferFish` tap handler calls `sound?.play(puff)` and `haptics?.tick()`
  on the counting tap (the `waiting` tap), alongside the state advance built in
  slice #07. Per the Sheep posture, the playful feedback may fire on every tap
  while only the `waiting` tap advances the loop.
- The Toy receives `sound` / `haptics` through the contract and never imports
  Web Audio directly (ADR-0003 holds via the `play(voice)` boundary).

## Acceptance criteria

- [x] A local `puff` `Voice` exists in the Puffer Fish folder with a rising
      pitch-bend (`bendTo > freq`).
- [x] The fish calls `sound.play(puff)` and `haptics.tick()` on a counting tap
      — assert via fakes injected through the contract (a fake `Sound` /
      `Haptics`), the way the Sheep sound/haptics wiring is tested.
- [x] `play(puff)` no-ops when muted and when no AudioContext exists (jsdom) —
      inherited from the slice #01 primitive; assert the fish path doesn't throw
      under a bare mount.
- [x] The fish imports no Web Audio API directly — audio only via the injected
      `Sound`.
- [x] On-device check (mine, before marking done): tapping a fish on a real
      device produces a soft rising "puff" + a little buzz that feels alive and
      responsive.

## Notes

- Blocked by #01 (the public `play(voice)` primitive the recipe rides on) and
  #07 (the tap handler the wiring hangs off).
- The `puff` recipe is the second consumer of `play(voice)` — the Sheep `baa`
  (slice #01) was the first. Neither sound lives on the shared engine (ADR-0004).
- ADR-0003: synthesized only, no audio files, never import Web Audio in a Toy.
  The one-shot `puff` voice is not Tone.js / real music (PRD Out of Scope). See
  `../../adr/0003-audio-synthesis-and-mobile-unlock.md`.
- Don't unit-assert the puff's frequency / bend / decay — those are
  on-device-tuned per the PRD Testing Decisions; assert that the fish *calls*
  `play(...)` and `tick()`, and test the primitive itself at the Web Audio
  boundary in slice #01.
- Mocking policy: shim only the Web Audio boundary and inject fakes through the
  contract; never mock our own components.
