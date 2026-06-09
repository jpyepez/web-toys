import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { UnderwaterBackdrop } from './UnderwaterBackdrop';
import { palette } from './palette';

/**
 * Puffer Fish — underwater backdrop tests. `UnderwaterBackdrop` is the analog
 * of `MeadowBackdrop`: a single full-bleed code-drawn SVG scene behind the
 * Critter, drawn from SVG primitives only (ADR-0002), every fill sourced from
 * the local ocean palette (slice #05). Scene layers are tagged
 * `data-ocean-layer` so tests address the composition without coupling to which
 * primitive draws each one (mirrors `data-meadow-layer`). Geometry, exact
 * colours, and `dvh`/`env()` layout are on-device-tuned per the slice DoD — we
 * assert the layer hooks and the palette-sourced fills, never the shapes.
 *
 * Palette assertions sweep by SET MEMBERSHIP (a colour-bearing attribute's
 * value is one of the palette tokens) rather than pinning a layer to one exact
 * token. The water layer in particular evolves from a flat fill toward a
 * top-lit gradient as the scene is built up; set-membership keeps that an
 * implementation change rather than a test rewrite. `url(...)` paint-server
 * references (gradients) are structural, not colours, so they're skipped and
 * the gradient's own `stop-color` stops carry the palette trace.
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

describe('Puffer Fish — UnderwaterBackdrop', () => {
  it('renders the water layer, addressable via its data-ocean-layer hook, painted from the ocean palette', () => {
    // AC #1 + AC #2 (tracer): the underwater field the whole scene sits in.
    // Addressed structurally via `data-ocean-layer="water"`; every colour it
    // paints traces back to the ocean palette (set membership, so the layer's
    // flat-fill → top-lit-gradient evolution stays an implementation detail).
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<UnderwaterBackdrop />);

    const water = container.querySelectorAll('[data-ocean-layer="water"]');
    expect(water.length).toBeGreaterThan(0);
    for (const layer of water) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders soft light rays, each addressable via its data-ocean-layer hook and painted from the ocean palette', () => {
    // AC #1 + AC #2: the god-ray shafts filtering down from the surface — a few
    // of them, so the scene reads as top-lit. Static composition like the
    // meadow's clouds (no idle ambient drift, per the project's standing
    // posture). Addressed structurally via `data-ocean-layer="light-ray"`; each
    // ray's colour traces to the ocean palette. Count/positions/softness are
    // on-device per the slice DoD, so we assert presence (at least one) + the
    // palette trace, not an exact count or geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<UnderwaterBackdrop />);

    const rays = container.querySelectorAll('[data-ocean-layer="light-ray"]');
    expect(rays.length).toBeGreaterThan(0);
    for (const ray of rays) {
      const colours = paletteColoursOf(ray);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders a few drifting bubbles, each addressable via its data-ocean-layer hook and painted from the ocean palette', () => {
    // AC #1 + AC #2: a few drifting bubbles scattered through the water column.
    // Static composition like the meadow's clouds — no idle ambient drift
    // animation (the PRD scopes motion to the fish's swim-in / balloon /
    // float-up only). Addressed structurally via `data-ocean-layer="bubble"`;
    // each bubble's colour traces to the ocean palette. Count/positions are
    // on-device per the slice DoD, so we assert presence + the palette trace.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<UnderwaterBackdrop />);

    const bubbles = container.querySelectorAll('[data-ocean-layer="bubble"]');
    expect(bubbles.length).toBeGreaterThan(0);
    for (const bubble of bubbles) {
      const colours = paletteColoursOf(bubble);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders coral silhouettes, each addressable via its data-ocean-layer hook and painted from the ocean palette', () => {
    // AC #1 + AC #2: pale coral / reef silhouettes standing on the seabed.
    // Addressed structurally via `data-ocean-layer="coral"`; each silhouette's
    // colour traces to the ocean palette. Count/shapes are on-device per the
    // slice DoD, so we assert presence + the palette trace.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<UnderwaterBackdrop />);

    const coral = container.querySelectorAll('[data-ocean-layer="coral"]');
    expect(coral.length).toBeGreaterThan(0);
    for (const silhouette of coral) {
      const colours = paletteColoursOf(silhouette);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders the sandy floor, addressable via its data-ocean-layer hook and painted from the ocean palette', () => {
    // AC #1 + AC #2: the soft sandy seabed the coral stands on. Addressed
    // structurally via `data-ocean-layer="sand"`; its colour traces to the
    // ocean palette. Shape/height is on-device per the slice DoD, so we assert
    // presence + the palette trace.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<UnderwaterBackdrop />);

    const sand = container.querySelectorAll('[data-ocean-layer="sand"]');
    expect(sand.length).toBeGreaterThan(0);
    for (const floor of sand) {
      const colours = paletteColoursOf(floor);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('is decorative — aria-hidden and pointer-events: none, so the Critter above stays reachable', () => {
    // AC #3: the backdrop is the world behind the fish, not an interactive
    // element. It must be hidden from screen readers (so they skim straight to
    // the tappable Critter) and transparent to taps (so taps fall through to
    // the Critter above). Same posture as `MeadowBackdrop`. We assert the root
    // SVG carries `aria-hidden` and `pointer-events: none`; the full-bleed
    // `dvh`/`env()` layout itself is on-device per the slice DoD.
    const { container } = render(<UnderwaterBackdrop />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
    expect(svg!.style.pointerEvents).toBe('none');
  });

  it('sources every fill from the ocean palette — no hardcoded HSL anywhere in the scene', () => {
    // AC #2: every colour in the whole backdrop routes through the local ocean
    // palette, no raw colour strings. This is the scene-wide guard that
    // generalises the per-layer traces above: we sweep every colour-bearing
    // attribute (`fill`/`stroke`, plus gradient `stop-color`) on every element,
    // excluding the structural `none` sentinel and `url(...)` paint-server
    // references, and assert each traces back to a `palette` value. Mirrors the
    // `FishDrawing` "every part traces to a palette token" rule across the
    // whole scene composition. Guards against a hardcoded HSL slipping into any
    // future layer tuned on-device.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<UnderwaterBackdrop />);

    const elements = container.querySelectorAll('svg *');
    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      for (const colour of paletteColoursOf(el)) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('grades the water lighter toward the surface — the water layer paints from both the surface and deep tokens', () => {
    // AC #2 + the "top-lit, lighter toward the surface" register from the
    // slice's "What to build". The water layer is not a flat fill: it runs the
    // lighter `palette.waterSurface` near the top and deepens to `palette.water`
    // below, so the scene reads as lit from above. We assert the *behaviour*
    // (the water layer paints from BOTH tokens), mechanism-agnostic: whether
    // that's a two-stop gradient or stacked bands is an on-device detail per
    // the slice DoD, and either keeps this green.
    const { container } = render(<UnderwaterBackdrop />);

    const water = container.querySelectorAll('[data-ocean-layer="water"]');
    expect(water.length).toBeGreaterThan(0);
    const waterColours = new Set<string>();
    for (const layer of water) {
      for (const colour of paletteColoursOf(layer)) waterColours.add(colour);
    }
    expect(waterColours).toContain(palette.waterSurface);
    expect(waterColours).toContain(palette.water);
  });
});
