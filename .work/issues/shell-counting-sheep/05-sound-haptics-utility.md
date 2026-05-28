---
slice: 5
title: Shared synthesized sound + haptics utility — baa + completion sound, mobile unlock
status: done
type: hitl
blocked_by: [2, 3]
parent_prd: shell-counting-sheep
stories: [3, 4]
---

## What to build

The Shell's shared **sound** and **haptics** utilities, passed to Toys, plus wiring the
existing Sheep/Completion moments through them. End-to-end: synthesis engine → unlock on
first gesture → utility surface passed to the Toy → audible/tactile feedback.

- A synthesized **sound** utility (no audio files — ADR-0002), **unlocked on the first user
  gesture** (the Card tap) — a known mobile constraint (PRD Further Notes).
- A **haptics** utility (vibration where supported; no-op where not).
- The Shell passes both to the mounted Toy via the shared-utilities part of the contract.
- Wire them in: Sheep tap → synthesized **"baa"** + a haptic tick; **Completion** → a
  celebratory sound (alongside the #3 confetti burst).

**HITL — decision points to resolve with a human:**
- **Tone.js vs raw Web Audio** — the PRD leaves this open ("Tone.js (or raw Web Audio)").
  Pick one; note the call.
- **Mobile audio-unlock approach** — how/where the first-gesture unlock hooks in so it's
  reliable across the Card tap → Toy mount boundary.

## Acceptance criteria

- [x] Tapping a Sheep produces a synthesized "baa" (after unlock) and a haptic tick where
      supported.
- [x] Completion produces a celebratory synthesized sound.
- [x] Audio is silent until the first user gesture, then plays — verify the unlock fires on
      the Card tap, not on page load.
- [x] No audio/image asset files are added (synthesis only).
- [x] The sound/haptics utilities are provided by the Shell and consumed by the Toy through
      the contract, not imported ad hoc inside the Toy.

## Notes

### HITL decisions (resolved 2026-05-28)

- **Synthesis engine — Raw Web Audio** (not Tone.js). Rationale: ADR-0002's recorded value
  is "tiny bundle on a phone"; Tone.js (~90KB+ gzip) is a sequencer/Transport framework
  whose strengths (tempo, loops, scheduling, samples) we don't use — we need two one-shot
  sounds (a "baa", a celebratory chime), each ~10–15 lines of oscillator + gain-envelope.
  Keeps the dependency set minimal (react/router/motion) and gives one small testable
  boundary (an injectable `AudioContext` factory). Revisit only if a future Toy needs real
  music — a conscious ADR-0002 reversal, not a quiet add.
- **Mobile unlock — explicit on the Card tap.** Home's Card `<Link>` `onClick` calls
  `sound.unlock()` (→ `ctx.resume()`) on the shared, injected Sound engine; the resumed
  `AudioContext` survives navigation so the mounted Toy plays on the same unlocked context.
  Chosen over a global document gesture listener because it's explicit, directly matches the
  "fires on the Card tap, not page load" criterion, and is straightforward to assert.

### Other notes

- Manual / on-device validation (not unit-asserted, per PRD Testing Decisions): actual sound
  quality, the iOS hardware silent switch muting Web Audio, and haptics on a real phone.
- Mocking policy: no process boundaries to mock; prefer real rendering + simulated events.
  Web Audio itself may need a light harness shim in tests — keep it at the boundary.
- Mute (toggle + persistence) is the next slice (#6); this slice just makes sound exist.
