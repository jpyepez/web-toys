---
slice: 3
title: Hold fill/leak/self-cap mechanic → detach + float (single balloon)
status: done
type: afk
blocked_by: [2]
parent_prd: balloons
stories: [2, 3, 4]
---

## What to build

The **Hold** — the second non-tap core interaction in the collection, and the
load-bearing mechanic of this Toy. End-to-end on a **single balloon**: press and
hold fills it, it self-caps at full and detaches + floats up; an early lift leaks
it slowly back down. **No bunch, no loop, no `onComplete` yet** (slice #4) — this
is the single-balloon vertical slice the PRD's sequencing suggestion calls for.

- A holdable balloon surface over the Critter (slice #2) that tracks **its own
  held-state** and sets `touch-action: none` so the browser doesn't hijack the
  press for scroll/zoom.
- A per-balloon **fill value 0→1**, no `<canvas>`: while a pointer is held over
  the balloon, fill rises at a fill-rate; while released it **leaks** back at a
  **slower** rate (fills fast, leaks slow). Fill drives slice #2's `fill` prop
  (swell + face brighten/droop).
- **Self-cap at 1**: holding past full is a no-op. At the cap the balloon
  **auto-detaches** from the peg and **floats up** (rises away). An early lift
  before the cap leaks slowly — **forgiving, never a reset** (no instant deflate,
  per Out of Scope).
- **Observability for tests** (no wall-clock): per-balloon **state** via a
  `data-*` hook (`limp` / `floating` — `gathered` arrives in slice #5) and the
  current **fill** via a `data-*` value, so tests drive fill to the cap directly.
- No fail/pop/sweet-spot/timer — the only outcome is success
  ([[0001-finite-success-only-toy-lifecycle]]).

## Acceptance criteria

- [x] Holding (pointer down over the balloon) raises **its** fill (`data-*` fill
      value increases); releasing **leaks** it (fill decreases) and does **not**
      detach.
- [x] Reaching the cap (fill = 1) **self-caps** (further holding is a no-op),
      detaches, and transitions the balloon's state to `floating`.
- [x] An early lift below the cap leaves the balloon attached and leaking — never
      an instant reset to 0.
- [x] The balloon surface carries `touch-action: none`.
- [x] Fill/state are asserted via the `data-*` hooks at the value boundary, never
      via wall-clock timing or pixel reads.
- [x] Public-interface tests pass; shim only the Web Audio boundary (no sound in
      this slice yet — slice #7); never mock our own components.
- [ ] On-device check (mine): holding swells the balloon with clear cause-and-
      effect and it pops free + floats at full; lifting early sags it slowly.

## Notes

- Test the fill contract **at the value boundary** per the PRD Testing Decisions:
  fill rises while held, leaks while released, caps at 1 with detach at the cap.
  Do **not** unit-assert the exact fill-rate, leak-rate, or per-balloon duration
  — on-device-tuned constants, like the sheep/fish counts.
- Asymmetric rates (fills fast ~2.5s, leaks slow) are the load-bearing feel but
  the tuples are on-device-tuned; the **asymmetry direction** (leak slower than
  fill) is the contract, not the numbers.
- Sound (rising-pitch pips / pop / raspberry), haptics, the bunch/loop, the
  gather Outro, and the idle demo are NOT in this slice — see #4, #5, #6, #7.
- Single balloon here floats up and away; the **linger/gather** behaviour is
  slice #5 (only meaningful once there are five).
