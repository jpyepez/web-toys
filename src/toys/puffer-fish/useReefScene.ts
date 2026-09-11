/**
 * The one place the Puffer Fish scene geometry exists.
 *
 * WHY IT IS A HOOK AND NOT PROPS. Two components need the same reef: the
 * backdrop has to DRAW the seabed, and the Fish has to hover above it. Those
 * used to be independent — the sand was drawn into a `--ocean-floor` CSS length
 * and the Fish was placed at `top: 42%` of the viewport, a percentage tuned by
 * eye against a floor it could not see — and that independence is exactly why
 * the Fish sat halfway up an empty blue rectangle on a desktop. Two
 * hand-maintained positions cannot be kept in agreement; one generator read by
 * both cannot fall out of it.
 *
 * WHY IT MEASURES THE VIEWPORT. The reef is composed into a frame whose aspect
 * MATCHES the viewport, so nothing is ever stretched or sliced — see `reef.ts`.
 * That aspect is only knowable at runtime, so the geometry is built from it and
 * rebuilt when it changes. The aspect is QUANTIZED first: a resize that crosses
 * no bucket boundary returns the identical object, so dragging a desktop window
 * does not re-run the generator on every frame, and a phone's address bar
 * sliding away cannot shift the seabed under the Fish mid-beat.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { buildReef, type Frame, type ReefArt } from './reef';
import { REEF, REEF_SEED } from './reef-config';
import { FISH_MAX_PX, FISH_MIN_PX, FISH_VW } from './FishDrawing';

/**
 * A Fish's rendered width in CSS px, mirroring `FISH_WIDTH`'s clamp. Every size
 * in the reef is a multiple of this, so it is imported from the component that
 * actually renders the Fish rather than assumed here — the two drifting apart
 * would rescale the whole scene relative to the cast without either file looking
 * wrong on its own.
 */
const fishPx = (w: number) => Math.min(FISH_MAX_PX, Math.max(FISH_MIN_PX, w * FISH_VW));

/**
 * Aspect buckets. 0.05 is about 40px of height on a phone — coarse enough that
 * browser chrome appearing and disappearing never rebuilds the scene, fine
 * enough that no real device sits far from the shape it was composed for.
 */
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

/** The quantized aspect, as the snapshot — a string so React's `===` is cheap. */
function snapshot(): string {
  const { w, h } = viewport();
  return `${Math.round(h / w / QUANTUM)}:${Math.round(fishPx(w))}:${Math.round(w / 40)}`;
}

const serverSnapshot = () => '43:172:10';

export type ReefScene = {
  frame: Frame;
  /** A Fish's width in frame units. ~44 on a phone, ~15 at 16:10. */
  fishW: number;
  art: ReefArt;
};

export function useReefScene(): ReefScene {
  const key = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    const { w, h } = viewport();
    // The frame is 100 wide and as tall as the viewport's aspect makes it.
    const frame: Frame = { w: 100, h: Math.max(40, Math.min(320, (h / w) * 100)) };
    const fishW = (fishPx(w) / w) * 100;
    return { frame, fishW, art: buildReef(REEF, frame, fishW, REEF_SEED) };
    // `key` is the quantized aspect — the only thing the build actually depends
    // on. Depending on the raw viewport instead would rebuild on every resize
    // pixel, which is the churn this hook exists to prevent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
