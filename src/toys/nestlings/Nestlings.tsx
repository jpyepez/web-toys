import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ToyProps } from '../../shell/registry';
import { DuskBackdrop } from './DuskBackdrop';
import { CarriableBird } from './CarriableBird';
import { GhostCarryHand } from './GhostCarryHand';
import type { BirdSpecies } from './BirdDrawing';
import { chirp, coo, flutter, plip } from './sounds';
import { FOOT_FRACTION, useCanopyScene } from './useCanopyScene';
import { BODY_CENTRE_DROP } from './CarriableBird';

/** A point in client (DOM-pixel) space — the measured nest centre. */
type Point = { x: number; y: number };

/**
 * Idle delay before the wordless ghost-hand CARRY demo arms (ms). With no real
 * carry yet, the stall flips the demo active and SHOWS the child the pick-up-and-
 * carry (slice #06). ~2–3s, on-device-tuned per the kid-handoff DoD — the
 * structural contract tested is THAT a stall flips the demo on (and a real carry
 * flips it off), never the exact ms. Mirrors Balloons' IDLE_DEMO_DELAY_MS.
 */
const IDLE_DEMO_DELAY_MS = 2500;

/**
 * Min interval between carry wing-flutters (ms). A carry fires a pointer-move per
 * frame, so the flutter is rate-limited to one per window — a gentle beat under a
 * fast drag, not a machine-gun stream (slice #07, AC #2). Mirrors Balloons'
 * PIP_THROTTLE_MS. On-device-tuned; the throttle (not the exact ms) is the
 * asserted contract.
 */
const FLUTTER_THROTTLE_MS = 90;

/**
 * The cast — one species per fledgling, in the order they are handed perches.
 *
 * The SIZE of this list is the on-device-tuned duration lever (like the sheep /
 * fish / balloon counts) and the Goal is derived from it, so it is deliberately
 * not a unit-asserted magic number. Five visually distinct species for variety;
 * there is no hidden identity/reveal (PRD), so they only colour the set.
 *
 * WHERE THEY STAND IS NO LONGER WRITTEN HERE, and that is the point.
 *
 * This used to be five hand-tuned `left`/`top` percentages, chosen to descend
 * toward the nest and to avoid the top chrome. They were maintained separately
 * from the scene, which was drawn separately from them — so five birds wearing
 * contact shadows stood in open sky, neither perched nor airborne, and no amount
 * of adjusting either list could fix it, because nothing tied them together.
 *
 * The canopy generator now produces PERCH points on the limbs it draws, and the
 * cast is placed on those. The birds stand on the branches for the same reason a
 * real one does: the branch is there. It also means the scatter re-composes
 * itself for the viewport instead of being a portrait arrangement stretched
 * across a desktop.
 */
const CAST: BirdSpecies[] = ['robin', 'bluebird', 'wren', 'sparrow', 'goldfinch'];

/**
 * Where each fledgling settles once it is tucked in — its seat in the huddle,
 * as a fraction of the measured nest's width, plus how far it nestles down.
 *
 * A placed bird used to simply stay wherever the finger released it, and the
 * snap radius is deliberately forgiving, so five of them landed in a pile: a
 * full nest looked identical to a nest with one bird in it. The Goal of the
 * whole Toy had no visible accumulation, which is the one reward a
 * three-year-old is actually playing for.
 *
 * Seats are assigned by the bird's INDEX, not by the order it was carried, so
 * the free-order cast stays free-order — every bird has its own spot and it does
 * not matter which arrives first. `y` ascends with the index so a later bird
 * draws in FRONT of an earlier one: DOM order is paint order, and a huddle
 * whose back row overlaps its front row reads as a mistake.
 *
 * They overlap, and they are meant to. Five fledglings do not fit side by side
 * in a bowl two birds wide, and a row of evenly spaced, non-touching birds would
 * be a shelf rather than a nestful.
 *
 * Every `y` is POSITIVE — below the measured rect. That rect is the nest's
 * OPENING, which sits at the top of the bowl, so seats level with it perch the
 * huddle on the rim like eggs balanced on the edge; the inside of the bowl is
 * further down than the thing the drop zone is measured from.
 */
/**
 * How far above the nest the wordless demo starts, in bird-widths. Far enough
 * that the pull is a carry rather than a nudge, close enough that the phantom
 * stays in the nest's own clear approach lane instead of crossing the cast.
 */
const DEMO_LIFT_BIRDS = 1.9;

const SEATS = [
  { x: -0.3, y: 0.1, scale: 0.6 },
  { x: 0.3, y: 0.1, scale: 0.6 },
  { x: -0.15, y: 0.22, scale: 0.62 },
  { x: 0.15, y: 0.22, scale: 0.62 },
  { x: 0, y: 0.34, scale: 0.64 },
] as const;

/**
 * Nestlings — the free-order cast (nestlings PRD, slice #04). Like Balloons (and
 * unlike the tap toys' arriving→waiting→dismissing conveyor), every bird is
 * present from the start, each a self-contained `CarriableBird` (slice #3) owning
 * its OWN `loose ↔ carried → placed` lifecycle, tuckable in ANY order. The Goal
 * is to tuck the whole cast into the nest; when the last one is placed the Shell's
 * Completion runs.
 *
 * This Toy owns its loop logic directly — NOT a shared hook
 * (`../../out-of-scope/shared-toy-loop-abstraction.md`); its shape (N concurrent
 * lifecycles) is deliberately different from the conveyor, so there is nothing to
 * share. The settle/sleep Outro (#5), idle DRAG demo (#6), and sound/haptics (#7)
 * are later slices — this one ends at: five placed → `onComplete` once → terminal.
 */
export function Nestlings({ onComplete, sound, haptics }: ToyProps) {
  /*
   * The scene geometry, built once from the viewport's aspect and shared with
   * the backdrop. ONE generator read by two consumers: the backdrop draws the
   * limbs and the cast stands on them, so they cannot drift apart the way two
   * hand-maintained lists did.
   */
  const scene = useCanopyScene(CAST.length);
  // Placements counted toward the Goal — incremented as each bird snaps into the
  // nest (its `onPlaced`). The cast runs N concurrent lifecycles rather than one
  // conveyor, so this is a simple tally, not a state machine: the order birds are
  // tucked in doesn't matter, only that every one has been. It only ever rises —
  // a placed bird is locked (slice #3), so the pile can't be undone.
  const [placed, setPlaced] = useState(0);
  // ADR-0001 amendment: `onComplete` is a one-shot. The ref guards against a
  // re-render with a new `onComplete` reference (which the Shell does the moment
  // Completion starts) re-firing the effect. Mirrors the other Toys' loop guard.
  const completedRef = useRef(false);
  // The nest's measured centre in client px, passed to every bird as the snap
  // target. Measured once from the rendered scene (not self-measured per bird) so
  // the whole cast shares one forgiving drop zone — the PRD's "parent measures the
  // nest's rect once and passes it". Starts at the origin; jsdom rects are all-
  // zero, so tests place a bird by releasing at `{0,0}`.
  const [nestCenter, setNestCenter] = useState<Point>({ x: 0, y: 0 });
  // The nest opening's measured WIDTH in client px — the scale the seats are
  // expressed in, so the huddle stays proportional to the nest at every viewport
  // instead of being a fixed pixel fan that fits one phone.
  const [nestWidth, setNestWidth] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  // Whether ANY carried bird is currently hovering over the nest's drop zone, so
  // the nest can swell a touch to say "yes — drop it here". A counter ref (not a
  // bare boolean) keeps it correct if two fingers carry at once: it's hovered while
  // the count is positive. Birds report enter/leave via `onHoverNest`.
  const hoverCountRef = useRef(0);
  const [nestHovered, setNestHovered] = useState(false);
  const handleHoverNest = (over: boolean) => {
    hoverCountRef.current = Math.max(0, hoverCountRef.current + (over ? 1 : -1));
    setNestHovered(hoverCountRef.current > 0);
  };
  // The wordless ghost-hand CARRY demo's active flag (slice #06). With no real
  // carry yet, the idle stall flips it true to SHOW the pick-up-and-carry. Toy-
  // LOCAL on purpose — NOT pre-abstracted into a shared primitive (the
  // `shared-toy-loop-abstraction` cautionary precedent; slice Notes say copy).
  const [demoActive, setDemoActive] = useState(false);
  // Latches once the child makes a real carry (a bird's `onCarry`). The demo then
  // cancels and stays SUPPRESSED for the rest of play — they've shown they can
  // carry, so it never re-teaches (AC #2). A ref, not state: it gates the idle
  // timer's callback without needing to re-run the arming effect. Mirrors
  // Balloons' heldForRealRef.
  const carriedForRealRef = useRef(false);
  // Wall-clock time (ms, via the `Date.now` boundary) the last wing-flutter fired
  // — the throttle's only state, shared across the whole cast so concurrent
  // carries contribute to one gentle flutter beat rather than overlapping machine-
  // guns. A ref, not state: the gate reads/writes it without re-rendering. Starts
  // at 0 so the first flutter of a carry always fires. Mirrors Balloons'
  // lastPipAtRef.
  const lastFlutterAtRef = useRef(0);

  // Voice a carry step as a wing-flutter, THROTTLED (slice #07): a carry fires a
  // pointer-move per frame, rate-limited to one flutter per window so a fast drag
  // stays a gentle beat, not a machine-gun (AC #2). Through the injected Sound (the
  // Toy never touches Web Audio, ADR-0003); optional, so a bare mount is silent.
  // Stable identity so a fresh closure each render doesn't churn the bird props.
  const onCarryStep = useCallback(() => {
    const now = Date.now();
    if (now - lastFlutterAtRef.current >= FLUTTER_THROTTLE_MS) {
      lastFlutterAtRef.current = now;
      sound?.play(flutter);
    }
  }, [sound]);

  // Measure the nest's centre from the rendered DuskBackdrop once after layout.
  // The nest is a backdrop layer (`data-dusk-layer="nest"`), so we read its rect
  // through the mounted scene rather than threading a ref down through the
  // decorative backdrop. On-device this is the real drop zone; in jsdom (no
  // layout) it stays `{0,0}`.
  useLayoutEffect(() => {
    const nest = mainRef.current?.querySelector('[data-dusk-layer="nest"]');
    if (!nest) return;
    const r = nest.getBoundingClientRect();
    setNestCenter({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setNestWidth(r.width);
    // Re-measured when the scene's aspect bucket changes: the canopy rebuilds,
    // the bough moves, and the nest goes with it — a drop zone left at the old
    // coordinates would silently stop matching the nest the child can see.
  }, [scene]);

  // The Goal — every bird in the cast placed. The count is the on-device-tuned
  // duration lever (slice Notes), so the Goal is derived from the cast size, never
  // a separate magic number.
  const goalMet = placed >= CAST.length;

  // Fire `onComplete` once when the Goal is met. In its own effect so the Shell
  // re-rendering with a fresh `onComplete` reference at Completion doesn't double-
  // fire — the ref pins it to a single call. Fires the instant the fifth bird is
  // placed, so the Shell's overlay layers over the settle-and-sleep Outro while
  // the Toy stays mounted (ADR-0001 layered-concurrent amendment).
  useEffect(() => {
    if (!goalMet || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [goalMet, onComplete]);

  // Arm the wordless demo's idle timer (slice #06). With no real carry yet, the
  // stall fires it active. The on-stage ghost-hand carry driven by `demoActive` is
  // on-device-tuned and not unit-asserted. Mirrors Balloons' arming effect.
  useEffect(() => {
    const timer = setTimeout(() => {
      // Don't prompt if the child has carried a bird for real during the wait —
      // they don't need teaching once they're already doing it.
      if (!carriedForRealRef.current) setDemoActive(true);
    }, IDLE_DEMO_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      ref={mainRef}
      data-toy-state={goalMet ? 'completed' : 'playing'}
      data-demo-active={demoActive}
      style={{
        position: 'relative',
        minHeight: '100dvh',
        // `--nestlings-ground` used to live here: a `dvh` clamp the backdrop's
        // bottom-anchored band read, so the horizon sat at a fixed fraction of
        // the viewport (ADR-0005). It is gone because the thing it positioned is
        // gone. The scene is no longer a stack of separately-positioned layers
        // agreeing on a shared CSS length — it is one viewBox matched to the
        // viewport's aspect, and everything in it is placed from that. A shared
        // length between two coordinate systems was the seam the old scene came
        // apart along on desktop; there is no seam left to share.
      }}
    >
      {/* The whole nestful settles to sleep UNDER the Shell's Completion overlay
       * on the terminal placement (slice #5): the backdrop deepens to night and
       * the first stars twinkle in. Driven by `goalMet` so it lands WITH the
       * Completion while the Toy keeps rendering (ADR-0001 layered-concurrent). */}
      <DuskBackdrop scene={scene} night={goalMet} hovered={nestHovered} placedCount={placed} />
      {CAST.map((species, i) => {
        // A perch is where the FEET land, so the bird's box is walked back up
        // from it by the height its own feet sit at. Percentages of the frame,
        // which is the same space the limbs were drawn in.
        const [px, py] = scene.art.perches[i] ?? [50, scene.frame.h * 0.4];
        return (
        <CarriableBird
          key={i}
          species={species}
          left={`${px}%`}
          top={`${((py - scene.birdW * FOOT_FRACTION) / scene.frame.h) * 100}%`}
          nestCenter={nestCenter}
          // Tally this bird's placement toward the Goal. Each bird owns its own
          // lifecycle, so this fires at most once per bird (placed is locked).
          onPlaced={() => {
            // The nestle beat (slice #07): a cozy descending coo + a haptic tick
            // as a bird is tucked into the nest. Through the injected utilities
            // (ADR-0003); both optional, so a bare mount is silent.
            sound?.play(coo);
            haptics?.tick();
            setPlaced((n) => n + 1);
          }}
          onPickup={() => {
            // The pickup beat (slice #07): a rising chirp + a haptic tick the
            // moment a bird is lifted. Through the injected utilities (ADR-0003);
            // both optional, so a bare mount degrades to silence.
            sound?.play(chirp);
            haptics?.tick();
          }}
          onRest={() => {
            // A loose set-down away from the nest (slice #07): the soft, neutral
            // plip — never a failure cue (ADR-0001). Through the injected Sound;
            // optional, so a bare mount is silent.
            sound?.play(plip);
          }}
          // Each carry move feeds the throttled wing-flutter (slice #07).
          onCarryStep={onCarryStep}
          // Tell the nest when this bird hovers over its drop zone so it nudges.
          onHoverNest={handleHoverNest}
          // Its seat in the huddle, in client px. Skipped until the nest has
          // been measured — a seat scaled by a zero width is the pile again.
          seat={
            nestWidth > 0
              ? {
                  x: SEATS[i].x * nestWidth,
                  y: SEATS[i].y * nestWidth,
                  scale: SEATS[i].scale,
                }
              : undefined
          }
          onCarry={() => {
            // A real carry — the child has picked a bird up and started moving it.
            // Cancel the teaching demo at once and suppress it for the rest of play
            // (AC #2). A bare tap (no carry) never fires this, so the demo keeps
            // teaching the tapper the gesture they still need (guard test).
            carriedForRealRef.current = true;
            setDemoActive(false);
          }}
        />
        );
      })}
      {/* The wordless CARRY demo's ghost hand (slice #06), overlaid while the child
       * stalls. Rendered only when `demoActive` and the Goal isn't yet met,
       * `pointer-events: none` so a real carry underneath is untouched, and drawn
       * over its OWN faint demo bird so it never advances the real cast. */}
      {demoActive && !goalMet && (() => {
        /*
         * Aim the wordless demo at the scene the child is actually looking at:
         * it lifts off the FIRST fledgling's perch and carries to the measured
         * nest. Both ends used to be constants tuned on one phone against a
         * hand-written scatter, and both ends have since moved — a demo that
         * teaches the gesture by ending in mid-air teaches the wrong thing.
         */
        /*
         * The demo lifts from straight above the nest and pulls STRAIGHT DOWN
         * into it, rather than from one of the cast's perches.
         *
         * Anchoring it to a real perch was the obvious idea and it was wrong
         * twice over. Taking `perches[0]` — the list is sorted top-to-bottom so
         * the cast reads as descending — handed the demo the longest, most
         * diagonal journey available, dragging a translucent bird right across
         * the real ones; what that looked like was a brown smear over a green
         * fledgling. And even from the NEAREST perch it still begins life
         * exactly on top of a solid, differently-coloured bird, because a perch
         * is by definition occupied. Five birds a third of the frame wide leave
         * no clear column on a phone, so there is no perch that avoids this.
         *
         * A phantom bird is allowed to be a phantom. Starting it over the nest's
         * own approach — the one lane that is deliberately kept clear, since it
         * is where the child is aiming — means the gesture plays out against
         * scene rather than against the cast, and a purely vertical pull is the
         * least ambiguous way to say "hold this and bring it down here".
         */
        const px = 50;
        const py = scene.art.bough.top - scene.birdW * DEMO_LIFT_BIRDS;
        const main = mainRef.current?.getBoundingClientRect();
        // The demo bird's centre, from the same arithmetic that places a real
        // one: a perch is where the FEET are, so walk up to the box's middle.
        const startTop = (py - scene.birdW * FOOT_FRACTION) / scene.frame.h;
        const centre = main && {
          x: main.left + (px / 100) * main.width,
          y: main.top + (startTop + scene.birdW / (2 * scene.frame.h)) * main.height,
        };
        return (
          <GhostCarryHand
            left={`${px}%`}
            top={`${startTop * 100}%`}
            travel={
              centre && main && nestCenter.x > 0
                ? {
                    x: nestCenter.x - centre.x,
                    // Plus the body drop, for the same reason a real placement
                    // needs it: the bird's body sits low in its own box, so
                    // landing the BOX on the nest hangs the demo bird above the
                    // bowl instead of putting it in.
                    y:
                      nestCenter.y -
                      centre.y +
                      (scene.birdW / 100) * main.width * BODY_CENTRE_DROP,
                  }
                : undefined
            }
          />
        );
      })()}
    </main>
  );
}
