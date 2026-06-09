import type { ManifestOptions } from 'vite-plugin-pwa';

/**
 * The code-drawn brand icon, kept as an SVG string so it's the single source
 * of truth for both the manifest icon (served as /icon.svg) and the iOS
 * apple-touch-icon PNG that the build rasterises from this same SVG.
 *
 * Per slice #07's HITL decisions, no authored binary asset lives in the repo:
 * the PNG is a build artifact of code (ADR-0002 spirit). The SVG itself is
 * built from primitives — circles, ellipses, a rounded rect.
 *
 * 512×512 viewBox is the W3C-recommended maskable PWA icon size.
 */
export const pwaIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#a7d4ff"/>
  <g fill="#ffffff">
    <circle cx="256" cy="280" r="120"/>
    <circle cx="170" cy="260" r="60"/>
    <circle cx="342" cy="260" r="60"/>
    <circle cx="190" cy="340" r="50"/>
    <circle cx="322" cy="340" r="50"/>
  </g>
  <ellipse cx="256" cy="304" rx="60" ry="54" fill="#3a2a1f"/>
  <ellipse cx="200" cy="265" rx="20" ry="32" fill="#3a2a1f"/>
  <ellipse cx="312" cy="265" rx="20" ry="32" fill="#3a2a1f"/>
  <circle cx="238" cy="298" r="7" fill="#ffffff"/>
  <circle cx="274" cy="298" r="7" fill="#ffffff"/>
</svg>`;

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
  name: 'Web Toys',
  short_name: 'Toys',
  description: 'Tiny, finite interactive toys for small humans.',
  start_url: '/',
  scope: '/',
  // 'standalone' = the installed app launches without browser chrome
  // (address bar, tabs), as if it were a native app on the home screen.
  display: 'standalone',
  // Sky-blue background matches the SVG icon's rounded tile so the splash
  // screen and the installed app's status-bar tint agree.
  background_color: '#a7d4ff',
  theme_color: '#a7d4ff',
  orientation: 'portrait',
  icons: [
    {
      // The code-drawn SVG is emitted to /icon.svg by the build (see vite.config).
      // sizes: 'any' tells Chrome the SVG is scalable to any size.
      src: '/icon.svg',
      type: 'image/svg+xml',
      sizes: 'any',
      purpose: 'any',
    },
    {
      // Build-rasterised PNG also used as the iOS apple-touch-icon
      // (referenced from index.html). 180×180 is iOS's expected size.
      src: '/apple-touch-icon.png',
      type: 'image/png',
      sizes: '180x180',
      purpose: 'any',
    },
  ],
};
