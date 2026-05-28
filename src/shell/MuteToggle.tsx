import { useState } from 'react';
import type { Sound } from './sound';

/**
 * The Shell's mute toggle: a single chrome control that silences (or restores)
 * all synthesized sound across the app. Writes through to the shared Sound
 * utility, which owns the muted state and its localStorage persistence —
 * this component just renders the toggle and dispatches the change.
 *
 * Haptics are deliberately *not* muted (per PRD): mute is about silencing
 * sound in quiet places, not removing tactile feedback.
 */
export function MuteToggle({ sound }: { sound: Sound }) {
  // Initial UI state mirrors the persisted preference Sound restored on construction.
  // The toggle is the only writer of mute state, so a one-way mirror is enough.
  const [muted, setMuted] = useState(() => sound.isMuted());

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    sound.setMuted(next);
  };

  return (
    <button type="button" onClick={toggle} aria-pressed={muted}>
      {muted ? 'Unmute' : 'Mute'}
    </button>
  );
}
