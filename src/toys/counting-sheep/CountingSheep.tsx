import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { ToyProps } from '../../shell/registry';

/** How many Sheep make up the meadow. Sized for ~15–30s; easy to tune. */
const SHEEP_COUNT = 5;

/** A single Sheep, drawn from SVG primitives — no image assets (ADR-0002). */
function SheepDrawing({ done }: { done: boolean }) {
  const fleece = done ? '#ffe6a0' : '#f7f7fb';
  return (
    <svg viewBox="0 0 100 80" width="100" height="80" aria-hidden="true">
      {/* legs */}
      <rect x="34" y="52" width="6" height="20" rx="3" fill="#5b5b6b" />
      <rect x="58" y="52" width="6" height="20" rx="3" fill="#5b5b6b" />
      {/* fluffy body */}
      <circle cx="40" cy="44" r="16" fill={fleece} />
      <circle cx="58" cy="44" r="16" fill={fleece} />
      <circle cx="49" cy="34" r="16" fill={fleece} />
      <circle cx="49" cy="48" r="18" fill={fleece} />
      {/* head */}
      <ellipse cx="72" cy="40" rx="12" ry="13" fill="#3f3f4a" />
      <circle cx="68" cy="37" r="2.5" fill="#ffffff" />
      <circle cx="76" cy="37" r="2.5" fill="#ffffff" />
      {/* ears */}
      <ellipse cx="62" cy="34" rx="5" ry="3" fill="#3f3f4a" />
      <ellipse cx="82" cy="34" rx="5" ry="3" fill="#3f3f4a" />
    </svg>
  );
}

/** One tappable Sheep. Tapping hops + squash/stretches it; done shifts its colour. */
function Sheep({ index, done, onTap }: { index: number; done: boolean; onTap: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label={`Sheep ${index + 1}`}
      aria-pressed={done}
      onClick={onTap}
      whileTap={{ scale: 0.85 }}
      animate={
        done
          ? { y: [0, -22, 0], scaleY: [1, 0.8, 1.12, 1], scaleX: [1, 1.15, 0.94, 1] }
          : { y: 0 }
      }
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      <SheepDrawing done={done} />
    </motion.button>
  );
}

/**
 * Counting Sheep: a meadow of tappable Sheep. Tapping a Sheep counts it; once
 * every Sheep is counted the Goal is met and the Toy signals the Shell.
 */
export function CountingSheep({ onComplete, sound, haptics }: ToyProps) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const completed = useRef(false);

  const handleTap = (index: number) => {
    // Every tap gets playful feedback — a baa and a tactile tick — whether or
    // not it counts a new Sheep (re-taps stay friendly, no penalty).
    sound?.baa();
    haptics?.tick();
    setDone((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  // Goal: every distinct Sheep counted. Signal the Shell once, never again.
  useEffect(() => {
    if (!completed.current && done.size >= SHEEP_COUNT) {
      completed.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  const sheep = Array.from({ length: SHEEP_COUNT }, (_, i) => i);

  return (
    <main>
      {sheep.map((i) => (
        <Sheep key={i} index={i} done={done.has(i)} onTap={() => handleTap(i)} />
      ))}
    </main>
  );
}
