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

  it('renders the fence silhouette, each post addressable via its data-barnyard-layer hook and painted from the barnyard palette', () => {
    // AC #2: the distant fence flanking the barn — the other half of the
    // barn/fence silhouette. Addressed structurally via
    // `data-barnyard-layer="fence"`; each post's colour traces to the barnyard
    // palette. Count/positions are on-device per the slice DoD, so we assert
    // presence (at least one) + the palette trace, not an exact post count.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<BarnyardBackdrop />);

    const fence = container.querySelectorAll('[data-barnyard-layer="fence"]');
    expect(fence.length).toBeGreaterThan(0);
    for (const layer of fence) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders the bottom-anchored grass ground band, addressable via its data-barnyard-layer hook and painted from the barnyard palette', () => {
    // AC #2: the ground band the critters trot on — the bottom-anchored ground
    // anchor of the layered scene (ADR-0005), the barnyard analog of Puffer
    // Fish's seabed. Addressed structurally via `data-barnyard-layer="grass"`;
    // its colour traces to the barnyard palette. Height/shape is on-device per
    // the slice DoD, so we assert presence + the palette trace, not geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<BarnyardBackdrop />);

    const grass = container.querySelectorAll('[data-barnyard-layer="grass"]');
    expect(grass.length).toBeGreaterThan(0);
    for (const layer of grass) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders the mud puddle in the lower third, addressable via its data-barnyard-layer hook and painted from the barnyard palette', () => {
    // AC #2: the mud puddle the critters emerge from (and the last one splashes
    // in, slice #04) — anchored in the lower third per the bottom-anchored
    // layered pattern (ADR-0005). Addressed structurally via
    // `data-barnyard-layer="puddle"`; every colour it paints traces to the
    // barnyard palette (the puddle is built from `mud`/`puddle`/`sparkle`, so
    // set membership covers the mud base, the wet sheen, and the glints).
    // Position/shape is on-device per the slice DoD, so we assert presence + the
    // palette trace, not geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<BarnyardBackdrop />);

    const puddle = container.querySelectorAll('[data-barnyard-layer="puddle"]');
    expect(puddle.length).toBeGreaterThan(0);
    for (const layer of puddle) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('is decorative — aria-hidden and pointer-events: none, so the Critter above stays reachable', () => {
    // The backdrop is the world behind the critters, not an interactive element.
    // It must be hidden from screen readers (so they skim straight to the
    // wipeable Critter) and transparent to taps/wipes (so touches fall through
    // to the Critter above). Same posture as `UnderwaterBackdrop` / the meadow.
    // We assert every root SVG carries `aria-hidden` and `pointer-events: none`;
    // the full-bleed `dvh`/`env()` layout itself is on-device per the slice DoD.
    const { container } = render(<BarnyardBackdrop />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.style.pointerEvents).toBe('none');
    }
  });

  it('sources every fill from the barnyard palette — no hardcoded HSL anywhere in the scene', () => {
    // AC #4 + ADR-0002: the whole backdrop is SVG primitives whose every colour
    // routes through the local barnyard palette — no raw colour strings, no
    // `<canvas>`, no binary assets. This is the scene-wide guard that
    // generalises the per-layer traces above: we sweep every colour-bearing
    // attribute (`fill`/`stroke`, plus gradient `stop-color`) on every element,
    // excluding the structural `none` sentinel and `url(...)` paint-server
    // references, and assert each traces back to a `palette` value. Guards
    // against a hardcoded HSL slipping into any future layer tuned on-device.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<BarnyardBackdrop />);

    const elements = container.querySelectorAll('svg *');
    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      for (const colour of paletteColoursOf(el)) {
        expect(paletteValues).toContain(colour);
      }
    }
  });
});
