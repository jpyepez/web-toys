/**
 * Design tokens — the project's single source of truth for the meadow
 * palette. Each entry is a concrete HSL value named for what it paints in
 * the scene (not for its hue), so consumers reference `palette.sheepWool`
 * rather than `'hsl(38 35% 90%)'`.
 *
 * Atmospheric register: **daytime, bright** (pivoted from the polish PRD's
 * original dusk palette + the mobile-rethink PRD's reinforcement of it).
 * On-device review during the kid-handoff DoD surfaced "palette is kinda
 * lame" with a reference image showing a bright sunny meadow — luminous
 * cyan-blue sky, vibrant lime hills, fluffy white clouds, one stylised
 * tree. Both PRDs' dusk intent (skyUpper at 22% lightness, stars + moon,
 * scenery cottage + treeline) reversed under explicit sign-off; reversal
 * recorded in polish PRD slice #03/#07 Notes + mobile-rethink PRD slice
 * #02 Notes. Names are load-bearing; values shifted to a daytime register.
 *
 * Token-name semantics that hold across the reversal:
 *   - `skyUpper` — the sky band, regardless of time-of-day
 *   - `hillNear` / `hillDistant` — the two hill planes, regardless of hue
 *   - `scenery` — warm-brown mid-distance accent (now: tree trunk)
 *   - `sheepWool` / `sheepSilhouette` — sheep + Card-surface family
 *   - `clouds` (new) — cool bright white for the daytime cloud cluster
 *   - `doneGlow` — warm-gold bloom during dismiss (sun-friendly already)
 *
 * Exact tuples remain on-device-tunable per the slice-level DoD.
 */
export const palette = {
  /**
   * Bright cyan-blue daytime sky (pivoted from the dusk 220°/22% value).
   * Reads as "sunny meadow" against the now-luminous hills + white clouds.
   * The Sheep + Card surfaces stay in the warm-cream family
   * (`sheepWool`) — separate register, surface-token not scene-token.
   */
  skyUpper: 'hsl(200 65% 70%)',
  horizonGlow: 'hsl(28 55% 78%)',
  grassSilhouette: 'hsl(160 18% 22%)',
  sheepWool: 'hsl(38 35% 90%)',
  sheepSilhouette: 'hsl(20 25% 22%)',
  doneGlow: 'hsl(42 95% 72%)',
  /**
   * Hill-near is a vibrant lime green (pivoted from the dusk 115°/38%/38%
   * muted meadow tone). Doubles as the tree-canopy fill — tree canopy
   * silhouettes against the cooler distant hill behind it, so reusing
   * `hillNear` for the canopy keeps the tree visually anchored to the
   * foreground-plane palette family without minting a separate token.
   *
   * Hill-distant is a teal-green mid-plane (pivoted from the cool
   * blue-grey 215°/18%/32%) — still cooler than the foreground hill so
   * depth holds, but in-family with the new daytime green register
   * rather than the old dusk blue-grey.
   *
   * Scenery is a warm tree-trunk brown — the scenery LAYER concept
   * (treeline / cottage mid-distance silhouette) retires with this
   * pivot, but the token itself stays available as the warm-brown
   * accent (tree trunks here; usable for fences / rooftops in future
   * Toys). Same retire-but-keep pattern as `grassSilhouette`.
   *
   * `grassSilhouette` stays on the palette — kept available for any
   * future Toy that wants a single-tone grass register.
   */
  hillNear: 'hsl(85 70% 55%)',
  hillDistant: 'hsl(150 45% 50%)',
  scenery: 'hsl(25 50% 35%)',
  /**
   * Cool bright white for the daytime cloud cluster. Separate from
   * `sheepWool` (which is warm cream, 38°/35%/90%) because the Card +
   * Completion surfaces consume `sheepWool` and want to stay warm-cream
   * — only the scene's clouds want the cool-blue-tinted bright white
   * the reference image shows. Reads as luminous against the cyan sky
   * without competing with the warm sheep + card register.
   */
  clouds: 'hsl(200 40% 97%)',
} as const;

/**
 * Type stack — rounded sans-serif. Replaces the editorial serif the polish
 * PRD's slice #07 originally pinned ("system serif only"). Reversal recorded
 * in that slice's Notes: the mobile-rethink PRD's on-device kid-handoff DoD
 * surfaced "kinda odd / wrong register" — Iowan Old Style / Palatino read
 * as a grown-up editorial book, not a tap-the-critter toy. Children's-app
 * convention (Khan Academy Kids, Sesame Workshop, PBS Kids, Toca Boca,
 * Endless Alphabet) lands unambiguously on rounded or humanist sans;
 * editorial serif appears only in storybook read-along apps, which is the
 * opposite frame from a phone-first toy shell.
 *
 * `ui-rounded` lights up SF Pro Rounded on iOS Safari (system-wide since
 * iOS 15) — the strongest single visual upgrade available without
 * bundling a webfont, which the polish PRD's "no custom fonts" out-of-scope
 * rule still bars. Chrome on Android doesn't implement `ui-rounded` so the
 * chain falls through to Roboto via `sans-serif` — humanist, friendly
 * enough, not rounded; that's the honest platform trade-off, and still
 * warmer than the editorial serif it replaces. Windows installations hit
 * Arial Rounded MT Bold as a serviceable rounded fallback. macOS Safari
 * picks up `ui-rounded` too.
 */
export const font = {
  rounded:
    "ui-rounded, 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', " +
    "'Arial Rounded MT Bold', 'Arial Rounded MT', system-ui, sans-serif",
} as const;

/**
 * Animation primitives — the easings and durations consumers share so the
 * whole app moves with a coherent register. `tap` lands first as the chrome
 * pill's tap-feedback ease; later slices (Outro stagger, dawn-wash gradient,
 * Card scale-down) add their own named entries here rather than inlining
 * cubic-bezier strings. Soft ease-out keeps presses feeling cushioned
 * rather than mechanical — the right register for a 3-4 year old's tap.
 *
 * `tap` is the CSS-string form (consumed by `transition: transform ... ${tap}`
 * in the chrome pill); `tapCurve` is the same curve in Motion's API shape
 * (a four-number cubic-bezier tuple). Two forms of one decision — Card's
 * Motion `whileTap` ease can't take the CSS string, so it consumes the
 * tuple. The numbers are kept literal in one place rather than parsed at
 * runtime from the string.
 */
export const timing = {
  tap: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  tapCurve: [0.2, 0.8, 0.2, 1] as const,
  /**
   * Slide-in / slide-out ease for the Counting Sheep arrival + exit
   * choreography (mobile-rethink PRD, slice #01). Mirrors `tapCurve`'s
   * Motion-API tuple shape — Motion's `transition.ease` consumes
   * `[x1, y1, x2, y2]` directly. A soft cushioned curve so the Sheep
   * settles in centre rather than skidding to a stop. Exact tuple is
   * on-device-tuned per the slice DoD; the value below is a coherent
   * cushioned-ease-out placeholder that holds its semantic ground
   * until the kid handoff confirms or revises it.
   */
  entrance: [0.22, 1, 0.36, 1] as const,
} as const;

/**
 * Chrome surface — the mute toggle and in-Toy Home control. Kept separate
 * from `palette` so the dawn six stay pure to the meadow scene; the chrome
 * pill needs a translucent neutral that reads as low-contrast over any
 * backdrop (today's white meadow, slice #03's dawn wash) without competing
 * with the Toy. The radius is generous enough to read as "pill, not button".
 */
export const chrome = {
  pillBg: 'hsla(220, 30%, 18%, 0.18)',
  pillRadius: '999px',
} as const;

/**
 * Home Card surface — corner radius, shadow, and tap-scale shared across
 * every Toy's Card. Sits beside `chrome` (mute / Home pills) rather than
 * inside it: the chrome wants a low-contrast translucent neutral; a Card
 * wants a generously-rounded, softly-shadowed editorial slab. The values
 * are on-device-tuned (per the slice DoD) — names are load-bearing.
 *
 * `tapScale` is the destination scale of the gentle tap-feedback the
 * slice spec calls for; consumers feed it into a `whileTap` / CSS
 * `:active` transform that uses `timing.tap` as its ease.
 */
export const card = {
  radius: '24px',
  shadow: '0 12px 28px hsla(220, 30%, 18%, 0.18)',
  tapScale: 0.97,
} as const;
