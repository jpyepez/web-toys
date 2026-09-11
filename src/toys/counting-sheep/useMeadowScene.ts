/**
 * The one place the Counting Sheep scene geometry exists.
 *
 * WHY IT IS A HOOK AND NOT PROPS. Two components need the same meadow: the
 * backdrop has to DRAW the ground, and the Sheep has to STAND on it. Those used
 * to be independent — the hills were drawn into a `--meadow-ground` CSS band and
 * the Sheep was placed at `calc(var(--meadow-ground) * 0.62)`, a multiplier
 * tuned by eye against a curve it could not see — and that independence is
 * exactly why the Sheep floated above the hill on a desktop viewport. Two
 * hand-maintained positions cannot be kept in agreement; one generator read by
 * both cannot fall out of it.
 *
 * WHY IT MEASURES THE VIEWPORT. The meadow is composed into a frame whose aspect
 * MATCHES the viewport, so nothing is ever stretched or sliced — see
 * `meadow.ts`. That aspect is only knowable at runtime, so the geometry is built
 * from it and rebuilt when it changes. The aspect is QUANTIZED first: a resize
 * that crosses no bucket boundary returns the identical object, so dragging a
 * desktop window does not re-run the generator on every frame, and a phone's
 * address bar sliding away cannot shift the ground under the Sheep mid-beat.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { buildMeadow, type Frame, type MeadowArt } from './meadow';
import { MEADOW, MEADOW_SEED } from './meadow-config';
import { SHEEP_MAX_PX, SHEEP_MIN_PX, SHEEP_VW } from './SheepDrawing';

/**
 * A Sheep's rendered width in CSS px, mirroring `SHEEP_WIDTH`'s clamp. Every
 * size in the meadow is a multiple of this, so it is imported from the component
 * that actually renders the Sheep rather than assumed here — the two drifting
 * apart would rescale the whole scene relative to the cast without either file
 * looking wrong on its own.
 */
const sheepPx = (w: number) => Math.min(SHEEP_MAX_PX, Math.max(SHEEP_MIN_PX, w * SHEEP_VW));

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
  return `${Math.round(h / w / QUANTUM)}:${Math.round(sheepPx(w))}:${Math.round(w / 40)}`;
}

const serverSnapshot = () => '17:179:10';

export type MeadowScene = {
  frame: Frame;
  /** A Sheep's width in frame units. ~46 on a phone, ~17 at 16:10. */
  sheepW: number;
  art: MeadowArt;
};

export function useMeadowScene(): MeadowScene {
  const key = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    const { w, h } = viewport();
    // The frame is 100 wide and as tall as the viewport's aspect makes it.
    const frame: Frame = { w: 100, h: Math.max(40, Math.min(320, (h / w) * 100)) };
    const sheepW = (sheepPx(w) / w) * 100;
    return { frame, sheepW, art: buildMeadow(MEADOW, frame, sheepW, MEADOW_SEED) };
    // `key` is the quantized aspect — the only thing the build actually depends
    // on. Depending on the raw viewport instead would rebuild on every resize
    // pixel, which is the churn this hook exists to prevent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
