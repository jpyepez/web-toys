import { motion } from 'motion/react';

/** Shared Shell confetti burst — code-drawn SVG, no image assets (ADR-0002). */
const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'];
const PIECES = 16;

/**
 * A one-shot celebratory burst: code-drawn confetti pieces fly outward from the
 * centre and settle. Purely decorative (`aria-hidden`); a Shell-owned utility so
 * every Toy's Completion celebrates the same way.
 */
export function Confetti() {
  const pieces = Array.from({ length: PIECES }, (_, i) => i);
  return (
    <div
      data-testid="confetti"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {pieces.map((i) => {
        const angle = (i / PIECES) * Math.PI * 2;
        return (
          <motion.svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            style={{ position: 'absolute', left: '50%', top: '40%' }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * 130,
              y: Math.sin(angle) * 130 + 90,
              rotate: 220,
              opacity: 0,
            }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <rect width="14" height="14" rx="2" fill={COLORS[i % COLORS.length]} />
          </motion.svg>
        );
      })}
    </div>
  );
}
