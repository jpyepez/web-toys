import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom ships no `matchMedia`; Motion's `useReducedMotion` reads it (the Sheep's
// idle blink/breathe gate on it). Stub a "no preference" matcher so the hook
// resolves to `false` in tests rather than throwing on the missing global.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// Testing Library auto-cleanup only runs with vitest `globals`; we use explicit
// imports, so unmount the React tree between tests ourselves.
afterEach(() => {
  cleanup();
});
