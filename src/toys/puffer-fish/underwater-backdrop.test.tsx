import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { buildReef, type Frame } from './reef';
import { REEF, REEF_SEED } from './reef-config';
import { UnderwaterBackdrop } from './UnderwaterBackdrop';
import { palette } from './palette';

/**
 * Puffer Fish — reef backdrop tests. `UnderwaterBackdrop` is the analog of
 * `MeadowBackdrop` / `DuskBackdrop`: the full-bleed code-drawn scene behind the
 * Critter, all SVG (ADR-0002), every fill sourced from the local reef `palette`
 * (ADR-0004, the Toy owns its scene assets). Layers are tagged
 * `data-ocean-layer` so tests address the composition without coupling to which
 * primitive draws each one.
 *
 * WHAT THESE ASSERT NOW. The old file checked that a water rect, three ray
 * polygons, five bubble circles, a sand path and two coral paths existed and
 * were painted from the palette — and every one of those passed while the coral
 * sat squarely in the cast's own size band and the fish was lighter than the
 * paper. Existence and palette-membership are still checked, because they are
 * cheap and they catch real leaks; what they are joined by is the composition
 * itself, which now comes out of a generator and is asserted in `reef.test.ts`.
 * The two coral clumps are asserted GONE by name here, because a deleted rival
 * that nothing tests for is a rival waiting to be redrawn.
 *
 * Palette assertions sweep by SET MEMBERSHIP rather than pinning a layer to one
 * exact token, so a layer evolving from a flat fill toward a gradient stays an
 * implementation change rather than a test rewrite. `url(...)` paint-server
 * references are structural, not colours, so they are skipped and the gradient's
 * own `stop-color` stops carry the palette trace.
 */

/**
 * A scene to render against. `UnderwaterBackdrop` takes its geometry as a PROP
 * rather than building it — one generator, read by the backdrop that draws the
 * seabed and by the Fish that hovers over it, so the two cannot drift apart.
 * Tests therefore build it the way the Toy does.
 */
const scene = (frame: Frame = { w: 100, h: 216 }, fishW = 44) => ({
  frame,
  fishW,
  art: buildReef(REEF, frame, fishW, REEF_SEED),
});

/** Every concrete colour an element paints, including any gradient stops nested
 * inside it. `none` and `url(...)` paint-server references are not colours. */
function paletteColoursOf(el: Element): string[] {
  const colours: string[] = [];
  for (const attr of ['fill', 'stroke'] as const) {
    const value = el.getAttribute(attr);
    if (value === null || value === 'none' || value.startsWith('url(')) continue;
    colours.push(value);
  }
  for (const stop of el.querySelectorAll('stop')) {
    const value = stop.getAttribute('stop-color');
    if (value) colours.push(value);
  }
  return colours;
}

describe('Puffer Fish — UnderwaterBackdrop', () => {
  it('renders the composed reef layers, each addressable via its data-ocean-layer hook', () => {
    // The layers the generator emits for a phone frame, back to front. The
    // ridges are deliberately absent from this list: a phone is ~2.3 Fish across
    // and cannot hold one that clears the cast's size band, so the generator
    // gives it none — asserted in `reef.test.ts`, where the frame is the subject.
    const { container } = render(<UnderwaterBackdrop scene={scene()} />);

    for (const layer of ['water', 'sun', 'light-ray', 'bed', 'kelp', 'frond', 'polyp', 'bubble', 'fore']) {
      expect(
        container.querySelectorAll(`[data-ocean-layer="${layer}"]`).length,
        `the ${layer} layer`,
      ).toBeGreaterThan(0);
    }
  });

  it('has no coral clumps left in it, by name or by shape', () => {
    /*
     * THE REGRESSION THIS FILE EXISTS FOR.
     *
     * The scene shipped two branchy coral clumps at `clamp(38px, 9vmin, 84px)` —
     * 0.35 of a Fish on a phone — flanking a Fish. Convex, closed, rounded and
     * in the cast's own size band: three blobs for a three-year-old to sort into
     * tappable and not. They were drawn for months and every review passed,
     * because a screenshot of a reef looks like a reef.
     *
     * The layer is gone, and so is the token that painted it. Asserting both is
     * what makes the deletion stick: a name nothing tests for comes back.
     */
    const { container } = render(<UnderwaterBackdrop scene={scene()} />);

    expect(container.querySelectorAll('[data-ocean-layer="coral"]')).toHaveLength(0);
    expect(Object.keys(palette)).not.toContain('coral');
    expect(Object.keys(palette)).not.toContain('sand');
  });

  it('draws the scene the generator emitted, not a second drawing of it', () => {
    // The cheapest honest proxy for "this is generated": a hand-drawn backdrop is
    // a handful of short `d` strings, a generated one carries hundreds of sampled
    // points per mass. If someone replaces this with a sketch again, this fails.
    const { container } = render(<UnderwaterBackdrop scene={scene()} />);

    const paths = [...container.querySelectorAll('path')];
    expect(paths.length).toBeGreaterThan(12);
    const longest = Math.max(...paths.map((p) => (p.getAttribute('d') ?? '').length));
    expect(longest, 'no generated geometry — the scene looks hand-drawn again').toBeGreaterThan(400);
  });

  it('gives a wide frame more reef sideways — the ridges a phone cannot legally hold', () => {
    // Counts follow the frame, sizes follow the Fish. The narrow frame gets no
    // ridge at all, not a smaller one, because there is no ridge a 100-unit frame
    // can hold at 2.5 Fish when a Fish is 44 units of it.
    const phone = render(<UnderwaterBackdrop scene={scene({ w: 100, h: 216 }, 44)} />).container;
    const desktop = render(<UnderwaterBackdrop scene={scene({ w: 100, h: 62.5 }, 15.3)} />).container;

    expect(phone.querySelectorAll('[data-ocean-layer="ridge"]')).toHaveLength(0);
    expect(desktop.querySelectorAll('[data-ocean-layer="ridge"]').length).toBeGreaterThan(0);
  });

  it('sources every fill from the reef palette — no hardcoded colour, no foreign-palette leak', () => {
    // Every colour-bearing attribute across the whole scene routes through the
    // local `palette`: no raw literals, no colour borrowed from another Toy. A
    // set-membership guard, so it survives tuning — the palette is the single
    // source of truth.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<UnderwaterBackdrop scene={scene()} />);

    const elements = container.querySelectorAll('svg *');
    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      for (const colour of paletteColoursOf(el)) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('contains no `stroke` — every line is a filled path', () => {
    // The house rule with the shortest distance between "written down" and
    // "broken". SVG has no variable-width stroke, so a uniform one reads as a
    // different line language from the cast's filled contour, and that single
    // mismatch is what makes a scene look like a different artist drew it.
    const { container } = render(<UnderwaterBackdrop scene={scene()} />);

    expect(container.querySelectorAll('[stroke]')).toHaveLength(0);
    expect(container.querySelectorAll('[stroke-width]')).toHaveLength(0);
  });

  it('is decorative — hidden from screen readers and transparent to presses', () => {
    // The scene is scenery: the Fish above it carries the whole interaction, so
    // taps and screen readers fall straight through.
    const { container } = render(<UnderwaterBackdrop scene={scene()} />);

    const shell = container.querySelector('.underwater-backdrop') as HTMLElement;
    expect(shell).not.toBeNull();
    expect(shell.getAttribute('aria-hidden')).toBe('true');
    expect(shell.style.pointerEvents).toBe('none');
    expect(shell.style.position).toBe('fixed');
  });
});
