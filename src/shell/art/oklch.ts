/**
 * OKLCH colour, and the ink-on-paper arithmetic the print rules need.
 *
 * WHY THIS EXISTS: the app currently authors every colour as `hsl()`, whose `L`
 * is a mathematical midpoint of RGB channels, not a lightness. `hsl(50 85% 62%)`
 * and `hsl(210 58% 60%)` claim to be siblings and are perceptually 0.19 apart in
 * real lightness — which is how the Balloons sky ended up DARKER than the yellow
 * balloon in front of it. OKLCH's `L` is lightness, so "these five are siblings"
 * becomes a thing you can state and assert.
 *
 * Conversion is Björn Ottosson's Oklab (2020), the same maths the CSS spec uses.
 */

export type Oklch = { l: number; c: number; h: number };

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Linear-light channel → sRGB gamma-encoded channel. */
function gamma(x: number): number {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

/** OKLCH → linear-light sRGB, unclamped so callers can detect out-of-gamut. */
function oklchToLinear({ l, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

/** True when the colour falls outside sRGB — the panel surfaces this. */
export function outOfGamut(col: Oklch): boolean {
  const [r, g, b] = oklchToLinear(col);
  const e = 0.0005;
  return r < -e || r > 1 + e || g < -e || g > 1 + e || b < -e || b > 1 + e;
}

/**
 * The nearest in-sRGB colour with the SAME lightness and hue, reached by
 * reducing chroma alone.
 *
 * WHY THIS IS NOT PER-CHANNEL CLAMPING. sRGB's chroma ceiling collapses as
 * lightness drops on the warm side — at L 0.50 hue 20 allows C 0.20, but the
 * house shadow formula (`shade`, which LOWERS lightness and RAISES chroma) lands
 * that same hue at L 0.38 C 0.155, where the ceiling is 0.10. Clamping the
 * resulting channels drives G and B to zero, which does not merely desaturate
 * the colour: it moves its hue toward pure red and its lightness below the value
 * the palette was derived to. Every ΔL the palette asserts is then a claim about
 * a colour that is not the one on screen.
 *
 * Reducing chroma instead is what CSS Color 4 specifies for out-of-gamut
 * colours, and it keeps the two properties the rules are written in terms of —
 * lightness and hue — exactly as authored. What is lost is saturation, which is
 * the one thing the display genuinely cannot show.
 */
export function toGamut(col: Oklch): Oklch {
  if (!outOfGamut(col)) return col;
  let lo = 0;
  let hi = col.c;
  // 24 halvings resolves chroma far finer than an 8-bit channel can express.
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (outOfGamut({ ...col, c: mid })) hi = mid;
    else lo = mid;
  }
  return { ...col, c: lo };
}

/**
 * OKLCH → `#rrggbb`, gamut-MAPPED (chroma reduced, lightness and hue kept) with
 * a per-channel clamp behind it only as a rounding guard. Mapping rather than
 * clipping is what makes a derived shadow still be the lightness the palette
 * says it is — see `toGamut`.
 */
export function hex(col: Oklch): string {
  const [r, g, b] = oklchToLinear(toGamut(col));
  const to255 = (x: number) => Math.round(clamp01(gamma(clamp01(x))) * 255);
  return (
    '#' +
    [to255(r), to255(g), to255(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Normalised sRGB triple in 0..1 — what the multiply arithmetic works in. */
export function srgb(col: Oklch): [number, number, number] {
  const [r, g, b] = oklchToLinear(col);
  return [clamp01(gamma(clamp01(r))), clamp01(gamma(clamp01(g))), clamp01(gamma(clamp01(b)))];
}

function fromSrgb([r, g, b]: [number, number, number]): string {
  const to255 = (x: number) => Math.round(clamp01(x) * 255);
  return (
    '#' +
    [to255(r), to255(g), to255(b)].map((n) => n.toString(16).padStart(2, '0')).join('')
  );
}

/**
 * RULE 1 — ink on paper. A `multiply` plate over paper renders `ink × paper`,
 * so to LAND on a target colour the ink must be `target / paper`.
 *
 * The division clips when any channel of the target is lighter than the paper,
 * because multiply can only ever darken. That is not a rounding artefact — it is
 * the physical constraint of the process, and it is why a screenprint renders a
 * cloud as a *knockout* (a shape that removes sky ink) rather than as white ink.
 * `clipped` is returned so the panel can warn instead of silently lying.
 */
export function inkOverPaper(
  target: Oklch,
  paper: Oklch,
): { hex: string; clipped: boolean } {
  const t = srgb(target);
  const p = srgb(paper);
  let clipped = false;
  const out = t.map((tc, i) => {
    const pc = p[i] || 1e-6;
    const v = tc / pc;
    if (v > 1) clipped = true;
    return clamp01(v);
  }) as [number, number, number];
  return { hex: fromSrgb(out), clipped };
}

/**
 * RULE 8 — shadow is a formula, never black.
 *
 * Adding black to a colour kills its chroma and produces the muddy "dirty" look.
 * A real shadow is lit by ambient light rather than by the key, so it is a
 * DIFFERENT COLOUR: darker, hue-rotated toward the ambient, and equal or higher
 * in chroma. Callers never hand-pick a shadow value; they call this.
 */
export function shade(
  base: Oklch,
  opts: { dl: number; hueRotate: number; dc: number },
): Oklch {
  return {
    l: Math.max(0, base.l - opts.dl),
    c: Math.max(0, base.c + opts.dc),
    h: (base.h + opts.hueRotate + 360) % 360,
  };
}

/** The highlight counterpart — rotates toward the light rather than the ambient. */
export function tint(base: Oklch, opts: { dl: number; hueRotate: number }): Oklch {
  return {
    l: Math.min(1, base.l + opts.dl),
    c: base.c,
    h: (base.h + opts.hueRotate + 360) % 360,
  };
}

/** Perceptual lightness distance — RULE 3's ΔL assertion, in one place. */
export function deltaL(a: Oklch, b: Oklch): number {
  return Math.abs(a.l - b.l);
}

export const css = (col: Oklch) => `oklch(${col.l.toFixed(3)} ${col.c.toFixed(3)} ${col.h.toFixed(1)})`;
