import { describe, it, expect, beforeEach } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { themeStore } from './theme';
import { renderApp } from './test-support/renderApp';
import { homeTheme, sky } from './tokens';

const metas = () => document.head.querySelectorAll('meta[name="theme-color"]');
const content = () => metas()[0]?.getAttribute('content');
/** jsdom normalises a hex background to rgb(); compare through the same parser. */
const asCss = (hex: string) => {
  const el = document.createElement('div');
  el.style.background = hex;
  return el.style.background;
};
const htmlBackground = () => document.documentElement.style.background;

describe('theme-color meta', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => themeStore.setPreference('system'));
    metas().forEach((m) => m.remove());
    const m = document.createElement('meta');
    m.name = 'theme-color';
    m.content = sky;
    document.head.appendChild(m);
  });

  it.each(['light', 'dark'] as const)('follows the %s page colour on Home', async (mode) => {
    act(() => themeStore.setPreference(mode));
    renderApp('/');
    await screen.findByRole('button', { name: /Theme:/ });
    expect(content()).toBe(homeTheme[mode].page);
    expect(htmlBackground()).toBe(asCss(homeTheme[mode].page));
  });

  it('updates live when the theme pill cycles, without remounting', async () => {
    const user = userEvent.setup();
    act(() => themeStore.setPreference('system'));
    renderApp('/');
    await user.click(await screen.findByRole('button', { name: 'Theme: System' }));
    expect(content()).toBe(homeTheme.light.page);
    await user.click(screen.getByRole('button', { name: 'Theme: Light' }));
    expect(content()).toBe(homeTheme.dark.page);
  });

  it.each(['light', 'dark'] as const)('is sky blue inside a Toy in %s and restored on Home', async (mode) => {
    act(() => themeStore.setPreference(mode));
    const router = renderApp('/');
    await screen.findByRole('button', { name: /Theme:/ });
    await act(() => router.navigate({ to: '/toy/$toyId', params: { toyId: 'counting-sheep' } }));
    await screen.findByRole('button', { name: 'Home' });
    expect(content()).toBe(sky);
    expect(htmlBackground()).toBe(asCss(sky));
    await act(() => router.navigate({ to: '/' }));
    await screen.findByRole('button', { name: /Theme:/ });
    expect(content()).toBe(homeTheme[mode].page);
    expect(htmlBackground()).toBe(asCss(homeTheme[mode].page));
  });

  it('sets every tag when index.html ships one per colour scheme', async () => {
    metas().forEach((m) => m.remove());
    for (const scheme of ['light', 'dark']) {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.media = `(prefers-color-scheme: ${scheme})`;
      m.content = sky;
      document.head.appendChild(m);
    }
    act(() => themeStore.setPreference('dark'));
    renderApp('/');
    await screen.findByRole('button', { name: /Theme:/ });
    expect([...metas()].map((m) => m.getAttribute('content'))).toEqual([
      homeTheme.dark.page,
      homeTheme.dark.page,
    ]);
  });

  it('creates exactly one tag when the document has none', async () => {
    metas().forEach((m) => m.remove());
    act(() => themeStore.setPreference('dark'));
    renderApp('/');
    await screen.findByRole('button', { name: /Theme:/ });
    expect(metas()).toHaveLength(1);
    expect(content()).toBe(homeTheme.dark.page);
  });
});
