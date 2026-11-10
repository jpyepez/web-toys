import { defineConfig, devices } from '@playwright/test';

const port = 4173;

// The smoke suite runs against the production build served by `vite preview`, not the dev
// server. Under CI the `checks` job builds first, so the server only serves `dist/`.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `${process.env.CI ? '' : 'bun run build && '}bun run preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
