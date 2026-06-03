import { describe, it, expect } from 'vitest';
import { chrome, font, palette, timing } from './tokens';

describe('design tokens — palette', () => {
  it('exposes the meadow palette colours as HSL strings, named for what they paint', () => {
    // The polish PRD pinned six concrete dusk colours (sky upper, horizon
    // glow, grass silhouette, sheep wool, sheep silhouette, done-state glow);
    // mobile-rethink PRD's slice #02 added three more for the layered
    // backdrop (hill near, hill distant, scenery silhouette). The on-device
    // kid-handoff DoD then pivoted the atmospheric register from dusk to
    // daytime, adding `clouds` (cool bright white for the cloud cluster
    // that replaced the dusk's star scatter + half-moon). Names are
    // load-bearing through the pivot — the *values* shifted from dusk hues
    // to daytime hues, but every consumer (`MeadowBackdrop`, sheep recolour,
    // outro glow, hill silhouettes) still reaches by name. Tuples are
    // on-device-tuned per the slice DoD. `grassSilhouette` stays on the
    // list per slice #02 notes — no live consumer, kept for future
    // single-tone-grass Toys; same retire-but-keep pattern now applies to
    // `scenery` after the pivot (no live scenery LAYER, but the warm-brown
    // token still paints tree trunks and is available for future fences /
    // rooftops).
    expect(Object.keys(palette).sort()).toEqual(
      [
        'clouds',
        'doneGlow',
        'grassSilhouette',
        'hillDistant',
        'hillNear',
        'horizonGlow',
        'scenery',
        'sheepSilhouette',
        'sheepWool',
        'skyUpper',
      ].sort(),
    );
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^hsl\(/);
    }
  });

  it('exposes hillNear, hillDistant, and scenery as HSL strings — the layered-backdrop tokens', () => {
    // The mobile-rethink PRD's slice #02 introduces a layered flat-colour
    // meadow: two grass hills (foreground warmer green, distant deeper
    // blue-grey) and a mid-distance silhouette (treeline or cottage) in a
    // third token. These three new palette entries are the load-bearing
    // names every consumer (the rewritten `MeadowBackdrop`, plus any later
    // Toy that wants the same layered look) reaches for. Exact tuples are
    // tuned on-device per the slice DoD — the shape rule is just "HSL string",
    // mirroring the existing six dawn entries.
    expect(palette.hillNear).toMatch(/^hsl\(/);
    expect(palette.hillDistant).toMatch(/^hsl\(/);
    expect(palette.scenery).toMatch(/^hsl\(/);
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
