import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Preview } from './Preview';
import { palette } from './palette';

/**
 * Counting Sheep — Card preview-scene tests. `Preview` is the tiny inline SVG
 * miniature the Home Card carries above its title: a small window onto the live
 * Toy, drawn from SVG primitives only (ADR-0002) with every fill sourced from the
 * local meadow `palette` (ADR-0004).
 *
 * This Toy was the only one of the five without such a file, which is part of why
 * its Card was free to drift off the scene it advertises — while the live meadow
 * was being rebuilt, the vignette kept showing a fat plank of a bough with lumpy
 * leaf blobs and a sun floating clear of every edge, and nothing failed.
 *
 * The composition itself is deliberately NOT asserted: it is no longer authored
 * here at all, it comes out of `buildMeadow`, so pinning it would be pinning the
 * generator twice. What is asserted is the contract — decorative, drawn from this
 * Toy's own palette, carrying the cast, and free of `stroke`.
 */

/** Every concrete colour an element paints. The structural `none` and `url(...)`
 * paint-server references are not colours, so they are excluded. Mirrors the
 * helper in `balloons/preview.test.tsx` and `nestlings/preview.test.tsx`. */
function paletteColoursOf(el: Element): string[] {
  const colours: string[] = [];
  for (const attr of ['fill', 'stroke'] as const) {
    const value = el.getAttribute(attr);
    if (value === null || value === 'none' || value.startsWith('url(')) continue;
    colours.push(value);
  }
  return colours;
}

describe('Counting Sheep — Preview', () => {
  it('renders a decorative miniature SVG scene, hidden from screen readers', () => {
    // The Card preview is a vignette, not an interactive element: the Card's
    // title and Link carry the semantic load, so it is `aria-hidden` and screen
    // readers skim straight past it.
    const { container } = render(<Preview />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the Sheep, tagged with the live data-sheep-part hook', () => {
    // The vignette teases the Toy's activity by drawing its own Critter, and it
    // carries the SAME structural hook the live `SheepDrawing` uses — so the Card
    // can be checked for its cast without coupling to the tuned geometry.
    const { container } = render(<Preview />);

    expect(container.querySelector('[data-sheep-part="wool"]')).not.toBeNull();
  });

  it('draws the scene the Toy actually paints, not a second drawing of it', () => {
    /*
     * THE REGRESSION THIS FILE EXISTS FOR.
     *
     * The Card is computed from `buildMeadow` with the shipped config and seed,
     * so it cannot contradict the live scene. Asserting that structurally rather
     * than by eye: the vignette must carry the elements the generator emits for
     * a Card-shaped frame — a cropped bough, a walking line, grass and blooms —
     * and it must NOT go back to being a hand-drawn stand-in.
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

  it('sources every fill from the meadow palette — no hardcoded colour, no foreign-palette leak', () => {
    // Every colour-bearing attribute across the whole vignette routes through the
    // local `palette`: no raw literals, no colour borrowed from another Toy. A
    // set-membership guard, so it survives tuning — the palette is the single
    // source of truth, the same scene-wide rule `MeadowBackdrop` carries.
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
    // "broken". SVG has no variable-width stroke, so a uniform one reads as a
    // different line language from the cast's filled contour, and that single
    // mismatch is what makes a vignette look like a different artist drew it.
    const { container } = render(<Preview />);

    expect(container.querySelectorAll('[stroke]')).toHaveLength(0);
    expect(container.querySelectorAll('[stroke-width]')).toHaveLength(0);
  });
});
