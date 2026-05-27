---
slice: 3
title: Shell Completion — celebration burst → end state (Play again / Home)
status: in-progress
type: afk
blocked_by: [2]
parent_prd: shell-counting-sheep
stories: [4, 5]
---

## What to build

The Shell's reaction to the Toy's `onComplete` — the back half of the finite lifecycle,
owned entirely by the Shell (ADR-0001). End-to-end: receive `onComplete` → celebration beat
→ end state → replay/back wiring.

- When the mounted Toy calls `onComplete()`, the Shell plays a **Completion** celebration:
  a confetti-style burst beat (the PRD also describes the Sheep lining up and jumping —
  that Toy-side flourish can ride here or stay in the Toy; the Shell owns the confetti +
  end state).
- After the celebration, the Shell shows an **end state** offering **Play again** and **Home**.
- **Play again** resets the Toy to its start (all Sheep un-done, fresh meadow).
- **Home** returns to the launcher.

Completion sound is NOT in this slice (celebratory sound wires in #5). The end state stays
put — no auto-advance (PRD Further Notes; ADR-0001 no-timers rule).

## Acceptance criteria

- [x] When the Toy fires `onComplete`, the Shell shows the celebration then the end state.
- [ ] The Toy cannot reach the end state without `onComplete` (no timer/fail path).
- [ ] **Play again** resets the Toy to its start: all 5 Sheep are tappable again and the
      Goal can be re-reached, firing `onComplete` again.
- [ ] **Home** from the end state returns to the launcher.
- [ ] Tests exercise the lifecycle at the Shell's public surface: drive a Toy to fire
      `onComplete`, assert celebration → end state; assert Play again resets; assert Home
      returns to the launcher. No internal mocks.

## Notes

- This is the lifecycle contract the PRD Testing Decisions call out as the highest-value
  Shell tests.
- Confetti is a shared Shell utility (CONTEXT: Shell owns confetti/sound/haptics) — built
  code-side, no asset files (ADR-0002).
- The always-visible mid-play Home control (exit *during* play, before Completion) is a
  separate concern — see #4. This slice's Home button lives on the end state.
