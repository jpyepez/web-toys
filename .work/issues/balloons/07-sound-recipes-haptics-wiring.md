---
slice: 7
title: Sound recipes (rising-pitch pips, pop, raspberry) + haptics
status: done
type: afk
blocked_by: [3]
parent_prd: balloons
stories: [8]
---

## What to build

The Toy's **own local sound recipes** consumed via the Shell's `play(voice)`,
plus haptics — wired through the contract. The fill-pip-at-rising-pitch is the
one genuinely **new sound shape** in the collection. **No new Shell↔Toy surface
and no sustained start/stop/set-pitch Sound API** — the rising-pitch feedback is
built from throttled one-shots, the same stance Muddy Puddle took for its squelch
(see Out of Scope).

- A local `sounds.ts` (analog to muddy-puddle's) defining recipes played via the
  contract's `sound` — the Toy **never imports Web Audio directly** (ADR-0003):
  - a short **fill "pip"** voice whose **pitch is a function of current fill %**
    (so rapid pips read as a rising tone), **throttled** (min interval + slight
    jitter) so it is not an unbounded per-frame stream;
  - a **pop/"boing"** on detach;
  - a descending **raspberry** on an early-lift leak.
- **Haptics**: `haptics?.tick()` fires while filling (denser as it nears full,
  throttled with the pips) and a pulse on detach.
- Wire these into the mechanic/loop (slices #3/#4): pips while held, pop on
  detach, raspberry on early-lift leak.

## Acceptance criteria

- [x] The Toy calls `sound.play(...)` for fill pips (while held), the detach pop,
      and the early-lift raspberry — asserted by injecting a fake through the
      contract.
- [x] Fill pips are **throttled** (rate-limited, not one-per-frame unbounded).
- [x] `haptics.tick()` fires while filling and a pulse on detach — fakes injected
      through the contract.
- [x] At the Web Audio boundary (the way `baa`/`puff` are tested): inject a fake
      `AudioContext` via the engine's `contextFactory` and assert an oscillator
      started; `play` **no-ops when muted** and when no context exists (jsdom).
- [x] No sustained start/stop/set-pitch Sound API is added to the Shell; the
      pitch ramp is throttled one-shots only.
- [x] Public-interface tests pass; shim **only** the Web Audio boundary; never
      mock our own components.
- [ ] On-device check (mine): holding produces a rising tone of little pips, a
      satisfying pop on float, and a funny raspberry on an early lift.

## Notes

- Mirror `sounds.ts` / `sounds.test.ts` and `sound-haptics-wiring.test.tsx`.
- Do **not** unit-assert sound frequencies, the fill%→pitch mapping, the throttle
  interval, or jitter — on-device-tuned. Assert *that* pips are throttled and
  *that* play is called, not the numbers.
- Audio watch-item (PRD): if throttled one-shots read too "steppy" on-device,
  revisit whether a single parametrized voice warrants a small, carefully-scoped
  Sound API addition — but **default** to the throttled-one-shot stance; do not
  expand the Shell audio surface speculatively.
