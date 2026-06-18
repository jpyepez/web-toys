import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToyProps } from '../../shell/registry';
import { SkyBackdrop } from './SkyBackdrop';
import { HoldableBalloon } from './HoldableBalloon';
import { GhostHoldFinger } from './GhostHoldFinger';
import { pip, pop, raspberry } from './sounds';
import { palette } from './palette';

/**
 * The bunch — each balloon's body colour (slice #1's palette) plus where it sits
 * in the scene. The bunch SIZE is `BUNCH.length`, the on-device-tuned duration
 * lever (like the sheep / fish / cast counts), deliberately NOT a unit-asserted
 * magic number (slice Notes). Five distinct colours for variety; there is no
 * hidden identity/reveal (PRD), so they are indexed, not named for a hue.
 *
 * `left`/`top` (percent of the Toy's `<main>`) fan the balloons into a loose
 * bunch over the peg — a gentle arch across the reachable MID-ZONE: high enough
 * to clear the bottom palm-rest dead zone where a thumb rests, low enough to
 * clear the top safe-area. They overlap as a believable cluster (the PRD's "bunch
 * tied to a low peg"), each still presenting its own tappable crown. The exact
 * tuples are on-device-tuned per AC #7 — this fan is the starting point for the
 * on-device reachability pass on a 390×844 phone, not a unit-asserted contract.
 */
/**
 * Idle delay before the wordless ghost-finger HOLD demo arms (ms). With no real
 * Hold yet, the stall flips the demo active and SHOWS the child the sustained
 * press (slice #06). ~2–3s, on-device-tuned per the kid-handoff DoD — the
 * structural contract tested is THAT a stall flips the demo on (and a real Hold
 * flips it off), never the exact ms. Mirrors Muddy Puddle's IDLE_DEMO_DELAY_MS.
 */
const IDLE_DEMO_DELAY_MS = 2500;

/**
 * Minimum gap between fill pips (ms) — the rate limit that turns the per-frame
 * fill ramp into a playful rising ladder rather than a machine-gun stream (slice
 * #07). A run of fill frames inside one window fires a single pip + tick; the
 * next only fires once this much wall-clock has passed. ~tens of ms, on-device-
 * tuned per the slice DoD — the structural contract tested is THAT throttling
 * happens, never the exact ms. Mirrors Muddy Puddle's SQUELCH_THROTTLE_MS.
 */
const PIP_THROTTLE_MS = 80;

const BUNCH = [
  { color: palette.balloon1, left: 22, top: 26 },
  { color: palette.balloon2, left: 50, top: 20 },
  { color: palette.balloon3, left: 78, top: 26 },
  { color: palette.balloon4, left: 36, top: 50 },
  { color: palette.balloon5, left: 64, top: 50 },
] as const;

/**
 * Balloons — the free-order bunch (balloons PRD, slice #04). The first Toy to
 * break the sequential one-at-a-time conveyor: every balloon is present from the
 * start, each a self-contained `HoldableBalloon` (slice #3) owning its OWN
 * independent lifecycle, fillable in ANY order. The Goal is to float the whole
 * bunch; when the last one detaches the Shell's Completion runs.
 *
 * This Toy owns its loop logic directly — NOT a shared hook
 * (`../../out-of-scope/shared-toy-loop-abstraction.md`); its shape (N concurrent
 * lifecycles) is deliberately different from the tap toys' arriving→waiting→
 * dismissing conveyor, so there is nothing to share.
 */
export function Balloons({ onComplete, sound, haptics }: ToyProps) {
  // Floats counted toward the Goal — incremented as each balloon detaches (its
  // `onFloat`). The bunch runs N concurrent lifecycles rather than one conveyor,
  // so this is a simple tally, not a state machine: the order balloons float in
  // doesn't matter, only that every one has.
  const [floated, setFloated] = useState(0);
  // ADR-0001 amendment: `onComplete` is a one-shot. The ref guards against a
  // re-render with a new `onComplete` reference (which the Shell does the moment
  // Completion starts) re-firing the effect. Mirrors the other Toys' loop guard.
  const completedRef = useRef(false);
  // The wordless ghost-finger HOLD demo's active flag (slice #06). With no real
  // Hold yet, the idle stall flips it true to SHOW the sustained press. Toy-LOCAL
  // on purpose — NOT pre-abstracted into a shared primitive (the
  // `shared-toy-loop-abstraction` cautionary precedent; slice Notes say copy).
  const [demoActive, setDemoActive] = useState(false);
  // Latches once the child makes a real, sustained Hold (a balloon's `onHold`).
  // The demo then cancels and stays SUPPRESSED for the rest of play — they've
  // shown they can Hold, so it never re-teaches (AC #2). A ref, not state: it
  // gates the idle timer's callback without needing to re-run the arming effect.
  const heldForRealRef = useRef(false);
  // Wall-clock time (ms, via the `Date.now` boundary) the last fill pip fired —
  // the throttle's only state, shared across the whole bunch so concurrent holds
  // contribute to one playful pip stream rather than overlapping machine-guns.
  // A ref, not state: the gate reads/writes it without re-rendering. Starts at 0
  // so the first pip of a hold always fires. Governs the haptic tick on the same
  // beat, so pip and tick rise and fall together (slice #07).
  const lastPipAtRef = useRef(0);

  // Voice + buzz a fill step, THROTTLED (slice #07): a fast per-frame ramp is
  // rate-limited to one pip + tick per window so the rising tone stays playful,
  // not a machine-gun (AC #2). Pitch is a function of the current fill, so the
  // throttled run ladders upward. Through the injected Sound/Haptics (the Toy
  // never touches Web Audio, ADR-0003); both optional, so a bare mount degrades
  // to silence. Stable identity so HoldableBalloon's progress effect doesn't
  // re-fire on a fresh closure each render.
  const onFillProgress = useCallback(
    (fill: number) => {
      const now = Date.now();
      if (now - lastPipAtRef.current >= PIP_THROTTLE_MS) {
        lastPipAtRef.current = now;
        sound?.play(pip(fill));
        haptics?.tick();
      }
    },
    [sound, haptics],
  );

  // The Goal — every balloon in the bunch floated. The count is the on-device-
  // tuned duration lever (slice Notes), so the Goal is derived from the bunch
  // size, never a separate magic number.
  const goalMet = floated >= BUNCH.length;

  // Fire `onComplete` once when the Goal is met. In its own effect so the Shell
  // re-rendering with a fresh `onComplete` reference at Completion doesn't double-
  // fire — the ref pins it to a single call. Fires the instant the last balloon
  // detaches, so the Shell's overlay layers over the final float-up while the Toy
  // stays mounted (ADR-0001 layered-concurrent amendment).
  useEffect(() => {
    if (!goalMet || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [goalMet, onComplete]);

  // Arm the wordless demo's idle timer (slice #06). With no real Hold yet, the
  // stall fires it active. The on-stage ghost-finger dwell + fill driven by
  // `demoActive` is on-device-tuned and not unit-asserted.
  useEffect(() => {
    const timer = setTimeout(() => {
      // Don't prompt if the child has Held for real during the wait — they don't
      // need teaching once they're already doing it.
      if (!heldForRealRef.current) setDemoActive(true);
    }, IDLE_DEMO_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      data-toy-state={goalMet ? 'completed' : 'playing'}
      data-demo-active={demoActive}
      style={{
        position: 'relative',
        minHeight: '100dvh',
        // The grassy-rise + peg band height, shared with SkyBackdrop's
        // bottom-anchored ground layer (which reads `var(--balloons-ground)`).
        // Defined on the common ancestor so the horizon sits at a fixed fraction
        // of the viewport across aspect ratios (ADR-0005). On-device-tuned; the
        // name is the contract. Deliberately a thin lower band — the tall sky
        // above is the load-bearing play space the balloons rise into.
        ['--balloons-ground' as string]: 'clamp(120px, 22dvh, 280px)',
      }}
    >
      <SkyBackdrop />
      {BUNCH.map(({ color, left, top }, i) => (
        // Static positioning wrapper — places the balloon in the mid-zone and
        // owns the centring `translateX(-50%)`. The float-up's `x`/`y` deltas live
        // on the `motion.div` INSIDE HoldableBalloon, so Motion fully owns that
        // transform while this wrapper owns the layout one (the
        // `motion-transform-ownership` gotcha — never let both write `transform`
        // on the same element).
        //
        // `pointer-events: none` is load-bearing: this slot's rectangle is far
        // larger than the round balloon and the slots OVERLAP across the bunch, so
        // an opaque slot would steal a tap meant for the balloon visible beneath
        // it (the on-device "wrong balloon inflates" bug). With every slot
        // transparent, the only hit-targets in the bunch are the balloon shapes
        // themselves (HoldableBalloon's `interactive` hit-target), so a press
        // always routes to the balloon under the finger; it still reaches the
        // balloon's own handlers by bubbling up through this transparent slot.
        <div
          key={i}
          data-balloon-slot=""
          style={{
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        >
          <HoldableBalloon
            color={color}
            onFloat={() => {
              // The detach reward beat (slice #07): a pop/"boing" + a haptic
              // pulse as the balloon snaps off the peg and leaps free. Through the
              // injected utilities (ADR-0003); optional, so a bare mount is silent.
              sound?.play(pop);
              haptics?.tick();
              setFloated((n) => n + 1);
            }}
            onHold={() => {
              // A real, sustained Hold — cancel the teaching demo at once and
              // suppress it for the rest of play (AC #2).
              heldForRealRef.current = true;
              setDemoActive(false);
            }}
            onFillProgress={onFillProgress}
            onLeak={() => {
              // An early lift before the cap — voice the funny descending
              // raspberry as the balloon deflates (slice #07). Through the
              // injected Sound (ADR-0003); optional, so a bare mount is silent.
              sound?.play(raspberry);
            }}
          />
        </div>
      ))}
      {/* The wordless HOLD demo's ghost finger (slice #06), overlaid while the
       * child stalls. Rendered only when `demoActive` and the Goal isn't yet met,
       * `pointer-events: none` so a real Hold underneath is untouched, and drawn
       * over its OWN faint demo balloon so it never advances the real bunch. */}
      {demoActive && !goalMet && <GhostHoldFinger />}
    </main>
  );
}
