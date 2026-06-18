---
slice: 2
title: Faced balloon Critter art — fill-driven sad→happy + swell
status: done
type: afk
blocked_by: [1]
parent_prd: balloons
stories: [1, 3]
---

## What to build

The balloon **Critter** — a faced, code-drawn SVG balloon whose appearance is a
**pure function of a `fill` prop (0→1)**: limp/sad at 0, swelling and brightening
to plump/happy at 1. No interaction yet (slice #3 drives the prop) — this slice
proves the art reads correctly across the fill range, statically. See the PRD
for full context.

- A `BalloonDrawing` component (analog to `PigletDrawing` / the fish/sheep
  drawings): each balloon is its own faced SVG drawn from primitives only
  ([[0002-no-binary-assets-everything-code-generated]]), tied to the peg by a
  string. Takes a `fill` prop (0→1) and a colour (from slice #1's palette).
- Structural pieces tagged `data-*` part hooks (mirrors `data-sheep-part` /
  `data-fish-part` / `data-piglet-part`) — body, face, string, etc.
- The **face transitions with fill**: sad/limp at 0, brightening to happy at
  full, and (because slice #3 will lower the prop on a leak) the mapping must be
  **continuous and reversible** — a mid-fill prop shows a mid-state face, not a
  binary flip. The **body swells** (scale) with fill.
- **No hidden identity / reveal** (unlike Muddy Puddle) — the balloon is just
  itself; the payoff is inflation + float, not "who is it".

## Acceptance criteria

- [x] `BalloonDrawing` renders an all-SVG faced balloon with `data-*` part hooks
      queryable in a render test.
- [x] Appearance is driven by the `fill` prop: rendering at fill `0`, a mid
      value, and `1` produces visibly distinct states (assert via the part hooks
      / attributes, not pixels) — and the mapping is monotonic/reversible (a
      lower prop yields a less-inflated state).
- [x] Accepts a balloon colour from the palette (slice #1); distinct colours
      render distinctly.
- [x] No `<canvas>`, no binary assets — SVG primitives only (ADR-0002).
- [x] Public-interface tests pass; no internal mocks; never mock our own components.
- [ ] On-device check (mine): at fill 0 the balloon reads as sad/limp, at full it
      reads as plump/happy, and the in-between reads as a smooth swell.

## Notes

- Mirror `src/toys/muddy-puddle/PigletDrawing.tsx` + `piglet-drawing.test.tsx`,
  but note the key difference: the piglet had a binary `cleaned` prop; the
  balloon has a **continuous** `fill` prop because the leak (slice #3) walks it
  back down smoothly.
- Do **not** unit-assert exact face shapes, colours, or the swell scale curve —
  on-device-tuned. Assert the part hooks render and that fill changes the state.
- Keep this art **stateless** — it owns no hold/leak logic. Slice #3 owns the
  fill value and passes it in. This is the same art/mechanic split the prior
  Toys used.
