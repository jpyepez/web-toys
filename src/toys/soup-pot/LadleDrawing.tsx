/**
 * Placeholder ladle, drawn pointing along +x from its bowl at the origin to its
 * handle tip at (LADLE_LENGTH, 0). The Toy rotates it so the tip follows the finger.
 */
export const LADLE_LENGTH = 40;

export function LadleDrawing() {
  return (
    <g data-ladle-drawing="">
      <line x1="0" y1="0" x2={LADLE_LENGTH} y2="0" stroke="#8a5a2b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy="0" r="6" fill="#8a5a2b" />
    </g>
  );
}
