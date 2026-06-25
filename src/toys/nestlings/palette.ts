/**
 * The Nestlings dusk palette — this Toy's own scene + Critter colours, owned
 * locally per ADR-0004 (shared Shell modules expose only cross-Toy primitives;
 * each Toy ships its own scene assets). The shared `tokens.ts` gains no
 * nestlings keys — these names live here, with the Toy that paints them.
 *
 * Each entry is a concrete HSL value named for what it paints in the scene (not
 * for its hue), so consumers reference `palette.nest` rather than a raw
 * `'hsl(…)'`. Names are load-bearing; exact tuples are on-device-tuned per the
 * slice-level DoD — same pattern as the balloons / barnyard / ocean palettes.
 *
 * Token-name semantics — the dusk scene:
 *   - `sky`     — the upper, representative dusk-sky tone the whole scene sits
 *                 in; also the tone the Home Card backs its preview with (the
 *                 Card `tint`, slice #8, IS `palette.sky` — declared by this
 *                 token existing, not a separate export, matching the
 *                 fish/puddle/balloon tint→color-string contract)
 *   - `skyDeep` — the deeper dusk tone at the top of the sky gradient; the band
 *                 the slice #5 Outro deepens the whole sky toward as night falls
 *   - `ground`  — the low, bottom-anchored dusk ground band (ADR-0005)
 *   - `branch`  — the tree/branch anchoring the lower third the nest rests in
 *   - `nest`    — the single empty woven nest: the drop target + diegetic
 *                 progress meter the sleepy pile grows in (slices #3 onward)
 *   - `sparkle` — the star/sparkle glint the slice #5 Outro twinkles into the
 *                 deepening sky (the token exists now; stars are painted then)
 *
 * Fledgling Critter colours — five VISUALLY DISTINCT songbird species for
 * variety (PRD), each carrying its own body / wing / beak so slice #2 can draw
 * the cast. There is no hidden identity/reveal — the species only give the set
 * variety; the play is the carrying and the nestling-in, not "who is it":
 *   - `robin*` / `bluebird*` / `sparrow*` / `wren*` / `goldfinch*`
 *     — each `*Body` (the breast/belly fill), `*Wing` (the folded wing + back),
 *       and `*Beak` (the small beak). Slice #2 may add to these additively if
 *       the art needs shared face colours (the Muddy Puddle / Balloons cast
 *       precedent — eyes/blush are not load-bearing scenery here).
 */
export const palette = {
  // Dusk scene
  sky: 'hsl(250 40% 58%)',
  skyDeep: 'hsl(255 45% 36%)',
  ground: 'hsl(150 22% 26%)',
  branch: 'hsl(25 33% 30%)',
  nest: 'hsl(35 45% 42%)',
  sparkle: 'hsl(50 100% 90%)',

  // Woven-nest depth (slice-#1 nest glow-up): the dark cup hollow + under-rim
  // shadow that give the bowl volume, and the lighter strand highlight the woven
  // twigs catch — so the nest reads as woven and cradling, not a flat ellipse.
  nestShadow: 'hsl(28 40% 24%)',
  nestRim: 'hsl(38 52% 56%)',

  // Shared Critter face vocabulary (the cast's cuteness levers — eyes/blush are
  // not load-bearing scenery, so they live here per the slice-#2 note and the
  // balloons/piglet/fish precedent). The eye-ink + catchlight tuples converge
  // with the rest of the cast (`hsl(220 30% 24%)` / pure white); the warm cheek
  // and pale belly read across every species, the foot is a soft twig-brown.
  birdEye: 'hsl(220 30% 24%)',
  birdEyeShine: 'hsl(0 0% 100%)',
  birdCheek: 'hsl(350 80% 80%)',
  birdBelly: 'hsl(40 50% 92%)',
  birdFoot: 'hsl(32 45% 38%)',

  // Five distinct fledgling species — body / wing / beak each (variety, no
  // identity per the PRD).
  robinBody: 'hsl(15 60% 56%)',
  robinWing: 'hsl(28 26% 38%)',
  robinBeak: 'hsl(45 32% 30%)',

  bluebirdBody: 'hsl(210 58% 60%)',
  bluebirdWing: 'hsl(215 55% 44%)',
  bluebirdBeak: 'hsl(35 38% 34%)',

  sparrowBody: 'hsl(32 34% 56%)',
  sparrowWing: 'hsl(28 40% 40%)',
  sparrowBeak: 'hsl(40 26% 30%)',

  wrenBody: 'hsl(25 46% 48%)',
  wrenWing: 'hsl(22 42% 34%)',
  wrenBeak: 'hsl(38 30% 32%)',

  goldfinchBody: 'hsl(50 85% 62%)',
  goldfinchWing: 'hsl(45 30% 32%)',
  goldfinchBeak: 'hsl(35 36% 34%)',
} as const;
