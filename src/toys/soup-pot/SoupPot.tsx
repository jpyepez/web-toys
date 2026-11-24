import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { motion } from 'motion/react';
import type { ToyProps } from '../../shell/registry';
import { GOAL_ANGLE, sampleAngle, stageFor, type Pt } from './stir';
import { blip, chime, squeak } from './sounds';
import { BlorpLayer, KitchenPlates, LadleLayer, SoupLayer, SteamLayer } from './KitchenScene';
import { MouseFigure, PAW_FRACTION, VB } from './MouseDrawing';
import { useKitchenScene } from './useKitchenScene';
import { palette } from './palette';
import { GhostStirFinger } from './GhostStirFinger';
import { DEMO_DURATION_MS, IDLE_DEMO_DELAY_MS } from './demo';

/**
 * Time from reaching the Goal to the Outro finishing: the blorp bursts out of the
 * pot and the mice hop up and cheer. The Shell's `winDelayMs` for this Toy.
 */
export const OUTRO_MS = 1600;

const QUARTER_TURN = Math.PI / 2;

/** A press that stays within this many px of where it began is a tap, not a Stir. */
export const TAP_DISTANCE_PX = 10;
/** How long a mouse's tap hop stays flagged as reacting. */
const HOP_MS = 450;

type Phase = 'stirring' | 'outro';

/**
 * Soup Pot — the Stir. While a pointer is down anywhere, each sample adds the
 * absolute angle it swept around the pot's fixed centre (the root's centre,
 * which is where the scene generator puts the pot). Progress never goes down;
 * lifting or cancelling keeps it.
 */
export function SoupPot({ onComplete, sound, haptics }: ToyProps) {
  const art = useKitchenScene();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('stirring');
  const [ladleAngle, setLadleAngle] = useState(0);
  const [demoActive, setDemoActive] = useState(false);
  const total = useRef(0);
  const done = useRef(false);
  const stroke = useRef<{ id: number; last: Pt; centre: Pt } | null>(null);
  // A press that began on a mouse and hasn't strayed past the tap distance yet.
  const tap = useRef<{ id: number; mouse: number; origin: Pt } | null>(null);
  // Per mouse: how many taps it has had (re-keys the hop) and whether it is hopping.
  const [taps, setTaps] = useState<number[]>([0, 0, 0]);
  const [hopping, setHopping] = useState<boolean[]>([false, false, false]);
  const hopTimers = useRef<(ReturnType<typeof setTimeout> | undefined)[]>([]);
  useEffect(() => () => hopTimers.current.forEach(clearTimeout), []);

  const hop = (i: number) => {
    sound?.play(squeak(i));
    setTaps((t) => t.map((n, j) => (j === i ? n + 1 : n)));
    setHopping((h) => h.map((v, j) => (j === i ? true : v)));
    clearTimeout(hopTimers.current[i]);
    hopTimers.current[i] = setTimeout(() => setHopping((h) => h.map((v, j) => (j === i ? false : v))), HOP_MS);
  };

  const end = (e: PointerEvent<HTMLElement>) => {
    const t = tap.current;
    tap.current = null;
    stroke.current = null;
    if (t && e.type === 'pointerup' && t.id === e.pointerId && !done.current) hop(t.mouse);
  };

  const onDown = (e: PointerEvent<HTMLElement>) => {
    if (done.current) return;
    const hit = (e.target as Element | null)?.closest?.('[data-mouse]');
    tap.current = hit
      ? { id: e.pointerId, mouse: Number(hit.getAttribute('data-mouse')), origin: { x: e.clientX, y: e.clientY } }
      : null;
    const r = e.currentTarget.getBoundingClientRect();
    const centre = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    stroke.current = { id: e.pointerId, last: { x: e.clientX, y: e.clientY }, centre };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const s = stroke.current;
    if (done.current || !s || s.id !== e.pointerId) return;
    const t = tap.current;
    if (t && Math.hypot(e.clientX - t.origin.x, e.clientY - t.origin.y) > TAP_DISTANCE_PX) tap.current = null;
    const next = { x: e.clientX, y: e.clientY };
    const added = sampleAngle(s.last, next, s.centre);
    s.last = next;
    setLadleAngle(Math.atan2(next.y - s.centre.y, next.x - s.centre.x));
    if (added === 0) return;
    const before = total.current;
    total.current += added;
    // One sample adds at most π/4, so it crosses at most one quarter turn.
    if (Math.floor(total.current / QUARTER_TURN) > Math.floor(before / QUARTER_TURN)) {
      sound?.play(blip(total.current / GOAL_ANGLE));
    }
    if (stageFor(total.current) > stageFor(before)) {
      sound?.play(chime);
      haptics?.tick();
    }
    setProgress(total.current);
    if (total.current >= GOAL_ANGLE) {
      done.current = true;
      stroke.current = null;
      tap.current = null;
      setPhase('outro');
      onComplete();
    }
  };

  // Idle ghost-finger demo: runs once, only while the child has made no Stir
  // progress. Any progress cancels it for good. It never touches Stir state.
  const started = progress > 0;
  useEffect(() => {
    if (started) return;
    const show = setTimeout(() => setDemoActive(true), IDLE_DEMO_DELAY_MS);
    const hide = setTimeout(() => setDemoActive(false), IDLE_DEMO_DELAY_MS + DEMO_DURATION_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      setDemoActive(false);
    };
  }, [started]);

  const stage = stageFor(progress);
  const outro = phase === 'outro';
  const fraction = Math.min(1, progress / GOAL_ANGLE);
  const { frame, mw } = art;

  return (
    <main
      data-toy-state={phase}
      data-phase={phase}
      data-stage={stage}
      data-progress={progress}
      data-demo-active={demoActive}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      style={{
        // The viewport, exactly. The pot sits at the frame's centre and the Stir
        // measures angle around this box's centre, so this box must BE the
        // window: `height: 100%` collapses to nothing inside the Shell frame.
        // The Toy bleeds under the safe-area insets as the other Toys do.
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        background: palette.counter,
      }}
    >
      <svg
        viewBox={`0 0 ${frame.w} ${frame.h}`}
        // The viewBox aspect IS the viewport aspect, so `none` distorts nothing.
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <KitchenPlates art={art} />
        <g data-pot="">
          <SoupLayer art={art} fraction={fraction} stage={stage} swirl={ladleAngle * 0.8} />
        </g>
        <g data-ladle="" data-ladle-angle={ladleAngle}>
          <LadleLayer art={art} angle={ladleAngle} />
        </g>
        {(stage >= 3 || outro) && <SteamLayer art={art} />}

        {art.mice.map((m, i) => (
          // The positioning slot is a plain attribute transform; Motion only
          // ever animates the inner group, so the two never fight over it.
          <g
            key={m.kind}
            data-mouse={i}
            data-mouse-kind={m.kind}
            data-reacting={hopping[i] && !outro}
            data-taps={taps[i]}
            transform={`translate(${m.at[0] - mw / 2} ${m.at[1] - mw * PAW_FRACTION}) scale(${mw / VB})`}
          >
            <motion.g
              // A hop at every stage beat; a looping cheer in the Outro. Keyed on
              // the stage so each beat re-runs the hop.
              key={outro ? 'cheer' : `beat-${stage}-${taps[i]}`}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              animate={
                outro
                  ? { y: [0, -22, 0], rotate: [0, i % 2 ? 6 : -6, 0] }
                  : stage > 0 || taps[i] > 0
                    ? { y: [0, -14, 0], scaleY: [1, 1.06, 1] }
                    : { y: 0 }
              }
              transition={
                outro
                  ? { duration: 0.55, repeat: Infinity, repeatDelay: 0.15, delay: i * 0.12, ease: 'easeOut' }
                  : // Stage beats ripple along the mice; a tap answers at once.
                    { duration: 0.45, delay: hopping[i] ? 0 : i * 0.08, ease: 'easeOut' }
              }
            >
              <MouseFigure kind={m.kind} pose={outro ? 'happy' : 'watching'} interactive={!outro} />
            </motion.g>
          </g>
        ))}

        {outro && <BlorpLayer art={art} />}
      </svg>

      {demoActive && <GhostStirFinger radius={art.soupR * 0.62} />}
    </main>
  );
}
