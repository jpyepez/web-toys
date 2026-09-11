/**
 * The one place the Nestlings scene geometry exists.
 *
 * WHY IT IS A HOOK AND NOT PROPS. Two components need the same canopy: the
 * backdrop has to DRAW the limbs, and the cast has to STAND on them. Those used
 * to be independent — a hand-written scatter of `left`/`top` percentages next to
 * a separately hand-drawn scene — and that independence is precisely why the
 * fledglings floated in open sky wearing contact shadows cast by nothing. Two
 * hand-maintained lists of positions cannot be kept in agreement; one generator
 * read by both cannot fall out of it.
 *
 * WHY IT MEASURES THE VIEWPORT. The canopy is composed into a frame whose aspect
 * MATCHES the viewport, so nothing is ever stretched or sliced — see
 * `canopy.ts`. That aspect is only knowable at runtime, so the geometry is built
 * from it and rebuilt when it changes. The aspect is QUANTIZED first: a resize
 * that crosses no bucket boundary returns the identical object, so dragging a
 * desktop window does not re-run the generator on every frame, and — far more
 * importantly — a phone's address bar sliding away cannot reshuffle the tree
 * under a child's finger mid-carry.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { buildCanopy, type CanopyArt, type Frame } from './canopy';
import { CANOPY, CANOPY_SEED } from './canopy-config';
import { BIRD_MAX_PX, BIRD_MIN_PX, BIRD_VW } from './BirdDrawing';

/**
 * A bird's rendered width in CSS px, mirroring `BIRD_WIDTH`'s clamp. Every size
 * in the canopy is a multiple of this, so it is imported from the component that
 * actually renders the bird rather than assumed here — the two drifting apart
 * would rescale the whole tree relative to the cast without either file looking
 * wrong on its own.
 */
const birdPx = (w: number) => Math.min(BIRD_MAX_PX, Math.max(BIRD_MIN_PX, w * BIRD_VW));
/** Where a bird's feet sit inside its own box (`footY` in `BirdDrawing`). */
export const FOOT_FRACTION = 0.943;

/**
 * Aspect buckets. 0.05 is about 40px of height on a phone — coarse enough that
 * the browser chrome appearing and disappearing never rebuilds the scene, fine
 * enough that no real device sits far from the shape it was composed for.
 */
const QUANTUM = 0.05;

function viewport(): { w: number; h: number } {
  if (typeof window === 'undefined') return { w: 390, h: 844 };
  return {
    w: window.innerWidth || 390,
    h: window.innerHeight || 844,
  };
}

function subscribe(cb: () => void) {
  window.addEventListener('resize', cb);
  window.addEventListener('orientationchange', cb);
  return () => {
    window.removeEventListener('resize', cb);
    window.removeEventListener('orientationchange', cb);
  };
}

/** The quantized aspect, as the snapshot — a string so React's `===` check is cheap. */
function snapshot(): string {
  const { w, h } = viewport();
  return `${Math.round(h / w / QUANTUM)}:${Math.round(birdPx(w))}:${Math.round(w / 40)}`;
}

const serverSnapshot = () => '17:140:10';

export type CanopyScene = {
  frame: Frame;
  /** A bird's width in frame units. ~36 on a phone, ~10 at 16:10. */
  birdW: number;
  art: CanopyArt;
};

export function useCanopyScene(castSize: number): CanopyScene {
  const key = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    const { w, h } = viewport();
    // The frame is 100 wide and as tall as the viewport's aspect makes it.
    const frame: Frame = { w: 100, h: Math.max(40, Math.min(320, (h / w) * 100)) };
    const birdW = (birdPx(w) / w) * 100;
    return { frame, birdW, art: buildCanopy(CANOPY, frame, birdW, CANOPY_SEED, castSize) };
    // `key` is the quantized aspect — the only thing the build actually depends
    // on. Depending on the raw viewport instead would rebuild on every resize
    // pixel, which is the churn this hook exists to prevent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, castSize]);
}
