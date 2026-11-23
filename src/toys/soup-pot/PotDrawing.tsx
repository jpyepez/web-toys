/** Placeholder pot: basic shapes only. The art ticket swaps this out. `stage` 0–3 fills it. */
export function PotDrawing({ stage }: { stage: number }) {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" aria-hidden="true" data-pot-drawing="">
      <ellipse cx="50" cy="20" rx="40" ry="10" fill="#444" />
      <path d="M10 20 H90 V55 Q90 75 70 75 H30 Q10 75 10 55 Z" fill="#666" />
      <ellipse cx="50" cy="20" rx="34" ry="7" fill={['#c9a66b', '#d9894b', '#c9602f', '#a8421f'][stage] ?? '#a8421f'} />
    </svg>
  );
}
