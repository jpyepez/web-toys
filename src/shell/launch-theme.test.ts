import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEME_KEY } from './theme';
import { homeTheme, sky } from './tokens';

/**
 * The launch script in index.html copies THEME_KEY and the status-bar colours
 * so it can paint before the app mounts. These tests run that exact script
 * and hold its choices to the Shell's own tokens.
 */
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const script = html.match(/<script id="launch-theme">([\s\S]*?)<\/script>/)?.[1];

const realMatchMedia = window.matchMedia;
const osScheme = (dark: boolean) => {
  window.matchMedia = ((query: string) =>
    ({ matches: dark && query.includes('dark'), media: query }) as MediaQueryList) as typeof window.matchMedia;
};

const metas = () => [...document.head.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];

function launch(path: string) {
  window.history.replaceState({}, '', path);
  new Function(script!)();
  return {
    tags: metas().map((m) => m.content),
    background: document.documentElement.style.background,
  };
}

/** jsdom normalises a hex background to rgb(); compare through the same parser. */
function asCss(hex: string) {
  const el = document.createElement('div');
  el.style.background = hex;
  return el.style.background;
}

describe('launch theme script (index.html)', () => {
  beforeEach(() => {
    localStorage.clear();
    metas().forEach((m) => m.remove());
    for (const scheme of ['light', 'dark']) {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.media = `(prefers-color-scheme: ${scheme})`;
      document.head.appendChild(m);
    }
  });

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    window.history.replaceState({}, '', '/');
    document.documentElement.style.background = '';
  });

  it('is present', () => {
    expect(script).toBeTruthy();
  });

  it.each([
    { saved: null, osDark: false, want: 'light' },
    { saved: null, osDark: true, want: 'dark' },
    { saved: 'light', osDark: true, want: 'light' },
    { saved: 'dark', osDark: false, want: 'dark' },
  ] as const)('on Home, saved $saved with OS dark=$osDark paints $want', ({ saved, osDark, want }) => {
    if (saved) localStorage.setItem(THEME_KEY, saved);
    osScheme(osDark);
    const { tags, background } = launch('/');
    expect(tags).toEqual([homeTheme[want].page, homeTheme[want].page]);
    expect(background).toBe(asCss(homeTheme[want].page));
  });

  it.each(['light', 'dark'] as const)('inside a Toy paints sky blue with a saved %s theme', (saved) => {
    localStorage.setItem(THEME_KEY, saved);
    osScheme(saved === 'dark');
    const { tags, background } = launch('/toy/counting-sheep');
    expect(tags).toEqual([sky, sky]);
    expect(background).toBe(asCss(sky));
  });

  it('ships fallback tags in the Home page colours, one per colour scheme', () => {
    const tag = (scheme: string) =>
      html.match(
        new RegExp(`<meta name="theme-color" content="([^"]+)" media="\\(prefers-color-scheme: ${scheme}\\)"`),
      )?.[1];
    expect(tag('light')).toBe(homeTheme.light.page);
    expect(tag('dark')).toBe(homeTheme.dark.page);
  });
});
