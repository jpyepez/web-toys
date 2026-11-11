import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { ToyProps } from '../../shell/registry';
import { FOOT_FRACTION, PENGUIN_WIDTH, PenguinDrawing, VB_H, VB_W } from './PenguinDrawing';
import { resolveLandings, type Launch } from './floe';
import type { Pt } from '../../shell/art/geometry';
import { useFloeScene } from './useFloeScene';
import { IceBackdrop } from './IceBackdrop';
import { palette, type PenguinKind } from './palette';
import { peep, plop, swish } from './sounds';
import { GhostSwipeFinger } from './GhostSwipeFinger';

/** Penguins on the floe — the Goal is to send every one into the water. */
export const PENGUIN_COUNT = 5;
/** A stroke must travel at least this far (DOM px) to count as a Swipe, not a tap. */
export const MIN_STROKE_PX = 24;
/** Only the last few pointer samples before release measure the stroke's speed. */
export const SPEED_SAMPLES = 4;
/**
 * The stroke speed (px/ms) that sends a penguin as far out as it goes. Slower
 * strokes still launch — speed only decides how far into the sea it slides.
 */
export const FULL_REACH_SPEED = 1.5;
/** Slide duration (ms) shrinks as the stroke gets faster, clamped to [MIN, MAX]. */
export const SLIDE_MS_AT_SPEED_1 = 700;
export const MIN_SLIDE_MS = 350;
export const MAX_SLIDE_MS = 1100;
/** Idle time (ms) with no penguin launched before the ghost-finger demo shows. */
export const IDLE_DEMO_DELAY_MS = 2500;
/** Brief wiggle on a tap. */
export const WIGGLE_MS = 400;
/** The Outro's first beat: everyone swims into a row. */
export const OUTRO_GATHER_MS = 650;
/**
 * Time from the last landing to the Outro finishing — the gather, then the
 * synchronized pop-and-splash. The Shell's `winDelayMs` for this Toy, so the
 * Completion overlay arrives as the first splash lands; the splash then keeps
 * looping underneath it.
 */
export const OUTRO_MS = 1200;
/** One pop-and-splash, and the rest between repeats under the overlay. */
const SPLASH_S = (OUTRO_MS - OUTRO_GATHER_MS) / 1000;
const SPLASH_REST_S = 1.1;
const SPLASH_SPRAY_S = 0.6;

export type PenguinState = 'standing' | 'launched' | 'in-water';
type Phase = 'playing' | 'outro';
type Sample = { x: number; y: number; t: number };

/** Who stands where. Neighbours differ in silhouette, so no two alike sit side by side. */
export const CAST: readonly PenguinKind[] = ['emperor', 'rockhopper', 'chick', 'gentoo', 'fairy'];

/** Speed (px/ms) over the last few samples; a zero time span reads as a fast flick. */
export function strokeSpeed(samples: Sample[]): number {
  const recent = samples.slice(-SPEED_SAMPLES);
  if (recent.length < 2) return 0;
  const a = recent[0];
  const b = recent[recent.length - 1];
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const dt = Math.max(b.t - a.t, 1);
  return dist / dt;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function PenguinSlide({ onComplete, sound, haptics }: ToyProps) {
  const art = useFloeScene(PENGUIN_COUNT);
  const [states, setStates] = useState<PenguinState[]>(() =>
    Array.from({ length: PENGUIN_COUNT }, () => 'standing'),
  );
  /**
   * The swipes, in order. Where each swimmer ends up is DERIVED from these
   * against the current scene (`resolveLandings`), never stored as a slot
   * number: rotating the phone mid-play rebuilds the floe and its slots.
   */
  const [launches, setLaunches] = useState<Launch[]>([]);
  const landings = useMemo(() => resolveLandings(art, launches), [art, launches]);
  const [slideMs, setSlideMs] = useState<number[]>(() => Array.from({ length: PENGUIN_COUNT }, () => 0));
  const [wiggle, setWiggle] = useState<number[]>(() => Array.from({ length: PENGUIN_COUNT }, () => 0));
  const [phase, setPhase] = useState<Phase>('playing');
  const [splashing, setSplashing] = useState(false);

  const stroke = useRef<{ index: number; pointerId: number; start: { x: number; y: number }; samples: Sample[] } | null>(null);
  const [demoActive, setDemoActive] = useState(false);
  // Latches once a penguin is launched for real: the demo never returns.
  const launchedForReal = useRef(false);
  const completed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const statesRef = useRef(states);
  statesRef.current = states;

  useEffect(() => {
    const id = setTimeout(() => {
      if (!launchedForReal.current) setDemoActive(true);
    }, IDLE_DEMO_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const land = (index: number) => {
    sound?.play(plop(statesRef.current.filter((s) => s === 'in-water').length));
    const next = statesRef.current.map((s, i) => (i === index ? 'in-water' : s)) as PenguinState[];
    statesRef.current = next;
    setStates(next);
    if (next.every((s) => s === 'in-water') && !completed.current) {
      completed.current = true;
      setPhase('outro');
      timers.current.push(setTimeout(() => setSplashing(true), OUTRO_GATHER_MS));
      onComplete();
    }
  };

  const launch = (index: number, dir: { x: number; y: number }, speed: number) => {
    sound?.play(swish);
    haptics?.tick();
    launchedForReal.current = true;
    setDemoActive(false);
    setLaunches((l) => [...l, { index, dir: [dir.x, dir.y], reach: speed / FULL_REACH_SPEED }]);
    const ms = clamp(SLIDE_MS_AT_SPEED_1 / Math.max(speed, 0.001), MIN_SLIDE_MS, MAX_SLIDE_MS);
    setSlideMs((m) => m.map((v, i) => (i === index ? ms : v)));
    const next = statesRef.current.map((s, i) => (i === index ? 'launched' : s)) as PenguinState[];
    statesRef.current = next;
    setStates(next);
    timers.current.push(setTimeout(() => land(index), ms));
  };

  const down = (index: number) => (e: React.PointerEvent) => {
    if (statesRef.current[index] !== 'standing' || stroke.current) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = { x: e.clientX, y: e.clientY };
    stroke.current = { index, pointerId: e.pointerId, start: p, samples: [{ ...p, t: e.timeStamp }] };
  };

  const move = (index: number) => (e: React.PointerEvent) => {
    const s = stroke.current;
    if (!s || s.index !== index) return;
    s.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
  };

  const up = (index: number) => (e: React.PointerEvent) => {
    const s = stroke.current;
    if (!s || s.index !== index) return;
    stroke.current = null;
    s.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    const dx = e.clientX - s.start.x;
    const dy = e.clientY - s.start.y;
    if (Math.hypot(dx, dy) >= MIN_STROKE_PX) {
      launch(index, { x: dx, y: dy }, strokeSpeed(s.samples));
    } else {
      sound?.play(peep);
      setWiggle((w) => w.map((v, i) => (i === index ? v + 1 : v)));
    }
  };

  const cancel = (index: number) => () => {
    if (stroke.current?.index === index) stroke.current = null;
  };

  /** Frame point → CSS position in the Toy (the frame is the viewport). */
  const at = ([x, y]: Pt) => ({ left: `${(x / art.frame.w) * 100}%`, top: `${(y / art.frame.h) * 100}%` });

  return (
    <main
      data-toy-state={phase}
      data-phase={phase}
      data-demo-active={demoActive}
      style={{
        // The viewport, exactly: the scene is composed for the WINDOW's aspect
        // and every penguin is placed in percentages of this box, so it must BE
        // the window. `height: 100%` collapsed to nothing inside the Shell
        // frame, and `100dvh` inside it would sit below the safe-area padding
        // on a notched phone — so the Toy is fixed to the viewport and bleeds
        // under the insets, as the other Toys' backdrops do. The chrome pills
        // still sit inside the insets, above it.
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: palette.water,
        touchAction: 'none',
      }}
    >
      <IceBackdrop art={art} />

      {states.map((state, i) => {
        const rest = art.rests[i];
        const landing = landings.get(i);
        const spot: Pt = phase === 'outro' ? art.row[i] : state === 'standing' || !landing ? rest : landing;
        // A belly-slide: lie down toward where you're actually GOING — the
        // landing, not the stroke, since the nearest good water can be off the
        // stroke's line. Travel straight up or down stays upright.
        const travel = landing ? [landing[0] - rest[0], landing[1] - rest[1]] : [0, 0];
        const tilt = (travel[0] / (Math.hypot(travel[0], travel[1]) || 1)) * 72;
        const pose = state === 'standing' ? 'standing' : state === 'launched' ? 'sliding' : 'swimming';
        const pos = at(spot);
        return (
          // The positioning slot. Motion animates only `left`/`top` here, so it
          // never owns a transform; the centring is plain negative margins. It
          // is `pointer-events: none` — only the painted penguin takes a press,
          // because the staggered rows' rectangles overlap.
          <motion.div
            key={i}
            data-penguin={i}
            data-penguin-kind={CAST[i]}
            data-penguin-state={state}
            onPointerDown={down(i)}
            onPointerMove={move(i)}
            onPointerUp={up(i)}
            onPointerCancel={cancel(i)}
            onLostPointerCapture={cancel(i)}
            initial={false}
            animate={pos}
            transition={
              phase === 'outro'
                ? // Under the water, not across the ice: the swimmer dives, jumps
                  // to its place in the row while hidden, and comes back up.
                  { duration: 0, delay: OUTRO_GATHER_MS / 2000 }
                : { duration: state === 'launched' ? slideMs[i] / 1000 : 0, ease: [0.15, 0.6, 0.35, 1] }
            }
            style={{
              position: 'absolute',
              ...pos,
              width: PENGUIN_WIDTH,
              aspectRatio: `${VB_W} / ${VB_H}`,
              marginLeft: `calc(${PENGUIN_WIDTH} / -2)`,
              marginTop: `calc(${PENGUIN_WIDTH} * ${(-(VB_H / VB_W) * FOOT_FRACTION).toFixed(4)})`,
              touchAction: 'none',
              pointerEvents: 'none',
              cursor: state === 'standing' ? 'grab' : 'default',
              // Nearer the bottom of the frame is nearer the viewer.
              zIndex: Math.round(spot[1] * 10),
            }}
          >
            {/* the pose: a tap's wiggle, the belly-slide tilt, the swimmer's bob,
                and the Outro's synchronized pop. Rotates about the feet. */}
            <motion.div
              animate={
                phase === 'outro'
                  ? splashing
                    ? { y: [0, -26, 0], rotate: 0, opacity: 1 }
                    : { y: [0, 18, 18, 0], opacity: [1, 0, 0, 1], rotate: 0 }
                  : state === 'launched'
                    ? { rotate: tilt, y: 0 }
                    : state === 'in-water'
                      ? { y: [0, -4, 0], rotate: 0 }
                      : { rotate: wiggle[i] ? [0, -12, 12, -8, 0] : 0, y: 0 }
              }
              transition={
                phase === 'outro' && !splashing
                  ? { duration: OUTRO_GATHER_MS / 1000, times: [0, 0.4, 0.6, 1], ease: 'easeInOut' }
                  : phase === 'outro' && splashing
                  ? {
                      y: { duration: SPLASH_S, ease: 'easeOut', repeat: Infinity, repeatDelay: SPLASH_REST_S },
                      rotate: { duration: 0.2 },
                    }
                  : state === 'in-water'
                    ? {
                        // Only the bob repeats. A shared repeating transition
                        // also looped the slide's tilt, so swimmers kept
                        // rocking back to lying flat.
                        y: { duration: 1.3 + i * 0.13, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: 0.35, ease: 'easeOut' },
                      }
                    : { duration: state === 'launched' ? 0.18 : WIGGLE_MS / 1000, ease: 'easeOut' }
              }
              style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                transformOrigin: `50% ${FOOT_FRACTION * 100}%`,
              }}
            >
              <PenguinDrawing kind={CAST[i]} pose={pose} interactive={state === 'standing'} />
            </motion.div>
            {phase === 'outro' && splashing && <Splash />}
          </motion.div>
        );
      })}
      {demoActive && phase === 'playing' && (() => {
        const target = states.indexOf('standing');
        if (target < 0) return null;
        const [x, y] = art.rests[target];
        // Out from the floe's middle toward open water, leaning to the floe's
        // front or back rather than its sides: a sideways demo on a phone ran
        // the finger off the screen, and taught a stroke toward the browser's
        // own edge-swipe gesture.
        const xs = art.floe.pts.map((p) => p[0]);
        const ys = art.floe.pts.map((p) => p[1]);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        const lean: [number, number] = [x - cx, (y - cy || art.pw * 0.1) * 3];
        const out: [number, number] = Math.hypot(lean[0], lean[1]) > art.pw * 0.2 ? lean : [0, 1];
        return (
          <GhostSwipeFinger
            left={`${(x / art.frame.w) * 100}%`}
            top={`calc(${(y / art.frame.h) * 100}% - ${PENGUIN_WIDTH} * 0.55)`}
            dir={out}
          />
        );
      })()}
    </main>
  );
}

/**
 * The splash at a penguin's waterline: a few droplets thrown up and out, then
 * gone — in time with the pop, looping with it. Droplets are well under 1/8 of a
 * penguin, so they read as spray, never as things. Transform and opacity only.
 */
const DROPS = [
  { dx: -30, dy: -22, r: 4 },
  { dx: -18, dy: -36, r: 3.2 },
  { dx: -8, dy: -16, r: 3.6 },
  { dx: 10, dy: -18, r: 3.4 },
  { dx: 20, dy: -34, r: 3.8 },
  { dx: 32, dy: -20, r: 3 },
];

function Splash() {
  return (
    <svg
      data-penguin-splash=""
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      aria-hidden="true"
      overflow="visible"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
      {DROPS.map((d, k) => (
        // A drop is paper with a hairline of ink: light spray on light water
        // has nothing to separate it otherwise, and the contour is what says
        // "drawn" everywhere else in this style.
        <motion.g
          key={k}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: [0, d.dx * 0.6, d.dx], y: [0, d.dy, d.dy * 0.1], opacity: [0, 1, 0] }}
          // Thrown out to the SIDES as the penguin drops back in — at the
          // apex, drops thrown upward landed on its belly as polka dots. One
          // period matches the pop's (SPLASH_S + SPLASH_REST_S) so they stay
          // in step under the overlay.
          transition={{
            duration: SPLASH_SPRAY_S,
            delay: SPLASH_S * 0.8,
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: SPLASH_S + SPLASH_REST_S - SPLASH_SPRAY_S,
          }}
        >
          {/* thrown from the rim of the ripple, not from the middle of the bird */}
          <circle data-splash-drop="" cx={50 + Math.sign(d.dx) * 30} cy={VB_H * FOOT_FRACTION} r={d.r + 0.9} fill={palette.contour} />
          <circle cx={50 + Math.sign(d.dx) * 30} cy={VB_H * FOOT_FRACTION} r={d.r} fill={k % 2 === 0 ? palette.paper : palette.waterLight} />
        </motion.g>
      ))}
    </svg>
  );
}
