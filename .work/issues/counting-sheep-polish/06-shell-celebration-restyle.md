---
slice: 6
title: Shell celebration overlay restyle — warm-light particles, sound bloom, longer beat
status: done
type: afk
blocked_by: [1]
parent_prd: counting-sheep-polish
stories: [3]
---

## What to build

A global restyle of the Shell's existing post-Goal celebration overlay so every
future Toy inherits the same aesthetic family. Both the visual burst and the
celebratory sound get the dawn treatment, and the celebration beat gets long
enough to overlap properly with the Counting Sheep Outro.

End-to-end through one vertical:

- **Visual:** the existing 16-piece primary-colour radial burst becomes ~8 soft
  warm-light particles drifting upward over ~2.5–3s with a soft blur glow.
  Colours sourced from the design-tokens module.
- **Sound:** the ascending arpeggio is kept; per-note decay extended to ~0.6s;
  one low sustained pad note is added underneath for warmth. Stays inside the
  Shell-owned sound utility per
  `../../adr/0003-audio-synthesis-and-mobile-unlock.md`.
- **Timing:** `CELEBRATION_MS` grows from 600ms to ~2200ms so the end state
  (replay / home) appears *after* the Outro choreography settles.
- The change is global — applies to every Toy that fires `onComplete`, not
  just Counting Sheep.

## Acceptance criteria

- [x] Sound restyle is unit-asserted via the existing AudioContext shim
      (the pattern from the parent PRD's `sound.test.ts`): `celebrate()` plays
      the expected voice count, including the new pad note.
- [x] `CELEBRATION_MS` value change is reflected in the end-state-appears
      timing test the parent PRD ships.
- [x] Existing Completion tests still pass — overlay still appears, end state
      still appears, replay/home still work.
- [x] Particle visuals route through the design-tokens module — no hardcoded
      colours.
- [ ] On-device check: the celebration reads as a coherent warm moment with
      the meadow, not a primary-colour party-popper bolted on. Combined with
      slice #5, the Outro and the celebration finish around the same time.

## Notes

- Per-Toy celebration overlays are explicitly out of scope — this PRD's
  position is one globally-restyled Shell celebration that every Toy
  inherits (PRD Out of Scope; ADR-0003).
- Audible quality of the restyled sound is on-device only — the unit test
  asserts voice count and shape, not subjective bloom.
- Spec for the visual + sound restyle and the timing change is in PRD
  Implementation Decisions → "Shell celebration overlay" and "Counting Sheep
  Outro" (`../../prds/counting-sheep-polish.md`).
- The 2200ms target is tuned against the ~2s Outro from slice #5 — leaves a
  small breathing pause before the end state appears.
- **`CELEBRATION_MS` delay retired during the mobile-rethink PRD's
  kid-handoff DoD** (commit `6b44dc4`, `fix(shell): … retire celebration
  delay [polish #02 regression + #06 retirement]`). The delay's
  load-bearing rationale was "cover the slice #05 Toy-side group-Outro
  choreography so the replay/home offer doesn't cut it off". The
  mobile-rethink PRD explicitly retired that group-Outro in favour of
  per-Sheep exit choreography (PRD Out of Scope: "Reusing the slice-#05
  group-Outro choreography … retired by this PRD"). With the Outro gone,
  the delay no longer covers anything; the 5th Sheep's per-Sheep
  dismiss is short (~700ms) and the layered-concurrent contract from
  slice #02 paints the celebration overlay *over* it concurrently
  anyway. End-state controls now render from `Completion`'s mount. The
  two delay-pinning tests ("reveals end state only after the
  celebration beat", "holds the celebration beat ~2200ms") retired in
  the sanctioned-pivot pattern.
- **Visual restyle** added on top during the same kid-handoff DoD: the
  bare h2 + buttons moved onto a Card-style surface
  (`palette.sheepWool` tint + `card.radius` + `card.shadow` — same
  tokens the Home Cards use) with `font.rounded` typography and
  pill-shaped primary/secondary buttons. Cross-PRD: pulls on the
  rounded-sans typography swap recorded in slice #07's reversal Notes.
