import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Preview } from './Preview';
import { palette } from './palette';

/**
 * Puffer Fish — Card preview-scene tests. `Preview` is the analog of Counting
 * Sheep's `Preview`: a tiny inline SVG miniature the Home Card carries above its
 * title — a small window onto the live Toy. Drawn from SVG primitives only
 * (ADR-0002), every fill sourced from the local ocean palette (slice #05), so
 * the Card art coheres with the live underwater scene + Critter.
 *
 * Visual coherence against the live Toy is on-device per the PRD's Testing
 * Decisions — what's jsdom-testable is the contract: it's a decorative
 * miniature underwater scene, it carries the round fish, and every colour
 * traces to the ocean palette (no hardcoded HSL, no meadow-palette leak). We
 * assert those, never the on-device-tuned geometry.
 */

/** Every concrete colour an element paints — its own `fill`/`stroke` when a
 * literal colour. The structural `none` (stroked-outline sentinel) and
 * `url(...)` paint-server references are not colours, so they're excluded.
 * Mirrors the helper in `underwater-backdrop.test.tsx`. */
function paletteColoursOf(el: Element): string[] {
  const colours: string[] = [];
  for (const attr of ['fill', 'stroke'] as const) {
    const value = el.getAttribute(attr);
    if (value === null || value === 'none' || value.startsWith('url(')) continue;
    colours.push(value);
  }
  return colours;
}

describe('Puffer Fish — Preview', () => {
  it('renders a decorative miniature SVG scene, hidden from screen readers', () => {
    // AC #3 (tracer): the Card preview is a tiny inline SVG vignette, not an
    // interactive element. Like the Sheep preview it carries no semantic load
    // (the Card's title + Link do) so it's `aria-hidden`, letting screen
    // readers skim straight past it. We assert the root SVG is present and
    // marked decorative; the on-device-tuned composition is not asserted here.
    const { container } = render(<Preview />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('carries the round fish — a circular body painted from the fish-body token', () => {
    // AC #3: the preview shows "the round fish". The Critter is addressed
    // structurally via the same `data-fish-part="body"` hook the live
    // `FishDrawing` uses, so the test stays decoupled from the miniature's
    // exact geometry. "Round" is the load-bearing silhouette contract (the
    // puffer is smooth and round in every state, never spiky), so we assert
    // the body is a `<circle>`, filled from the ocean palette's `fishBody`
    // token — the white round body, sourced from the Toy's own palette.
    const { container } = render(<Preview />);

    const body = container.querySelector('[data-fish-part="body"]');
    expect(body).not.toBeNull();
    expect(body!.tagName.toLowerCase()).toBe('circle');
    expect(body!.getAttribute('fill')).toBe(palette.fishBody);
  });

  it('is a miniature underwater scene — paints the water field from the ocean palette', () => {
    // AC #3: the vignette is a "miniature underwater scene", a *different
    // world* from the Sheep's meadow. The load-bearing trace is that it paints
    // the underwater water field from the ocean palette's `water` token — the
    // deep field the whole scene sits in. We assert the water colour is present
    // somewhere in the scene (set membership over every fill), mechanism-
    // agnostic: a flat water rect or a top-lit gradient both keep this green,
    // and either way the Card reads as water, not meadow.
    const { container } = render(<Preview />);

    const fills = new Set<string>();
    for (const el of container.querySelectorAll('svg *')) {
      for (const colour of paletteColoursOf(el)) fills.add(colour);
    }
    expect(fills).toContain(palette.water);
  });

  it('sources every fill from the ocean palette — no hardcoded HSL, no meadow-palette leak', () => {
    // AC #3: the preview is drawn "from SVG primitives, sourced from the ocean
    // palette" — so every colour-bearing attribute across the whole vignette
    // must route through the local ocean `palette`, no raw HSL strings and no
    // borrowed meadow colour. This is the scene-wide guard that generalises the
    // per-element traces above, mirroring the `UnderwaterBackdrop`'s same rule.
    // It keeps the Card art coherent with the Toy's own world and guards a
    // hardcoded colour slipping in when the miniature is tuned on-device.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<Preview />);

    const elements = container.querySelectorAll('svg *');
    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      for (const colour of paletteColoursOf(el)) {
        expect(paletteValues).toContain(colour);
      }
    }
  });
});
