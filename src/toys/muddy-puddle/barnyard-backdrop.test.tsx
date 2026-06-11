import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BarnyardBackdrop } from './BarnyardBackdrop';
import { palette } from './palette';

/**
 * Muddy Puddle — barnyard backdrop tests. `BarnyardBackdrop` is the analog of
 * `UnderwaterBackdrop` / the meadow: a full-bleed code-drawn SVG scene behind
 * the Critter, drawn from SVG primitives only (ADR-0002), every fill sourced
 * from the local barnyard palette. Scene layers are tagged `data-barnyard-layer`
 * so tests address the composition without coupling to which primitive draws
 * each one (mirrors `data-ocean-layer`). Geometry, exact colours, and
 * `dvh`/`env()` layout are on-device-tuned per the slice DoD — we assert the
 * layer hooks and the palette-sourced fills, never the shapes.
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

describe('Muddy Puddle — BarnyardBackdrop', () => {
  it('renders the sky layer, addressable via its data-barnyard-layer hook, painted from the barnyard palette', () => {
    // AC #2 (tracer): the open barnyard sky the whole scene sits in. Addressed
    // structurally via `data-barnyard-layer="sky"`; every colour it paints
    // traces back to the barnyard palette (set membership, so a flat-fill →
    // gradient evolution stays an implementation detail).
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<BarnyardBackdrop />);

    const sky = container.querySelectorAll('[data-barnyard-layer="sky"]');
    expect(sky.length).toBeGreaterThan(0);
    for (const layer of sky) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders a distant barn silhouette, addressable via its data-barnyard-layer hook and painted from the barnyard palette', () => {
    // AC #2: the distant barn on the horizon — part of the barn/fence
    // silhouette that makes the scene read as a barnyard. Addressed structurally
    // via `data-barnyard-layer="barn"`; its colour traces to the barnyard
    // palette. Shape/position is on-device per the slice DoD, so we assert
    // presence + the palette trace, not geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<BarnyardBackdrop />);

    const barn = container.querySelectorAll('[data-barnyard-layer="barn"]');
    expect(barn.length).toBeGreaterThan(0);
    for (const layer of barn) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });
});
