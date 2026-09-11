import { describe, it, expect } from 'vitest';
import { buildCanopy } from './canopy';
import { CANOPY, CANOPY_SEED } from './canopy-config';

/**
 * A scene to render against. `DuskBackdrop` takes its geometry as a PROP rather
 * than building it — one generator, read by the backdrop that draws the limbs
 * and by the cast that stands on them, so the two cannot drift apart. Tests
 * therefore build it the same way the Toy does.
 */
const scene = () => {
  const frame = { w: 100, h: 216 };
  const birdW = 36;
  return { frame, birdW, art: buildCanopy(CANOPY, frame, birdW, CANOPY_SEED, 5) };
};
import { render } from '@testing-library/react';
import { DuskBackdrop } from './DuskBackdrop';
import { palette } from './palette';

/**
 * Nestlings — dusk backdrop tests. `DuskBackdrop` is the analog of
 * `SkyBackdrop` / `UnderwaterBackdrop` / `BarnyardBackdrop`: a full-bleed
 * code-drawn SVG scene behind the fledgling Critters, drawn from SVG primitives
 * only (ADR-0002, no `<canvas>`/binary assets), every fill sourced from the
 * local dusk `palette` (ADR-0004, the Toy owns its scene assets). Scene layers
 * are tagged `data-dusk-layer` so tests address the composition without coupling
 * to which primitive draws each one (mirrors `data-sky-layer` / `data-ocean-layer`).
 *
 * Emphasis split (slice notes / ADR-0005): the deepening dusk sky ABOVE is the
 * mood space; the nest + ground band is the reachable lower anchor. The scene is
 * still bottom-anchored — the ground/branch/nest sit in the lower band keyed to
 * one CSS length. Geometry, exact colours, and `dvh`/`env()` layout are
 * on-device-tuned per the slice DoD — we assert the layer hooks and the
 * palette-sourced fills, never the shapes.
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

describe('Nestlings — DuskBackdrop', () => {
  it('renders the deepening dusk-sky layer, addressable via its data-dusk-layer hook, painted from the dusk palette', () => {
    // AC #2 (tracer): the dusk sky above the whole scene sits in — the mood
    // space. Addressed structurally via `data-dusk-layer="sky"`; every colour it
    // paints traces back to the dusk palette (set membership, so the flat-fill →
    // gradient evolution stays an implementation detail — the `sky`/`skyDeep`
    // gradient stops are caught via their `stop-color`).
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<DuskBackdrop scene={scene()} />);

    const sky = container.querySelectorAll('[data-dusk-layer="sky"]');
    expect(sky.length).toBeGreaterThan(0);
    for (const layer of sky) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders the bottom-anchored ground band, addressable via its data-dusk-layer hook and painted from the dusk palette', () => {
    // AC #2: the low dusk ground band — the bottom-anchored ground anchor of the
    // layered scene (ADR-0005), the reachable lower band the nest rests in.
    // Addressed structurally via `data-dusk-layer="ground"`; its colour traces to
    // the dusk palette. Height/shape (the understory's corner-weighted depth) is
    // on-device per the slice DoD, so we assert presence + the palette trace, not
    // geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<DuskBackdrop scene={scene()} />);

    const ground = container.querySelectorAll('[data-dusk-layer="ground"]');
    expect(ground.length).toBeGreaterThan(0);
    for (const layer of ground) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders the tree/branch anchoring the lower third, addressable via its data-dusk-layer hook and painted from the dusk palette', () => {
    // AC #2: the tree/branch anchoring the lower third the nest rests in — part
    // of the reachable lower band (ADR-0005). Addressed structurally via
    // `data-dusk-layer="branch"`; its colour traces to the dusk palette.
    // Position/shape is on-device per the slice DoD, so we assert presence + the
    // palette trace, not geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<DuskBackdrop scene={scene()} />);

    const branch = container.querySelectorAll('[data-dusk-layer="branch"]');
    expect(branch.length).toBeGreaterThan(0);
    for (const layer of branch) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('renders the single empty nest in the lower band, locatable via its data-dusk-layer hook and painted from the dusk palette', () => {
    // AC #3: the single empty nest sitting in the reachable lower band — the
    // drop target + diegetic progress meter. It must render with its own
    // `data-*` hook so later slices can LOCATE it (slice #3 reads its rect to
    // decide the snap; the sleepy pile grows inside it). Addressed structurally
    // via `data-dusk-layer="nest"`; its colour traces to the dusk palette. The
    // exact rect / drop-zone size is on-device-tuned (load-bearing in slice #3),
    // so we assert presence + the palette trace, not geometry.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<DuskBackdrop scene={scene()} />);

    const nest = container.querySelectorAll('[data-dusk-layer="nest"]');
    expect(nest.length).toBeGreaterThan(0);
    for (const layer of nest) {
      const colours = paletteColoursOf(layer);
      expect(colours.length).toBeGreaterThan(0);
      for (const colour of colours) {
        expect(paletteValues).toContain(colour);
      }
    }
  });

  it('is decorative — aria-hidden and pointer-events: none, so the fledgling Critters above stay reachable', () => {
    // The backdrop is the world behind the birds, not an interactive element. It
    // must be hidden from screen readers (so they skim straight to the carried
    // Critters) and transparent to presses (so a pickup/Drag falls through to the
    // bird above, never onto the scenery). Same posture as the prior Toys'
    // backdrops. We assert every root SVG carries `aria-hidden` and
    // `pointer-events: none`; the full-bleed `dvh`/`env()` layout itself is
    // on-device per the slice DoD.
    const { container } = render(<DuskBackdrop scene={scene()} />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.style.pointerEvents).toBe('none');
    }
  });

  it('sources every fill from the dusk palette — no hardcoded HSL anywhere in the scene', () => {
    // AC #5 + ADR-0002: the whole backdrop is SVG primitives whose every colour
    // routes through the local dusk palette — no raw colour strings, no
    // `<canvas>`, no binary assets. This is the scene-wide guard that generalises
    // the per-layer traces above: we sweep every colour-bearing attribute
    // (`fill`/`stroke`, plus gradient `stop-color`) on every element, excluding
    // the structural `none` sentinel and `url(...)` paint-server references, and
    // assert each traces back to a `palette` value. Guards against a hardcoded
    // HSL slipping into any future layer tuned on-device.
    const paletteValues = new Set<string>(Object.values(palette));
    const { container } = render(<DuskBackdrop scene={scene()} />);

    const elements = container.querySelectorAll('svg *');
    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      for (const colour of paletteColoursOf(el)) {
        expect(paletteValues).toContain(colour);
      }
    }
  });
});
