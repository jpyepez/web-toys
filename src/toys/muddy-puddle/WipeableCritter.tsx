import { useEffect, useRef, useState } from 'react';
import { type Critter, PIGLET } from './cast';

/**
 * The Wipe — the first non-tap core interaction in the collection (muddy-puddle
 * PRD / slice #03). A single muddy piglet the child cleans with a sustained
 * finger drag: any touch point crossing a mud blob clears that blob, and the
 * cleared blobs stay cleared (the Wipe is continuous + accumulative, distinct
 * from a tap — CONTEXT).
 *
 * Coverage lives here as the set of blobs still caked on (`remaining`), handed
 * to `PigletDrawing` so the clean piglet shows through as mud lifts. The blob
 * nodes are the observable: clearing one unmounts its `data-mud-blob` node, so
 * progress is counted by node count, never read from pixels (ADR-0006).
 *
 * The surface accepts ALL touch points and delegates their pointer events: a
 * finger crossing a blob fires `pointerover` on it (a bubbling event, unlike
 * `pointerenter`), which reaches this surface; the handler reads the blob's
 * `data-blob-index` and drops it. Multi-finger / whole-hand mashing therefore
 * just clears faster — forgiving, not broken.
 *
 * The loop that consumes the "clean reached" signal is slice #04; this slice is
 * end-to-end on one Critter. The signal is the optional `onClean` callback,
 * fired once at the snap — the loop wires it to its `wiping → dismissing`
 * transition.
 *
 * Slice #05 makes it animal-agnostic: the Critter to Wipe is the injected
 * `critter` descriptor (defaulting to the piglet — the slices #02–#04 default),
 * so the loop sends a different cast member each round. The mud blanket and the
 * reveal art come from that descriptor; the wipe logic below is unchanged.
 */

/**
 * The clean-snap fires once this fraction of blobs is wiped — the child never
 * has to clear the final bit; partial completion is by design (touch-dev
 * research: 3-year-olds abandon the last fraction). On-device-tuned (~80%) per
 * the slice Notes; the contract tested is THAT crossing it snaps clean, not the
 * exact value.
 */
const CLEAN_THRESHOLD = 0.8;

export function WipeableCritter({
  critter = PIGLET,
  onClean,
}: {
  critter?: Critter;
  onClean?: () => void;
}) {
  // The injected Critter's own mud blanket — every index caked on at mount. Each
  // arrival is a fresh mount (the loop's `idle` beat unmounts the prior Critter),
  // so this seeds the full set once per animal; no need to react to `critter`
  // changing in place.
  const allBlobs = critter.blobs.map((_, i) => i);
  const Drawing = critter.Drawing;
  // `remaining` and `cleaned` move together atomically through one updater so a
  // burst of pointer events (multi-finger mashing) can't race: each crossing
  // sees the prior crossing's result, and the snap to `cleaned` is computed
  // from the same snapshot that drops the blob.
  const [state, setState] = useState<{ remaining: number[]; cleaned: boolean }>({
    remaining: allBlobs,
    cleaned: false,
  });

  // The "clean reached" signal is a one-shot. The ref guards against the loop
  // (slice #04) handing a fresh `onClean` reference on re-render — without it
  // the effect's `onClean` dependency would re-fire the signal. Mirrors the
  // Fish's `completedRef`.
  const signalledRef = useRef(false);
  useEffect(() => {
    if (!state.cleaned || signalledRef.current) return;
    signalledRef.current = true;
    onClean?.();
  }, [state.cleaned, onClean]);

  // Delegated wipe: read the crossed blob's index off the event target and drop
  // it. A blob already cleared by an earlier stroke is a no-op (it is no longer
  // in `remaining`), so cleared mud stays cleared. When the drop carries the
  // wiped fraction past the threshold, the Critter snaps clean: any leftover
  // blobs vanish at once (`remaining: []`) and the reveal art shows.
  const wipeBlobUnderPointer = (target: EventTarget) => {
    const raw = (target as Element).getAttribute?.('data-blob-index');
    if (raw == null) return;
    const index = Number(raw);
    setState((prev) => {
      if (prev.cleaned || !prev.remaining.includes(index)) return prev;
      const next = prev.remaining.filter((i) => i !== index);
      const wipedFraction = (allBlobs.length - next.length) / allBlobs.length;
      return wipedFraction >= CLEAN_THRESHOLD
        ? { remaining: [], cleaned: true }
        : { remaining: next, cleaned: false };
    });
  };

  return (
    <div
      data-wipe-surface=""
      // `touch-action: none` so the browser does not hijack the drag for
      // scroll/zoom — the wipe gets every touch move (slice spec).
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        // Touch sets IMPLICIT pointer capture on the element the finger lands
        // on, which would route the whole drag's moves to that one element and
        // suppress `pointerover` on the sibling blobs the finger then crosses —
        // the drag would clear only the first blob. Releasing it lets each
        // crossed blob get its own `pointerover` so the sustained drag wipes
        // along its path. (Pointer-capture + real movement aren't observable in
        // jsdom — this is the on-device drag enabler behind AC #7.)
        const target = e.target as Element;
        if (target.hasPointerCapture?.(e.pointerId)) {
          target.releasePointerCapture(e.pointerId);
        }
        // The press itself is a crossing — clear the blob under the finger so
        // the stroke's first contact counts.
        wipeBlobUnderPointer(e.target);
      }}
      onPointerOver={(e) => wipeBlobUnderPointer(e.target)}
    >
      <Drawing cleaned={state.cleaned} remainingBlobIndices={state.remaining} />
    </div>
  );
}
