---
slice: 6
title: Idle-triggered ghost-finger demo
status: done
type: afk
blocked_by: [4]
parent_prd: muddy-puddle
stories: [6]
---

## What to build

Wordless discoverability: if a child doesn't know what to do, the Toy **shows**
them how to wipe. If no wipe happens within ~2–3s of a Critter settling, a
translucent **ghost finger** sweeps across the mud and one or two blobs
**lift-and-reform** to demonstrate the cause-and-effect — then it loops until the
child wipes, and re-prompts on any Critter where they stall.

- An idle timer (~2–3s, on-device-tuned) that arms once a Critter is settled in
  `wiping` with no contributing wipe yet.
- On fire: a demo-active state drives a translucent ghost-finger sweep across the
  mud; one or two blobs **lift and then reform** (they demonstrate, they do
  **not** give real progress — the demo teaches honestly without playing the toy
  for the child).
- A real wipe **cancels/suppresses** the demo immediately; the demo re-arms /
  re-prompts if the child stalls again on a later Critter.
- Honour **reduced-motion** for the demo sweep (as Sheep/Fish honour it).

## Acceptance criteria

- [x] After the idle delay with no wipe, the demo is **active** (observable
      state/flag).
- [x] A real wipe **cancels/suppresses** the demo.
- [x] The demo's blobs **reform** — it does **not** advance the cleaned count or
      move the threshold (assert at the state/flag level).
- [x] The demo re-arms on a later Critter where the child stalls.
- [x] Public-interface tests pass; no internal mocks.
- [ ] On-device check (mine): a ghost finger appears after ~2–3s of no wiping,
      visibly shows the wipe, and disappears the instant the child wipes.

## Notes

- Test by **observable effect, not visuals**: the demo-active flag, that a wipe
  cancels it, and that demo blobs reform without advancing progress. The
  ghost-finger animation itself is on-device-tuned — do not unit-assert it.
- This demo is, for now, **local to this Toy** — do **not** pre-abstract it into
  a shared primitive ([[shared-toy-loop-abstraction]] is the cautionary
  precedent). If a future gesture Toy needs the same wordless-teaching pattern,
  revisit then.
- Idle delay (~2–3s) is on-device-tunable per the kid-handoff DoD. Implemented as
  `IDLE_DEMO_DELAY_MS` in `MuddyPuddle.tsx` (2500ms placeholder); the ghost-finger
  sweep/puff offsets + timing live in `GhostFinger.tsx`, both tuned on-device.
- AC #6 (on-device: finger appears after ~2–3s, shows the wipe, vanishes the
  instant the child wipes) is the human gate and is still **pending** — there is
  no live route to the Toy until slice #08 (`registry-entry-card-preview`) wires
  its Card in, so the on-device pass happens once #08 lands. All flag-level ACs
  (#1–#5) are green.
