---
slice: 8
title: Registry entry + Home Card preview
status: in-progress
type: afk
blocked_by: [4, 5]
parent_prd: muddy-puddle
stories: [9]
---

## What to build

Surface the Toy on the Home launcher: one **additive** registry entry, plus the
Toy's own tiny inline SVG preview-scene the Home Card hosts (mirroring how the
existing Toys ship their previews). After this slice the third Toy is launchable
from Home — a clearly different *activity* from the two tap toys.

- Add the `muddy-puddle` entry to the Shell registry: `id`, `title`
  ("Muddy Puddle"), `component` (the `MuddyPuddle` from slice #4), `tint` (the
  color string from slice #1's palette), and `preview`. Adding it is **one
  additive registry entry** per the existing contract — nothing else in the Shell
  changes (no Shell rework).
- A `Preview` component: a tiny inline SVG preview-scene — a muddy critter with a
  **wiped streak** revealing a sliver of clean animal — so the Card teases the
  wipe activity. Drawn from this Toy's primitives/palette (ADR-0002/0004),
  mirroring `puffer-fish/Preview.tsx`.

## Acceptance criteria

- [x] The registry exposes a `muddy-puddle` entry with `id`, `title`
      ("Muddy Puddle"), `component`, `tint`, and `preview`.
- [x] The entry is **additive** — no other registry entries or Shell code change.
- [ ] The Home Card renders the Toy's `preview` (an inline SVG muddy-critter-with-
      wiped-streak scene) and the `tint` surface.
- [ ] Launching the Card mounts the playable `MuddyPuddle` Toy through the
      standard contract.
- [ ] No image/sprite assets — the preview is SVG primitives only (ADR-0002).
- [ ] Public-interface tests pass; no internal mocks.
- [ ] On-device check (mine): the Home grid shows three Cards; the Muddy Puddle
      Card teases wiping and launches the Toy.

## Notes

- Mirror `src/toys/puffer-fish/Preview.tsx` + `preview.test.tsx` and the registry
  wiring of Puffer Fish slice #09. `tint` is a solid CSS color string from this
  Toy's palette (ADR-0004) — not a key into a shared palette.
- Do **not** unit-assert the preview's colors/geometry — on-device-tuned. Assert
  the entry's shape and that the Card renders the preview + launches the Toy.
- Reaching the Goal triggers the **Shell's** Completion (story 8) — that's the
  Shell's job via `onComplete` (slice #4); this slice doesn't reimplement it.
