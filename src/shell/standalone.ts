/**
 * True when the app runs installed from the home screen rather than in a
 * browser tab. `display-mode: standalone` covers Android and current iOS;
 * `navigator.standalone` is iOS Safari's older, non-standard flag.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
