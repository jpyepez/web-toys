/**
 * The Puffer Fish ocean palette — this Toy's own scene + Critter colours,
 * owned locally per ADR-0004 (shared Shell modules expose only cross-Toy
 * primitives; each Toy ships its own scene assets). The shared `tokens.ts`
 * gains no fish keys — these names live here, with the Toy that paints them.
 *
 * Each entry is a concrete HSL value named for what it paints in the scene
 * (not for its hue), so consumers reference `palette.fishBody` rather than a
 * raw `'hsl(…)'`. Names are load-bearing; exact tuples are on-device-tuned
 * per the slice-level DoD — same pattern as the sheep meadow palette.
 *
 * Token-name semantics:
 *   - `water`        — the deep underwater field the whole scene sits in
 *   - `waterSurface` — the lighter, top-lit shade the water grades toward near
 *                      the surface (added slice #06; the backdrop's water layer
 *                      runs `waterSurface` at the top → `water` at depth)
 *   - `lightRay` — the god-ray shafts filtering down from the surface
 *   - `coral`    — coral / reef accent colour on the seabed
 *   - `sand`     — the seabed floor
 *   - `bubble`   — drifting bubbles
 *   - `fishBody`  — the Critter's smooth round body (white)
 *   - `fishFin`   — fins + tail (pink) — the tail shares the fin token
 *   - `fishCheek` — the puffer's blushy cheeks (pink, warmer than the fins)
 *   - `fishEye`   — dark ink for the large eyes + the small smile stroke
 */
export const palette = {
  water: 'hsl(200 70% 42%)',
  waterSurface: 'hsl(195 75% 68%)',
  lightRay: 'hsl(190 80% 75%)',
  coral: 'hsl(8 75% 65%)',
  sand: 'hsl(45 55% 78%)',
  bubble: 'hsl(195 60% 90%)',
  /**
   * White body; pink fins/tail/cheeks. The cheeks run a touch warmer and more
   * saturated than the fins so the blush reads as a distinct kawaii feature
   * rather than blending into the fin pink.
   */
  fishBody: 'hsl(195 30% 97%)',
  fishFin: 'hsl(340 75% 80%)',
  fishCheek: 'hsl(350 85% 78%)',
  fishEye: 'hsl(210 35% 22%)',
} as const;
