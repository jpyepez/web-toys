/**
 * Placeholder penguin — basic SVG shapes only, no binary assets. The real
 * art arrives in a later ticket; keep this self-contained so it can be swapped
 * for the finished Critter without touching the Swipe loop.
 */
export function PenguinDrawing({ hue = 250 }: { hue?: number }) {
  return (
    <svg viewBox="0 0 100 120" width="100%" height="100%" aria-hidden="true">
      <ellipse cx="50" cy="75" rx="30" ry="38" fill={`oklch(0.3 0.04 ${hue})`} />
      <ellipse cx="50" cy="82" rx="19" ry="28" fill="oklch(0.96 0.01 90)" />
      <circle cx="40" cy="48" r="4" fill="oklch(0.98 0 0)" />
      <circle cx="60" cy="48" r="4" fill="oklch(0.98 0 0)" />
      <circle cx="40" cy="48" r="1.8" fill="oklch(0.2 0 0)" />
      <circle cx="60" cy="48" r="1.8" fill="oklch(0.2 0 0)" />
      <polygon points="44,56 56,56 50,66" fill="oklch(0.75 0.15 70)" />
      <ellipse cx="40" cy="113" rx="9" ry="4" fill="oklch(0.75 0.15 70)" />
      <ellipse cx="60" cy="113" rx="9" ry="4" fill="oklch(0.75 0.15 70)" />
    </svg>
  );
}
