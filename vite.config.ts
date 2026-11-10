/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { Resvg } from '@resvg/resvg-js';
import { mkdir, writeFile } from 'node:fs/promises';
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

/**
 * Dev-only endpoint the critter lab's Save button posts to (see src/lab/Lab.tsx).
 *
 * Saving to a FILE rather than only the clipboard is the point: the real Toys
 * will import the saved JSON, so saving IS shipping the decision. `apply: 'serve'`
 * keeps it out of every build.
 */
function labConfigSave(): Plugin {
  return {
    name: 'lab-config-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__lab/save', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        try {
          const { name, config } = JSON.parse(Buffer.concat(chunks).toString());
          const safe = String(name).replace(/[^a-z0-9-]/gi, '-');
          const dir = new URL('./src/lab/saved/', import.meta.url);
          await mkdir(dir, { recursive: true });
          const file = new URL(`${safe}.json`, dir);
          await writeFile(file, JSON.stringify(config, null, 2) + '\n');
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ path: `src/lab/saved/${safe}.json` }));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    codegenPwaIcons(),
    labConfigSave(),
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
    // `e2e/` is the Playwright smoke suite, run by `bun run test:e2e`, not Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
