---
slice: 6
title: Mute toggle persisted to localStorage
status: done
type: afk
blocked_by: [5]
parent_prd: shell-counting-sheep
stories: [7]
---

## What to build

A **mute** toggle the parent can use to silence the app in quiet places, persisted across
sessions. End-to-end: Shell control → sound utility respects it → localStorage persistence →
restored on load.

- A mute toggle in the Shell chrome.
- When muted, the sound utility (#5) produces no audio. Haptics behavior when muted is a
  small call — default: leave haptics on (mute is about *sound*); note if decided otherwise.
- The mute preference is the **single** persisted client-side state — stored in
  **localStorage** and restored on app load (PRD Implementation Decisions / Further Notes).

## Acceptance criteria

- [x] Toggling mute on silences all synthesized sound (baa + completion); toggling off
      restores it.
- [x] The mute state persists across a reload (written to and read from localStorage).
- [x] On first load with no stored preference, the app starts unmuted (sound on).
- [x] Tests drive the public surface: toggle mute → assert the sound utility is silenced;
      simulate reload with a stored preference → assert it's honored. localStorage is the
      one boundary that may be stubbed.

## Notes

- This is the only persisted state in the app — revisit if it proves unnecessary (PRD
  Further Notes). Keep the storage key/shape minimal.
- Depends on the sound utility existing (#5) — there's nothing to mute before then.
