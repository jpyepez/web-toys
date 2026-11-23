# Drag is hand-rolled pointer tracking, not Motion's `drag` prop

The drag-to-place Toy's core gesture (**Drag** — carry a **Critter** to a target and
release within a forgiving snap-radius) is implemented with hand-rolled pointer tracking:
`onPointerDown/Move/Up` follow `clientX/clientY` in DOM-pixel space, drive the carried
Critter's offset via a Motion value, and on release compare the Critter's bounding rect to
the target's to decide the snap — rather than Motion's built-in `drag` prop. We chose
hand-rolled for **testability, control, and consistency**: the gesture is assertable at the
boundary with `data-*` state + `fireEvent` pointer events in jsdom (Motion's `drag` relies
on real layout measurement jsdom can't provide, so it would be effectively untestable per
[[0003-audio-synthesis-and-mobile-unlock]]); release snaps the Critter to a *nest nestle
position*, not back to origin, which fights `dragSnapToOrigin` either way; and Wipe
([[0006-wipe-coverage-as-discrete-svg-blobs]]) and Hold are already hand-rolled pointer
tracking, so this keeps one mental model across the non-tap gestures. The accepted cost is
writing the pointer math (and pointer-capture/loss handling) ourselves instead of getting
momentum and capture free from Motion.

## Consequences

- The Drag is **unit-testable** at the boundary (assert pickup sets a carried state, a
  release within range reaches the placed/locked terminal state) — the exact snap-radius,
  carry feel, and settle animation stay on-device-tuned and are deliberately NOT asserted,
  matching the project's "observe the boundary, don't read rendered output" posture.
- Critters and the target are positioned in **DOM-pixel space** (`left%/top%` wrappers, as
  Balloons does), not SVG user-space — the transform-ownership split is mandatory: the
  static wrapper owns layout (`left/top/translateX(-50%)`), the inner `motion` element owns
  the carry `x/y`; never let both write `transform`.
- Pointer-capture/cancel/loss must be handled explicitly (a lifted, cancelled, or lost
  pointer all end the carry) so a Critter can never get stuck attached to a finger that is
  gone — the same robustness Wipe and Hold handle by hand. These pointer-capture paths
  aren't observable in jsdom, so they are on-device-validated, not unit-asserted.
- A future Toy wanting throw/fling momentum (a velocity gesture, explicitly outside the
  Drag definition) would need to revisit this — it is a deliberate trade of free momentum
  for testability and snap control.

## Amendment — Swipe, the velocity gesture (issue 2, Penguin Slide)

The last consequence above anticipated a Toy wanting throw/fling momentum. **Swipe** (see
the glossary) is that Toy, and the decision holds: Swipe is hand-rolled pointer tracking
too, not Motion's `drag` with momentum. The reasons carry over unchanged — Motion's `drag`
can't be exercised in jsdom, and a Swipe launches the Critter on release rather than
dragging it, so momentum-while-dragging isn't even the shape we need.

- Launch direction and speed are derived by hand from the last few pointer samples before
  release. The launch is assertable at the boundary (a stroke past the minimum distance
  reaches a launched state; a tap doesn't); the exact speed-to-distance mapping and the
  minimum distance are on-device-tuned and deliberately not asserted.
- Speed shapes the launch but never gates it — there is no velocity threshold that makes a
  stroke "not count" (ADR-0001: no failure path).
- The same pointer-capture/cancel/loss handling applies: a lost or cancelled pointer ends
  the stroke without launching, and the Critter stays put to be Swiped again.

## Amendment — Stir, the rotation gesture (issue 36, Soup Pot)

**Stir** (see the glossary) is hand-rolled pointer tracking too, for the same reasons: it has
to be assertable in jsdom with `fireEvent` pointer events, and no Motion gesture models
"accumulate rotation". What's new is *how* a turn is counted, and two choices there will
look odd without context:

- **The centre is fixed, not estimated.** Angle is measured around the pot's centre, not
  around a centre fitted to the child's stroke. A fitted centre would let circles anywhere
  count, but it's fragile on short, wobbly toddler strokes and hard to assert. The pot is
  the obvious thing to circle, and a finger circling half off it still sweeps angle around
  its centre, so nothing is missed.
- **Rotation is summed unsigned.** Every pointer sample adds the *absolute* angle it swept,
  so reversing direction, or wiggling back and forth, still makes progress. Signed turns
  would make going backwards undo work: a failure path in disguise
  ([[0001-finite-success-only-toy-lifecycle]]).

Two guards stop that generosity from producing fake turns:

- A **dead zone** near the centre: samples close to it add nothing, so a jittering finger on
  the centre can't sweep huge angles from tiny moves.
- A **per-sample jump cap**: one sample adds at most a small angle, so a finger that skips
  across the centre can't count as half a turn in one go.

Progress never decreases. A lifted, cancelled or lost pointer ends the stroke and keeps
every turn already made. The Goal's turn count, the dead-zone radius and the jump cap are
tuned on a device and deliberately not asserted. Tests observe the boundary: enough circling
reaches the Goal, a little doesn't, a reversal still adds, and a lift keeps progress.
