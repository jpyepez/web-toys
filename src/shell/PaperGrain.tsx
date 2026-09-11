import { print } from './art/house';

/**
 * The paper the whole collection is printed on — one static, screen-space grain
 * layer above every Toy.
 *
 * WHY IT EXISTS. A perfectly uniform colour field does not occur in any physical
 * medium; it is a signature of software, and it is most of what separates
 * "printed illustration" from "vector file". Grain also dithers the large
 * gradients the backdrops use, which otherwise band on an 8-bit display.
 *
 * It is safe for a 3–4 year old's attention in a way that adding more *objects*
 * would not be: the classroom-decoration research is about extraneous
 * interpretable elements competing for a still-developing selective attention.
 * Grain is a sub-object frequency — it does not parse as a thing, so it adds no
 * cognitive load while still reading as craft to the adult holding the phone.
 *
 * THREE THINGS THAT MUST NOT CHANGE:
 *
 *  1. **It is screen-space, not scene-space.** `baseFrequency` is in user-space
 *     units, so grain authored inside a Toy's `viewBox="0 0 100 100"` would
 *     resize whenever the viewport does. Here 1 user unit is 1 CSS pixel.
 *  2. **It never animates.** Animating `baseFrequency` or `seed` re-runs a
 *     full-region turbulence evaluation every frame, which is the single most
 *     expensive thing available in SVG filters. Static, it rasterises once and
 *     the compositor reuses it forever — everything underneath animates freely.
 *  3. **`fractalNoise`, not `turbulence`.** fractalNoise is symmetric about 0.5
 *     and gives an even wash; turbulence bunches near zero and reads as sparse
 *     ridges. `numOctaves` stays at 2 — above `baseFrequency` 0.3 the extra
 *     octaves land below the device pixel and cost raster time for nothing.
 *
 * Gated on `prefers-contrast: more` rather than `prefers-reduced-motion` — grain
 * is not motion, and stripping it for a user who asked for less *movement* would
 * remove something they never objected to. It does reduce effective contrast,
 * which is a real reason to drop it.
 */
export function PaperGrain() {
  return (
    <svg
      className="paper-grain"
      aria-hidden="true"
      focusable="false"
      style={{ opacity: print.grainOpacity }}
    >
      <filter
        id="paper-grain-filter"
        x="0"
        y="0"
        width="100%"
        height="100%"
        // The spec default is linearRGB, which makes the noise composite darker
        // and muddier than authored.
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency={print.grainFrequency}
          numOctaves={2}
          seed={11}
          stitchTiles="stitch"
        />
        {/* Kill the RGB, drive alpha off luminance, and warm it toward paper.
            The negative alpha intercept keeps the mean near zero so the layer
            textures what is underneath instead of darkening it. */}
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.20  0 0 0 0 0.17  0 0 0 0 0.13  0.16 0.16 0.16 0 -0.05"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain-filter)" />
    </svg>
  );
}
