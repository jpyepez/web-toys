import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkyBackdrop } from './SkyBackdrop';
import { buildSky, type Frame } from './sky';
import { SKY, SKY_SEED } from './sky-config';
import { BALLOONS, palette } from './palette';
import type { SkyScene } from './useSkyScene';

/**
 * Up & Away — sky backdrop tests. `SkyBackdrop` is the analog of the meadow and
 * the barnyard: a full-bleed code-drawn SVG scene behind the bunch, drawn from
 * SVG primitives only (ADR-0002), every fill sourced from the local sky palette.
 * Scene layers are tagged `data-sky-layer` so tests address the composition
 * without coupling to which primitive draws each one.
 *
 * WHAT CHANGED. The component no longer draws itself — it renders a scene the
 * shared generator built, so these tests now hand it one. Two hooks survive the
 * migration and mean something different, which is worth stating because a test
 * asking for the old name would have kept passing against a layer that no longer
 * exists in the form the name implies:
 *
 *   - `cloud` is now ONE bank cropped into a top corner, not five `<circle>`
 *     puffs floating in the middle of the sky. That is the whole migration: a
 *     puff is convex, closed, rounded and balloon-sized, which in a Toy about
 *     balloons makes the background a set of decoys. `sky.test.ts` asserts the
 *     shape rules on the emitted geometry.
 *   - `peg` is now a tapered stake rather than a `<rect>` with an `<ellipse>`
 *     cap — the cap was the puff's shape class one octave down, sitting at the
 *     exact point the child's eye is drawn to.
 *
 * The `grass` hook is gone and `ground` replaces it, because the layer changed
 * from a `preserveAspectRatio="none"` band with its own `--balloons-ground` CSS
 * height into the generator's sampled ground line.
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
const PHONE: SkyScene = (() => {
  const frame: Frame = { w: 100, h: 216.4 };
  const balloonW = 28;
  return { frame, balloonW, art: buildSky(SKY, frame, balloonW, SKY_SEED, BALLOONS.length) };
})();

const DESKTOP: SkyScene = (() => {
  const frame: Frame = { w: 100, h: 62.5 };
  const balloonW = 13.19;
  return { frame, balloonW, art: buildSky(SKY, frame, balloonW, SKY_SEED, BALLOONS.length) };
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
  const nodes = container.querySelectorAll(`[data-sky-layer="${layer}"]`);
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

describe('Up & Away — SkyBackdrop', () => {
  it('renders every scene layer, addressable via its data-sky-layer hook', () => {
    // The composition, back to front. Every one of these is present on a phone,
    // which is the frame with the least room — the far banks are the exception
    // and are asserted at the wide aspect instead.
    const { container } = render(<SkyBackdrop scene={PHONE} />);
    for (const layer of ['sky', 'cloud', 'ground', 'peg', 'tuft', 'mote', 'fore']) {
      expectPaletteLayer(container, layer);
    }
  });

  it('paints every layer from the sky palette at a wide aspect too', () => {
    // The wide frame is the one that gets the elements a phone cannot legally
    // hold — a second cloud bank and the cropped far banks — so it is the frame
    // where an off-palette colour would first appear.
    const { container } = render(<SkyBackdrop scene={DESKTOP} />);
    for (const layer of ['sky', 'cloud', 'bank', 'ground', 'peg', 'tuft', 'mote', 'fore']) {
      expectPaletteLayer(container, layer);
    }
  });

  it('draws the scene from SVG primitives, with no raster and no bare strokes', () => {
    // ADR-0002: the whole backdrop is code-drawn SVG — no `<canvas>`, no
    // `<image>`, no binary assets. And no `stroke` anywhere: SVG has no
    // variable-width stroke, so a uniform one reads as a different line language
    // from the cast's filled contour, which is most of what makes a scene look
    // like a different artist drew it. Every line here is a filled tapered path.
    for (const scene of [PHONE, DESKTOP]) {
      const { container } = render(<SkyBackdrop scene={scene} />);
      expect(container.querySelectorAll('canvas')).toHaveLength(0);
      expect(container.querySelectorAll('image')).toHaveLength(0);
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
      for (const el of container.querySelectorAll('svg *')) {
        const stroke = el.getAttribute('stroke');
        expect(stroke === null || stroke === 'none', `${el.tagName} carries a stroke`).toBe(true);
      }
    }
  });

  it('sources every colour in the whole scene from the sky palette', () => {
    // The scene-wide guard that generalises the per-layer traces above: sweep
    // every colour-bearing attribute on every element and trace each back to a
    // `palette` value. Guards against a hardcoded colour slipping into a layer
    // tuned in the lab.
    const paletteValues = new Set<string>(Object.values(palette));
    for (const scene of [PHONE, DESKTOP]) {
      const { container } = render(<SkyBackdrop scene={scene} />);
      const elements = container.querySelectorAll('svg *');
      expect(elements.length).toBeGreaterThan(0);
      for (const el of elements) {
        for (const colour of paletteColoursOf(el)) {
          expect(paletteValues).toContain(colour);
        }
      }
    }
  });

  it('is decorative — hidden from screen readers and transparent to pointers', () => {
    // The backdrop is the world behind the balloons, not an interactive element.
    // It must be hidden from screen readers (so they skim straight to the
    // holdable Critters) and transparent to taps (so a Hold falls through to the
    // balloon above).
    const { container } = render(<SkyBackdrop scene={PHONE} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.style.pointerEvents).toBe('none');
    }
  });

  it('composes into a viewBox whose aspect is the viewport’s, so nothing is stretched', () => {
    /*
     * The replacement for the old two-layer stack: a square `xMidYMid slice` sky
     * over a `preserveAspectRatio="none"` ground band whose height was a `dvh`
     * clamp. Those agreed with each other on a phone and came apart everywhere
     * else — the slice scaled the sky by width and cropped it about the vertical
     * centre while the band stayed pinned to the bottom, so the peg slid out from
     * under a bunch that was positioned against the viewport instead.
     *
     * One box, matched to the viewport, leaves `preserveAspectRatio` nothing to
     * correct.
     */
    for (const scene of [PHONE, DESKTOP]) {
      const { container } = render(<SkyBackdrop scene={scene} />);
      const svg = container.querySelector('svg')!;
      expect(svg.getAttribute('viewBox')).toBe(`0 0 ${scene.frame.w} ${scene.frame.h}`);
      expect(svg.getAttribute('preserveAspectRatio')).toBe('none');
    }
  });
});
