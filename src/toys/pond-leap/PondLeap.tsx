import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { ToyProps } from '../../shell/registry';
import { FrogDrawing, FOOT_FRACTION } from './FrogDrawing';
import { PadDrawing } from './PadDrawing';
import { PondBackdrop } from './PondBackdrop';
import { palette } from './palette';
import {
  FROG_WIDTH,
  LAST_PAD,
  MAX_PULL_PX,
  PADS,
  PAD_WIDTH,
  STAGE_MAX_WIDTH_PX,
  landingPad,
  padsForPull,
  stretchOf,
} from './pond';
import { boing, chime, pullTone, splash } from './sounds';

/** How long a leap takes, from release to landing (ms). */
export const LEAP_MS = 650;
/**
 * Time from the last landing to the Outro settling — the Shell's `winDelayMs`
 * for this Toy, so the Completion overlay arrives once the frog has done its
 * hop; the ripples keep going underneath it.
 */
export const OUTRO_MS = 900;
/** The pull tone sounds each time the stretch climbs another step of this size. */
const TONE_STEP = 0.2;
/** Brief wiggle on a tap. */
const WIGGLE_MS = 400;

/** idle: not yet moved · pulling: finger down · leaping: in the air · landed: on a pad again. */
export type FrogState = 'idle' | 'pulling' | 'leaping' | 'landed';
type Phase = 'playing' | 'outro';

export function PondLeap({ onComplete, sound, haptics }: ToyProps) {
  const [frogState, setFrogState] = useState<FrogState>('idle');
  /** The pad the frog sits on (while leaping, the one it left). */
  const [pad, setPad] = useState(0);
  /** The pad the frog is flying to, while leaping. */
  const [target, setTarget] = useState<number | null>(null);
  /** The finger's offset from where the Pull began, DOM px. */
  const [pull, setPull] = useState({ dx: 0, dy: 0 });
  const [phase, setPhase] = useState<Phase>('playing');
  const [wiggle, setWiggle] = useState(0);

  const grip = useRef<{ pointerId: number; x: number; y: number; toneStep: number } | null>(null);
  const padRef = useRef(0);
  const stateRef = useRef<FrogState>('idle');
  const completed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const setState = (s: FrogState) => {
    stateRef.current = s;
    setFrogState(s);
  };

  const land = (to: number) => {
    padRef.current = to;
    setPad(to);
    setTarget(null);
    setState('landed');
    sound?.play(splash);
    sound?.play(chime(to));
    if (to === LAST_PAD && !completed.current) {
      completed.current = true;
      setPhase('outro');
      onComplete();
    }
  };

  const canPull = () =>
    !grip.current && padRef.current < LAST_PAD && (stateRef.current === 'idle' || stateRef.current === 'landed');

  const down = (e: React.PointerEvent) => {
    if (!canPull()) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    grip.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, toneStep: 0 };
    setPull({ dx: 0, dy: 0 });
    setState('pulling');
  };

  const move = (e: React.PointerEvent) => {
    const g = grip.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    setPull({ dx, dy });
    const step = Math.floor(stretchOf(Math.hypot(dx, dy)) / TONE_STEP);
    if (step > g.toneStep) sound?.play(pullTone(step * TONE_STEP));
    g.toneStep = step;
  };

  /** A lifted, cancelled or lost pointer before release: no leap, frog stays put. */
  const cancel = () => {
    if (!grip.current) return;
    grip.current = null;
    setPull({ dx: 0, dy: 0 });
    setState(padRef.current === 0 ? 'idle' : 'landed');
  };

  const up = (e: React.PointerEvent) => {
    const g = grip.current;
    if (!g) return;
    grip.current = null;
    setPull({ dx: 0, dy: 0 });
    const distance = Math.hypot(e.clientX - g.x, e.clientY - g.y);
    const to = landingPad(padRef.current, distance);
    if (padsForPull(distance) === 0 || to === padRef.current) {
      // A tap or a tiny pull: a little wiggle, and the frog waits to be pulled again.
      setWiggle((w) => w + 1);
      setState(padRef.current === 0 ? 'idle' : 'landed');
      return;
    }
    sound?.play(boing);
    haptics?.tick();
    setTarget(to);
    setState('leaping');
    timers.current.push(setTimeout(() => land(to), LEAP_MS));
  };

  const pulling = frogState === 'pulling';
  const len = Math.hypot(pull.dx, pull.dy);
  const stretch = pulling ? stretchOf(len) : 0;
  // The frog follows the finger back, but never past the cap.
  const k = len > MAX_PULL_PX ? MAX_PULL_PX / len : 1;
  const shown = pulling ? { x: pull.dx * k, y: pull.dy * k } : { x: 0, y: 0 };
  const angle = (Math.atan2(pull.dy, pull.dx) * 180) / Math.PI;
  // One valid transform at all times: `translate(..) none` is invalid CSS, and a
  // browser that rejects it keeps the previous pulled pose after release.
  const pose = pulling
    ? `translate(${shown.x}px, ${shown.y}px) rotate(${angle}deg) scale(${1 + 0.35 * stretch}, ${1 - 0.25 * stretch}) rotate(${-angle}deg)`
    : 'none';

  const at = (i: number) => ({ left: `${PADS[i][0] * 100}%`, top: `${PADS[i][1] * 100}%` });
  const frogAt = at(target ?? pad);
  const leaping = frogState === 'leaping';
  const anchor = at(pad);

  return (
    <main
      data-toy-state={phase}
      data-phase={phase}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: palette.water,
        touchAction: 'none',
      }}
    >
      <PondBackdrop />
      <div
        data-pond-stage=""
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: STAGE_MAX_WIDTH_PX,
          margin: '0 auto',
          touchAction: 'none',
        }}
      >
        {/* behind the pads, so the rings read as water, not a veil over the leaf */}
        {phase === 'outro' && <Ripples at={at(LAST_PAD)} />}

        {PADS.map((_, i) => (
          <div
            key={i}
            data-pad={i}
            data-pad-reached={i <= pad}
            style={{
              position: 'absolute',
              ...at(i),
              width: PAD_WIDTH,
              aspectRatio: '1 / 1',
              marginLeft: `calc(${PAD_WIDTH} / -2)`,
              marginTop: `calc(${PAD_WIDTH} / -2)`,
              pointerEvents: 'none',
            }}
          >
            <PadDrawing bloom={i === LAST_PAD} />
          </div>
        ))}

        {pulling && len > 0 && (
          // The tension band: a thin bar from the pad to the frog, thickening as it loads.
          <div
            data-pull-band=""
            style={{
              position: 'absolute',
              ...anchor,
              width: Math.min(len, MAX_PULL_PX),
              height: 4 + stretch * 6,
              marginTop: -(2 + stretch * 3),
              transformOrigin: '0 50%',
              transform: `rotate(${angle}deg)`,
              background: palette.bloom,
              borderRadius: 6,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        <motion.div
          data-frog=""
          data-frog-state={frogState}
          data-frog-pad={pad}
          data-frog-target={target ?? ''}
          data-pull-stretch={stretch.toFixed(2)}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={cancel}
          onLostPointerCapture={cancel}
          initial={false}
          animate={frogAt}
          transition={{ duration: leaping ? LEAP_MS / 1000 : 0, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            ...frogAt,
            width: FROG_WIDTH,
            aspectRatio: '1 / 1',
            marginLeft: `calc(${FROG_WIDTH} / -2)`,
            marginTop: `calc(${FROG_WIDTH} * ${(-FOOT_FRACTION - 0.05).toFixed(2)})`,
            touchAction: 'none',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: pose,
              transformOrigin: '50% 80%',
              pointerEvents: frogState === 'leaping' || phase === 'outro' ? 'none' : 'auto',
              touchAction: 'none',
              cursor: 'grab',
              // A bigger target than the drawing: small fingers miss a small frog.
              padding: '12%',
              margin: '-12%',
              boxSizing: 'content-box',
            }}
          >
            <motion.div
              key={wiggle}
              animate={
                leaping
                  ? { y: [0, -90, 0], scaleY: [1, 1.15, 0.9, 1] }
                  : phase === 'outro'
                    ? { y: [0, -22, 0] }
                    : wiggle
                      ? { rotate: [0, -10, 10, -6, 0] }
                      : { y: 0 }
              }
              transition={
                leaping
                  ? { duration: LEAP_MS / 1000, ease: 'easeInOut' }
                  : phase === 'outro'
                    ? { duration: OUTRO_MS / 2000, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.6 }
                    : { duration: WIGGLE_MS / 1000 }
              }
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              <FrogDrawing />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

/** The pond rippling under the last pad: three rings swelling and fading, out of step. */
function Ripples({ at }: { at: { left: string; top: string } }) {
  return (
    <div data-pond-ripples="" style={{ position: 'absolute', ...at, pointerEvents: 'none' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 2.4], opacity: [0.8, 0] }}
          transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: PAD_WIDTH,
            aspectRatio: '1 / 1',
            marginLeft: `calc(${PAD_WIDTH} / -2)`,
            marginTop: `calc(${PAD_WIDTH} / -2)`,
            borderRadius: '50%',
            background: palette.ripple,
          }}
        />
      ))}
    </div>
  );
}
