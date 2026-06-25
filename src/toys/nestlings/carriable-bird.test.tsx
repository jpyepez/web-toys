import { describe, it, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { CarriableBird } from './CarriableBird';

/**
 * Nestlings — the Drag (nestlings PRD, slice #03; ADR-0007). `CarriableBird` is
 * the third non-tap core interaction in the collection (CONTEXT): a finger
 * *attaches* one fledgling Critter, *carries* it across the scene, and on release
 * within a forgiving snap-radius of the nest *places* it (snaps in, curls asleep,
 * locks) — while a release outside merely rests it loose where it was left,
 * pickup-able again (ADR-0001 forgiveness — no reset, no penalty). End-to-end on a
 * SINGLE bird against the slice #1 nest; the full cast / `onComplete` is slice #04.
 *
 * The gesture is proven at the boundary the way ADR-0007 mandates: synthetic
 * `fireEvent` pointer events with `clientX/clientY` drive the carry, and the snap
 * decision is `distance(release, nestCenter) ≤ radius` against an INJECTED
 * `nestCenter` — so no real layout is needed (jsdom has none). State is observed
 * through the surface's `data-bird-state` hook (loose | carried | placed) and the
 * carry offset through `data-carry-x/y` — the value boundary, never pixels. The
 * exact snap-radius, carry feel, lift/scale cue, and nestle position are
 * on-device-tuned and deliberately NOT asserted (slice Notes); tests release
 * squarely on the nest or far across the screen, never pinning the radius.
 */

// The nest's centre in client px, injected — tests feed pointer coords relative
// to it. Far away is anywhere well outside any sane snap-radius.
const NEST = { x: 200, y: 300 };

const state = (container: HTMLElement) =>
  container.querySelector('[data-carriable-bird]')!.getAttribute('data-bird-state');

const carry = (container: HTMLElement) => {
  const el = container.querySelector('[data-carry-x]')!;
  return { x: Number(el.getAttribute('data-carry-x')), y: Number(el.getAttribute('data-carry-y')) };
};

describe('Nestlings — CarriableBird drag/snap/rest mechanic', () => {
  it('attaches to the finger on pointer-down — a loose bird becomes carried', () => {
    // AC #1 (first half): a pointer-down on a `loose` bird sets it `carried` — the
    // pickup that begins the Drag. We read `data-bird-state` (the value boundary),
    // press on the surface, and assert it left `loose` for `carried`.
    const { container } = render(<CarriableBird nestCenter={NEST} />);
    const surface = container.querySelector('[data-carriable-bird]')!;

    expect(state(container)).toBe('loose');

    fireEvent.pointerDown(surface, { clientX: 50, clientY: 50 });

    expect(state(container)).toBe('carried');
  });

  it('follows the finger while carried — moves drive the carry offset', () => {
    // AC #1 (second half): once carried, subsequent pointer moves drive the bird's
    // carry offset (the Motion value that transports it). We grab, then move the
    // finger by a positive delta and assert the carry offset responds (becomes
    // non-zero, tracking the move) — the value boundary, not the rendered
    // transform. The exact grab math / carry feel is on-device-tuned, so we assert
    // the offset MOVED with the finger, never a pinned pixel mapping.
    const { container } = render(<CarriableBird nestCenter={NEST} />);
    const surface = container.querySelector('[data-carriable-bird]')!;

    fireEvent.pointerDown(surface, { clientX: 50, clientY: 50 });
    expect(carry(container)).toEqual({ x: 0, y: 0 });

    fireEvent.pointerMove(surface, { clientX: 90, clientY: 130 });

    const offset = carry(container);
    expect(offset.x).toBeGreaterThan(0);
    expect(offset.y).toBeGreaterThan(0);
  });

  it('places the bird when released within the nest snap-radius — it snaps in and curls asleep', () => {
    // AC #2: a release whose point is WITHIN the forgiving snap-radius of the nest
    // sets the bird `placed` and shows the asleep look (head tucked, eyes closed —
    // slice #2's nestled face). We carry the bird and release it squarely ON the
    // nest centre, so the distance test passes at any sane radius (the exact
    // radius is on-device-tuned and never pinned). The asleep look is proven
    // through the real `BirdDrawing` eye part switching to its closed-lid shape —
    // no mock, the actual rendered Critter.
    const { container } = render(<CarriableBird nestCenter={NEST} />);
    const surface = container.querySelector('[data-carriable-bird]')!;

    fireEvent.pointerDown(surface, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(surface, { clientX: NEST.x, clientY: NEST.y });
    fireEvent.pointerUp(surface, { clientX: NEST.x, clientY: NEST.y });

    expect(state(container)).toBe('placed');
    // The nestled face: an awake bird draws an open-eye <circle>, a placed/asleep
    // bird a closed-lid <path> (slice #2). Proves the asleep look is shown.
    expect(container.querySelector('[data-bird-part="eye"]')!.tagName).toBe('path');
  });

  it('rests loose when released outside the snap-radius — and stays pickup-able', () => {
    // AC #3: a release FAR from the nest is forgiving (ADR-0001) — the bird does
    // not place, it simply rests `loose` where it was left (no reset, no penalty)
    // and can be picked up again. We carry it, drop it far across the screen, and
    // assert it is `loose` with its carry offset persisted (rested where left, not
    // eased back to origin), then a SECOND pickup re-attaches it (`carried`).
    const { container } = render(<CarriableBird nestCenter={NEST} />);
    const surface = container.querySelector('[data-carriable-bird]')!;

    fireEvent.pointerDown(surface, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(surface, { clientX: 900, clientY: 900 });
    fireEvent.pointerUp(surface, { clientX: 900, clientY: 900 });

    expect(state(container)).toBe('loose');
    // Rested where left, not snapped back to origin.
    expect(carry(container)).not.toEqual({ x: 0, y: 0 });

    // Still pickup-able — a second Drag begins.
    fireEvent.pointerDown(surface, { clientX: 900, clientY: 900 });
    expect(state(container)).toBe('carried');
  });

  it('locks a placed bird — further pointers are non-destructive no-ops', () => {
    // AC #4: once a bird is `placed` it is settled in the nest for good; further
    // pointers on it do nothing (no re-pickup, no drift). We place it, then fire a
    // full down→move→up sequence on it and assert it stays `placed` with its carry
    // offset unchanged at every step — the nestled bird is locked.
    const { container } = render(<CarriableBird nestCenter={NEST} />);
    const surface = container.querySelector('[data-carriable-bird]')!;

    fireEvent.pointerDown(surface, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(surface, { clientX: NEST.x, clientY: NEST.y });
    fireEvent.pointerUp(surface, { clientX: NEST.x, clientY: NEST.y });
    expect(state(container)).toBe('placed');
    const settled = carry(container);

    fireEvent.pointerDown(surface, { clientX: NEST.x, clientY: NEST.y });
    expect(state(container)).toBe('placed');
    fireEvent.pointerMove(surface, { clientX: 900, clientY: 900 });
    expect(state(container)).toBe('placed');
    expect(carry(container)).toEqual(settled);
    fireEvent.pointerUp(surface, { clientX: 900, clientY: 900 });
    expect(state(container)).toBe('placed');
  });

  it('decides the snap by distance to the nest — the same drop places under the nest, rests away from it', () => {
    // AC #5: the snap outcome is the rect-distance test against the nest, fed
    // synthetic pointer coordinates — proven at the boundary. We hold the DROP
    // point fixed and vary only the injected `nestCenter`: dropping onto the nest
    // places; the identical drop with the nest far away rests loose. Isolating the
    // nest position as the sole difference proves the decision is driven by the
    // pointer-vs-nest distance, not by where on the screen the release happened.
    const dropAt = { clientX: 400, clientY: 400 };
    const outcomeFor = (nestCenter: { x: number; y: number }) => {
      const { container } = render(<CarriableBird nestCenter={nestCenter} />);
      const surface = container.querySelector('[data-carriable-bird]')!;
      fireEvent.pointerDown(surface, { clientX: 50, clientY: 50 });
      fireEvent.pointerMove(surface, dropAt);
      fireEvent.pointerUp(surface, dropAt);
      return state(container);
    };

    expect(outcomeFor({ x: 400, y: 400 })).toBe('placed'); // nest under the drop
    expect(outcomeFor({ x: 50, y: 50 })).toBe('loose'); // nest far from the same drop
  });

  it('honours the transform-ownership split — layout on the wrapper, carry on the inner element', () => {
    // AC #6 + ADR-0007 (mandatory): the static wrapper owns LAYOUT (absolute
    // placement + the `translateX(-50%)` centring) and the inner element owns the
    // CARRY `x/y` — never both writing `transform`. We assert the wrapper carries
    // the centring transform, then drive a carry and assert the offset lands on
    // the inner element while the wrapper's transform is UNCHANGED (no carry leak,
    // no double transform).
    const { container } = render(<CarriableBird nestCenter={NEST} />);
    const wrapper = container.querySelector<HTMLElement>('[data-carriable-bird]')!;

    expect(wrapper.style.position).toBe('absolute');
    expect(wrapper.style.left).not.toBe('');
    expect(wrapper.style.transform).toContain('translateX(-50%)');
    const layoutTransform = wrapper.style.transform;

    fireEvent.pointerDown(wrapper, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(wrapper, { clientX: 200, clientY: 260 });

    // The carry offset lands on the inner element...
    expect(carry(container).x).toBeGreaterThan(0);
    // ...and the wrapper's transform never gains the carry (no double transform).
    expect(wrapper.style.transform).toBe(layoutTransform);
  });

  it('takes the press only on the painted bird, with touch-action none on the surface', () => {
    // Slice spec (mirrors Balloons / [[web-toys-touch-gotchas]]): the carry surface
    // must carry `touch-action: none` or the browser claims the drag for
    // scroll/zoom and the bird never follows the finger. And the positioning
    // wrapper is a large RECTANGLE far bigger than the bird, so it must be
    // pointer-TRANSPARENT (`pointer-events: none`) — only the painted bird shape
    // re-enables the press (`pointer-events: visiblePainted`) — or it would steal
    // taps meant for an overlapping neighbour in the full cast (slice #4). jsdom
    // has no hit-testing, so we pin the MECHANISM, the same posture as Balloons.
    const { container } = render(<CarriableBird nestCenter={NEST} />);
    const wrapper = container.querySelector<HTMLElement>('[data-carriable-bird]')!;

    expect(wrapper.style.touchAction).toBe('none');
    expect(wrapper.style.pointerEvents).toBe('none');

    const bird = wrapper.querySelector<SVGElement>('[data-bird-part="bird"]')!;
    // CSS keyword, case-insensitive — jsdom serialises it lowercased.
    expect(bird.style.pointerEvents.toLowerCase()).toBe('visiblepainted');
  });

  it('never gets stuck on a gone finger — a cancelled carry ends, resting the bird loose', () => {
    // Slice spec + ADR-0007: a cancelled/lost pointer must end the carry so a bird
    // can never stay stuck attached to a finger that is gone. The full capture/loss
    // semantics aren't observable in jsdom (on-device-validated), but `pointerCancel`
    // IS dispatchable, so we lock the guarantee we can see: a carried bird that gets
    // a cancel returns to `loose` (not stuck `carried`, and never `placed` — a
    // cancel is an interruption, not a deliberate drop in the nest), resting where
    // it was left so it stays pickup-able.
    const { container } = render(<CarriableBird nestCenter={NEST} />);
    const surface = container.querySelector('[data-carriable-bird]')!;

    fireEvent.pointerDown(surface, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(surface, { clientX: NEST.x, clientY: NEST.y });
    expect(state(container)).toBe('carried');

    fireEvent.pointerCancel(surface);

    expect(state(container)).toBe('loose');
  });
});
