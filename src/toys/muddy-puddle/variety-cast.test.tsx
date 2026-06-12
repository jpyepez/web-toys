import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WipeableCritter } from './WipeableCritter';
import { MuddyPuddle } from './MuddyPuddle';
import { CAST } from './cast';

/** Wipe every blob the surface still shows, in turn, until the mud is gone. */
function wipeUntilClean(container: HTMLElement) {
  let blob = container.querySelector('[data-mud-blob]');
  while (blob) {
    fireEvent.pointerOver(blob);
    blob = container.querySelector('[data-mud-blob]');
  }
}

/**
 * Muddy Puddle — the surprise cast wired into the Wipe + loop (muddy-puddle PRD,
 * slice #05). The single-piglet mechanic of slices #03/#04 becomes animal-
 * agnostic: `WipeableCritter` Wipes whichever cast member it's handed, and the
 * loop walks a per-play-shuffled five-animal cast. Tests drive through the public
 * boundaries (the rendered DOM, the `data-mud-blob` nodes, the on-stage
 * Critter's `data-critter` identity), never the shuffle internals — the order is
 * non-deterministic by design (slice Notes).
 */
describe('Muddy Puddle — surprise cast in the Wipe', () => {
  it('Wipes whichever cast critter it is handed, snapping THAT animal clean', () => {
    // `WipeableCritter` is no longer piglet-bound: handed a cast descriptor, it
    // renders that animal (here the duckling — its bill tease shows, not a
    // piglet hook) and Wipes its OWN mud blanket to the clean reveal. This is the
    // generalisation the loop needs to send a different animal each round.
    const duckling = CAST.find((c) => c.id === 'duckling')!;
    const { container } = render(<WipeableCritter critter={duckling} />);

    expect(container.querySelectorAll('[data-critter-tease="beak"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-piglet-tease]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-mud-blob]').length).toBeGreaterThan(1);

    wipeUntilClean(container);

    expect(container.querySelectorAll('[data-mud-blob]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-critter-tease]')).toHaveLength(0);
  });

  describe('one play, on the loop', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('cleans five DISTINCT animals in a single play — one each, no repeats (AC #3)', async () => {
      // AC #3: the loop draws from the five-element cast, one each, so a single
      // play reveals five distinct animals — not five piglets. We walk the whole
      // play, reading the on-stage Critter's `data-critter` identity at each
      // round (the public hook the loop exposes alongside the accessible
      // `aria-label`), and assert the five collected ids are exactly the cast,
      // all distinct. The ORDER is shuffled per play and non-deterministic, so
      // we never assert which animal arrives when (slice Notes) — only the
      // distinct five-set.
      vi.useFakeTimers();
      const { container } = render(<MuddyPuddle onComplete={vi.fn()} />);

      const seen: (string | null)[] = [];
      for (let round = 0; round < CAST.length; round += 1) {
        await vi.runOnlyPendingTimersAsync(); // arriving → wiping
        seen.push(screen.getByRole('img').getAttribute('data-critter'));
        wipeUntilClean(container); // wiping → dismissing (clean-snap)
        await vi.runOnlyPendingTimersAsync(); // dismissing → idle | completed
        await vi.runOnlyPendingTimersAsync(); // idle → arriving (no-op past the 5th)
      }

      expect(seen).toHaveLength(5);
      expect(new Set(seen).size).toBe(5);
      expect(new Set(seen)).toEqual(new Set(['piglet', 'duckling', 'lamb', 'chick', 'calf']));
    });
  });
});
