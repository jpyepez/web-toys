---
slice: 7
title: Sound recipes + haptics wiring
status: done
type: afk
blocked_by: [4]
parent_prd: muddy-puddle
stories: [7]
---

## What to build

Make the wipe feel and sound alive. The Toy defines its **own** local sound
recipes (per ADR-0004), played through the Shell's injected `sound.play(voice)`
primitive — the Toy **never** imports Web Audio directly (ADR-0003). Haptics ride
the same beats via the injected `haptics?.tick()`.

- A short wet **squelch** voice played per blob cleared, but **throttled** (min
  ~60–80ms apart, on-device-tuned) with **pitch jitter** so it reads as playful,
  not a machine-gun.
- A **sparkle** voice on the clean-snap.
- A distinct **happy per-animal voice** on each reveal (oink / quack / baa /
  peep / moo) — keyed to which Critter just snapped clean.
- `haptics?.tick()` on contributing wipes (throttled with the squelch) and/or the
  snap, matching the tactile feel of the tap toys.
- All recipes are built from the existing one-shot `play(voice)` primitive — this
  slice adds **no** sustained start/stop sound API to the Shell.

## Acceptance criteria

- [x] The Toy calls `sound.play(...)` for a contributing wipe (squelch) and for
      the clean-snap (sparkle + the per-animal reveal voice).
- [x] Rapid wipes are **throttled** — squelch sounds are rate-limited, **not**
      one-per-blob unbounded (assert the rate limit, not exact frequencies).
- [x] `haptics.tick()` fires on contributing wipes/snap (inject a fake `Haptics`
      through the contract).
- [x] At the Web Audio boundary (the way the tap toys test `baa`/`puff`): inject
      a fake `AudioContext` via the engine's `contextFactory` and assert an
      oscillator started; `play` **no-ops** when muted and when no context exists
      (jsdom).
- [x] `sound`/`haptics` are optional — a bare mount degrades to silence (no crash).
- [x] Public-interface tests pass; shim **only** the Web Audio boundary and inject
      fakes through the contract; never mock our own components.
- [ ] On-device check (mine): wiping gives playful (not machine-gun) squelches, a
      sparkle + the right animal voice on the snap, and a tick under the finger.

## Notes

- Mirror `src/toys/puffer-fish/sounds.ts` + `sounds.test.ts` and slice #08's
  sound/haptics wiring posture (every contributing wipe gets feedback; the
  `wiping`-only guard blocks the *state advance*, not the feedback).
- Do **not** unit-assert sound frequencies, the exact throttle interval, or the
  pitch-jitter range — on-device-tuned. Assert that throttling happens and that
  the right calls fire.
- No sustained "rubbing" sound — one-shot throttled squelches only (ADR-0003/0004,
  PRD Out of Scope).
