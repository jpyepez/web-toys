/** Placeholder mouse: basic shapes only. The art ticket swaps this out. */
export function MouseDrawing({ tint = '#bbb' }: { tint?: string }) {
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true" data-mouse-drawing="">
      <circle cx="10" cy="10" r="7" fill={tint} />
      <circle cx="30" cy="10" r="7" fill={tint} />
      <ellipse cx="20" cy="24" rx="15" ry="13" fill={tint} />
      <circle cx="15" cy="22" r="2" fill="#222" />
      <circle cx="25" cy="22" r="2" fill="#222" />
      <circle cx="20" cy="28" r="2" fill="#e88" />
    </svg>
  );
}
