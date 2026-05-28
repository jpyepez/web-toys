import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { ToyEntry } from './registry';
import type { Sound } from './sound';
import type { Haptics } from './haptics';
import { Completion } from './Completion';

/**
 * Hosts a single Toy through the finite lifecycle the Shell owns (ADR-0001):
 * play → Goal met (`onComplete`) → Completion. The Toy only ever signals
 * `onComplete`; everything after — celebration, end state — lives here.
 *
 * The Shell's shared `sound`/`haptics` are passed down to the Toy (its tap
 * feedback) and used here for the Completion celebration sound.
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
  const navigate = useNavigate();
  const Toy = toy.component;

  if (phase === 'complete') {
    return (
      <Completion
        onPlayAgain={() => setPhase('playing')}
        onHome={() => navigate({ to: '/' })}
      />
    );
  }

  return (
    <>
      <Toy
        onComplete={() => {
          // The Shell's Completion celebration: a sound alongside the confetti.
          sound.celebrate();
          setPhase('complete');
        }}
        sound={sound}
        haptics={haptics}
      />
      <button type="button" onClick={() => navigate({ to: '/' })}>
        Home
      </button>
    </>
  );
}
