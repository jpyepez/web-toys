import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { ToyEntry } from './registry';
import type { Sound } from './sound';
import type { Haptics } from './haptics';
import { Completion } from './Completion';
import { ChromeIconSvg, ChromePill } from './ChromePill';

/**
 * Hosts a single Toy through the finite lifecycle the Shell owns (ADR-0001):
 * play → Goal met (`onComplete`) → Completion. The Toy only ever signals
 * `onComplete`; everything after — celebration, end state — lives here.
 *
 * Layered-concurrent: per the ADR-0001 amendment, the Toy stays mounted when
 * `onComplete` fires; the Shell's Completion renders as a sibling overlay
 * above it. The Toy is only torn down when the user picks Play again (fresh
 * remount via the `playId` key) or Home.
 *
 * The Shell's shared `sound`/`haptics` are passed down to the Toy (its tap
 * feedback) and used here for the Completion celebration sound.
 *
 * The always-visible Home control is rendered here (rather than at the root)
 * because it only applies when a Toy is mounted; on the launcher there's
 * nowhere to "go home" from. Its surface comes from the shared ChromePill so
 * it's visually identical to the mute toggle in the opposite corner.
 */
export function ToyHost({
  toy,
  sound,
  haptics,
}: {
  toy: ToyEntry;
  sound: Sound;
  haptics: Haptics;
}) {
  const [phase, setPhase] = useState<'playing' | 'complete'>('playing');
  // Bumped on Play again to force a clean Toy remount — the Toy stays mounted
  // through Completion, so without a key change a replay would reuse its
  // mid-Goal state instead of resetting.
  const [playId, setPlayId] = useState(0);
  const navigate = useNavigate();
  const Toy = toy.component;

  // One-shot guard + handle for the optional `winDelayMs` hold. `completingRef`
  // also covers the hold window (not just `phase === 'complete'`), so a Toy
  // firing `onComplete` repeatedly while the win animation plays schedules the
  // celebration exactly once. The timer is cleared on unmount and reset on
  // Play again (ToyHost itself doesn't remount — only the Toy does, via the
  // `playId` key — so the guard must be cleared by hand).
  const completingRef = useRef(false);
  const winTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(winTimerRef.current), []);

  return (
    <>
      <Toy
        key={playId}
        onComplete={() => {
          // `onComplete` is a one-shot signal (ADR-0001 amendment): ignore any
          // re-entrant calls during the hold/celebration window.
          if (completingRef.current) return;
          completingRef.current = true;
          // Hold the celebration for the Toy's declared win-animation beat so
          // its critter finishes the dance before the dialogue lands; the
          // sound and the overlay arrive together at the end of the hold.
          const celebrate = () => {
            sound.celebrate();
            setPhase('complete');
          };
          const delay = toy.winDelayMs ?? 0;
          if (delay > 0) {
            winTimerRef.current = setTimeout(celebrate, delay);
          } else {
            celebrate();
          }
        }}
        sound={sound}
        haptics={haptics}
      />
      <ChromePill
        corner="top-left"
        ariaLabel="Home"
        onClick={() => navigate({ to: '/' })}
      >
        <HomeIcon />
      </ChromePill>
      {phase === 'complete' && (
        <Completion
          onPlayAgain={() => {
            completingRef.current = false;
            setPlayId((id) => id + 1);
            setPhase('playing');
          }}
          onHome={() => navigate({ to: '/' })}
        />
      )}
    </>
  );
}

/**
 * Code-drawn house glyph — pitched roof over a square body. ADR-0002 spirit:
 * no binary icon asset. The 2px stroke matches the speaker icons so the two
 * corner pills read as one chrome family.
 */
function HomeIcon() {
  return (
    <ChromeIconSvg>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </ChromeIconSvg>
  );
}
