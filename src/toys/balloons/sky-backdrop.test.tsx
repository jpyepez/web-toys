import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkyBackdrop } from './SkyBackdrop';
import { palette } from './palette';

/**
 * Balloons — sky backdrop tests. `SkyBackdrop` is the analog of
 * `UnderwaterBackdrop` / `BarnyardBackdrop` / the meadow: a full-bleed code-drawn
 * SVG scene behind the balloon Critters, drawn from SVG primitives only
 * (ADR-0002), every fill sourced from the local sky palette. Scene layers are
 * tagged `data-sky-layer` so tests address the composition without coupling to
 * which primitive draws each one (mirrors `data-barnyard-layer`/`data-ocean-layer`).
 *
 * Note the INVERSION of emphasis vs the prior Toys (slice notes / ADR-0005): the
 * load-bearing space here is the TALL SKY above, not the ground band — but the
 * scene is still bottom-anchored (the grassy rise + peg are the ground anchor).
 * Geometry, exact colours, and `dvh`/`env()` layout are on-device-tuned per the
 * slice DoD — we assert the layer hooks and the palette-sourced fills, never the
 * shapes.
 *
 * Palette assertions sweep by SET MEMBERSHIP (a colour-bearing attribute's value
 * is one of the palette tokens) rather than pinning a layer to one exact token,
 * so a layer evolving from a flat fill toward a gradient stays an implementation
 * change rather than a test rewrite. `url(...)` paint-server references
 * (gradients) are structural, not colours, so they're skipped and the gradient's
 * own `stop-color` stops carry the palette trace.
 */

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

describe('Balloons — SkyBackdrop', () => {
  it('renders the tall sky layer, addressable via its data-sky-layer hook, painted from the sky palette', () => {
    // AC #2 (tracer): the deliberately TALL open sky the whole scene sits in and
    // the balloons rise/gather into. Addressed structurally via
    // `data-sky-layer="sky"`; every colour it paints traces back to the sky
    // palette (set membership, so a flat-fill → gradient evolution stays an
    // implementation detail).
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<SkyBackdrop />);

    const sky = container.querySelectorAll('[data-sky-layer="sky"]');
    expect(sky.length).toBeGreaterThan(0);
    for (const layer of sky) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders a cloud or two drifting in the tall sky, addressable via its data-sky-layer hook and painted from the sky palette', () => {
    // AC #2: the soft cloud(s) in the tall sky that make it read as open sky the
    // balloons rise into. Addressed structurally via `data-sky-layer="cloud"`;
    // its colour traces to the sky palette. Count/position/shape is on-device per
    // the slice DoD, so we assert presence (at least one) + the palette trace,
    // not geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<SkyBackdrop />);

    const cloud = container.querySelectorAll('[data-sky-layer="cloud"]');
    expect(cloud.length).toBeGreaterThan(0);
    for (const layer of cloud) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders the bottom-anchored grassy rise, addressable via its data-sky-layer hook and painted from the sky palette', () => {
    // AC #2: the grassy rise the peg stands on — the bottom-anchored ground
    // anchor of the layered scene (ADR-0005). Note the inversion of emphasis:
    // here the ground is just the anchor, the tall sky above is the load-bearing
    // space. Addressed structurally via `data-sky-layer="grass"`; its colour
    // traces to the sky palette. Height/shape is on-device per the slice DoD, so
    // we assert presence + the palette trace, not geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<SkyBackdrop />);

    const grass = container.querySelectorAll('[data-sky-layer="grass"]');
    expect(grass.length).toBeGreaterThan(0);
    for (const layer of grass) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders the low peg in the lower third, addressable via its data-sky-layer hook and painted from the sky palette', () => {
    // AC #2: the low peg standing on the grassy rise that the balloons are tied
    // to (slice #2/#3 attach their strings here). Anchored in the lower third per
    // the bottom-anchored layered pattern (ADR-0005). Addressed structurally via
    // `data-sky-layer="peg"`; its colour traces to the sky palette.
    // Position/shape is on-device per the slice DoD, so we assert presence + the
    // palette trace, not geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<SkyBackdrop />);

    const peg = container.querySelectorAll('[data-sky-layer="peg"]');
    expect(peg.length).toBeGreaterThan(0);
    for (const layer of peg) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('is decorative — aria-hidden and pointer-events: none, so the balloon Critters above stay reachable', () => {
    // The backdrop is the world behind the balloons, not an interactive element.
    // It must be hidden from screen readers (so they skim straight to the
    // held/inflatable Critters) and transparent to taps/holds (so a Hold falls
    // through to the balloon above). Same posture as the prior Toys' backdrops.
    // We assert every root SVG carries `aria-hidden` and `pointer-events: none`;
    // the full-bleed `dvh`/`env()` layout itself is on-device per the slice DoD.
    const { container } = render(<SkyBackdrop />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.style.pointerEvents).toBe('none');
    }
  });

  it('sources every fill from the sky palette — no hardcoded HSL anywhere in the scene', () => {
    // AC #4 + ADR-0002: the whole backdrop is SVG primitives whose every colour
    // routes through the local sky palette — no raw colour strings, no
    // `<canvas>`, no binary assets. This is the scene-wide guard that generalises
    // the per-layer traces above: we sweep every colour-bearing attribute
    // (`fill`/`stroke`, plus gradient `stop-color`) on every element, excluding
    // the structural `none` sentinel and `url(...)` paint-server references, and
    // assert each traces back to a `palette` value. Guards against a hardcoded
    // HSL slipping into any future layer tuned on-device.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<SkyBackdrop />);

    const elements = container.querySelectorAll('svg *');
    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      for (const colour of paletteColoursOf(el)) {
        expect(paletteValues).toContain(colour);
      }
    }
  });
});
