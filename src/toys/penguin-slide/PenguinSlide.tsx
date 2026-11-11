import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { ToyProps } from '../../shell/registry';
import { PenguinDrawing } from './PenguinDrawing';
import { peep, plop, swish } from './sounds';

/** Penguins on the floe — the Goal is to send every one into the water. */
export const PENGUIN_COUNT = 5;
/** A stroke must travel at least this far (DOM px) to count as a Swipe, not a tap. */
export const MIN_STROKE_PX = 24;
/** Only the last few pointer samples before release measure the stroke's speed. */
export const SPEED_SAMPLES = 4;
/** Slide distance (px) per px/ms of stroke speed, clamped to [MIN, MAX]. */
export const SLIDE_PX_PER_SPEED = 400;
export const MIN_SLIDE_PX = 120;
export const MAX_SLIDE_PX = 600;
/** Slide duration (ms) shrinks as the stroke gets faster, clamped to [MIN, MAX]. */
export const SLIDE_MS_AT_SPEED_1 = 700;
export const MIN_SLIDE_MS = 350;
export const MAX_SLIDE_MS = 1100;
/** Brief wiggle on a tap. */
export const WIGGLE_MS = 400;
/**
 * Time from the last landing to the Outro finishing — the Shell's `winDelayMs`
 * for this Toy's registry entry (added in the art ticket).
 */
export const OUTRO_MS = 1200;

export type PenguinState = 'standing' | 'launched' | 'in-water';
type Phase = 'playing' | 'outro';
type Sample = { x: number; y: number; t: number };
type Vec = { x: number; y: number };

const HUES = [250, 220, 280, 200, 265];

/** Rest positions on the floe (percent of the frame). */
const REST = [
  { left: 20, top: 62 },
  { left: 36, top: 70 },
  { left: 50, top: 60 },
  { left: 64, top: 70 },
  { left: 80, top: 62 },
];

/** Where the Outro row sits in the water (percent of the frame). */
const outroSpot = (i: number) => ({ left: 15 + i * 17.5, top: 18 });

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
  const [states, setStates] = useState<PenguinState[]>(() =>
    Array.from({ length: PENGUIN_COUNT }, () => 'standing'),
  );
  const [offsets, setOffsets] = useState<Vec[]>(() =>
    Array.from({ length: PENGUIN_COUNT }, () => ({ x: 0, y: 0 })),
  );
  const [slideMs, setSlideMs] = useState<number[]>(() =>
    Array.from({ length: PENGUIN_COUNT }, () => 0),
  );
  const [wiggle, setWiggle] = useState<number[]>(() =>
    Array.from({ length: PENGUIN_COUNT }, () => 0),
  );
  const [phase, setPhase] = useState<Phase>('playing');

  const stroke = useRef<{ index: number; pointerId: number; start: Vec; samples: Sample[]; moved: boolean } | null>(null);
  const completed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const statesRef = useRef(states);
  statesRef.current = states;

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
      onComplete();
    }
  };

  const launch = (index: number, dir: Vec, speed: number) => {
    sound?.play(swish);
    haptics?.tick();
    const len = Math.hypot(dir.x, dir.y) || 1;
    const distance = clamp(speed * SLIDE_PX_PER_SPEED, MIN_SLIDE_PX, MAX_SLIDE_PX);
    const ms = clamp(SLIDE_MS_AT_SPEED_1 / Math.max(speed, 0.001) / 1, MIN_SLIDE_MS, MAX_SLIDE_MS);
    setOffsets((o) => o.map((v, i) => (i === index ? { x: (dir.x / len) * distance, y: (dir.y / len) * distance } : v)));
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
    stroke.current = {
      index,
      pointerId: e.pointerId,
      start: p,
      samples: [{ ...p, t: e.timeStamp }],
      moved: false,
    };
  };

  const move = (index: number) => (e: React.PointerEvent) => {
    const s = stroke.current;
    if (!s || s.index !== index) return;
    s.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (Math.hypot(e.clientX - s.start.x, e.clientY - s.start.y) >= MIN_STROKE_PX) s.moved = true;
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

  return (
    <main
      data-toy-state={phase}
      data-phase={phase}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'oklch(0.82 0.08 230)',
        touchAction: 'none',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '58%',
          height: '24%',
          borderRadius: '50%',
          background: 'oklch(0.97 0.02 220)',
        }}
      />
      {states.map((state, i) => {
        const spot = phase === 'outro' ? outroSpot(i) : REST[i];
        const inWater = state === 'in-water';
        const x = state === 'standing' ? 0 : offsets[i].x;
        const y = state === 'standing' ? 0 : offsets[i].y;
        return (
          <motion.div
            key={i}
            data-penguin={i}
            data-penguin-state={state}
            onPointerDown={down(i)}
            onPointerMove={move(i)}
            onPointerUp={up(i)}
            onPointerCancel={cancel(i)}
            onLostPointerCapture={cancel(i)}
            animate={
              phase === 'outro'
                ? { x: 0, y: 0 }
                : { x, y, rotate: wiggle[i] ? [0, -12, 12, -8, 0] : 0 }
            }
            transition={{
              duration: phase === 'outro' ? OUTRO_MS / 1000 : state === 'launched' ? slideMs[i] / 1000 : WIGGLE_MS / 1000,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              left: `${spot.left}%`,
              top: `${spot.top}%`,
              width: 'min(18vw, 90px)',
              aspectRatio: '100 / 120',
              marginLeft: 'calc(min(18vw, 90px) / -2)',
              touchAction: 'none',
              cursor: state === 'standing' ? 'grab' : 'default',
            }}
          >
            <motion.div
              animate={inWater ? { y: [0, -6, 0] } : { y: 0 }}
              transition={inWater ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
              style={{ width: '100%', height: '100%' }}
            >
              <PenguinDrawing hue={HUES[i % HUES.length]} />
            </motion.div>
          </motion.div>
        );
      })}
    </main>
  );
}
