import { hex, type Oklch } from './art/oklch';

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
 * Ink — the Shell-owned neutral dark for editorial type on Card surfaces.
 * The Home Card frames every Toy identically (rounded slab, preview, title),
 * so the title's type colour is a Shell chrome primitive, not a scene colour
 * any one Toy owns. Per ADR-0004 it lives here alongside `chrome` / `card`
 * rather than being borrowed from the meadow palette's `sheepSilhouette`,
 * which kept the Card coupled to a single Toy's scene. The value sits in the
 * same warm dark register the Card title used before the move, but pulled
 * toward neutral (lower saturation than the meadow's warm-brown
 * `sheepSilhouette`) so it reads as editorial ink rather than a scene tint;
 * the *name* is load-bearing, the tuple is on-device-tunable per the slice DoD.
 */
export const ink = 'hsl(20 14% 20%)';

/**
 * Completion — the Shell-owned colours for the celebratory end moment (the
 * "You did it!" card surface, its type/controls, and the Confetti burst).
 * Completion is owned entirely by the Shell (ADR-0001) and framed identically
 * for every Toy, so these are cross-Toy Shell primitives — not meadow palette
 * keys the Completion borrows. Before slice #04 the Completion + Confetti
 * tinted themselves from the meadow `palette` (`sheepWool` / `sheepSilhouette`
 * / `horizonGlow` / `doneGlow`); when that palette moved into the Counting
 * Sheep folder (ADR-0004), the Shell-owned Completion couldn't reach into a
 * Toy's assets, so the values relocated here under Shell-primitive names. The
 * move is behaviour-preserving — same HSL tuples, new home + names (same
 * pattern as `ink` peeling the Card off the meadow palette in slice #02).
 *
 *   - `surface` — the cream slab the message + end-state ride (was `sheepWool`),
 *     also the cream text on the dark primary button.
 *   - `ink` — the dark editorial type + button fill/border (was
 *     `sheepSilhouette`). Distinct from the top-level `ink` (a more neutral
 *     dark for Card titles): this preserves the Completion's exact pre-move
 *     value; a future slice could unify the two darks if desired.
 *   - `spark` — the Confetti particle fills, a warm-light family (peachy
 *     horizon, golden bloom, cream — was `horizonGlow` / `doneGlow` /
 *     `sheepWool`). Cycled through the burst so it reads as a coherent
 *     warm wash rather than a single-colour shower.
 *
 * Exact tuples are on-device-tunable per the slice DoD; the names are
 * load-bearing.
 */
const completionSurface: Oklch = { l: 0.923, c: 0.028, h: 85 };

/**
 * Spark lightness. The sparks used to be peach, gold and CREAM — and the slab
 * they burst over is cream, so one particle was invisible against it and the
 * other two were within ΔL 0.07. The burst was painting behind the card at the
 * time, which hid the problem; raising it above the card exposed it. Held a
 * clear step below the surface so the celebration is legible against its own
 * card AND against a bright Toy backdrop.
 */
const SPARK_L = 0.74;
const SPARK_C = 0.14;

export const completion = {
  surface: hex(completionSurface),
  ink: hex({ l: 0.3, c: 0.033, h: 45 }),
  // Warm family — coral, amber, gold. One hue each, shared lightness and
  // chroma, the same sibling rule the Critter casts follow.
  spark: [
    hex({ l: SPARK_L, c: SPARK_C, h: 30 }),
    hex({ l: SPARK_L, c: SPARK_C, h: 65 }),
    hex({ l: SPARK_L, c: SPARK_C, h: 100 }),
  ],
  /** Exported so the contrast rule can be asserted rather than eyeballed. */
  surfaceLightness: completionSurface.l,
  sparkLightness: SPARK_L,
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
 * Chrome surface — the mute toggle and in-Toy Home control. A Shell chrome
 * primitive, independent of any Toy's scene palette (ADR-0004); the chrome
 * pill needs a translucent neutral that reads as low-contrast over any
 * backdrop (today's bright meadow, future Toys' scenes) without competing
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
  /**
   * The consistent paper surface every Card's chrome shares — the slab the
   * title footer rides and the fallback fill behind a Card with no preview.
   * A Shell chrome primitive (ADR-0004): the Card frames every Toy identically,
   * so its base surface is Shell-owned, NOT a per-Toy colour. Per-Toy identity
   * comes from the Toy's `tint` (the preview cover's stage backing) and the
   * preview scene itself — never from this surface, which stays the same across
   * the whole collection so the Cards read as one coherent set. A soft warm
   * near-white so the ink title reads as editorial type and the colourful
   * preview covers pop against it; on-device-tunable per the slice DoD.
   */
  surface: 'hsl(40 30% 97%)',
} as const;
