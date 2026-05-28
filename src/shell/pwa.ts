import type { ManifestOptions } from 'vite-plugin-pwa';

/**
 * The web app manifest fed to vite-plugin-pwa at build time. Keeps the PWA
 * configuration in one importable place so its shape can be unit-asserted
 * (jsdom-friendly) and reused by both the Vite build and any tests.
 *
 * Per slice #07's HITL decisions, icon entries reference an SVG source and
 * a build-emitted PNG apple-touch-icon rasterised from that SVG — no
 * authored binary assets in the repo (ADR-0002 spirit).
 */
export const pwaManifest: Partial<ManifestOptions> = {
  // 'standalone' = the installed app launches without browser chrome
  // (address bar, tabs), as if it were a native app on the home screen.
  display: 'standalone',
  icons: [
    {
      // The code-drawn SVG is emitted to /icon.svg by the build (see vite.config).
      // sizes: 'any' tells Chrome the SVG is scalable to any size.
      src: '/icon.svg',
      type: 'image/svg+xml',
      sizes: 'any',
      purpose: 'any',
    },
  ],
};
