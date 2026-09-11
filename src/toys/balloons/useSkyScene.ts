/**
 * The one place the Up & Away scene geometry exists.
 *
 * WHY IT IS A HOOK AND NOT PROPS. Two components need the same sky: the backdrop
 * has to DRAW the peg, and the bunch has to HANG OFF it. Those used to be
 * independent — the peg was drawn at x 50 of a `preserveAspectRatio="none"` band
 * that stretched with the viewport, and the five balloons were placed at
 * hand-tuned `left`/`top` percentages of the Toy's `<main>` with fixed-length
 * strings that pointed at nothing in particular — and that independence is
 * exactly why the strings only landed on the peg at the one aspect they were
 * tuned on. Two hand-maintained positions cannot be kept in agreement; one
 * generator read by both cannot fall out of it.
 *
 * WHY IT MEASURES THE VIEWPORT. The sky is composed into a frame whose aspect
 * MATCHES the viewport, so nothing is ever stretched or sliced — see `sky.ts`.
 * That aspect is only knowable at runtime, so the geometry is built from it and
 * rebuilt when it changes. The aspect is QUANTIZED first: a resize that crosses
 * no bucket boundary returns the identical object, so dragging a desktop window
 * does not re-run the generator on every frame, and a phone's address bar
 * sliding away cannot shift the peg out from under a balloon mid-hold.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { buildSky, type Frame, type SkyArt } from './sky';
import { SKY, SKY_SEED } from './sky-config';
import { BALLOON_MAX_PX, BALLOON_MIN_PX, BALLOON_VW } from './balloon-metrics';

/**
 * A balloon's rendered width in CSS px, mirroring `BALLOON_WIDTH`'s clamp. Every
 * size in the sky is a multiple of this, so it comes from the metrics module the
 * drawing also reads rather than being assumed here — the two drifting apart
 * would rescale the whole scene relative to the cast without either file looking
 * wrong on its own.
 */
const balloonPx = (w: number) =>
  Math.min(BALLOON_MAX_PX, Math.max(BALLOON_MIN_PX, w * BALLOON_VW));

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
  return `${Math.round(h / w / QUANTUM)}:${Math.round(balloonPx(w))}:${Math.round(w / 40)}`;
}

const serverSnapshot = () => '43:109:10';

export type SkyScene = {
  frame: Frame;
  /** A balloon's width in frame units. ~28 on a phone, ~13 at 16:10. */
  balloonW: number;
  art: SkyArt;
};

/**
 * `bunchSize` is a parameter because the scene emits one anchor per balloon: the
 * bunch's size is the Toy's on-device-tuned duration lever, and the fan has to
 * follow it rather than the generator assuming five.
 */
export function useSkyScene(bunchSize: number): SkyScene {
  const key = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    const { w, h } = viewport();
    // The frame is 100 wide and as tall as the viewport's aspect makes it.
    const frame: Frame = { w: 100, h: Math.max(40, Math.min(320, (h / w) * 100)) };
    const balloonW = (balloonPx(w) / w) * 100;
    return { frame, balloonW, art: buildSky(SKY, frame, balloonW, SKY_SEED, bunchSize) };
    // `key` is the quantized aspect — the only thing the build actually depends
    // on besides the bunch size. Depending on the raw viewport instead would
    // rebuild on every resize pixel, which is the churn this hook prevents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, bunchSize]);
}
