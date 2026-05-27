import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { ToyEntry } from './registry';
import { Completion } from './Completion';

/**
 * Hosts a single Toy through the finite lifecycle the Shell owns (ADR-0001):
 * play → Goal met (`onComplete`) → Completion. The Toy only ever signals
 * `onComplete`; everything after — celebration, end state — lives here.
 */
export function ToyHost({ toy }: { toy: ToyEntry }) {
  const [phase, setPhase] = useState<'playing' | 'complete'>('playing');
  const navigate = useNavigate();
  const Toy = toy.component;

  if (phase === 'complete') {
    return <Completion onPlayAgain={() => {}} onHome={() => navigate({ to: '/' })} />;
  }

  return <Toy onComplete={() => setPhase('complete')} />;
}
