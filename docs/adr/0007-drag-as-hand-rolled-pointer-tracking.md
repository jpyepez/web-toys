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
