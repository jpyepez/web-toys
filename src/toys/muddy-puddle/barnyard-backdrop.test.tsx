import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BarnyardBackdrop } from './BarnyardBackdrop';
import { buildBarnyard, type Frame } from './barnyard';
import { BARNYARD, BARNYARD_SEED } from './barnyard-config';
import { palette } from './palette';
import type { BarnyardScene } from './useBarnyardScene';

/**
 * Muddy Puddle — barnyard backdrop tests. `BarnyardBackdrop` is the analog of
 * the meadow and the reef: a full-bleed code-drawn SVG scene behind the cast,
 * drawn from SVG primitives only (ADR-0002), every fill sourced from the local
 * barnyard palette. Scene layers are tagged `data-barnyard-layer` so tests
 * address the composition without coupling to which primitive draws each one.
 *
 * WHAT CHANGED. The component no longer draws itself — it renders a scene the
 * shared generator built, so these tests now hand it one. The `barn` and `fence`
 * hooks survive the migration and mean something different: `barn` is a cropped
 * wall rather than a free-standing gable, and `fence` is a run of tapered fills
 * rather than five `<rect>` uprights. The shape rules behind both are asserted
 * on the emitted geometry in `barnyard.test.ts`; what is asserted HERE is that
 * the composition is present and that every colour traces to the palette.
 *
 * The `grass` hook is gone and `ground` replaces it, because the layer changed
 * from a stretched band with its own CSS height into the generator's trotting
 * line. That is a rename with a reason rather than churn: a test asking for
 * `grass` would have kept passing against a layer that no longer exists in the
 * form the name implies.
 *
 * Palette assertions sweep by SET MEMBERSHIP (a colour-bearing attribute's value
 * is one of the palette tokens) rather than pinning a layer to one exact token,
 * so a layer evolving from a flat fill toward a gradient stays an implementation
 * change rather than a test rewrite. `url(...)` paint-server references
 * (gradients) are structural, not colours, so they're skipped and the gradient's
 * own `stop-color` stops carry the palette trace.
 */

/** A Card-shaped frame is the wrong shape to test a backdrop in — these are the
 *  two the Toy actually ships into, and the phone is the one that legally gets
 *  no far banks at all. */
const PHONE: BarnyardScene = (() => {
  const frame: Frame = { w: 100, h: 216.4 };
  const critterW = 50;
  return { frame, critterW, art: buildBarnyard(BARNYARD, frame, critterW, BARNYARD_SEED) };
})();

const DESKTOP: BarnyardScene = (() => {
  const frame: Frame = { w: 100, h: 62.5 };
  const critterW = 16.67;
  return { frame, critterW, art: buildBarnyard(BARNYARD, frame, critterW, BARNYARD_SEED) };
})();

/** Every concrete colour a backdrop element paints — a layer's own
 * `fill`/`stroke` when it's a literal colour, plus any `stop-color` on gradient
 * stops nested inside it. `none` (stroked-outline sentinel) and `url(...)`
 * paint-server references are not colours and are excluded. */
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

/** Asserts a layer exists and that everything under it paints from the palette. */
function expectPaletteLayer(container: HTMLElement, layer: string) {
  const paletteValues = new Set<string>(Object.values(palette));
  const nodes = container.querySelectorAll(`[data-barnyard-layer="${layer}"]`);
  expect(nodes.length, `layer "${layer}"`).toBeGreaterThan(0);
  for (const node of nodes) {
    // A layer may be a `<g>` carrying no paint of its own; what must hold is
    // that every colour beneath it is a palette token.
    for (const el of [node, ...node.querySelectorAll('*')]) {
      for (const colour of paletteColoursOf(el)) {
        expect(paletteValues, `layer "${layer}"`).toContain(colour);
      }
    }
  }
}

describe('Muddy Puddle — BarnyardBackdrop', () => {
  it('renders every scene layer, addressable via its data-barnyard-layer hook', () => {
    // The composition, back to front. Each is present on a phone — the aspect
    // where the scene has the least room and is most likely to drop something.
    const { container } = render(<BarnyardBackdrop scene={PHONE} />);
    for (const layer of ['sky', 'barn', 'ground', 'fence', 'straw', 'puddle', 'fore']) {
      expectPaletteLayer(container, layer);
    }
  });

  it('paints every layer from the barnyard palette at a wide aspect too', () => {
    // The far banks only exist here: a bank must clear 2.5 Critters to stay out
    // of the cast's size band, and no such bank fits inside a phone's frame.
    const { container } = render(<BarnyardBackdrop scene={DESKTOP} />);
    for (const layer of ['sky', 'barn', 'bank', 'ground', 'fence', 'straw', 'puddle', 'fore']) {
      expectPaletteLayer(container, layer);
    }
  });

  it('draws the scene from SVG primitives, with no raster and no bare strokes', () => {
    /*
     * ADR-0002 (no binary assets), plus the house rule that costs the most to
     * break: SVG has no variable-width stroke, so a uniform `stroke` reads as a
     * different line language from the cast's filled contour — and that single
     * mismatch is what makes a scene look like a different artist drew it. Every
     * line in this backdrop is a filled tapered path.
     */
    const { container } = render(<BarnyardBackdrop scene={PHONE} />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('image')).toBeNull();
    for (const el of container.querySelectorAll('*')) {
      expect(el.getAttribute('stroke'), el.tagName).toBeNull();
    }
  });

  it('is decorative — hidden from screen readers and transparent to pointers', () => {
    // The Wipe is a sustained drag across the whole stage, so a backdrop that
    // caught pointer events would eat the interaction rather than merely being
    // noisy. Both properties are load-bearing here in a way they are not in the
    // tap Toys.
    const { container } = render(<BarnyardBackdrop scene={PHONE} />);
    const root = container.querySelector('.barnyard-backdrop') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.style.pointerEvents).toBe('none');
    const svg = root.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('composes into a viewBox whose aspect is the viewport’s, so nothing is stretched', () => {
    /*
     * The replacement for three separately-positioned layers — a square `slice`
     * sky and two `none`-stretched bands sharing a `--barnyard-floor` CSS length
     * — which agreed with each other on a phone and came apart at 16:10. One box
     * matched to the viewport leaves `preserveAspectRatio` nothing to correct.
     */
    for (const scene of [PHONE, DESKTOP]) {
      const { container } = render(<BarnyardBackdrop scene={scene} />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs).toHaveLength(1);
      expect(svgs[0].getAttribute('viewBox')).toBe(`0 0 ${scene.frame.w} ${scene.frame.h}`);
    }
  });
});
