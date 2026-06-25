---
slice: 8
title: Registry entry + Card preview + final-name pick
status: done
type: hitl
blocked_by: [1, 2, 3, 4, 5, 6, 7]
parent_prd: nestlings
stories: [11]
---

## What to build

Land the Toy on the Home screen: one additive registry entry plus the Toy's own
inline SVG preview-scene the Card hosts. This is the only slice that **ships the
Toy to the launcher** — and the one HITL decision point: **pick the display
title**. See the PRD for full context.

- **HITL — pick the display title.** The PRD leaves the name open (working title
  "Nestlings"; candidates "Off to Nest", "Tuck-In", "Time for Bed", "Nest at
  Dusk"). Pick one before writing the entry. The **slug `nestlings` is stable
  regardless** — only the `title` string is the decision (mirrors Balloons
  choosing "Up & Away" at its registry slice while the slug stayed `balloons`).
- **Registry entry** (`src/toys/registry.ts`): add `{ id: 'nestlings', title,
  component, tint, preview, winDelayMs }` — `tint` the dusk sky tone color
  string from the slice #1 palette (the tint→color-string contract, ADR-0004),
  `winDelayMs` from slice #5. Additive only — **nothing else in the Shell
  changes** (the registry contract).
- **Preview** (`Preview.tsx`): the Toy's own tiny inline SVG preview-scene the
  Home Card hosts above the title — e.g. a bird being carried toward the nest,
  or a sleepy bird nestled in — drawn from inside the Toy so the Card art coheres
  with the live scene (mirrors the existing Toys' previews).

## Acceptance criteria

- [x] Display title chosen (HITL) and set as `title`; the slug/`id` stays
      `nestlings`.
- [x] A single additive `nestlings` entry is added to `src/toys/registry.ts`
      with `id`, `title`, `component`, `tint` (dusk-sky color string from the
      Toy's palette), `preview`, and `winDelayMs` (from slice #5).
- [x] `Preview` renders the Toy's own all-SVG miniature scene (ADR-0002), hosted
      by the Card.
- [x] The Shell renders a Card for the Toy and routes to it — **nothing else in
      the Shell changes** (additive-only registry contract).
- [x] `tint` is a concrete CSS color string from the Toy's own palette, not a
      shared-token key (ADR-0004).
- [x] Public-interface tests pass; no internal mocks; never mock our own
      components.
- [x] On-device check (mine, before marking done): the Card reads well in the
      Home grid, the preview coheres with the live dusk scene, and launching →
      playing → Completion → replay/back all work through the Shell. Confirmed
      during the art/interaction polish pass (cute-chibi birds + woven nest,
      responsive on phone + desktop, drag-to-nest verified, hover + placement
      feedback) — see the commits after slice #08's wiring.

## Notes

- **HITL decision (resolved 2026-06-23):** display `title` = **"Tuck-In"**. Slug/`id`
  stays `nestlings`. Chosen for a short, cozy bedtime-themed label that reads well
  on a small Card.
- Mirror `src/toys/balloons/Preview.tsx` + `preview.test.tsx` and the Balloons
  registry entry (`src/toys/registry.ts`) for the entry + preview shape.
- Do **not** unit-assert the `tint` colour or preview geometry — on-device-tuned.
  Assert the entry exists with the required fields and the preview renders SVG.
- This is the integration slice: it depends on every prior slice (component,
  tint, `winDelayMs`, preview art). The name pick is the genuine decision — make
  the call, then the rest is additive wiring.
