import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Testing Library auto-cleanup only runs with vitest `globals`; we use explicit
// imports, so unmount the React tree between tests ourselves.
afterEach(() => {
  cleanup();
});
