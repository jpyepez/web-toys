/**
 * The Counting Sheep meadow palette — this Toy's own scene colours, owned
 * locally per ADR-0004 (shared Shell modules expose only cross-Toy primitives;
 * each Toy ships its own scene assets). Moved here from the shared `tokens.ts`
 * in slice #04: when Counting Sheep was the only Toy these names lived in the
 * Shell, but the meadow is a single Toy's scene, so its home is the Toy folder.
 *
 * Each entry is a concrete HSL value named for what it paints in the scene
 * (not for its hue), so consumers reference `palette.sheepWool` rather than
 * `'hsl(38 35% 90%)'`. Names are load-bearing; the move preserves both names
 * and values — only the home and import paths changed.
 *
 * Atmospheric register: **daytime, bright** (pivoted from the polish PRD's
 * original dusk palette + the mobile-rethink PRD's reinforcement of it). The
 * dusk → day pivot reversed both PRDs' original dusk intent (skyUpper at 22%
 * lightness, stars + moon, scenery cottage + treeline) under explicit sign-off
 * recorded in polish PRD slice #03/#07 Notes + mobile-rethink PRD slice #02
 * Notes. Names held across the reversal; values shifted to a daytime register.
 *
 * Token-name semantics that hold across the reversal:
 *   - `skyUpper` — the sky band, regardless of time-of-day
 *   - `hillNear` / `hillDistant` — the two hill planes, regardless of hue
 *   - `scenery` — warm-brown mid-distance accent (now: tree trunk)
 *   - `sheepWool` / `sheepSilhouette` — sheep + (formerly) Card-surface family
 *   - `clouds` — cool bright white for the daytime cloud cluster
 *   - `doneGlow` — warm-gold bloom during dismiss (sun-friendly already)
 *
 * Exact tuples remain on-device-tunable per the slice-level DoD.
 */
export const palette = {
  /**
   * Bright cyan-blue daytime sky (pivoted from the dusk 220°/22% value).
   * Reads as "sunny meadow" against the now-luminous hills + white clouds.
   * The Sheep stay in the warm-cream family (`sheepWool`) — separate register.
   */
  skyUpper: 'hsl(200 65% 70%)',
  horizonGlow: 'hsl(28 55% 78%)',
  grassSilhouette: 'hsl(160 18% 22%)',
  sheepWool: 'hsl(38 35% 90%)',
  sheepSilhouette: 'hsl(20 25% 22%)',
  doneGlow: 'hsl(42 95% 72%)',
  /**
   * The Sheep's face family — the slice that lifts the face from "two pale dots
   * on a dark head" to a cute, friendly lamb. The dark head (`sheepSilhouette`)
   * stays; these paint the features that read against it:
   *   - `muzzle`     — a soft cream snout patch low on the face, so the dark
   *                    eyes + smile read against the dark head (and drops the
   *                    features into the lower face per the baby-schema)
   *   - `eyeWhite`   — a bright cream eye base, lighter than the wool so the
   *                    eye pops as its own shape
   *   - `eyePupil`   — warm near-black for the big pupils + the smile stroke
   *                    (warm, not pure black, keeps it soft not harsh)
   *   - `eyeShine`   — the white catchlight glint; the single biggest
   *                    "alive & friendly" lever (vs. flat doll eyes)
   *   - `noseTip`    — a small dusty-rose nose
   * Exact tuples stay on-device-tunable per the slice DoD.
   */
  muzzle: 'hsl(36 40% 88%)',
  eyeWhite: 'hsl(40 45% 96%)',
  eyePupil: 'hsl(20 30% 14%)',
  eyeShine: 'hsl(0 0% 100%)',
  noseTip: 'hsl(345 45% 55%)',
  /**
   * Hill-near is a vibrant lime green (pivoted from the dusk muted meadow
   * tone). Doubles as the tree-canopy fill — the canopy silhouettes against
   * the cooler distant hill behind it, so reusing `hillNear` keeps the tree
   * anchored to the foreground-plane palette family without minting a token.
   *
   * Hill-distant is a teal-green mid-plane (pivoted from the cool blue-grey) —
   * still cooler than the foreground hill so depth holds, but in-family with
   * the daytime green register rather than the old dusk blue-grey.
   *
   * Scenery is a warm tree-trunk brown — the scenery LAYER concept (treeline /
   * cottage mid-distance silhouette) retired with the pivot, but the token
   * stays available as the warm-brown accent (tree trunks here; usable for
   * fences / rooftops in future scenes). Same retire-but-keep pattern as
   * `grassSilhouette`, which stays for any future single-tone-grass use.
   */
  hillNear: 'hsl(85 70% 55%)',
  hillDistant: 'hsl(150 45% 50%)',
  scenery: 'hsl(25 50% 35%)',
  /**
   * Cool bright white for the daytime cloud cluster. Separate from
   * `sheepWool` (warm cream) because the clouds want the cool-blue-tinted
   * bright white the reference image shows — luminous against the cyan sky
   * without competing with the warm sheep register.
   */
  clouds: 'hsl(200 40% 97%)',
} as const;
