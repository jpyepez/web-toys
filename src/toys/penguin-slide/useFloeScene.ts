/**
 * The one place the Penguin Slide scene geometry exists.
 *
 * WHY A HOOK. The backdrop draws the floe; the cast stands on its `rests`; a
 * swiped penguin lands on one of its `slots`; the Outro lines up on its `row`;
 * the ghost finger demonstrates on a rest. All of them read this one object, so
 * none of them can disagree about where the ice ends.
 *
 * WHY IT MEASURES THE VIEWPORT. The scene is composed into a frame whose aspect
 * matches the viewport, so nothing is stretched — and the penguin's size, the
 * scene's unit, depends on both the width and the height. The aspect is
 * QUANTIZED first: a resize that crosses no bucket boundary returns the identical
 * object, so a phone's address bar sliding away cannot reshuffle the floe under a
 * child's finger mid-swipe.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { buildFloe, type FloeArt } from './floe';
import { FLOE, FLOE_SEED } from './floe-config';
import { penguinPx } from './PenguinDrawing';

const QUANTUM = 0.05;

function viewport(): { w: number; h: number } {
  if (typeof window === 'undefined') return { w: 390, h: 844 };
  return { w: window.innerWidth || 390, h: window.innerHeight || 844 };
}

function subscribe(cb: () => void) {
  window.addEventListener('resize', cb);
  window.addEventListener('orientationchange', cb);
  return () => {
    window.removeEventListener('resize', cb);
    window.removeEventListener('orientationchange', cb);
  };
}

function snapshot(): string {
  const { w, h } = viewport();
  return `${Math.round(h / w / QUANTUM)}:${Math.round(penguinPx(w, h))}:${Math.round(w / 40)}`;
}

const serverSnapshot = () => '43:86:10';

/** The scene for a viewport of `w` x `h` CSS px. Pure — the lab and the Card call it too. */
export function floeSceneFor(w: number, h: number, castSize: number): FloeArt {
  const frame = { w: 100, h: Math.max(30, Math.min(320, (h / w) * 100)) };
  const pw = (penguinPx(w, h) / w) * 100;
  return buildFloe(FLOE, frame, pw, FLOE_SEED, castSize);
}

export function useFloeScene(castSize: number): FloeArt {
  const key = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    const { w, h } = viewport();
    return floeSceneFor(w, h, castSize);
    // `key` is the quantized aspect — the only thing the build depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, castSize]);
}
