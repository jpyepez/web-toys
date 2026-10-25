---
slice: 1
title: Sequential Sheep mechanic — one Sheep at a time, kid-paced loop
status: done
type: afk
blocked_by: []
parent_prd: counting-sheep-mobile-rethink
stories: [1, 3, 4, 5]
---

## What to build

Rewrite Counting Sheep's play-loop around a small state machine: one Sheep is
visible at a time, centred in the meadow as a generous touch target, sliding
in on its own and waiting for the kid's tap before hopping-and-exiting; after
a short beat the next Sheep arrives. The kid's tap drives the rhythm.

End-to-end through one vertical:

- State machine over the five-Sheep loop:
  - `idle` — no Sheep on stage, intermission between Sheep
  - `arriving` — current Sheep is sliding in from the left
  - `waiting` — current Sheep is centred, awaiting tap
  - `dismissing` — current Sheep is playing its jump-and-exit beat
  - `completed` — five Sheep dismissed; `onComplete` has fired
- Time-driven transitions: `arriving → waiting` after the entrance
  animation completes; `dismissing → idle` after the exit animation
  completes; `idle → arriving` after a short intermission beat. The only
  user-driven transition is `waiting → dismissing` (the kid's tap).
- User-driven transition: tap on the current Sheep advances `waiting →
  dismissing`. Taps during `arriving` or `dismissing` are no-ops (the
  Sheep is mid-animation; re-tap is non-destructive, no counter
  advance, no double-`onComplete`).
- On the 5th `dismissing → completed` transition, `onComplete` fires
  exactly once. The 5th Sheep's exit choreography runs concurrently
  with the Shell's celebration overlay — layered-concurrent per
  ADR-0001 amendment, identical to the existing contract.
- Sheep visual: existing `SheepDrawing` SVG primitives (slice #04 of
  the polish PRD), sized large for a phone touch target — concrete
  size on-device-tuned per the slice DoD; the structural rule is "one
  Sheep, centred, big".
- Arrival/exit choreography: arriving Sheep slides in from the left
  with a soft ease (Motion, eased by a new `timing.entrance` curve
  added to the tokens module in this slice); dismissing Sheep does a
  brief rise-fall hop with the done-glow blooming, then slides off-
  stage to the right with a fade.
- Total per-Sheep cycle ~1.3s of animation + the kid's tap delay; five
  Sheep across 15–30s leaves room for the kid's actual decision tempo.

## Acceptance criteria

- [x] Only one tappable Sheep is in the DOM at any time during the loop
      (assert via role-query: `getAllByRole('button', { name: /Sheep/ })`
      length ≤ 1 across the states `arriving`, `waiting`, `dismissing`,
      `idle`). (Test uses `queryAllByRole` so the `idle`-beat count of
      zero is valid; the AC's `getAllByRole` is the spec's loose form.)
- [x] Tapping the current Sheep in `waiting` advances the loop; after
      the dismiss + intermission beats, the next Sheep is queryable.
- [x] Tapping during `arriving` or `dismissing` is a no-op — neither
      `onComplete` fires nor the next Sheep arrives early. Re-tap safety
      asserted via fake-timers + multiple `userEvent.click` in the wrong
      state. (Test uses `fireEvent.click` rather than `userEvent.click`
      because the latter hangs under `vi.useFakeTimers` in Vitest 4.)
- [x] The 5th tap (in `waiting`) fires `onComplete` exactly once after
      the dismiss beat completes — assert via `vi.fn` spy + fake-timers,
      then a second `expect(spy).toHaveBeenCalledTimes(1)` after a long
      delay to catch any spurious second call. (`onComplete` fires at
      the start of the 5th `dismissing` beat per the ADR-0001 amendment;
      the test settles 10s past the tap to catch spurious re-fires.)
- [x] After `onComplete`, no further Sheep arrives — the loop is
      terminal (`completed` state, regardless of how the Shell handles
      the celebration overlay above).
- [x] `timing.entrance` exists on the tokens module with the existing
      Motion-API ease shape (a four-number cubic-bezier tuple, mirroring
      `timing.tapCurve`). Asserted via the tokens unit-test pattern from
      the polish PRD.
- [x] On-device check (mine, before re-marking the slice done — see PRD
      Testing Decisions inversion): the loop reads as one big Sheep at a
      time, kid-paced, on a 390×844 phone viewport.

## Notes

- Replaces the polish PRD's slice-#04 `SHEEP_PLACEMENTS` scatter and
  slice-#05 `OUTRO_STAGGER_MS` group-Outro choreography in the same
  diff. Those constants and the per-Sheep `phase` / `outro` Set state
  are removed; the new single-counter + state-machine state replaces
  them.
- The existing `SheepDrawing` SVG (wool circles, head, ears, legs,
  done-glow gradient) is reused as-is — the visual primitives of the
  Sheep don't change, only how many are mounted and how they enter /
  exit.
- The slice-#04 (polish PRD) `tapping a Sheep flips its done state`
  test no longer maps cleanly — done-state was a per-Sheep persistent
  flag; in the new mechanic each Sheep is mounted once and dismissed
  after tap, so "done" lives in the `dismissing` state, not on the
  Sheep. That test gets rewritten in this slice to assert "tapping
  the current Sheep transitions the loop into `dismissing`" via a
  data attribute or structural state-query through the public
  interface.
- Time-driven transitions are tested with `vi.useFakeTimers()` — time
  is a process-boundary collaborator (mocking policy: ✓). Motion
  internals stay unmocked; render through the public boundary and
  advance time.
- Card preview-scene visual coherence with the live mechanic is on-
  device per PRD Testing Decisions; the actual `Preview.tsx` update
  is slice #03's scope, not this one.
- Spec for the state machine + choreography is in PRD Implementation
  Decisions → "Counting Sheep play-loop state machine" and "Sheep
  arrival/exit choreography" (`../../prds/counting-sheep-mobile-rethink.md`).
- ADR-0001 (finite, success-only): Goal is unchanged ("five Sheep
  counted"). ADR-0001 amendment (layered-concurrent): the 5th Sheep's
  exit + Shell celebration are still simultaneous. ADR-0002
  (code-drawn SVG): no new assets — only existing primitives.
- **On-device regression caught + fixed during slice #02/#03 review**
  (commit `b8170e9`, `fix(sheep): centre waiting Sheep via static
  wrapper`): the `waiting` Sheep landed roughly 75% from the
  viewport's left edge instead of centred. Cause: the `motion.button`
  carries an `x` motion value through its variants, and Motion's
  variant-driven transform overwrites any inline `transform:
  translateX(-50%)` on the same element on every frame. Fix: split
  transform ownership — wrap the `motion.button` in a static `<div>`
  with `position: absolute; left: 50%; transform: translateX(-50%)`,
  let the button carry only its `x` deltas. Pattern saved to
  user-memory (`motion-transform-ownership`) — likely to recur as
  Bubble Pop / Fish Pond add Motion-animated centred critters.
