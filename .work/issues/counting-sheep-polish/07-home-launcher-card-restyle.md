---
slice: 7
title: Home launcher Cards — big vertical-scroll Cards with palette-gradient preview-scenes
status: done
type: afk
blocked_by: [1]
parent_prd: counting-sheep-polish
stories: [4]
---

## What to build

The Home stops reading as a list of plain text links and starts reading as a
book of small worlds. Vertical-scroll list, one big Card per registered Toy,
each carrying a tiny preview-scene of the Toy it launches.

End-to-end through one vertical:

- Home renders a vertical-scroll list of Cards from the existing Toy registry
  (the mechanism the parent PRD's slice #01 established — additive: a new Toy
  is still just a registry entry).
- Each Card is ~70% of viewport height with a peek of the next Card showing
  as a scroll affordance.
- Card background is a soft palette-gradient extracted from the Toy's
  signature palette. Counting Sheep's Card uses the dawn wash (sky-upper →
  horizon-glow → grass-silhouette family) sourced from the design-tokens
  module. Mechanism for the per-Toy palette is registry-driven so future
  Toys declare their gradient via their registry entry.
- Each Card carries a tiny inline SVG preview-scene from inside the Toy
  (Counting Sheep gets a miniature meadow with a couple of Sheep).
- Card title beneath in the system serif from the design tokens.
- Tap feedback is a gentle scale-down using the design tokens' timing
  primitives.
- Generously rounded corners, soft shadow, no border.

## Acceptance criteria

- [x] Home renders one Card per registered Toy, vertically stacked — existing
      registry-driven Card test still passes.
- [x] Card palette mapping is data-driven: a registry entry's declared
      palette resolves to its Card gradient. Test the mapping (jsdom-friendly
      structural assertion); the rendered gradient itself is on-device.
- [x] Tapping a Card still navigates to its Toy route — existing navigation
      test still passes.
- [x] All colours, font, timing routed through the design-tokens module — no
      hardcoded values in the Card or Home components.
- [ ] On-device check: picking a Toy feels like opening a book of small
      worlds. Story 4 is the test.

## Notes

- Carousel layouts and compact tile grids are explicitly rejected in favour
  of the vertical-scroll big-Card layout (PRD Out of Scope).
- The Card preview-scenes are deliberately tiny SVGs from inside each Toy —
  no preview-image generation, no rendering the live Toy into the Card.
  Visual coherence with the live Toy is on-device per the PRD's Testing
  Decisions.
- Spec for the Card composition is in PRD Implementation Decisions → "Home
  launcher Cards" (`../../prds/counting-sheep-polish.md`).
- After this slice the PRD-level DoD kicks in: the child plays the polished
  Counting Sheep at least once and returns to it (PRD Testing Decisions).
- The deferred shared `renderApp` test-helper extraction (`../../notes/shared-render-app-test-helper.md`)
  becomes more attractive once this slice's Card tests land; treat as a tiny
  post-PRD refactor pass per PRD Further Notes.
- **Editorial-serif typography reversed during the mobile-rethink PRD's
  kid-handoff DoD** (commit `9b6da32`, `refactor(shell): swap editorial
  serif -> rounded sans for kid-app warmth`). This slice originally
  pinned a system serif stack ('New York' / 'Iowan Old Style' /
  Palatino / Georgia) under the PRD's "no custom fonts" out-of-scope
  line, on the read of the Home as "a book of small worlds" — the
  editorial-serif register matched the book metaphor. On-device review
  on the actual phone surfaced "kinda odd / wrong register": editorial
  serif reads as a grown-up book, not a tap-the-critter toy. Research
  pass on children's-app typography (Khan Academy Kids, Sesame
  Workshop, PBS Kids, Toca Boca, Endless Alphabet) landed unambiguously
  on rounded or humanist sans; editorial serif appears only in
  storybook read-along apps — opposite frame from the toy shell.
  Reversal: `font.serif` → `font.rounded` with a `ui-rounded`-led stack
  (SF Pro Rounded on iOS Safari, Roboto fallback on Android via
  `sans-serif` tail). The "no custom fonts" out-of-scope rule itself
  is unchanged — still system-font-only, just rounded instead of
  serif. One consumer touched (`Card.tsx` title style). Sanctioned-
  pivot pattern: token contract test rewritten to pin `ui-rounded`
  first + `sans-serif` tail, structural rule (single platform-only
  string, no `@font-face`) preserved.
