import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { HoldableBalloon } from './HoldableBalloon';

/**
 * Balloons — the Hold (balloons PRD, slice #03). `HoldableBalloon` is the second
 * non-tap core interaction in the collection (CONTEXT): a sustained, stationary
 * finger-press fills one balloon over time; it self-caps at full, detaches, and
 * floats up, while an early lift leaks it slowly back down — forgiving, never a
 * reset. End-to-end on a SINGLE balloon; the bunch/loop/`onComplete` is slice #04.
 *
 * Fill and state are observed through the surface's `data-*` hooks
 * (`data-balloon-fill`, `data-balloon-state`) — the value boundary — never by
 * reading pixels or measuring wall-clock duration (slice AC #5). Time is the one
 * boundary collaborator: `vi.useFakeTimers()` advances the fill/leak ramp the same
 * way the loop/idle tests drive their timed beats. The exact fill-rate, leak-rate,
 * and per-balloon duration are on-device-tuned and deliberately NOT asserted
 * (slice Notes) — we advance generously to cross the cap and modestly to stay
 * below it, asserting only the value-boundary outcomes.
 */

const balloonFill = (container: HTMLElement) =>
  Number(container.querySelector('[data-holdable-balloon]')!.getAttribute('data-balloon-fill'));

describe('Balloons — HoldableBalloon hold/fill/leak/self-cap mechanic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('raises its fill while a pointer is held over the balloon', async () => {
    // AC #1 (first half): holding — a pointer down over the balloon — raises ITS
    // fill. We read the live `data-balloon-fill` value (the value boundary, not
    // pixels), press, advance a small slice of time (well under any tuned fill
    // duration), and assert the fill climbed above its at-rest 0.
    const { container } = render(<HoldableBalloon />);
    const surface = container.querySelector('[data-holdable-balloon]')!;

    expect(balloonFill(container)).toBe(0);

    fireEvent.pointerDown(surface);
    await vi.advanceTimersByTimeAsync(300);

    expect(balloonFill(container)).toBeGreaterThan(0);
  });

  it('leaks the fill back down on release without detaching', async () => {
    // AC #1 (second half): releasing the press LEAKS the fill (it decreases) and
    // does NOT detach — the balloon stays attached/`limp`. We hold to build a
    // sub-cap fill, release, advance, and assert the value dropped while the
    // state never left `limp`.
    const { container } = render(<HoldableBalloon />);
    const surface = container.querySelector('[data-holdable-balloon]')!;

    fireEvent.pointerDown(surface);
    await vi.advanceTimersByTimeAsync(500);
    const heldFill = balloonFill(container);
    expect(heldFill).toBeGreaterThan(0);

    fireEvent.pointerUp(surface);
    await vi.advanceTimersByTimeAsync(500);

    expect(balloonFill(container)).toBeLessThan(heldFill);
    expect(surface.getAttribute('data-balloon-state')).toBe('limp');
  });

  it('self-caps at full, detaches and floats away, and ignores further holding', async () => {
    // AC #2: holding to the cap (fill = 1) self-caps — the balloon detaches and
    // floats up and OFF the screen (it does not linger or gather). We advance
    // generously (far past any tuned fill + float-away duration, like the loop
    // tests' 10s fast-forward) so the assertion never encodes the rate. The
    // detached state is `floating` and it is TERMINAL — the balloon is gone.
    // Holding PAST full is a no-op: more time leaves the fill pinned at 1 and the
    // state `floating`.
    const { container } = render(<HoldableBalloon />);
    const surface = container.querySelector('[data-holdable-balloon]')!;

    fireEvent.pointerDown(surface);
    await vi.advanceTimersByTimeAsync(10_000);

    expect(balloonFill(container)).toBe(1);
    expect(surface.getAttribute('data-balloon-state')).toBe('floating');

    // Still pressing after the cap changes nothing — no over-inflate, no reset,
    // and `floating` is terminal so the gone balloon never re-appears.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(balloonFill(container)).toBe(1);
    expect(surface.getAttribute('data-balloon-state')).toBe('floating');
  });

  it('once blown up, floats away and stays gone — it never settles back or re-attaches', async () => {
    // The ending: a self-capped balloon rises up and off the screen and is gone
    // for good — there is no gather/linger beat. Its terminal state is `floating`
    // and nothing brings it back. We hold to the cap (detach → `floating`), lift,
    // then advance generously; the balloon must remain `floating` (off-screen),
    // never reverting to `limp` or leaking. The float-away path/position is
    // on-device-tuned and not asserted — only the terminal state.
    const { container } = render(<HoldableBalloon />);
    const surface = container.querySelector('[data-holdable-balloon]')!;

    fireEvent.pointerDown(surface);
    await vi.advanceTimersByTimeAsync(10_000);
    fireEvent.pointerUp(surface);
    await vi.advanceTimersByTimeAsync(10_000);

    expect(surface.getAttribute('data-balloon-state')).toBe('floating');
  });

  it('never instant-resets on an early lift — the balloon stays attached and inflated', async () => {
    // AC #3 (guard): lifting before the cap is FORGIVING — the balloon stays
    // attached (`limp`) and merely leaks, it never snaps back to 0. A naive
    // "deflate on release" implementation would fail this: right after a brief
    // release the fill is still well above 0 (and still below the cap), and the
    // state never flips to `floating`. Pins the absence of a reset path.
    const { container } = render(<HoldableBalloon />);
    const surface = container.querySelector('[data-holdable-balloon]')!;

    fireEvent.pointerDown(surface);
    await vi.advanceTimersByTimeAsync(500);
    fireEvent.pointerUp(surface);

    // One short slice after lifting: still inflated, still attached — not reset.
    await vi.advanceTimersByTimeAsync(50);
    const fillJustAfterLift = balloonFill(container);
    expect(fillJustAfterLift).toBeGreaterThan(0);
    expect(fillJustAfterLift).toBeLessThan(1);
    expect(surface.getAttribute('data-balloon-state')).toBe('limp');
  });

  it('carries touch-action: none on the hold surface', () => {
    // AC #4: the surface taking the press must carry `touch-action: none`, or the
    // browser claims the sustained hold for scroll/zoom and the fill never rises.
    // Asserted through the DOM style, not component internals — and the balloon
    // art being held lives inside that same surface (not a detached sibling).
    const { container } = render(<HoldableBalloon />);

    const surface = container.querySelector<HTMLElement>('[data-holdable-balloon]');
    expect(surface).not.toBeNull();
    expect(surface!.style.touchAction).toBe('none');
    expect(surface!.querySelector('[data-balloon-part="balloon"]')).not.toBeNull();
  });

  it('brings the held balloon to the front while held, dropping it back into the bunch on release', async () => {
    // On-device feedback: with the balloons overlapping in a bunch it was unclear
    // which one a press had grabbed. The active balloon must lift out of the
    // cluster and stack ABOVE its neighbours while held, then drop back when the
    // press ends — so the child always sees which one they're inflating. We pin
    // the structural promise (an elevated stacking order appears while held and
    // clears on release) through the surface's inline `z-index`; the exact lift /
    // scale / glow tuples are on-device-tuned and deliberately NOT asserted
    // (slice Notes), the same posture as the fill-rate and gather-path tuples.
    const { container } = render(<HoldableBalloon />);
    const surface = container.querySelector<HTMLElement>('[data-holdable-balloon]')!;

    // At rest it sits in the bunch at its natural paint order — no elevation.
    expect(surface.style.zIndex).toBe('');

    fireEvent.pointerDown(surface);
    // Held: lifted above its neighbours so it's unmistakably the active one.
    expect(Number(surface.style.zIndex)).toBeGreaterThan(0);

    fireEvent.pointerUp(surface);
    // Released early (still attached/limp) → back into the bunch, no elevation.
    expect(surface.style.zIndex).toBe('');
  });

  it('takes the press only on the balloon shape, not its overlapping bounding box', () => {
    // On-device: tapping near one balloon inflated a DIFFERENT one. The balloons
    // overlap in the bunch, and each balloon's wrapper is a large RECTANGLE far
    // bigger than the round balloon (the empty corners + the string's dead area),
    // so a tap on one balloon's empty rectangle was stolen by whichever
    // overlapping wrapper stacked on top. The fix is shape-accurate hit-testing:
    // the hold surface is pointer-TRANSPARENT so its empty area passes taps
    // through to whatever balloon is actually beneath, and only the painted
    // balloon shape (`data-balloon-part="balloon"`) re-enables the press. jsdom
    // has no layout or hit-testing, so we pin the MECHANISM that makes the right
    // balloon win — the same posture as the `touch-action: none` contract above.
    const { container } = render(<HoldableBalloon />);
    const surface = container.querySelector<HTMLElement>('[data-holdable-balloon]')!;

    // The wrapper's empty area no longer captures taps...
    expect(surface.style.pointerEvents).toBe('none');
    // ...while the balloon's own painted shape takes the press.
    const balloon = surface.querySelector<SVGElement>('[data-balloon-part="balloon"]')!;
    // CSS keyword, case-insensitive — jsdom serialises it lowercased.
    expect(balloon.style.pointerEvents.toLowerCase()).toBe('visiblepainted');
  });

  it('leaks slower than it fills — the load-bearing asymmetry (direction, not rate)', async () => {
    // Slice Notes elevate the asymmetry DIRECTION (leak slower than fill) to a
    // contract — "fills fast, leaks slow" is what makes lifting forgiving. We
    // assert the direction only, never the tuned tuples: over the SAME elapsed
    // time, the rise while held exceeds the drop while released. Both windows are
    // kept clear of the 0/1 clamps so the comparison is of the raw rates.
    const { container } = render(<HoldableBalloon />);
    const surface = container.querySelector('[data-holdable-balloon]')!;
    const WINDOW_MS = 400;

    fireEvent.pointerDown(surface);
    await vi.advanceTimersByTimeAsync(WINDOW_MS);
    const rise = balloonFill(container); // from 0, still below the cap
    expect(rise).toBeGreaterThan(0);
    expect(rise).toBeLessThan(1);

    fireEvent.pointerUp(surface);
    await vi.advanceTimersByTimeAsync(WINDOW_MS);
    const drop = rise - balloonFill(container); // leaked over the same window
    expect(drop).toBeGreaterThan(0);

    expect(drop).toBeLessThan(rise);
  });
});
