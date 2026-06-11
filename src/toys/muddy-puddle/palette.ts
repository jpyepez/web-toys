/**
 * The Muddy Puddle barnyard palette — this Toy's own scene + Critter colours,
 * owned locally per ADR-0004 (shared Shell modules expose only cross-Toy
 * primitives; each Toy ships its own scene assets). The shared `tokens.ts`
 * gains no barnyard keys — these names live here, with the Toy that paints them.
 *
 * Each entry is a concrete HSL value named for what it paints in the scene
 * (not for its hue), so consumers reference `palette.mud` rather than a raw
 * `'hsl(…)'`. Names are load-bearing; exact tuples are on-device-tuned per the
 * slice-level DoD — same pattern as the Puffer Fish ocean palette.
 *
 * Token-name semantics:
 *   - `sky`     — the open barnyard sky the whole scene sits in (also the
 *                 barnyard surface tint slice #08 backs the Home Card with)
 *   - `barn`    — the distant barn silhouette on the horizon
 *   - `fence`   — the distant fence silhouette flanking the barn
 *   - `grass`   — the bottom-anchored ground band the critters trot on
 *   - `mud`     — the earthy mud puddle in the lower third (its base) and the
 *                 mud blobs caked over each Critter (slice #03)
 *   - `puddle`  — the wet sheen on the mud puddle's surface (lighter than `mud`)
 *   - `sparkle` — the clean-snap sparkle + the puddle's glints
 *   - `pigletBody`     — the piglet Critter's smooth round body (pink)
 *   - `pigletSnout`    — the snout + inner-ear pink (deeper than the body); the
 *                        piglet's signature feature, analog of the fish's fin
 *   - `pigletCheek`    — the piglet's blushy cheeks (warmer than the body)
 *   - `pigletEye`      — dark ink for the eyes + the small smile stroke
 *   - `pigletEyeShine` — the white catchlight glint on the eyes (the cute
 *                        "alive & friendly" spark; matches the fish's eyeShine)
 *
 * The piglet colours land here now because slice #02 (the first Critter) needs
 * them; the other four animals' colours land additively in slice #05.
 */
export const palette = {
  sky: 'hsl(205 65% 80%)',
  barn: 'hsl(2 55% 52%)',
  fence: 'hsl(35 25% 88%)',
  grass: 'hsl(95 40% 62%)',
  mud: 'hsl(28 45% 32%)',
  puddle: 'hsl(28 38% 44%)',
  sparkle: 'hsl(50 100% 88%)',
  /**
   * Pink body; deeper-pink snout/ears; warm blush cheeks. The snout runs deeper
   * and more saturated than the body so the piglet's signature feature reads as
   * a distinct shape rather than blending into the body pink; the cheeks run
   * warmer again so the blush reads as its own kawaii feature.
   */
  pigletBody: 'hsl(345 65% 82%)',
  pigletSnout: 'hsl(345 60% 72%)',
  pigletCheek: 'hsl(350 80% 80%)',
  pigletEye: 'hsl(220 30% 24%)',
  pigletEyeShine: 'hsl(0 0% 100%)',
} as const;
