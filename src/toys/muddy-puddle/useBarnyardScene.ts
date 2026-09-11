/**
 * The one place the Muddy Puddle scene geometry exists.
 *
 * WHY IT IS A HOOK AND NOT PROPS. Three things need the same yard: the backdrop
 * has to DRAW the ground and the pool, a Critter has to STAND on the ground, and
 * the last Critter of the play has to SPLASH into the pool. Those used to be
 * independent — the puddle was drawn into a `--barnyard-floor` CSS band and the
 * splash was a hardcoded `y: 90` nudge — and that independence is exactly why
 * the final beat landed in the water on a phone and in the grass beside it on a
 * desktop. Three hand-maintained positions cannot be kept in agreement; one
 * generator read by all of them cannot fall out of it.
 *
 * WHY IT MEASURES THE VIEWPORT. The yard is composed into a frame whose aspect
 * MATCHES the viewport, so nothing is ever stretched or sliced — see
 * `barnyard.ts`. That aspect is only knowable at runtime, so the geometry is
 * built from it and rebuilt when it changes. The aspect is QUANTIZED first: a
 * resize that crosses no bucket boundary returns the identical object, so
 * dragging a desktop window does not re-run the generator on every frame, and a
 * phone's address bar sliding away cannot shift the ground under a Critter
 * mid-wipe.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { buildBarnyard, type BarnyardArt, type Frame } from './barnyard';
import { BARNYARD, BARNYARD_SEED } from './barnyard-config';
import { CRITTER_MAX_PX, CRITTER_MIN_PX, CRITTER_VW } from './critter-metrics';

/**
 * A Critter's rendered width in CSS px, mirroring `CRITTER_WIDTH`'s clamp. Every
 * size in the yard is a multiple of this, so it is imported from the module that
 * defines how a Critter is actually rendered rather than assumed here — the two
 * drifting apart would rescale the whole scene relative to the cast without
 * either file looking wrong on its own.
 */
const critterPx = (w: number) =>
  Math.min(CRITTER_MAX_PX, Math.max(CRITTER_MIN_PX, w * CRITTER_VW));

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
  return `${Math.round(h / w / QUANTUM)}:${Math.round(critterPx(w))}:${Math.round(w / 40)}`;
}

const serverSnapshot = () => '43:195:10';

export type BarnyardScene = {
  frame: Frame;
  /** A Critter's width in frame units. ~50 on a phone, ~17 at 16:10. */
  critterW: number;
  art: BarnyardArt;
};

export function useBarnyardScene(): BarnyardScene {
  const key = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    const { w, h } = viewport();
    // The frame is 100 wide and as tall as the viewport's aspect makes it.
    const frame: Frame = { w: 100, h: Math.max(40, Math.min(320, (h / w) * 100)) };
    const critterW = (critterPx(w) / w) * 100;
    return { frame, critterW, art: buildBarnyard(BARNYARD, frame, critterW, BARNYARD_SEED) };
    // `key` is the quantized aspect — the only thing the build actually depends
    // on. Depending on the raw viewport instead would rebuild on every resize
    // pixel, which is the churn this hook exists to prevent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
