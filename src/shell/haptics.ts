/** A short tactile tick, in milliseconds. */
const TICK_MS = 12;

/**
 * The Shell's haptics utility, passed to Toys: a tiny tactile pulse on
 * interaction. Vibrates where the Vibration API is supported; a no-op
 * everywhere else (desktop, iOS Safari) — never throws.
 */
export type Haptics = {
  /** A brief vibration to acknowledge a tap. */
  tick(): void;
};

export function createHaptics(): Haptics {
  return {
    tick() {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(TICK_MS);
      }
    },
  };
}
