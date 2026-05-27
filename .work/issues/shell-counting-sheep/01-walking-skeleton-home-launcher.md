---
slice: 1
title: Walking skeleton — home launcher renders a Card per registered Toy
status: in-progress
type: afk
blocked_by: []
parent_prd: shell-counting-sheep
stories: [2]
---

## What to build

The end-to-end skeleton that proves the Shell ↔ Toy architecture with a placeholder
Toy. Cuts through tooling → routing → registry → UI:

- Scaffold a Vite + React + TypeScript SPA with TanStack Router.
- A **Toy registry**: each entry declares its metadata (title, Card appearance) and its
  component. Adding a Toy is a registry entry, nothing more.
- The **home** route reads the registry and renders one **Card** per registered Toy.
- **Route-per-Toy**: tapping a Card navigates to that Toy's route, which mounts the Toy's
  component inside the Shell frame.
- Register **Counting Sheep** with a *placeholder* component (e.g. renders the title) so
  exactly one Card appears and launches. The real Sheep meadow lands in slice #2.

Install only the deps this slice needs (Vite, React, TypeScript, TanStack Router). Motion,
Tone.js, and vite-plugin-pwa arrive in the slices that use them.

## Acceptance criteria

- [ ] `npm run dev` serves the app; `/` renders the home launcher.
- [ ] Home renders exactly one Card (Counting Sheep) sourced from the registry — Card
      content is driven by registry metadata, not hardcoded in the home component.
- [ ] Tapping the Card navigates to the Counting Sheep route and mounts its (placeholder)
      component within the Shell frame.
- [ ] Adding a second dummy registry entry makes a second Card appear with no edits to the
      home component (verify, then remove the dummy).
- [ ] Public-interface tests pass: rendering home shows a Card per registered Toy; tapping
      a Card lands on its Toy route. No internal mocks (no process boundaries here).

## Notes

- This is the deliberate "walking skeleton" first slice (signed off): scaffold + registry +
  Cards + launch as one demoable vertical path, rather than a blank-page bootstrap.
- The registry is the mechanism behind "one Card per Toy" and makes future Toys additive —
  see PRD Implementation Decisions (`../../prds/shell-counting-sheep.md`).
- Shell ownership boundaries (home, routing, Home control, Completion) per
  `../../adr/0001-finite-success-only-toy-lifecycle.md`; Toys never reimplement them.
- Card visual design / color system is intentionally unspecified (PRD "Open" note) —
  a plain, big, tappable tile is fine for this slice.
- Phone-first, portrait. Landscape need only not break.
