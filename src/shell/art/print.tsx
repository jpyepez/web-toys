import type { CSSProperties, ReactNode } from 'react';

/**
 * The printing process, as shared primitives. Each Toy supplies its own shapes
 * and hues; the PROCESS is the same across the collection, which is what makes
 * five different scenes read as one set rather than five separate looks.
 *
 * Cross-Toy primitives in the ADR-0004 sense — nothing here names a dusk, a
 * meadow or an ocean.
 *
 * ── THE ONE RULE THAT GOVERNS ALL OF IT ────────────────────────────────────
 * Everything in this file is for STATIC layers only. `feTurbulence` is evaluated
 * per pixel over the whole filter region; rendered once it is free, because the
 * result rasterises and the compositor reuses it. Re-run every frame it will
 * melt a phone. So: never put these on an element whose geometry animates, and
 * never animate a filter attribute (`baseFrequency`, `scale`, `seed`) — that is
 * the single most expensive thing available in SVG. Backdrops are exactly the
 * right home for them, which is why the Critters get none of this.
 *
 * ── THE GOTCHA THAT WILL BITE ──────────────────────────────────────────────
 * `baseFrequency` is in USER-SPACE units, not pixels. The same value inside
 * `viewBox="0 0 100 100"` and `viewBox="0 0 200 120"` gives visibly different
 * grain. That is why frequency and scale are props with no universal default
 * worth trusting: they must be tuned per viewBox. As a rule of thumb, halving
 * the viewBox's width means doubling `baseFrequency` to keep the same look.
 */

/**
 * Turns a clean vector edge into a hand-cut one — the single highest-value move
 * for making a shape stop looking like a primitive.
 *
 * `fractalNoise`, never `turbulence`: fractalNoise is symmetric about 0.5, so
 * the mean displacement is zero and the shape stays where you put it.
 * `turbulence` bunches its channels near zero, which pushes every pixel the same
 * way and slides the whole shape off its position.
 *
 * TWO CONSTRAINTS ON `scale`, both about not shredding what you displace:
 *  - Amplitude: keep `scale` at roughly 0.3–0.5× the stroke width of anything
 *    thin in the shape. Past ~1.5× the stroke, the line breaks into pieces.
 *  - Wavelength: the noise period (`1 / frequency`) must be several times longer
 *    than the feature, or the displacement varies WITHIN a stroke and tears it.
 *    Aim for a period at least 5× the stroke width.
 *
 * The filter region is padded because displacement moves edges outward as well
 * as inward, and anything tighter clips the result. A full-bleed rect must also
 * be drawn oversized by at least `scale`, or the displacement pulls its edge in
 * and leaves a gap at the viewport border.
 */
export function HandCutFilter({
  id,
  frequency,
  scale,
  seed = 3,
  octaves = 3,
}: {
  id: string;
  /** In user-space units of the SVG that references this. Tune per viewBox. */
  frequency: number;
  /** Displacement amplitude, also in user-space units. */
  scale: number;
  seed?: number;
  octaves?: number;
}) {
  return (
    <filter
      id={id}
      x="-15%"
      y="-15%"
      width="130%"
      height="130%"
      // The spec default is linearRGB, which changes the channel values feeding
      // the displacement — so `scale` would quietly mean something else.
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency={frequency}
        numOctaves={octaves}
        seed={seed}
        result="handcut-noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="handcut-noise"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
}

/**
 * Uneven ink lay — the mottle a screen or a duplicator leaves where pressure and
 * mesh tension vary. Displaces the edge like `HandCutFilter` and additionally
 * thins the ink in patches.
 *
 * `softness` is the alpha slope, and it is the whole game. Keep it shallow:
 * around 0.25–0.5 thins the ink here and there, which reads as ink. Steeper
 * punches holes clean through the middle of the shape, which reads as damage.
 */
export function InkMottleFilter({
  id,
  frequency,
  scale,
  seed = 6,
  softness = 0.35,
}: {
  id: string;
  frequency: number;
  scale: number;
  seed?: number;
  softness?: number;
}) {
  return (
    <filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
      <feTurbulence
        type="fractalNoise"
        baseFrequency={frequency}
        numOctaves={4}
        seed={seed}
        result="mottle-noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="mottle-noise"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
        result="mottle-displaced"
      />
      {/* Drive alpha off the same noise field, on a shallow slope with a lifted
          intercept, so coverage dips without ever reaching zero. */}
      <feColorMatrix
        in="mottle-noise"
        type="matrix"
        values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${-softness} ${1 + softness * 0.45}`}
        result="mottle-alpha"
      />
      <feComposite in="mottle-displaced" in2="mottle-alpha" operator="in" />
    </filter>
  );
}

/**
 * One pass of the press. Each colour in a print is laid down separately, and the
 * substrate shifts a fraction of a millimetre between passes — so the plates
 * never land in perfect register.
 *
 * Reproducing that is close to free and reads instantly as "printed" rather than
 * "rendered". Keep the offset small: under about 2.5 CSS pixels it is charming,
 * above it, it reads as a bug or as 3D glasses.
 *
 * `blend` defaults to `multiply`, which is the physical model — inks are
 * subtractive and transparent, so where two overlap their transmittances
 * multiply into a genuine third colour. Pass `blend="normal"` for the base plate,
 * which has nothing beneath it to mix with.
 *
 * The offset goes on a plain `<g transform>`. It must NOT go on a Motion
 * element: Motion owns `transform` on anything it animates and will clobber the
 * translate the moment it writes its first frame.
 */
export function Plate({
  dx = 0,
  dy = 0,
  blend = 'multiply',
  opacity,
  children,
  ...rest
}: {
  dx?: number;
  dy?: number;
  blend?: CSSProperties['mixBlendMode'];
  opacity?: number;
  children: ReactNode;
} & Record<`data-${string}`, string | boolean | number | undefined>) {
  return (
    <g transform={`translate(${dx} ${dy})`} style={{ mixBlendMode: blend }} opacity={opacity} {...rest}>
      {children}
    </g>
  );
}
