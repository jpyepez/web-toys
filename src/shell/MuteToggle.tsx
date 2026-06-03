import { useState } from 'react';
import type { Sound } from './sound';
import { ChromeIconSvg, ChromePill } from './ChromePill';

/**
 * The Shell's mute toggle: a single chrome control that silences (or restores)
 * all synthesized sound across the app. Writes through to the shared Sound
 * utility, which owns the muted state and its localStorage persistence —
 * this component just renders the toggle and dispatches the change.
 *
 * Haptics are deliberately *not* muted (per PRD): mute is about silencing
 * sound in quiet places, not removing tactile feedback.
 *
 * Surface (pill + corner placement) comes from the shared ChromePill so the
 * mute and Home controls stay visually identical; this component only owns
 * the muted/unmuted icon swap and the aria-label that names the *action*
 * the press will take (Mute when sounding, Unmute when silenced).
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
    <ChromePill
      corner="top-right"
      ariaLabel={muted ? 'Unmute' : 'Mute'}
      ariaPressed={muted}
      onClick={toggle}
    >
      {muted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
    </ChromePill>
  );
}

/**
 * Code-drawn speaker glyph — used when sound is on, so the *action* the press
 * will take is to mute. ADR-0002 spirit: no binary icon asset.
 */
function SpeakerIcon() {
  return (
    <ChromeIconSvg>
      <path d="M5 9v6h4l5 4V5L9 9H5z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </ChromeIconSvg>
  );
}

/**
 * Code-drawn speaker-muted glyph — used when sound is off, so the action is
 * to unmute. The diagonal cross reads more legibly than a single slash at
 * the small icon size a 3-year-old's tap target uses.
 */
function SpeakerMutedIcon() {
  return (
    <ChromeIconSvg>
      <path d="M5 9v6h4l5 4V5L9 9H5z" />
      <line x1="17" y1="9" x2="22" y2="14" />
      <line x1="22" y1="9" x2="17" y2="14" />
    </ChromeIconSvg>
  );
}
