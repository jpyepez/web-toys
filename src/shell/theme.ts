import { useSyncExternalStore } from 'react';

/**
 * Home's theme setting — System / Light / Dark. Like the mute toggle it is a
 * parent-facing setting persisted in localStorage, not a progress feature
 * (docs/out-of-scope/progress-and-gamification.md). System, the default,
 * follows `prefers-color-scheme` and updates live.
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/** localStorage key holding the theme preference; absent = System. */
export const THEME_KEY = 'web-toys:theme';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

export type ThemeStore = {
  getPreference(): ThemePreference;
  getResolved(): ResolvedTheme;
  setPreference(pref: ThemePreference): void;
  /** System → Light → Dark → System. */
  cycle(): void;
  subscribe(listener: () => void): () => void;
  /** Mirror the resolved theme onto `<html data-theme>` and keep it live. */
  start(): void;
};

type Options = {
  storage?: Storage;
  matchMedia?: (query: string) => MediaQueryList;
  document?: Document;
};

function defaultStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function createThemeStore(options: Options = {}): ThemeStore {
  const storage = 'storage' in options ? options.storage : defaultStorage();
  const doc = options.document ?? (typeof document === 'undefined' ? undefined : document);
  const mq =
    options.matchMedia?.('(prefers-color-scheme: dark)') ??
    (typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : undefined);

  let pref: ThemePreference = 'system';
  try {
    const saved = storage?.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') pref = saved;
  } catch {
    /* unreadable storage: stay on System */
  }

  const listeners = new Set<() => void>();
  const systemDark = () => mq?.matches ?? false;
  const resolve = (): ResolvedTheme =>
    pref === 'system' ? (systemDark() ? 'dark' : 'light') : pref;

  const notify = () => listeners.forEach((l) => l());

  // The switch is instant: transitions are switched off for the frame the
  // theme changes in, so nothing cascades raggedly.
  let freeze: HTMLStyleElement | undefined;
  const suppressTransitions = () => {
    if (!doc?.head) return;
    freeze?.remove();
    const el = doc.createElement('style');
    el.setAttribute('data-theme-switch', '');
    el.textContent = '*,*::before,*::after{transition:none !important}';
    doc.head.appendChild(el);
    freeze = el;
    // Read layout so the no-transition style applies before release.
    void doc.body?.offsetHeight;
    setTimeout(() => {
      if (freeze === el) freeze = undefined;
      el.remove();
    }, 50);
  };

  let lastResolved = resolve();
  const mirror = () => {
    if (doc) doc.documentElement.dataset.theme = lastResolved;
  };
  const onChange = () => {
    const next = resolve();
    if (next !== lastResolved) {
      suppressTransitions();
      lastResolved = next;
      mirror();
    }
    notify();
  };

  const store: ThemeStore = {
    getPreference: () => pref,
    getResolved: () => resolve(),
    setPreference(next) {
      if (next === pref) return;
      pref = next;
      try {
        if (next === 'system') storage?.removeItem(THEME_KEY);
        else storage?.setItem(THEME_KEY, next);
      } catch {
        /* unwritable storage: the choice just won't persist */
      }
      onChange();
    },
    cycle() {
      store.setPreference(ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length]);
    },
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) mq?.addEventListener?.('change', onChange);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) mq?.removeEventListener?.('change', onChange);
      };
    },
    start() {
      mirror();
      store.subscribe(() => {});
    },
  };
  return store;
}

/** The Shell's one theme store. */
export const themeStore = createThemeStore();

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(themeStore.subscribe, themeStore.getPreference);
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(themeStore.subscribe, themeStore.getResolved);
}
