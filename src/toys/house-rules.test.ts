/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';
import { BANNED_SOURCE, paletteViolations, type PaletteSource } from '../shell/art/rules';

/**
 * The house art rules, run against EVERY Toy. A new Toy is covered the moment
 * it has a `palette.ts` exporting `source` and some `.tsx` files: nothing to
 * remember, nothing to copy. Toy-specific claims (a soup that cooks by hue, a
 * pink that reads on the body) stay in each Toy's own `palette.test.ts`.
 */

const palettes = import.meta.glob<{ source: PaletteSource }>('./*/palette.ts', { eager: true });
const sources = import.meta.glob<string>(['./**/*.ts', './**/*.tsx', '!./**/*.test.ts', '!./**/*.test.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
});

const toyOf = (path: string) => path.split('/')[1];

/**
 * Known breaks, by file, until that art is redrawn. Keep this list shrinking:
 * remove a line when its file is fixed, never add one for new work.
 */
const KNOWN_BREAKS: Record<string, string> = {
  './balloons/GhostHoldFinger.tsx': 'stroked ghost finger, from before the house style',
  './muddy-puddle/GhostFinger.tsx': 'stroked ghost finger, from before the house style',
  './nestlings/GhostCarryHand.tsx': 'stroked ghost hand, from before the house style',
};

/** Strip comments, so prose explaining a rule never trips it. */
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('house art rules, every Toy', () => {
  it('finds every Toy palette', () => {
    expect(Object.keys(palettes).length).toBeGreaterThanOrEqual(7);
  });

  for (const [path, mod] of Object.entries(palettes)) {
    const toy = toyOf(path);
    it(`${toy}: corridor, objects and scene chroma follow the colour rules`, () => {
      expect(paletteViolations(mod.source)).toEqual([]);
    });
  }

  it('uses no stroke, no hsl() and no bare Math.random() in Toy source', () => {
    const found: string[] = [];
    for (const [path, text] of Object.entries(sources)) {
      if (path in KNOWN_BREAKS) continue;
      const body = code(text);
      for (const { pattern, why } of BANNED_SOURCE) {
        if (pattern.test(body)) found.push(`${path}: ${pattern} — ${why}`);
      }
    }
    expect(found).toEqual([]);
  });

  it('keeps the known-breaks list honest: every listed file exists and still breaks a rule', () => {
    for (const path of Object.keys(KNOWN_BREAKS)) {
      expect(sources[path], path).toBeDefined();
      expect(BANNED_SOURCE.some(({ pattern }) => pattern.test(code(sources[path]))), `${path} is fixed: remove it from KNOWN_BREAKS`).toBe(true);
    }
  });
});
