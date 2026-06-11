import { describe, it, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { WipeableCritter } from './WipeableCritter';

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
});
