import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BirdDrawing, type BirdSpecies } from './BirdDrawing';

// The forgiving snap-radius (DOM px): a release whose point lands within this of
// the nest centre counts as "in the nest". On-device-tuned for a generous,
// 3-year-old-friendly target (ADR-0001 forgiveness) and deliberately NOT asserted
// — tests release squarely on the nest or far across the screen, never pinning it.
const SNAP_RADIUS = 120;

/** A point in client (DOM-pixel) space — the nest centre, the carry offset, and
 * the pointer positions the carry math works in. */
type Point = { x: number; y: number };

/**
 * The Drag — the third non-tap core interaction in the collection (CONTEXT;
 * nestlings PRD / slice #03; ADR-0007). One fledgling Critter the child picks up,
 * carries across the dusk scene, and drops near the nest: a release within a
 * forgiving snap-radius PLACES it (it snaps in, curls asleep, and locks); a
 * release outside merely RESTS it loose where it was left, pickup-able again
 * (ADR-0001 — no reset, no penalty). End-to-end on ONE bird against the slice #1
 * nest; the full cast / `onComplete` is slice #04, so this owns no callbacks yet.
 *
 * Hand-rolled pointer tracking, not Motion's `drag` (ADR-0007): `onPointerDown`
 * attaches the bird to the finger, `onPointerMove` follows `clientX/clientY` in
 * DOM-pixel space and drives the carry offset, and `onPointerUp` decides the snap
 * by comparing the release point to the injected `nestCenter` — so the gesture is
 * assertable at the boundary with synthetic pointer events (jsdom has no layout).
 * The per-bird lifecycle is exposed as `data-bird-state` (loose | carried |
 * placed) and the carry offset as `data-carry-x/y` so tests observe the value
 * boundary, never pixels.
 */
export function CarriableBird({
  species = 'robin',
  nestCenter,
  left = '50%',
  top = '58%',
  onPlaced,
  onCarry,
  onPickup,
  onRest,
  onCarryStep,
  onHoverNest,
}: {
  /** Which fledgling — passed through to `BirdDrawing` (slice #2). */
  species?: BirdSpecies;
  /**
   * The nest's centre in client px. The snap decision is the distance from the
   * release point to this — injected (not self-measured) so the Drag is provable
   * at the boundary with synthetic pointer coordinates (ADR-0007). In the full
   * scene (slice #4) the parent measures the nest's rect once and passes it.
   */
  nestCenter: Point;
  /**
   * Where this bird sits at rest in the scene (CSS length, percent of the Toy's
   * `<main>`) — the static wrapper's absolute placement. The full cast (slice #4)
   * scatters each bird to its own spot; a single-bird mount keeps the sensible
   * centred default. On-device-tuned, not asserted.
   */
  left?: string;
  top?: string;
  /**
   * Fired once when this bird crosses `loose → placed` (snapped into the nest).
   * The free-order cast (slice #4) tallies placements through it to drive the
   * Goal — mirrors Balloons' `onFloat`. Because `placed` is terminal and locked,
   * it fires at most once. Optional, so a bare single-bird mount needs no parent.
   */
  onPlaced?: () => void;
  /**
   * Fired when this bird is actually CARRIED — picked up and moved, not merely
   * tapped. The idle DRAG demo (slice #06) latches on it to cancel and suppress
   * its teaching: once the child carries a bird for real, they no longer need the
   * ghost-hand hint. A bare tap (press + release with no carry) must NOT fire it,
   * so the demo keeps teaching the tapper the carry they still need. Optional, so
   * a bare single-bird mount needs no parent.
   */
  onCarry?: () => void;
  /**
   * Fired the moment this bird is GRABBED (pointer-down on a loose bird) — the
   * pickup, before any move. The parent voices the rising chirp + a haptic tick
   * on it (slice #07). Unlike `onCarry` (which waits for the first move so a bare
   * tap doesn't suppress the demo), the pickup feedback fires on the grab itself:
   * touching a bird should always chirp + buzz. Optional, so a bare single-bird
   * mount needs no parent.
   */
  onPickup?: () => void;
  /**
   * Fired when this bird is deliberately RELEASED outside the snap-radius — set
   * down loose, away from the nest (ADR-0001 — no penalty). The parent voices the
   * gentle plip on it (slice #07). Only a deliberate drop fires it: a cancelled /
   * lost pointer (`endCarry`) is an interruption, not a set-down, so it stays
   * silent. Optional, so a bare single-bird mount needs no parent.
   */
  onRest?: () => void;
  /**
   * Fired on EVERY carry move (each pointer-move while held) — the raw stream the
   * parent rate-limits into the throttled wing-flutter (slice #07). Distinct from
   * the once-per-grab `onCarry` (demo suppression): the flutter must follow the
   * whole drag, so the parent owns the throttle, not this component. Optional, so
   * a bare single-bird mount needs no parent.
   */
  onCarryStep?: () => void;
  /**
   * Fired when the carried bird crosses INTO or OUT of the nest's snap-radius
   * (the same forgiving zone `onPointerUp` decides the drop by) — `true` on enter,
   * `false` on leave, and `false` again when the carry ends. The parent reflects
   * it to the nest so it nudges (a gentle swell) while a bird hovers over it,
   * telling the child "yes — drop it here". Only fires on transitions, not every
   * move. Optional, so a bare single-bird mount needs no parent.
   */
  onHoverNest?: (over: boolean) => void;
}) {
  // The bird's lifecycle through the Drag:
  //  - `loose`   — at rest, pickup-able (the start state, and where an
  //                out-of-range release leaves it).
  //  - `carried` — attached to the finger, following it across the scene.
  //  - `placed`  — snapped into the nest, curled asleep, and LOCKED (further
  //                pointers are no-ops). Terminal for this slice.
  const [phase, setPhase] = useState<'loose' | 'carried' | 'placed'>('loose');

  // The carry offset (DOM px) the inner element is transported by, relative to
  // where this bird sits at rest. It persists across releases so an out-of-range
  // drop rests the bird wherever it was left (ADR-0001 — no easing back to
  // origin), and a re-pickup continues from there.
  const [carry, setCarry] = useState<Point>({ x: 0, y: 0 });
  // The finger position where this carry began, captured on pickup. The offset is
  // measured from it (current pointer − grab), so the bird tracks the finger from
  // the point it was grabbed rather than snapping its centre under the finger.
  const grabRef = useRef<Point>({ x: 0, y: 0 });
  // The carry offset at the moment of pickup — the live offset is this plus the
  // finger's travel since, so re-grabbing a bird left mid-scene keeps its place.
  const carryAtGrabRef = useRef<Point>({ x: 0, y: 0 });
  // Whether `onCarry` has fired for the current grab. A grab alone (pointer-down)
  // is not yet a carry — only a MOVE while held is — so we wait for the first move
  // to report it, and only once per grab. Reset on each fresh pickup. This is what
  // keeps a bare TAP (down + up, no move) from reading as a real carry and wrongly
  // suppressing the idle demo (the carry-not-tap distinction; `onCarry` docs).
  const carriedReportedRef = useRef(false);
  // Whether the carried bird is currently OVER the nest's snap-radius. Tracked so
  // `onHoverNest` fires only on the enter/leave transitions (not every move), and
  // so the carry-end paths can clear a lingering hover. Reset per grab.
  const hoveringRef = useRef(false);

  // Report a hover transition once, keeping `hoveringRef` in sync. Clearing on
  // pointer-up/cancel makes the nest settle back the instant the carry ends.
  const setHovering = (over: boolean) => {
    if (over === hoveringRef.current) return;
    hoveringRef.current = over;
    onHoverNest?.(over);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== 'loose') return; // a placed bird is locked (no-op)
    grabRef.current = { x: e.clientX, y: e.clientY };
    carryAtGrabRef.current = carry;
    carriedReportedRef.current = false;
    // Capture the pointer to the painted bird so the carry keeps tracking even
    // when the finger/cursor leaves the bird shape (ADR-0007). Touch gets this
    // implicitly, but a desktop MOUSE does not — without it, a mouse drag loses
    // its move/up events the instant the cursor slides off the (small,
    // `visiblePainted`) bird, and the bird never reaches the nest. Capturing to
    // the stable `data-bird-part="bird"` group keeps the events flowing to these
    // handlers (they still bubble up through the pointer-transparent wrapper).
    const birdEl = (e.target as Element).closest?.('[data-bird-part="bird"]');
    try {
      birdEl?.setPointerCapture?.(e.pointerId);
    } catch {
      // capture can throw if the pointer is already gone — harmless, ignore.
    }
    setPhase('carried');
    // The grab is the pickup — voice the chirp + tick at once (slice #07). Fires
    // on the press itself (unlike `onCarry`, gated to the first move), so even a
    // bare tap chirps; the demo-suppression distinction stays with `onCarry`.
    onPickup?.();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (phase !== 'carried') return;
    setCarry({
      x: carryAtGrabRef.current.x + (e.clientX - grabRef.current.x),
      y: carryAtGrabRef.current.y + (e.clientY - grabRef.current.y),
    });
    // Is the bird now hovering over the nest's drop zone? Compare the finger (which
    // carries the bird) to the nest centre against the SAME radius the drop uses, so
    // the "drop it here" nudge lights up exactly when a release would land. Reported
    // only on the enter/leave edge (`setHovering` dedupes), never every move.
    const overNest =
      Math.hypot(e.clientX - nestCenter.x, e.clientY - nestCenter.y) <= SNAP_RADIUS;
    setHovering(overNest);
    // Every move feeds the wing-flutter stream (slice #07); the parent throttles
    // it into a gentle beat. Distinct from the once-per-grab `onCarry` below.
    onCarryStep?.();
    // The first move of this grab is the moment a pickup becomes a real CARRY —
    // report it once so the idle demo (slice #06) can cancel and suppress its
    // teaching. A bare tap never moves, so it never reaches here.
    if (!carriedReportedRef.current) {
      carriedReportedRef.current = true;
      onCarry?.();
    }
  };

  // The snap decision — the boundary, not physics (ADR-0007). On release we
  // compare the drop point (the finger, which carries the bird) to the nest
  // centre: within the forgiving radius → the bird is PLACED (snaps in, curls
  // asleep, and locks); outside → it RESTS loose exactly where it was left and
  // stays pickup-able (ADR-0001 — no reset, no easing back to origin).
  const onPointerUp = (e: React.PointerEvent) => {
    if (phase !== 'carried') return;
    const dx = e.clientX - nestCenter.x;
    const dy = e.clientY - nestCenter.y;
    const placed = Math.hypot(dx, dy) <= SNAP_RADIUS;
    // The carry is over — the nest settles back from any hover swell (the placement
    // beat below is the nest's own, separate reaction).
    setHovering(false);
    setPhase(placed ? 'placed' : 'loose');
    // Tally the placement for the cast's Goal (slice #4) — once only, since
    // `placed` is terminal and a placed bird's pointers are no-ops above. A drop
    // outside the radius is a deliberate loose set-down (slice #07): the parent
    // voices the gentle plip on it.
    if (placed) onPlaced?.();
    else onRest?.();
  };

  // A cancelled or lost pointer ENDS the carry (ADR-0007): the bird can never get
  // stuck attached to a finger that is gone. Unlike a deliberate release, this is
  // an interruption — never a snap decision — so the bird simply rests `loose`
  // where it currently is (its carry offset persists) and stays pickup-able. The
  // capture/loss semantics aren't observable in jsdom, so this is on-device-
  // validated; the same robustness Wipe and Hold handle by hand.
  const endCarry = () => {
    if (phase === 'carried') {
      setHovering(false);
      setPhase('loose');
    }
  };

  return (
    <div
      data-carriable-bird=""
      data-bird-state={phase}
      // The static positioning wrapper owns LAYOUT only (ADR-0007 transform-
      // ownership split): absolute placement in DOM-pixel space + `translateX
      // (-50%)` to centre the bird on its anchor point. It must never write the
      // carry transform — that lives on the inner element below — so the two never
      // fight over `transform`. The rest position comes from `left`/`top` (the
      // full cast scatters each bird; a single mount keeps the centred default).
      //
      // `touch-action: none` so the browser doesn't claim the drag for scroll/zoom
      // — the carry gets every pointer move. `pointer-events: none` makes this
      // large wrapper RECTANGLE transparent to taps so it can't steal a press meant
      // for an overlapping bird in the cast (slice #4); only the painted bird shape
      // re-enables the press (BirdDrawing `interactive`). The press still fires
      // these handlers — it bubbles up from the shape through this pointer-
      // transparent wrapper ([[web-toys-touch-gotchas]], the same fix as Balloons).
      style={{
        position: 'absolute',
        left,
        top,
        transform: 'translateX(-50%)',
        touchAction: 'none',
        pointerEvents: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={endCarry}
      onLostPointerCapture={endCarry}
    >
      {/* The inner element owns the carry transform (`x/y`); the static wrapper
       * above owns layout (ADR-0007 transform-ownership split). The carry offset is
       * mirrored to `data-carry-x/y` so the Drag is observable at the value
       * boundary. */}
      <motion.div data-carry-x={carry.x} data-carry-y={carry.y} style={{ x: carry.x, y: carry.y }}>
        <BirdDrawing
          species={species}
          carried={phase === 'carried'}
          asleep={phase === 'placed'}
          interactive
        />
      </motion.div>
    </div>
  );
}
