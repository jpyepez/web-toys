import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MuddyPuddle } from './MuddyPuddle';

/**
 * Muddy Puddle — sequential loop mechanic (muddy-puddle PRD, slice #04).
 *
 * The playable Toy owns its OWN copy of the five-state machine (duplicated from
 * the tap toys, NOT shared — the deliberate cost of Toy independence per the
 * out-of-scope shared-loop rejection): `arriving → wiping → dismissing → idle →
 * arriving …` for the first four piglets, with the 5th clean-snap transitioning
 * into `dismissing` and firing `onComplete` (the ADR-0001 layered-concurrent
 * amendment — the Shell celebration overlay layers above the 5th piglet's
 * splash Outro). The only user-driven transition is `wiping → dismissing`,
 * consuming slice #3's "clean reached" signal; the rest are time-driven beats.
 *
 * Time-driven transitions use `vi.useFakeTimers()`; time is a process-boundary
 * collaborator per the mocking policy. Motion + WipeableCritter internals stay
 * unmocked — tests render through the public `<MuddyPuddle />` boundary and
 * observe state through the rendered DOM (the on-stage Piglet via its accessible
 * `img` role + `data-toy-state`, mirroring the Fish contract). Wipe-progress is
 * driven through slice #3's `data-mud-blob` nodes (never pixels, ADR-0006). The
 * trot-in / splash paths, snap scale, and timing tuples are on-device-tuned and
 * deliberately NOT unit-asserted (slice Notes).
 */
describe('Muddy Puddle — sequential loop mechanic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mounts with a single Piglet on stage in the arriving phase', () => {
    // The state machine bootstraps to `arriving` at mount: one muddy piglet is
    // on stage immediately (trotting in under Motion's control), queryable as a
    // single accessible element. This pins both the single-Critter invariant at
    // t=0 and the load-bearing role-name shape the rest of the AC's queries
    // reuse — `getAllByRole('img', { name: /Piglet/ })`.
    render(<MuddyPuddle onComplete={vi.fn()} />);

    const piglets = screen.getAllByRole('img', { name: /Piglet/ });
    expect(piglets).toHaveLength(1);
  });
});
