---
slice: 1
title: baa() → Sheep-local recipe via a public play(voice) Sound primitive
status: done
type: afk
blocked_by: []
parent_prd: puffer-fish
stories: []
---

## What to build

Promote the Sound engine's internal `Voice` shape to a public `play(voice)`
primitive on the shared `Sound` API, and migrate Counting Sheep's `baa()` off
the shared engine into a Sheep-local sound recipe consumed through it. The
shared engine stops carrying Toy-specific sounds (ADR-0004); the Puffer Fish's
`puff` (slice #08) is the second consumer of the same primitive.

End-to-end through the sound vertical:

- Add `play(voice: Voice)` to the `Sound` type and `createSound(...)`
  implementation, exporting the `Voice` type. `play` wraps the existing
  private `playVoice(ctx, v)`: no-op when muted, no-op when no context
  exists (jsdom), otherwise starts an enveloped oscillator at the boundary.
- Add a Counting Sheep local recipe (e.g. `toys/counting-sheep/sounds.ts`)
  exporting the `baa` `Voice` — the same `{ type: 'sawtooth', freq: 380,
  bendTo: 300, bendOver: 0.18, peak: 0.3, decay: 0.25 }` the engine's `baa()`
  currently plays.
- `CountingSheep` calls `sound?.play(baa)` where it currently calls
  `sound?.baa()`.
- Remove `baa()` from the `Sound` type and engine. `celebrate()`, `unlock()`,
  `isMuted()`, `setMuted()` stay on the shared engine unchanged (Completion +
  mute are the Shell's per ADR-0001 / ADR-0004).

## Acceptance criteria

- [x] `sound.play(voice)` starts an oscillator at the Web Audio boundary —
      assert via the injected fake `AudioContext` (`contextFactory`), the way
      the existing `baa()` test asserts `oscillator.start` was called.
- [x] `sound.play(voice)` no-ops when muted and when no context exists
      (jsdom) — no throw, no oscillator started.
- [x] `Voice` is exported from the sound module and the `baa` recipe lives in
      the Counting Sheep folder, not the shared engine.
- [x] `baa()` is no longer a member of the `Sound` type or the engine.
- [x] Counting Sheep's existing tests still pass — tapping a Sheep still plays
      the bleat (now via `sound.play(baa)`) and still fires `haptics.tick()`.
- [x] `celebrate()`, `unlock()`, and the mute concerns remain on the shared
      engine and their tests still pass.

## Notes

- Mocking policy: shim only the Web Audio boundary via `contextFactory`; never
  mock our own components. Mirrors the existing `sound.test.ts` posture.
- ADR-0003 still holds: Toys never import Web Audio directly — the fish and the
  sheep both reach audio only through the injected `Sound`. See
  `../../adr/0003-audio-synthesis-and-mobile-unlock.md`.
- ADR-0004 is the driver: shared modules expose cross-Toy primitives only;
  per-Toy sounds live with the Toy. See
  `../../adr/0004-shared-modules-expose-primitives-toys-own-assets.md`.
- This is the first consumer migration of the new primitive; the fish `puff`
  (slice #08) is the second — that slice depends on `play(voice)` existing.
- No on-device check needed here — this is a behaviour-preserving refactor
  fully covered by the Web Audio boundary tests.
