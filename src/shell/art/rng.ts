/**
 * Seeded randomness. RULE 5 and RULE 10 both depend on it.
 *
 * `Math.random()` is banned in the render path for three reasons: React
 * re-renders would reshuffle the art, the save button would be a lie (a saved
 * config could not reproduce its own image), and you could never say "seed 4271
 * composes best" and keep it.
 */

/** mulberry32 — small, fast, good enough, deterministic. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A named sub-stream, so adding a knob upstream doesn't reshuffle everything downstream. */
export function stream(seed: number, name: string): () => number {
  let h = seed >>> 0;
  for (let i = 0; i < name.length; i++) h = (Math.imul(h ^ name.charCodeAt(i), 0x01000193) >>> 0);
  return mulberry32(h);
}

/** Symmetric jitter in ±amount. */
export const jitter = (rnd: () => number, amount: number) => (rnd() - 0.5) * 2 * amount;

/**
 * RULE 10 — blue-noise scatter.
 *
 * Uniform `Math.random()` scatter is white noise: it has energy at every spatial
 * frequency including very low ones, which shows up as clumps and conspicuous
 * voids. It is mathematically random and reads as "messy". A jittered grid keeps
 * the local randomness and removes the low-frequency energy, which is what a
 * human illustrator produces by hand. `amount` 0 = rigid grid, 1 = full cell.
 */
export function jitteredGrid(
  cols: number,
  rows: number,
  width: number,
  height: number,
  amount: number,
  rnd: () => number,
): Array<[number, number]> {
  const cw = width / cols;
  const ch = height / rows;
  const pts: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pts.push([
        (c + 0.5 + jitter(rnd, 0.5 * amount)) * cw,
        (r + 0.5 + jitter(rnd, 0.5 * amount)) * ch,
      ]);
    }
  }
  return pts;
}

/**
 * Vogel spiral at the golden angle — the most even radial packing there is, and
 * the pattern phyllotaxis uses. For bursts and radial arrays, where a jittered
 * grid has no meaning and a linear spread reads as a fan rather than a bloom.
 */
export function vogelSpiral(n: number, radius: number): Array<[number, number]> {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const theta = i * golden;
    const r = radius * Math.sqrt((i + 0.5) / n);
    pts.push([r * Math.cos(theta), r * Math.sin(theta)]);
  }
  return pts;
}
