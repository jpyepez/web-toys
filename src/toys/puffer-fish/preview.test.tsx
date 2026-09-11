import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Preview } from './Preview';
import { palette } from './palette';

/**
 * Puffer Fish — Card preview-scene tests. `Preview` is the tiny inline SVG
 * miniature the Home Card carries above its title: a small window onto the live
 * Toy, drawn from SVG primitives only (ADR-0002) with every fill sourced from
 * the local reef `palette` (ADR-0004).
 *
 * The composition itself is deliberately NOT asserted: it is no longer authored
 * here at all, it comes out of `buildReef`, so pinning it would be pinning the
 * generator twice. What is asserted is the contract — decorative, drawn from
 * this Toy's own palette, carrying the real cast, and free of `stroke`.
 */

/** Every concrete colour an element paints. The structural `none` and `url(...)`
 * paint-server references are not colours, so they are excluded. */
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
    // The Card preview is a vignette, not an interactive element: the Card's
    // title and Link carry the semantic load, so it is `aria-hidden` and screen
    // readers skim straight past it.
    const { container } = render(<Preview />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the real Fish, not a simplified stand-in', () => {
    /*
     * The Card used to carry a hand-drawn `MiniFish` built from four
     * `<ellipse>`s and a `stroke`d smile — the exact construction the live
     * Critter was rebuilt away from, sitting on the Card that advertises it.
     * Simplifying the cast for a thumbnail is not a saving; it is the defect,
     * shrunk. It is now `FishFigure` itself, so the Card cannot drift.
     */
    const { container } = render(<Preview />);

    expect(container.querySelector('[data-fish-part="body"]')).not.toBeNull();
    expect(container.querySelector('[data-fish-part="eye"]')).not.toBeNull();
    expect(container.querySelectorAll('ellipse')).toHaveLength(0);
  });

  it('draws the scene the Toy actually paints, not a second drawing of it', () => {
    /*
     * THE REGRESSION THIS FILE EXISTS FOR.
     *
     * The Card is computed from `buildReef` with the shipped config and seed, so
     * it cannot contradict the live scene — it used to carry its own hand-placed
     * sand curve, its own single coral clump and its own ray, all maintained
     * beside the live scene by nobody.
     *
     * The cheapest honest proxy is path complexity. A hand-drawn miniature is a
     * handful of short `d` strings; a generated one carries hundreds of sampled
     * points per mass. If someone replaces this with a sketch again, this fails.
     */
    const { container } = render(<Preview />);

    const paths = [...container.querySelectorAll('path')];
    expect(paths.length).toBeGreaterThan(12);
    const longest = Math.max(...paths.map((p) => (p.getAttribute('d') ?? '').length));
    expect(longest, 'no generated geometry — the Card looks hand-drawn again').toBeGreaterThan(400);
  });

  it('sources every fill from the reef palette — no hardcoded colour, no foreign-palette leak', () => {
    // Every colour-bearing attribute across the whole vignette routes through
    // the local `palette`: no raw literals, no colour borrowed from another Toy.
    // A set-membership guard, so it survives tuning.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<Preview />);

    const elements = container.querySelectorAll('svg *');
    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      for (const colour of paletteColoursOf(el)) {
        expect(paletteValues).toContain(colour);
      }
    }
    // The gradient stops are colours too, and they sit on `stop-color` rather
    // than `fill`, so the loop above cannot see them.
    for (const stop of container.querySelectorAll('stop')) {
      expect(paletteValues).toContain(stop.getAttribute('stop-color'));
    }
  });

  it('contains no `stroke` — every line is a filled path', () => {
    // The house rule with the shortest distance between "written down" and
    // "broken". The old `MiniFish` smile was a stroke, and a uniform vector
    // stroke beside a filled variable-width contour is what makes a vignette
    // look like a different artist drew it.
    const { container } = render(<Preview />);

    expect(container.querySelectorAll('[stroke]')).toHaveLength(0);
    expect(container.querySelectorAll('[stroke-width]')).toHaveLength(0);
  });
});
