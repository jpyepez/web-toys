import { useState } from 'react';
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
 * end-to-end on one Critter.
 */
const ALL_BLOBS = MUD_BLOBS.map((_, i) => i);

export function WipeableCritter() {
  const [remaining, setRemaining] = useState<number[]>(ALL_BLOBS);

  // Delegated wipe: read the crossed blob's index off the event target and drop
  // it from the remaining set. A blob already cleared by an earlier stroke is a
  // no-op (it is no longer in `remaining`), so cleared mud stays cleared.
  const wipeBlobUnderPointer = (target: EventTarget) => {
    const raw = (target as Element).getAttribute?.('data-blob-index');
    if (raw == null) return;
    const index = Number(raw);
    setRemaining((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : prev));
  };

  return (
    <div
      // `touch-action: none` so the browser does not hijack the drag for
      // scroll/zoom — the wipe gets every touch move (slice spec).
      style={{ touchAction: 'none' }}
      onPointerOver={(e) => wipeBlobUnderPointer(e.target)}
    >
      <PigletDrawing remainingBlobIndices={remaining} />
    </div>
  );
}
