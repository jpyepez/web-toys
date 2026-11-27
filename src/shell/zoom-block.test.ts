import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { installZoomBlock } from './zoomBlock';

describe('zoom block', () => {
  it('shell.css sets a touch-action without pinch-zoom on html/body', () => {
    const css = readFileSync(resolve(__dirname, 'shell.css'), 'utf8');
    const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(([, sel]) =>
      /(^|[\s,])(html|body)\s*(,|$)/.test(sel.replace(/\/\*[\s\S]*?\*\//g, '').trim()),
    );
    const values = rules
      .map(([, , body]) => /touch-action:\s*([^;]+);/.exec(body)?.[1].trim())
      .filter((v): v is string => !!v);
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) expect(v).not.toMatch(/pinch-zoom|manipulation|auto/);
  });

  describe('gesturestart', () => {
    let cleanup: (() => void) | undefined;
    afterEach(() => cleanup?.());

    it('is cancelled once installed', () => {
      cleanup = installZoomBlock();
      const e = new Event('gesturestart', { cancelable: true });
      document.dispatchEvent(e);
      expect(e.defaultPrevented).toBe(true);
    });

    it('adds one listener when installed twice; cleanup removes it', () => {
      const add = vi.spyOn(document, 'addEventListener');
      const remove = vi.spyOn(document, 'removeEventListener');
      cleanup = installZoomBlock();
      installZoomBlock();
      expect(add.mock.calls.filter(([t]) => t === 'gesturestart')).toHaveLength(1);
      cleanup();
      expect(remove.mock.calls.filter(([t]) => t === 'gesturestart')).toHaveLength(1);
      const e = new Event('gesturestart', { cancelable: true });
      document.dispatchEvent(e);
      expect(e.defaultPrevented).toBe(false);
      add.mockRestore();
      remove.mockRestore();
    });
  });
});
