import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { Nestlings } from './Nestlings';
import { SETTLE_MS } from './DuskBackdrop';

/**
 * Nestlings — the settle & sleep Outro (nestlings PRD, slice #05). When the last
 * bird is placed the whole nestful settles to sleep UNDER the Shell's Completion
 * overlay: the dusk deepens toward night, the first stars twinkle in, the nest
 * bobs, every fledgling curls asleep — and the Toy KEEPS RENDERING through the
 * overlay (the Optional-Outro shape, ADR-0001 layered-concurrent amendment), it
 * does not unmount at Goal.
 *
 * Posture mirrors `balloons-loop.test.tsx` and the slice Notes: assert that the
 * Outro STATE is entered and the Toy stays mounted — never the choreography. The
 * settle timing, the star-twinkle, the sky-deepen tuples, and the exported
 * settle-duration's magnitude are all on-device-tuned and deliberately NOT
 * asserted. The settle is observed at the value boundary via the backdrop's
 * `data-dusk-night` flag; the asleep nestful via slice #3's `data-bird-state`.
 */

/** The dusk backdrop's settle flag — `true` once the nestful is going to sleep. */
const isSettled = (container: HTMLElement) =>
  container.querySelector('.dusk-backdrop')?.getAttribute('data-dusk-night');

/** Every bird surface in the cast (slice #3's `data-carriable-bird`). */
const birds = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-carriable-bird]')];

/**
 * Carry one bird and drop it ON the nest — a full Drag that PLACES it. The
 * measured nest centre is `{0,0}` in jsdom (all-zero rects), so a release at
 * `{0,0}` lands inside any sane snap-radius. Mirrors the loop test's helper.
 */
function placeBird(surface: HTMLElement) {
  fireEvent.pointerDown(surface, { clientX: 300, clientY: 300 });
  fireEvent.pointerMove(surface, { clientX: 0, clientY: 0 });
  fireEvent.pointerUp(surface, { clientX: 0, clientY: 0 });
}

describe('Nestlings — settle & sleep Outro', () => {
  it('is not yet settled while the cast is still being tucked in', () => {
    // During play (Goal not met) the dusk has not deepened to night — the settle
    // Outro only fires on the terminal placement. The backdrop's settle flag is
    // off; nothing about the scene reads as "asleep" yet.
    const { container } = render(<Nestlings onComplete={vi.fn()} />);

    expect(isSettled(container)).toBe('false');
  });

  it('enters the settle Outro on the terminal placement and keeps rendering — every bird asleep, onComplete once', () => {
    // AC #1 + #3 — placing the LAST bird flips the whole nestful into its settle
    // & sleep Outro: the backdrop deepens to night (`data-dusk-night`). The Toy
    // KEEPS RENDERING through the Shell's overlay (Optional-Outro shape, ADR-0001
    // amendment) — it does not unmount at Goal: `<main>` is still there with the
    // full cast, every bird `placed` (the asleep look from slice #2). And the
    // settle does not disturb slice #4's contract — `onComplete` still fires
    // exactly once. The deepen/star/bob choreography itself is on-device and not
    // asserted here.
    const onComplete = vi.fn();
    const { container } = render(<Nestlings onComplete={onComplete} />);

    const cast = birds(container);
    for (const b of cast) placeBird(b);

    // The settle Outro is entered.
    expect(isSettled(container)).toBe('true');
    // The Toy stays mounted through the overlay — the full cast is still rendered,
    // every member asleep in the nest (none unmounted, none reverted to loose).
    expect(container.querySelector('main')).not.toBeNull();
    expect(birds(container)).toHaveLength(cast.length);
    for (const b of birds(container)) {
      expect(b.getAttribute('data-bird-state')).toBe('placed');
    }
    // Slice #4's contract is unchanged by the Outro.
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('exports a settle-duration constant for the registry to hold the Completion', () => {
    // AC #2 — the per-Toy lever the registry wires to `winDelayMs` (slice #8), so
    // the Shell holds the "You did it!" dialogue for this settle beat instead of
    // landing it on a mid-settle frame (as Balloons' FLOAT_AWAY_MS / Counting
    // Sheep's exit do). We assert the CONTRACT — it's exported and is a positive,
    // finite number of ms — never its magnitude, which is on-device-tuned per the
    // slice Notes.
    expect(typeof SETTLE_MS).toBe('number');
    expect(Number.isFinite(SETTLE_MS)).toBe(true);
    expect(SETTLE_MS).toBeGreaterThan(0);
  });
});
