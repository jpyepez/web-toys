---
slice: 8
title: Registry entry + Home Card preview (+ pick display name)
status: done
type: hitl
blocked_by: [1, 2, 3, 4, 5, 6, 7]
parent_prd: balloons
stories: [10]
---

## What to build

The additive registry entry that lights the Toy up on the Home screen, plus its
own inline preview-scene for the Card. **Additive only — nothing else in the
Shell changes.** This is the slice that makes Balloons a fourth Toy the parent
sees is a clearly different *activity*.

- **HITL decision — the display name.** The PRD leaves the final display title
  open (working title "Balloons"; candidates "Up & Away", "Balloon Sky",
  "Up-Up Balloons"). Pick it here. The slug `balloons` is **stable regardless**
  of the title.
- Add the `balloons` registry entry per the existing additive registry contract:
  `id`, `title` (the chosen name), `component`, `tint` color string from the
  Toy's own palette (slice #1's sky tone — matching the fish/puddle
  tint→color-string contract, ADR-0004), and `preview`.
- A tiny **inline SVG preview-scene** the Home Card hosts (analog to the existing
  Toys' previews) — e.g. a faced balloon mid-inflate, or one floating up on its
  string. All-SVG, no binary assets.

## Acceptance criteria

- [x] Display name chosen (HITL) and used as the registry `title`; slug stays
      `balloons`. → **"Up & Away"** (see HITL decision in Notes).
- [x] The `balloons` registry entry exists with `id`, `title`, `component`,
      `tint` (sky tone from the Toy palette), and `preview` — wired exactly like
      the existing entries (additive, one entry).
- [x] The Home Card renders the inline SVG preview-scene; tapping it launches the
      Toy.
- [x] No `<canvas>`, no binary assets — SVG primitives only (ADR-0002).
- [x] Nothing else in the Shell or the existing Toys changes (additive only).
- [x] Public-interface tests pass (mirror `preview.test.tsx` / the registry-wiring
      test — that the Card wires its own tint, preview, and Toy launch); never
      mock our own components.
- [ ] On-device check (mine): the Home Card reads as a balloons Toy distinct from
      the tap/wipe Cards, and launches the Toy.

## Notes

- Mirror muddy-puddle slice #08 (`08-registry-entry-card-preview.md`) and its
  `Preview.tsx` / `preview.test.tsx` and the GUARD registry-wiring test.
- Do **not** unit-assert the preview colours/geometry — on-device-tuned. Assert
  the entry's wiring and that the Card launches the Toy.
- This is the only HITL slice: the single genuine decision is the display name.
  Everything else is mechanical additive wiring.

### HITL decision (resolved 2026-06-18)
- **Display name: "Up & Away".** Chosen over the working title "Balloons" and the
  other candidates ("Balloon Sky", "Up-Up Balloons"). The slug stays `balloons`
  (stable regardless of title, per "What to build"). This is the registry entry's
  `title`.
