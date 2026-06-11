import { useEffect, useRef, useState } from 'react';
import { MUD_BLOBS, PigletDrawing } from './PigletDrawing';

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
 */
const ALL_BLOBS = MUD_BLOBS.map((_, i) => i);

/**
 * The clean-snap fires once this fraction of blobs is wiped — the child never
 * has to clear the final bit; partial completion is by design (touch-dev
 * research: 3-year-olds abandon the last fraction). On-device-tuned (~80%) per
 * the slice Notes; the contract tested is THAT crossing it snaps clean, not the
 * exact value.
 */
const CLEAN_THRESHOLD = 0.8;

export function WipeableCritter({ onClean }: { onClean?: () => void }) {
  // `remaining` and `cleaned` move together atomically through one updater so a
  // burst of pointer events (multi-finger mashing) can't race: each crossing
  // sees the prior crossing's result, and the snap to `cleaned` is computed
  // from the same snapshot that drops the blob.
  const [state, setState] = useState<{ remaining: number[]; cleaned: boolean }>({
    remaining: ALL_BLOBS,
    cleaned: false,
  });

  // Delegated wipe: read the crossed blob's index off the event target and drop
  // it. A blob already cleared by an earlier stroke is a no-op (it is no longer
  // in `remaining`), so cleared mud stays cleared. When the drop carries the
  // wiped fraction past the threshold, the Critter snaps clean: any leftover
  // blobs vanish at once (`remaining: []`) and the reveal art shows.
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

  const wipeBlobUnderPointer = (target: EventTarget) => {
    const raw = (target as Element).getAttribute?.('data-blob-index');
    if (raw == null) return;
    const index = Number(raw);
    setState((prev) => {
      if (prev.cleaned || !prev.remaining.includes(index)) return prev;
      const next = prev.remaining.filter((i) => i !== index);
      const wipedFraction = (ALL_BLOBS.length - next.length) / ALL_BLOBS.length;
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
      onPointerOver={(e) => wipeBlobUnderPointer(e.target)}
    >
      <PigletDrawing cleaned={state.cleaned} remainingBlobIndices={state.remaining} />
    </div>
  );
}
