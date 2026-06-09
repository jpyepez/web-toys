import { describe, it, expect } from 'vitest';
import { chrome, completion, font, ink, timing } from './tokens';

describe('design tokens — ink', () => {
  it('exposes a Shell-owned neutral ink for editorial type', () => {
    // ADR-0004: shared Shell modules expose cross-Toy primitives; per-Toy
    // scene colours live with the Toy. The Card title is Shell chrome (it
    // frames every Toy's Card the same way), so its type colour is a Shell
    // primitive — `ink` — not a meadow palette key the Card has to borrow.
    // This peeled the Card off the meadow palette ahead of the palette move
    // (slice #04), which relocated the meadow palette into the Counting Sheep
    // folder entirely — so the shared module no longer carries a meadow
    // palette to assert against here (AC #5). Shape rule: an HSL string; the
    // exact tuple is on-device-tuned per the slice DoD, so we pin the shape.
    expect(ink).toMatch(/^hsl\(/);
  });
});

describe('design tokens — completion', () => {
  it('exposes a Shell-owned celebration token group, separate from any Toy palette', () => {
    // ADR-0004: the Completion flourish (the celebratory end-beat + its
    // Confetti burst) is owned by the Shell (ADR-0001), so its surface, type,
    // and particle colours are cross-Toy Shell primitives — not meadow palette
    // keys the Completion has to borrow. Slice #04 moved the meadow palette
    // into the Counting Sheep folder; the Shell-owned Completion can't reach
    // into a Toy's assets, so it sources from this group instead. Same spirit
    // as `ink` (slice #02) peeling the Card off the meadow palette. Values are
    // HSL strings, on-device-tunable per the slice DoD — we pin the shape:
    // a cream `surface`, a dark `ink`, and a non-empty `spark` list of warm
    // particle fills. `completion` being its own export (not a key on the
    // meadow `palette`) is the load-bearing "Shell-owned" assertion.
    expect(completion.surface).toMatch(/^hsl\(/);
    expect(completion.ink).toMatch(/^hsl\(/);
    expect(Array.isArray(completion.spark)).toBe(true);
    expect(completion.spark.length).toBeGreaterThan(0);
    for (const fill of completion.spark) {
      expect(fill).toMatch(/^hsl\(/);
    }
  });
});

describe('design tokens — chrome', () => {
  it('exposes the soft pill background + corner radius the mute and Home chrome share', () => {
    // The dawn palette is reserved for the atmospheric scene (sky / grass /
    // sheep / glow); the chrome buttons need their own low-contrast pill
    // surface that sits over any backdrop without competing with it. Keeping
    // these two values on a separate `chrome` namespace makes the palette's
    // six entries stay semantically pure to the meadow.
    expect(chrome.pillBg).toMatch(/^(hsl|hsla|rgb|rgba)\(/);
    expect(chrome.pillRadius).toMatch(/^\d/);
  });
});

describe('design tokens — timing', () => {
  it('exposes a `tap` ease so chrome microinteractions share one easing curve', () => {
    // The Outro choreography and Card tap-feedback slices will add their own
    // named entries on this same `timing` object (per PRD Further Notes:
    // "Animation primitives left for implementation time"). This slice ships
    // the first concrete consumer of the namespace — the chrome pill's tap
    // response — so the ease lands here as a cubic-bezier-shaped string and
    // becomes the precedent every later timing entry follows.
    expect(timing.tap).toMatch(/cubic-bezier\(/);
  });

  it('exposes an `entrance` ease as a four-number cubic-bezier tuple, mirroring `tapCurve`', () => {
    // The mobile-rethink PRD's slice #01 introduces a per-Sheep arrival /
    // exit choreography (slide-in from the left, hop, slide-off to the right)
    // and pins its Motion `ease` on this `timing.entrance` entry. Like
    // `tapCurve` the value is the Motion-API four-number tuple form (a
    // cubic-bezier as `[x1, y1, x2, y2]`), not the CSS string form, because
    // Motion's `transition.ease` consumes the tuple and we'd rather keep the
    // numbers literal in one place than parse a string at runtime. Exact
    // values are tuned on-device per the slice DoD — the *shape* is the
    // load-bearing rule.
    expect(Array.isArray(timing.entrance)).toBe(true);
    expect(timing.entrance).toHaveLength(4);
    for (const n of timing.entrance) {
      expect(typeof n).toBe('number');
      expect(Number.isFinite(n)).toBe(true);
    }
  });
});

describe('design tokens — font', () => {
  it('exposes a rounded-sans stack so Cards + Completion can render kid-warm type without bundling a webfont', () => {
    // PRD out-of-scope rule unchanged: no custom fonts, no `@font-face` — the
    // token still lists only platform-installed faces. What *did* change is
    // the polish PRD's "system serif only" decision (slice #07), reversed
    // during the mobile-rethink PRD's on-device kid-handoff DoD: the
    // editorial serif read as "kinda odd / wrong register" on phone,
    // children's-app convention lands on rounded/humanist sans. The token's
    // contract is now "a rounded-sans stack ending in a generic sans-serif
    // fallback" — the structural rule (single platform-only string in tokens,
    // no `@font-face`) holds; the *value* moved from serif → rounded. The
    // value-side test below pins `ui-rounded` first (the iOS Safari payoff)
    // and `sans-serif` as the tail-of-chain fallback (the structural marker
    // that the stack is sans-family, not serif).
    expect(typeof font.rounded).toBe('string');
    expect(font.rounded.length).toBeGreaterThan(0);
    expect(font.rounded).toMatch(/ui-rounded/);
    expect(font.rounded).toMatch(/sans-serif$/);
  });
});
