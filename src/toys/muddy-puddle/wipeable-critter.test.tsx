import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { WipeableCritter } from './WipeableCritter';

/** Wipe every blob the surface still shows, in turn, until the mud is gone. */
function wipeUntilClean(container: HTMLElement) {
  let blob = container.querySelector('[data-mud-blob]');
  while (blob) {
    fireEvent.pointerOver(blob);
    blob = container.querySelector('[data-mud-blob]');
  }
}

/**
 * Muddy Puddle — the Wipe (muddy-puddle PRD, slice #03). `WipeableCritter` is
 * the first non-tap core interaction in the collection: a sustained finger drag
 * removes the mud blobs it crosses, and once enough are gone the Critter
 * auto-snaps clean and reveals. End-to-end on a single piglet; the loop that
 * consumes the "clean reached" signal is slice #04.
 *
 * Coverage is asserted by COUNTING remaining `data-mud-blob` nodes, never by
 * reading pixels (ADR-0006). A finger "crossing" a blob is simulated by firing
 * a pointer event on that blob node — the assertable blob boundary — so the
 * tests need no layout/geometry from jsdom. The exact blob count and the clean
 * threshold percentage are on-device-tuned and deliberately NOT asserted (slice
 * Notes); we pin only that crossing a blob removes it and that crossing the
 * threshold snaps clean.
 */
describe('Muddy Puddle — WipeableCritter wipe-coverage mechanic', () => {
  it('removes the blob a pointer crosses — the remaining blob count decrements', () => {
    // AC #1: a pointer/touch crossing a blob removes THAT blob; the remaining
    // count (observed by node count per ADR-0006) decrements. One crossing is
    // far below the clean threshold (~80% wiped), so this is a plain removal,
    // not a snap — the count drops by exactly one.
    const { container } = render(<WipeableCritter />);

    const before = container.querySelectorAll('[data-mud-blob]').length;
    expect(before).toBeGreaterThan(1);

    fireEvent.pointerOver(container.querySelector('[data-mud-blob]')!);

    expect(container.querySelectorAll('[data-mud-blob]').length).toBe(before - 1);
  });

  it('snaps clean at the threshold — leftover blobs vanish at once and the revealed-clean art shows', () => {
    // AC #2: crossing the clean threshold (~80% wiped, on-device-tuned) snaps
    // the Critter clean — any leftover blobs are removed AT ONCE and the reveal
    // art shows. We must NOT hardcode the threshold (slice Notes), so we wipe
    // blobs one at a time until the mud is gone and assert the load-bearing
    // shape: it took FEWER crossings than there are blobs (the child never has
    // to wipe the final bit — partial completion by design), the leftover blobs
    // were cleared in one go (zero `data-mud-blob` remain), and the reveal art
    // is showing — the tease is dropped and the clean piglet is fully visible.
    const { container } = render(<WipeableCritter />);

    const total = container.querySelectorAll('[data-mud-blob]').length;

    let crossings = 0;
    let blob = container.querySelector('[data-mud-blob]');
    while (blob) {
      fireEvent.pointerOver(blob);
      crossings += 1;
      blob = container.querySelector('[data-mud-blob]');
    }

    expect(crossings).toBeLessThan(total);
    expect(container.querySelectorAll('[data-mud-blob]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-piglet-tease]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-piglet-part="body"]').length).toBeGreaterThan(0);
  });

  it('signals "clean reached" exactly once via onClean at the snap — ref-guarded against re-render', () => {
    // The slice exposes "clean reached" as an observable the loop (slice #04)
    // consumes to drive `wiping → dismissing`. We chose an `onClean` callback;
    // it fires once, at the snap, never before. The single-call guard mirrors
    // the Fish's `completedRef`: when the Shell hands the Toy a fresh `onClean`
    // reference on re-render at Completion, the signal must not re-fire.
    const onClean = vi.fn();
    const { container, rerender } = render(<WipeableCritter onClean={onClean} />);

    // A sub-threshold wipe does not signal — the loop must not advance early.
    fireEvent.pointerOver(container.querySelector('[data-mud-blob]')!);
    expect(onClean).not.toHaveBeenCalled();

    // Wiping past the threshold fires the signal exactly once.
    wipeUntilClean(container);
    expect(onClean).toHaveBeenCalledTimes(1);

    // A re-render with a brand-new `onClean` reference must not re-fire it.
    rerender(<WipeableCritter onClean={vi.fn()} />);
    expect(onClean).toHaveBeenCalledTimes(1);
  });

  it('accepts all touch points — simultaneous fingers each clear the blob they cross', () => {
    // AC #3: any finger or palm crossing a blob clears it, with no special-
    // casing of a "primary" pointer — so multi-finger / whole-hand mashing just
    // cleans faster (forgiving, not broken). Two distinct touch points
    // (different `pointerId`) each cross a different blob; both clear, the count
    // drops by two, and nothing throws.
    const { container } = render(<WipeableCritter />);

    const before = container.querySelectorAll('[data-mud-blob]').length;
    const [a, b] = container.querySelectorAll('[data-mud-blob]');
    const idxA = a.getAttribute('data-blob-index');
    const idxB = b.getAttribute('data-blob-index');

    expect(() => {
      fireEvent.pointerOver(a, { pointerId: 1 });
      fireEvent.pointerOver(b, { pointerId: 2 });
    }).not.toThrow();

    expect(container.querySelectorAll('[data-mud-blob]').length).toBe(before - 2);
    expect(container.querySelector(`[data-blob-index="${idxA}"]`)).toBeNull();
    expect(container.querySelector(`[data-blob-index="${idxB}"]`)).toBeNull();
  });
});
