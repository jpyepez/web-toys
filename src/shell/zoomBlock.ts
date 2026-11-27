/**
 * iOS Safari ignores `user-scalable=no`, and pinch fires its own
 * `gesturestart` event. Cancelling it blocks pinch zoom app-wide; the CSS
 * `touch-action` in shell.css blocks double-tap zoom. Returns a cleanup.
 */
let installed: (() => void) | null = null;

function block(e: Event) {
  e.preventDefault();
}

export function installZoomBlock(): () => void {
  if (!installed) {
    document.addEventListener('gesturestart', block, { passive: false });
    installed = () => {
      document.removeEventListener('gesturestart', block);
      installed = null;
    };
  }
  return installed;
}
