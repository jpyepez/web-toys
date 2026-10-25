# Progress, Rewards & Profiles (Gamification Meta-Layer)

This project deliberately has **no meta-layer** around the toys: no scores, stars, sticker
books, achievements, streaks, "times played" counters, per-child profiles, or saved
progress. The home screen is a pure launcher that shows one Card per Toy and nothing else.

## Why this is out of scope

Two durable reasons:

1. **Age-appropriateness.** The target users are 3–4 years old. They can't read a score,
   doesn't track streaks, and won't grasp a collection meta-game. Each Toy's own
   **Completion** celebration is the entire reward — adding a points/sticker layer on top
   is noise they can't parse and a distraction from the simple tap→delight loop.
2. **It fights the architecture.** Persisting progress means client state, a persistence
   layer, and reset/edge-case handling; profiles or sync would require the backend we
   explicitly chose not to have (Static SPA, no server). A reward meta-layer is exactly the
   creep that turns a tiny offline toy site into an app with accounts.

The only persisted state we'd entertain is a parent-facing **mute toggle** in localStorage
— a setting, not a progress/reward feature.

## Considered

- 2026-05-27 — original proposal during the grill-with-context session; rejected in favour
  of a pure-launcher home screen.
