import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Preview } from './Preview';
import { palette } from './palette';

/**
 * Tuck-In (Nestlings) — Card preview-scene tests. `Preview` is the analog of the
 * other Toys' `Preview`: a tiny inline SVG miniature the Home Card carries above
 * its title — a small window onto the live Toy. Drawn from SVG primitives only
 * (ADR-0002), every fill sourced from the local dusk `palette` (slice #1), so the
 * Card art coheres with the live dusk scene + cast.
 *
 * Per this slice's Notes the preview is on-device-tuned: we deliberately do NOT
 * assert its colours' tuples or its geometry (where the bird sits in the nest, how
 * it's drawn). What stays jsdom-testable is the contract — it's a decorative
 * miniature (carries no semantic load, the Card's title + Link do), and every
 * colour-bearing attribute routes through the dusk `palette` (no raw HSL, no
 * foreign-palette leak). We assert those, never the tuned tuples.
 */

/** Every concrete colour an element paints — its own `fill`/`stroke` when a
 * literal colour. The structural `none` (stroked-outline sentinel) and
 * `url(...)` paint-server references are not colours, so they're excluded.
 * Mirrors the helper in `balloons/preview.test.tsx`. */
function paletteColoursOf(el: Element): string[] {
  const colours: string[] = [];
  for (const attr of ['fill', 'stroke'] as const) {
    const value = el.getAttribute(attr);
    if (value === null || value === 'none' || value.startsWith('url(')) continue;
    colours.push(value);
  }
  return colours;
}

describe('Tuck-In — Preview', () => {
  it('renders a decorative miniature SVG scene, hidden from screen readers', () => {
    // AC #3 (tracer): the Card preview is a tiny inline SVG vignette, not an
    // interactive element. Like the Sheep/Fish/Puddle/Balloons previews it carries
    // no semantic load (the Card's title + Link do) so it's `aria-hidden`, letting
    // screen readers skim straight past it. We assert the root SVG is present and
    // marked decorative; the on-device-tuned composition is not asserted here.
    const { container } = render(<Preview />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the nestled bird Critter, tagged with the live data-bird-part hook', () => {
    // AC #3 (preview): the vignette teases the Toy's *activity* by drawing its own
    // Critter — a songbird nestled in. It carries the SAME `data-bird-part="body"`
    // structural hook the live `BirdDrawing` uses, so the Home wiring test can find
    // the Critter inside the Card without coupling to the on-device-tuned geometry
    // (mirrors the balloons preview's `data-balloon-part="body"`). We assert the
    // hook is present, not where the bird sits or how it's drawn.
    const { container } = render(<Preview />);

    expect(container.querySelector('[data-bird-part="body"]')).not.toBeNull();
  });

  it('sources every fill from the dusk palette — no hardcoded HSL, no foreign-palette leak', () => {
    // AC #5 / ADR-0002: the preview is drawn "from this Toy's primitives/palette"
    // — so every colour-bearing attribute across the whole vignette must route
    // through the local dusk `palette`, no raw HSL strings and no borrowed colour
    // from another Toy. This is a set-membership guard (colours come FROM the
    // palette), not an assertion of which on-device-tuned tuples are used — it
    // survives tuning because the palette is the single source of truth, the same
    // scene-wide rule `DuskBackdrop` and the other Toys' previews carry. It keeps
    // the Card art coherent with the Toy's own world and catches a hardcoded
    // colour slipping in when the miniature is tuned on-device.
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
