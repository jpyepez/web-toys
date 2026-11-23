import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { ToyProps } from '../../shell/registry';
import { GOAL_ANGLE, sampleAngle, stageFor, type Pt } from './stir';
import { PotDrawing } from './PotDrawing';
import { MouseDrawing } from './MouseDrawing';
import { LadleDrawing } from './LadleDrawing';

/**
 * Time from reaching the Goal to the Outro finishing. The Shell's `winDelayMs`
 * for this Toy, added with the registry entry. Placeholder until the art ticket.
 */
export const OUTRO_MS = 1500;

type Phase = 'stirring' | 'outro';

const MICE = [
  { left: '12%', top: '18%' },
  { left: '72%', top: '18%' },
  { left: '42%', top: '72%' },
];

/**
 * Soup Pot — the Stir. While a pointer is down anywhere, each sample adds the
 * absolute angle it swept around the pot's fixed centre (the surface's centre).
 * Progress never goes down; lifting or cancelling keeps it.
 */
export function SoupPot({ onComplete }: ToyProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('stirring');
  const [ladleAngle, setLadleAngle] = useState(0);
  const total = useRef(0);
  const done = useRef(false);
  const stroke = useRef<{ id: number; last: Pt; centre: Pt } | null>(null);

  const end = () => {
    stroke.current = null;
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (done.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const centre = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    stroke.current = { id: e.pointerId, last: { x: e.clientX, y: e.clientY }, centre };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = stroke.current;
    if (done.current || !s || s.id !== e.pointerId) return;
    const next = { x: e.clientX, y: e.clientY };
    const added = sampleAngle(s.last, next, s.centre);
    s.last = next;
    setLadleAngle(Math.atan2(next.y - s.centre.y, next.x - s.centre.x));
    if (added === 0) return;
    total.current += added;
    setProgress(total.current);
    if (total.current >= GOAL_ANGLE) {
      done.current = true;
      stroke.current = null;
      setPhase('outro');
      onComplete();
    }
  };

  const stage = stageFor(progress);

  return (
    <main
      data-toy-state={phase}
      data-phase={phase}
      data-stage={stage}
      data-progress={progress}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', touchAction: 'none', userSelect: 'none', background: '#f3ead6' }}
    >
      <div data-pot="" style={{ position: 'absolute', left: '25%', top: '35%', width: '50%', height: '30%' }}>
        <PotDrawing stage={stage} />
      </div>
      {MICE.map((m, i) => (
        <div key={i} data-mouse={i} style={{ position: 'absolute', width: '16%', aspectRatio: '1', pointerEvents: 'none', ...m }}>
          <MouseDrawing />
        </div>
      ))}
      <svg
        data-ladle=""
        data-ladle-angle={ladleAngle}
        viewBox="-50 -50 100 100"
        style={{ position: 'absolute', left: '50%', top: '50%', width: '30%', height: '30%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', overflow: 'visible' }}
        aria-hidden="true"
      >
        <g style={{ transform: `rotate(${ladleAngle}rad)` }}>
          <LadleDrawing />
        </g>
      </svg>
    </main>
  );
}
