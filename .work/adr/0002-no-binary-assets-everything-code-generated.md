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
