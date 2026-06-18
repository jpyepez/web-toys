---
slice: 5
title: Outro — linger, gather cluster, final all-five bob
status: done
type: afk
blocked_by: [4]
parent_prd: balloons
stories: [6, 9]
---

## What to build

The Toy's **Outro** — the choreographed end-beat that **intentionally diverges**
from Muddy Puddle's on-stage-only Outro (justified here because floated balloons
physically accumulate). A detached balloon rises but **slows and bobs near the
top of the sky**, gathering into a growing cluster; when the last balloon joins,
all five do a happy bob together under the Shell's Completion confetti.

- **Linger + gather**: instead of floating off-screen (slice #3/#4 behaviour), a
  detached balloon rises, **slows, and bobs near the top**, accumulating into a
  growing cluster with its already-floated friends. Add the `gathered` state to
  the per-balloon lifecycle (`floating → gathered`), exposed via the existing
  `data-*` state hook.
- The growing cluster reads as **wordless, diegetic progress** — it is *not* a
  tracked score/count ([[progress-and-gamification]]). No number, no meter.
- **Final bob**: when the fifth balloon joins the cluster, all five do a happy
  bob/wiggle together. This runs **under** the Shell's Completion overlay
  (`onComplete` already fired on the fifth detach in slice #4 — this slice does
  not change when it fires).
- **Reduced motion** is honoured for the float/gather and the final bob (as the
  existing Toys honour it for their Outros).

## Acceptance criteria

- [x] A floated balloon transitions `floating → gathered` (observable via the
      `data-*` state hook) — it lingers near the top rather than exiting.
- [x] When the fifth balloon gathers, all five are in the `gathered` state and
      the final-bob beat plays; the terminal state (slice #4) is preserved.
- [x] `onComplete` still fires exactly once and **on the fifth detach** (slice
      #4) — this slice does not move or duplicate it.
- [x] `prefers-reduced-motion` is honoured for the gather and the final bob.
- [x] No score/count/meta-layer is introduced — the cluster is diegetic scenery.
- [x] Public-interface tests pass; shim only the Web Audio boundary; never mock
      our own components.
- [ ] On-device check (mine): floated balloons visibly gather and linger at the
      top, and all five bob together happily under the confetti.

## Notes

- Test by the **state contract** (the `gathered` transition, all-five-gathered),
  not the choreography. Do **not** unit-assert the gather position, float/gather
  paths, or the final-bob tuples — on-device-tuned per the PRD.
- The all-five gather/bob is **not** a precedent the tap/wipe toys must follow —
  it's justified by the balloon physics here only.
- Motion choreography consumes the shared `timing` eases; exact tuples/offsets
  are on-device-tuned.
