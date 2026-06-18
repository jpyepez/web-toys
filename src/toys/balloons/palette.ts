/**
 * The Balloons sky palette — this Toy's own scene + Critter colours, owned
 * locally per ADR-0004 (shared Shell modules expose only cross-Toy primitives;
 * each Toy ships its own scene assets). The shared `tokens.ts` gains no balloon
 * keys — these names live here, with the Toy that paints them.
 *
 * Each entry is a concrete HSL value named for what it paints in the scene (not
 * for its hue), so consumers reference `palette.sky` rather than a raw
 * `'hsl(…)'`. Names are load-bearing; exact tuples are on-device-tuned per the
 * slice-level DoD — same pattern as the barnyard / ocean palettes.
 *
 * Token-name semantics:
 *   - `sky`     — the deliberately TALL open sky the whole scene sits in and the
 *                 balloons rise/gather into (also the sky tone slice #08 backs
 *                 the Home Card with — the Card `tint` IS `palette.sky`)
 *   - `cloud`   — a soft cloud or two drifting in the tall sky
 *   - `grass`   — the bottom-anchored grassy rise the peg stands on
 *   - `peg`     — the low peg/fence in the lower third the balloons are tied to
 *   - `string`  — the thin string tying each balloon down to the peg (slice #2/#3)
 *   - `sparkle` — small glints in the sky / on the balloons (slice #2 onward)
 *
 * Balloon Critter colours — five DISTINCT body colours for variety. Unlike the
 * Muddy Puddle cast there is no hidden identity/reveal (PRD), so the balloons
 * differ only by body colour and are indexed rather than named for a hue:
 *   - `balloon1`…`balloon5` — the five balloon body fills
 *
 * The face is uniform across all five (only the body colour varies), drawn from
 * shared face colours its sad→happy expression reuses (the expression changes by
 * SHAPE, not colour — slice #2). Slice #2 may add to these additively if the art
 * needs more, the established Muddy Puddle cast precedent:
 *   - `faceInk`   — dark ink for the eyes + the sad/happy mouth stroke
 *   - `faceShine` — the white catchlight glint on the eyes (the "alive" spark)
 *   - `cheek`     — the happy blush that appears as a balloon fills
 */
export const palette = {
  sky: 'hsl(205 80% 78%)',
  cloud: 'hsl(205 40% 97%)',
  grass: 'hsl(100 42% 60%)',
  peg: 'hsl(30 35% 50%)',
  string: 'hsl(35 20% 40%)',
  sparkle: 'hsl(50 100% 88%)',

  // Five distinct balloon body colours — variety, no identity (PRD).
  balloon1: 'hsl(2 75% 66%)',
  balloon2: 'hsl(210 70% 64%)',
  balloon3: 'hsl(48 85% 64%)',
  balloon4: 'hsl(140 45% 58%)',
  balloon5: 'hsl(280 50% 70%)',

  // Shared face colours — every balloon's sad→happy face is drawn from these;
  // the expression changes by shape, not colour.
  faceInk: 'hsl(220 30% 24%)',
  faceShine: 'hsl(0 0% 100%)',
  cheek: 'hsl(350 80% 80%)',
} as const;
