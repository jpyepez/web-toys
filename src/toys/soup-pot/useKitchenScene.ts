/**
 * The one place the Soup Pot scene geometry exists.
 *
 * WHY A HOOK. The backdrop draws the counter and the pot; the soup, ladle and
 * steam sit at the pot's centre; the mice stand on the rim points; the ghost
 * finger circles the same centre. All of them read this one object, so none of
 * them can disagree about where the pot is.
 *
 * WHY IT MEASURES THE VIEWPORT. The scene is composed into a frame whose aspect
 * matches the viewport, and the mouse — the scene's unit — depends on both the
 * width and the height. The aspect is QUANTIZED first, so a phone's address bar
 * sliding away can't rebuild the pot under a stirring finger.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { buildKitchen, type KitchenArt } from './kitchen';
import { KITCHEN, KITCHEN_SEED } from './kitchen-config';
import { mousePx } from './MouseDrawing';

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
  return `${Math.round(h / w / QUANTUM)}:${Math.round(mousePx(w, h))}:${Math.round(w / 40)}`;
}

const serverSnapshot = () => '43:86:10';

/** The scene for a viewport of `w` x `h` CSS px. Pure — the lab and the Card call it too. */
export function kitchenSceneFor(w: number, h: number): KitchenArt {
  const frame = { w: 100, h: Math.max(30, Math.min(320, (h / w) * 100)) };
  const mw = (mousePx(w, h) / w) * 100;
  return buildKitchen(KITCHEN, frame, mw, KITCHEN_SEED);
}

export function useKitchenScene(): KitchenArt {
  const key = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    const { w, h } = viewport();
    return kitchenSceneFor(w, h);
    // `key` is the quantized aspect — the only thing the build depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
