/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { Resvg } from '@resvg/resvg-js';
import { pwaManifest, pwaIconSvg } from './src/shell/pwa';

/**
 * Emits the PWA icons from the single code-drawn SVG source:
 *   /icon.svg               — manifest icon (Android/Chrome PWA install).
 *   /apple-touch-icon.png   — iOS home-screen icon (referenced from index.html).
 *
 * Per slice #07's HITL decisions, the PNG is a build artifact of code, not an
 * authored binary asset — consistent with ADR-0002 (see its amendment for the
 * narrow build-emitted-raster carve-out).
 */
function codegenPwaIcons(): Plugin {
  return {
    name: 'codegen-pwa-icons',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'icon.svg',
        source: pwaIconSvg,
      });
      // 180×180 is iOS's expected apple-touch-icon size; we keep it sharp by
      // rasterising the SVG natively at exactly that pixel size.
      const png = new Resvg(pwaIconSvg, {
        fitTo: { mode: 'width', value: 180 },
      })
        .render()
        .asPng();
      this.emitFile({
        type: 'asset',
        fileName: 'apple-touch-icon.png',
        source: png,
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    codegenPwaIcons(),
    VitePWA({
      registerType: 'autoUpdate',
      // The manifest object is defined in src/shell/pwa.ts so its shape is
      // unit-asserted and shared between build config and tests.
      manifest: pwaManifest,
      // Default workbox precache covers the built JS/CSS bundle; we add the
      // emitted icons so they're available offline once the app is installed.
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
  },
});
