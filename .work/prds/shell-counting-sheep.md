# Toy Shell + Counting Sheep (Vertical Slice)

## Problem Statement
A parent wants something to hand a 3–4 year old on a phone that entertains them in a short,
bounded burst — tap a cute critter, something delightful happens, and it ends on a happy,
satisfying note rather than running forever. Off-the-shelf kids' apps don't fit: most are
infinite, ad-laden, or too complex for a toddler, and they never end *cleanly*. And there's
no foundation yet — no app, no shared structure — to build these little experiences on.

## Solution
A phone-first, installable web app whose home screen is a launcher of big, colorful **Cards**,
one per **Toy**. Tapping a Card opens a Toy: a tiny, self-contained experience with a clear
beginning, a small **Goal** sized to ~15–30 seconds, and a celebratory **Completion** when the
Goal is met — never a timer cutoff and never a fail state.

This slice delivers two things at once: the reusable **Shell** that frames every Toy (home
launcher, launch/exit, entry/exit transitions, the Completion celebration, replay/back, and
shared synthesized sound + haptics), and the first Toy — **Counting Sheep** — which proves the
whole loop end-to-end. The child gets one finished, delightful experience; the project gets the
foundation every future Toy plugs into via a single contract.

## User Stories
Actors: the **Child** (3–4 yo player) and the **Parent** (sets it up, hands over the phone).

1. As a Parent, I want to install the app to my phone's home screen and have it launch
   full-screen, so that a child sees only the toys and can't wander into the browser chrome.
2. As a Child, I want to see big colorful Cards and tap one, so that I can start a Toy by myself.
3. As a Child, I want to tap a cute sheep and have something fun happen, so that I feel I made
   it react.
4. As a Child, I want a clear "we did it!" celebration once I've tapped all the sheep, so that
   the Toy ends on a happy note.
5. As a Child, I want to play the same Toy again or go back to the Cards with one tap, so that
   I'm never stuck at the end.
6. As a Child, I want to leave a Toy at any time via an always-visible Home control, so that
   I'm never trapped if I lose interest mid-play.
7. As a Parent, I want a mute toggle, so that I can silence the app in quiet places.

## Implementation Decisions
- Module: **Shell** — a deep module that hides the entire Toy lifecycle (launch, entry/exit
  transitions, Completion celebration, replay/back chrome) and shared concerns (synthesized
  sound, haptics) behind a thin surface. Individual Toys are leaf modules; they never reimplement
  the lifecycle (ADR-0001).
- Interface (Shell ↔ Toy contract): a Toy is a self-contained component the Shell mounts. The
  *only* signal a Toy raises to the Shell is a single completion callback, `onComplete()`,
  invoked when its Goal is met; the Shell then takes over (celebration → end state). The Shell
  passes Toys shared utilities for sound and haptics. The Shell owns the home launcher, route-
  per-Toy navigation, the always-visible ungated Home control (abandoning is non-destructive),
  and the post-Completion end state (Play again / Home).
- Toy registry: each Toy declares its metadata (title, Card appearance) and its component; the
  Shell renders one Card per registered Toy and routes to it. This is the mechanism behind
  "one Card per Toy" and makes adding future Toys additive.
- Counting Sheep (this slice's Toy): a meadow of 5 **Sheep**, each drawn from SVG primitives
  (ADR-0002). Tapping a Sheep gives an immediate reaction (hop + squash/stretch, a synthesized
  "baa", a happy color shift) and marks it done. Goal: all 5 Sheep tapped. Completion: the Sheep
  line up and jump together with a confetti-style burst + celebratory sound, then the end state
  appears. Re-tapping an already-done Sheep still gives a small playful reaction — no penalty,
  no double-count, no fail.
- Schema changes: none (no backend, no persistence) — except a single client-side **mute**
  preference stored in localStorage.
- API contracts: none — static SPA, no server.
- Dependencies: Vite, React, TypeScript, TanStack Router, Motion (Framer Motion), Tone.js (or
  raw Web Audio), vite-plugin-pwa. No image/sprite/audio asset files (ADR-0002).

## Testing Decisions
- Good tests exercise the **lifecycle contract** at the Shell's public surface: launching a Toy
  from a Card, the Shell reacting to `onComplete` (celebration → end state), Play again resetting
  the Toy to its start, and Home/exit returning to the launcher from both mid-play and the end
  state.
- Counting Sheep Goal logic: tapping all 5 distinct Sheep fires `onComplete` exactly once;
  tapping fewer does not fire it; re-tapping a done Sheep neither double-counts nor fails. Drive
  these through the component's public interaction surface (simulated taps), not internal state.
- Mocking policy: mock only at process boundaries. There are none here (no network, no backend),
  so prefer real rendering + simulated user events over mocks.
- Validated by hand on a real phone, not unit-asserted: animation polish, synthesized audio, and
  the multi-touch case (several simultaneous taps all registering). `prefers-reduced-motion`
  behavior is worth at least a manual check.

## Out of Scope
- The other three v1 Toys — Fish Pond, Bubble Pop, Bloom. Each becomes its own PRD/slice once
  this slice proves the loop.
- Any progress/reward/profile meta-layer — scores, stars, sticker books, streaks, profiles. See
  `.work/out-of-scope/progress-and-gamification.md`.
- Backend, accounts, sync, server-side anything.
- Binary art/audio assets (ADR-0002).
- A parental gate / guarded exit — decided against; there's nothing dangerous to reach.
- A landscape-optimized layout — portrait-first; landscape need only not break.

## Further Notes
- Goal-sizing: 5 Sheep is the starting guess for ~15–30s; tune the count and pacing on a real
  device with a child.
- Mobile audio: synthesized sound must be unlocked on the first user gesture (the Card tap) — a
  known constraint for the Shell's sound utility.
- iOS PWA standalone quirks to verify on-device: safe-area insets, and the hardware silent switch
  muting Web Audio.
- The Completion end state stays put (no auto-advance), consistent with the no-timers rule;
  confirm this feels right with a child.
- Mute is the only persisted state; revisit if it proves unnecessary.
- Open: exact Card visual design / color system and home-screen layout — design polish, not yet
  specified.
