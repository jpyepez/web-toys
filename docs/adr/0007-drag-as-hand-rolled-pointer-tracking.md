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
