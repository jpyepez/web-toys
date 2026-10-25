# No binary assets — visuals and audio are generated in code

There are no raster images, sprite sheets, or audio files in this project. Critters and
scenery are built from code-drawn SVG primitives (paths, circles, ovals), and sounds are
synthesized at runtime via the Web Audio API (likely Tone.js). A reasonable contributor
would assume a kids' app ships PNGs and `.mp3`s, so this is a deliberate deviation worth
recording: it keeps the bundle tiny on a phone, removes the art/audio asset pipeline that
usually bottlenecks a solo project, makes everything trivially animatable/tweakable, and
gives the whole site a coherent minimalist aesthetic. The trade-off is a ceiling on visual
and sonic richness, accepted for v1.

## Consequences

- Adding a new Toy means writing code, not commissioning/sourcing assets. No `public/`
  image or audio directory should appear.
- The animation library and the SVG primitives are load-bearing — they're how *all* art is
  produced — so that choice matters more than in an asset-driven app.
- If richer art is ever wanted, it's a conscious reversal of this ADR, not a quiet addition.

## Amendment — build-emitted PWA install icons (slice #07)

PWA install icons are the one narrow case where a raster file (PNG) must be served. The
manifest can carry an SVG entry that Android/Chrome use directly, but iOS Safari ignores
manifest icons and only reads `apple-touch-icon` (PNG) from `<head>` — there is no
SVG-only path that gives iOS a real home-screen icon. To stay within this ADR's spirit:

- **The icon's source of truth is still code.** A single SVG string in `src/shell/pwa.ts`
  defines the icon from primitives — no authored binary asset is checked in.
- **The PNG is a build artifact, not a repo asset.** `vite.config`'s `codegenPwaIcons`
  plugin rasterises the SVG at build time (via `@resvg/resvg-js`) and emits both
  `/icon.svg` and `/apple-touch-icon.png` to `dist/`. There is no `public/` PNG.
- **Scope is exactly PWA install icons.** This carve-out is *not* an opening for in-app
  art: Critters, scenery, and Completion visuals remain code-drawn SVG; sound remains
  synthesized. Reintroducing authored PNGs/MP3s anywhere else is still a conscious
  reversal of this ADR, not a quiet addition.
