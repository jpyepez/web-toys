---
slice: 1
title: Design tokens module + Shell chrome positioning
status: done
type: afk
blocked_by: []
parent_prd: counting-sheep-polish
stories: [5]
---

## What to build

A new local **design-tokens** module that becomes the single source of truth for the
project's dawn palette, type stack, and animation primitives — and the first concrete
consumer of it: the Shell's mute toggle and in-Toy Home control restyled into the
safe-area corners as low-contrast soft pill icon-buttons.

End-to-end through one vertical:

- A named-export module exposing the six dawn HSL palette values (sky upper, horizon
  glow, grass silhouette, sheep wool, sheep silhouette, done-state glow), the system
  serif font stack, and the timing/easing constants the later Outro + Card slices will
  consume. Shape is open; named exports rather than a single `tokens` object are
  fine — pick whatever reads cleanly.
- The mute toggle (top-right) and the in-Toy Home control (top-left), both restyled as
  soft pill icon-buttons sourcing their colour and radius from the tokens module. No
  text labels. They sit inside the `.shell-frame` safe-area inset already shipped in
  the parent PRD's slice #07 — positioning now reads as "recessed in the corners"
  rather than wherever flow puts them.

## Acceptance criteria

- [x] Design-tokens module exists; jsdom-friendly tests assert the expected exports
      exist and have the expected shape (mirror the parent PRD's manifest-module
      test pattern).
- [x] Mute toggle renders top-right; Home control (when a Toy is mounted) renders
      top-left. Both use tokens for colour/radius, no hardcoded values.
- [x] Existing Shell tests (mute persistence, Home navigation) still pass — behaviour
      is unchanged, only appearance and position.
- [ ] On-device check: chrome reads as unobtrusive corner icons against the existing
      meadow (still pre-backdrop), not as default-positioned buttons.

## Notes

- This is the PRD's "Foundation" grouping
  (`../../prds/counting-sheep-polish.md` → Further Notes → slice order). Tokens-alone
  would be horizontal; pairing with chrome gives it a real consumer so the slice
  ships visible value.
- Every later slice in this PRD references these tokens — no scene hardcodes a
  colour.
- The `.shell-frame` safe-area CSS already exists (parent PRD slice #07). Don't
  reimplement it; only the buttons inside the frame change.
- Visual / CSS correctness is on-device per the slice-level DoD in the PRD's Testing
  Decisions; structural assertions are unit-tested.
