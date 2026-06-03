import type { CSSProperties, ReactNode } from 'react';
import { chrome, timing } from './tokens';

/**
 * The shared Shell chrome button: a soft low-contrast pill that hosts an
 * SVG icon (no text label) and sits in a safe-area corner of the Shell frame.
 *
 * Two consumers today — the mute toggle and the in-Toy Home control — both
 * source their surface (background colour, corner radius) from the design
 * tokens module and their corner placement from a `chrome-pill--{corner}`
 * class the slice's CSS targets. Future chrome (Completion replay, etc.)
 * picks this up for free rather than reimplementing the surface.
 *
 * The `corner` prop is the *positioning intent*; the actual CSS placement
 * lives in `shell.css` and is on-device-validated per the slice DoD.
 */
export function ChromePill({
  corner,
  ariaLabel,
  ariaPressed,
  onClick,
  children,
}: {
  corner: 'top-left' | 'top-right';
  ariaLabel: string;
  ariaPressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`chrome-pill chrome-pill--${corner}`}
      style={pillStyle}
    >
      {children}
    </button>
  );
}

/**
 * Shared SVG wrapper for chrome-pill icons — locks in the size (20×20 in a
 * 24-unit viewBox), the 2px stroke, the round line joins, and the
 * currentColor stroke so the icon inherits the pill's text colour. Every
 * chrome icon (speaker, speaker-muted, house — and any future chrome glyph)
 * uses this so the corner controls read as one visual family.
 */
export function ChromeIconSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// The non-positional surface — sourced from tokens so the pill stays in step
// with any future palette / timing adjustments. Positioning (corner placement)
// is the class's job, not the inline style's.
const pillStyle: CSSProperties = {
  background: chrome.pillBg,
  borderRadius: chrome.pillRadius,
  border: 'none',
  padding: 0,
  width: 44,
  height: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'currentColor',
  cursor: 'pointer',
  transition: `transform 120ms ${timing.tap}`,
};
