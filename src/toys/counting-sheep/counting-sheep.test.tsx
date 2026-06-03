import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CountingSheep } from './CountingSheep';
import { palette } from '../../shell/tokens';

/**
 * Counting Sheep — backdrop + Sheep-palette tests that survive the
 * mobile-rethink slice #01 mechanic rewrite. The mechanic-level assertions
 * (one-Sheep-at-a-time, tap-advances-loop, re-tap safety, 5th-tap
 * `onComplete`, terminal `completed`) live in `counting-sheep-mechanic.test.tsx`
 * and exercise the state machine through fake timers + the public button
 * query. The polish PRD's slice-#04 per-Sheep done-state tests and the
 * slice-#05 group-Outro stagger tests are retired by the mobile-rethink PRD
 * (see `.work/issues/counting-sheep-mobile-rethink/01-…`, "Notes": those
 * tests "no longer map cleanly" and are rewritten in this slice).
 */
describe('Counting Sheep — scene + palette', () => {
  it('paints the sky as a solid skyUpper fill from the dawn palette tokens', () => {
    // The meadow reads as a place at dawn rather than a white page (slice
    // #03 intent). Original mechanism was a sky-upper → horizon-glow linear
    // gradient; on-device review in slice #07 revised the visual direction
    // toward "very few gradients" — sky becomes a solid fill from the same
    // dawn palette token. The load-bearing rule is unchanged (sky sources
    // from the dawn palette, single source of truth); only the mechanism
    // moved from two-stop gradient to solid skyUpper.
    const { container } = render(<CountingSheep onComplete={vi.fn()} />);

    const sky = container.querySelector('[data-meadow-layer="sky"]');
    expect(sky).not.toBeNull();
    expect(sky!.getAttribute('fill')).toBe(palette.skyUpper);
  });

  // The polish PRD's half-moon test (`data-meadow-layer="moon"` painted
  // from a palette token) retires with the on-device kid-handoff dusk →
  // day pivot. The moon was the dusk era's single atmospheric detail;
  // the daytime scene replaces it with a cloud-cluster scatter (asserted
  // by the cloud-count test below). Sanctioned-pivot pattern — same shape
  // as polish PRD slice #07's "grass-distant + grass-foreground share
  // grassSilhouette" test retiring when this PRD's slice #02 split the
  // two grass layers into hill-distant + hill-near, and the polish #07
  // serif → rounded-sans token rewrite earlier in this session.

  // The polish PRD's "layers two grass silhouettes" test (grass-distant +
  // grass-foreground both painted from `palette.grassSilhouette`) is
  // retired in the mobile-rethink PRD's slice #02 — the two grass layers
  // are replaced by `hill-distant` and `hill-near`, each from its own
  // dedicated token, and asserted by the two single-hill tests below.
  // The shared-grass-token rule is mechanically subsumed by "each hill
  // paints from its own token".
  it('paints a distant hill silhouette behind the scene from the hillDistant token', () => {
    // Layered-backdrop slice (mobile-rethink PRD, slice #02). The deepest
    // plane of the new flat-colour vignette: a distant hill silhouette
    // sitting behind the scenery and the foreground hill, in its own
    // cooler blue-grey token so the depth reads as a distinct plane
    // rather than a single grass tone. Structurally addressed via
    // `data-meadow-layer="hill-distant"`; fill traces to `palette.hillDistant`.
    const { container } = render(<CountingSheep onComplete={vi.fn()} />);

    const distantHills = container.querySelectorAll('[data-meadow-layer="hill-distant"]');
    expect(distantHills).toHaveLength(1);
    expect(distantHills[0].getAttribute('fill')).toBe(palette.hillDistant);
  });

  // The mid-distance scenery silhouette test (treeline / cottage in
  // `palette.scenery`) retires with the dusk → day pivot. The scenery
  // LAYER concept (mid-distance silhouette between the two hills) is
  // replaced by a single stylised tree — asserted by the tree-canopy +
  // tree-trunk tests below. The `palette.scenery` token itself stays on
  // the palette (now consumed by the tree trunk) per the retire-but-keep
  // pattern; the token's structural existence is asserted by the
  // tokens-module test, and its consumer test moves to the tree-trunk
  // assertion below.

  it('paints the foreground hill silhouette from the hillNear token', () => {
    // Frontmost ground plane of the layered backdrop (mobile-rethink PRD,
    // slice #02). The near hill silhouette overlaps the scenery and distant
    // hill so the scene reads as three planes of depth, painted in
    // `palette.hillNear`'s warmer green so the foreground reads as closer
    // and warmer than the cooler distant hill. Structurally addressed via
    // `data-meadow-layer="hill-near"`; the rule that retires with this slice
    // is "both grass layers share one token" — replaced with "each hill
    // paints from its own token", same structural shape, two tokens not one.
    const { container } = render(<CountingSheep onComplete={vi.fn()} />);

    const nearHill = container.querySelectorAll('[data-meadow-layer="hill-near"]');
    expect(nearHill).toHaveLength(1);
    expect(nearHill[0].getAttribute('fill')).toBe(palette.hillNear);
  });

  it('scatters three to four static cloud clusters across the upper sky, each painted from the clouds token', () => {
    // Atmospheric scatter for the daytime backdrop (mobile-rethink PRD slice
    // #02 with the kid-handoff DoD dusk → day pivot applied). Three-to-four
    // cloud clusters replace the retired 5–7 star scatter; each cluster is
    // a `<g data-meadow-layer="cloud">` wrapping circles + an ellipse, all
    // painted from `palette.clouds` (cool bright white, separate from
    // `sheepWool`'s warm cream). Static — no per-render jitter, no
    // animation; the polish PRD's out-of-scope rule against idle ambient
    // motion still binds. The structural assertion is the count band +
    // the clouds-token fill on each shape inside each cluster; exact
    // positions are tuned on-device per the slice DoD.
    const { container } = render(<CountingSheep onComplete={vi.fn()} />);

    const clouds = container.querySelectorAll('[data-meadow-layer="cloud"]');
    expect(clouds.length).toBeGreaterThanOrEqual(3);
    expect(clouds.length).toBeLessThanOrEqual(4);
    for (const cloud of clouds) {
      const shapes = cloud.querySelectorAll('circle, ellipse');
      expect(shapes.length).toBeGreaterThan(0);
      for (const shape of shapes) {
        expect(shape.getAttribute('fill')).toBe(palette.clouds);
      }
    }
  });

  it('paints the single tree canopy from the hillNear token', () => {
    // Single stylised tree on the foreground hill (dusk → day pivot). The
    // canopy reuses `palette.hillNear`'s vibrant lime so the tree stays
    // visually anchored to the foreground-plane palette family without
    // minting a separate token; it silhouettes against the cooler
    // `hillDistant` plane behind it, not against the hill it stands on.
    // Structurally addressed via `data-meadow-layer="tree-canopy"`; fill
    // traces to `palette.hillNear`. Exact circle radius + position is
    // tuned on-device per the slice DoD.
    const { container } = render(<CountingSheep onComplete={vi.fn()} />);

    const canopy = container.querySelectorAll('[data-meadow-layer="tree-canopy"]');
    expect(canopy).toHaveLength(1);
    expect(canopy[0].getAttribute('fill')).toBe(palette.hillNear);
  });

  it('paints the single tree trunk from the scenery token', () => {
    // The tree trunk is the live consumer of `palette.scenery` (warm
    // brown) after the dusk-era scenery LAYER concept (treeline / cottage)
    // retired with the day pivot. The token name + value semantic
    // ("warm-brown mid-distance accent") still holds; only the live
    // consumer narrowed from a silhouette path to a tree-trunk rect.
    // Structurally addressed via `data-meadow-layer="tree-trunk"`.
    const { container } = render(<CountingSheep onComplete={vi.fn()} />);

    const trunk = container.querySelectorAll('[data-meadow-layer="tree-trunk"]');
    expect(trunk).toHaveLength(1);
    expect(trunk[0].getAttribute('fill')).toBe(palette.scenery);
  });

  it('paints wool from the sheep-wool token and silhouette parts from the sheep-silhouette token', () => {
    // The polish PRD's headline acceptance criterion for slice #04: every fill
    // in the Sheep components routes through the design-tokens module, no
    // hardcoded colour strings. Structural pieces are labelled via
    // `data-sheep-part` so tests address wool / head / ears / legs without
    // coupling to which SVG primitive each one happens to be. Under the new
    // mechanic only the current Sheep is on stage, so the part-counts are
    // smaller (one wool group, one head, two ears, two legs) — but the rule
    // is unchanged: every part with a fill traces back to a palette token.
    const { container } = render(<CountingSheep onComplete={vi.fn()} />);

    const wool = container.querySelectorAll('[data-sheep-part="wool"]');
    const heads = container.querySelectorAll('[data-sheep-part="head"]');
    const ears = container.querySelectorAll('[data-sheep-part="ear"]');
    const legs = container.querySelectorAll('[data-sheep-part="leg"]');

    expect(wool.length).toBeGreaterThan(0);
    expect(heads.length).toBeGreaterThan(0);
    expect(ears.length).toBeGreaterThan(0);
    expect(legs.length).toBeGreaterThan(0);

    for (const w of wool) expect(w.getAttribute('fill')).toBe(palette.sheepWool);
    for (const h of heads) expect(h.getAttribute('fill')).toBe(palette.sheepSilhouette);
    for (const e of ears) expect(e.getAttribute('fill')).toBe(palette.sheepSilhouette);
    for (const l of legs) expect(l.getAttribute('fill')).toBe(palette.sheepSilhouette);
  });
});
