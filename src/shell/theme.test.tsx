import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createThemeStore, themeStore, THEME_KEY } from './theme';
import { fakeStorage } from '../test/fakes';
import { renderApp } from './test-support/renderApp';
import { homeTheme } from './tokens';

function fakeMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const mq = {
    get matches() {
      return matches;
    },
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  } as unknown as MediaQueryList;
  return {
    matchMedia: () => mq,
    set(next: boolean) {
      matches = next;
      listeners.forEach((l) => l());
    },
  };
}

describe('theme store', () => {
  it('defaults to System when nothing is saved, following prefers-color-scheme', () => {
    const media = fakeMedia(true);
    const store = createThemeStore({ storage: fakeStorage(), matchMedia: media.matchMedia });
    expect(store.getPreference()).toBe('system');
    expect(store.getResolved()).toBe('dark');
  });

  it('cycles System → Light → Dark → System and persists the choice', () => {
    const storage = fakeStorage();
    const store = createThemeStore({ storage, matchMedia: fakeMedia(false).matchMedia });
    store.cycle();
    expect(store.getPreference()).toBe('light');
    store.cycle();
    expect(store.getPreference()).toBe('dark');
    expect(storage.getItem(THEME_KEY)).toBe('dark');
    // A reload reads it back.
    const reloaded = createThemeStore({ storage, matchMedia: fakeMedia(false).matchMedia });
    expect(reloaded.getPreference()).toBe('dark');
    store.cycle();
    expect(store.getPreference()).toBe('system');
    expect(storage.getItem(THEME_KEY)).toBeNull();
  });

  it('follows a live change of the OS setting while on System, not otherwise', () => {
    const media = fakeMedia(false);
    const store = createThemeStore({ storage: fakeStorage(), matchMedia: media.matchMedia });
    const listener = vi.fn();
    store.subscribe(listener);
    media.set(true);
    expect(store.getResolved()).toBe('dark');
    expect(listener).toHaveBeenCalled();
    store.setPreference('light');
    media.set(false);
    media.set(true);
    expect(store.getResolved()).toBe('light');
  });

  it('suppresses transitions during a switch and mirrors data-theme on <html>', () => {
    const store = createThemeStore({ storage: fakeStorage(), matchMedia: fakeMedia(false).matchMedia });
    store.start();
    expect(document.documentElement.dataset.theme).toBe('light');
    store.setPreference('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    const freeze = document.head.querySelector('style[data-theme-switch]');
    expect(freeze?.textContent).toMatch(/transition:\s*none/);
  });
});

describe('Home theme pill', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => themeStore.setPreference('system'));
  });

  it('cycles System → Light → Dark, naming the mode in its aria-label', async () => {
    const user = userEvent.setup();
    renderApp('/');
    const pill = await screen.findByRole('button', { name: 'Theme: System' });
    await user.click(pill);
    expect(screen.getByRole('button', { name: 'Theme: Light' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Theme: Light' }));
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument();
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('paints dark tokens on Home, and nothing theme-related inside a Toy', async () => {
    const user = userEvent.setup();
    const router = renderApp('/');
    await user.click(await screen.findByRole('button', { name: 'Theme: System' }));
    await user.click(screen.getByRole('button', { name: 'Theme: Light' }));
    const frame = document.querySelector('.shell-frame') as HTMLElement;
    expect(frame.style.getPropertyValue('--pill-fg')).toBe(homeTheme.dark.pillFg);
    expect(frame.style.background).not.toBe('');
    await act(() => router.navigate({ to: '/toy/$toyId', params: { toyId: 'counting-sheep' } }));
    await screen.findByRole('button', { name: 'Home' });
    const toyFrame = document.querySelector('.shell-frame') as HTMLElement;
    expect(toyFrame.style.getPropertyValue('--pill-fg')).toBe('');
    expect(toyFrame.style.getPropertyValue('--pill-bg')).toBe('');
    expect(screen.queryByRole('button', { name: /Theme:/ })).toBeNull();
  });
});

describe('Home theme — Card title contrast', () => {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = (hexStr: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hexStr.slice(i, i + 2), 16) / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  it.each(['light', 'dark'] as const)('keeps the title legible on its footer in %s', (mode) => {
    const t = homeTheme[mode];
    expect(ratio(t.ink, t.cardSurface)).toBeGreaterThanOrEqual(7);
  });

  it('puts the dark Card footer a step lighter than the dark page, with a border instead of a shadow', () => {
    const d = homeTheme.dark;
    expect(luminance(d.cardSurface)).toBeGreaterThan(luminance(d.page));
    expect(d.cardShadow).toBe('none');
    expect(d.cardBorder).not.toBe('transparent');
  });
});
