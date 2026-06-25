import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BirdDrawing, type BirdSpecies } from './BirdDrawing';
import { palette } from './palette';

/**
 * Nestlings — faced Critter art tests. `BirdDrawing` is a stateless, code-drawn
 * SVG fledgling whose appearance is a PURE FUNCTION of its props: a `species`
 * picks the body/wing/beak colours from the slice-#1 palette, and `asleep`
 * switches the awake face (eyes open) for the nestled-in look (head tucked, eyes
 * closed). All primitives, no binary assets (ADR-0002). Structural pieces are
 * tagged `data-bird-part` so tests address them without coupling to which
 * primitive draws each one (mirrors `data-balloon-part` / `data-piglet-part`).
 *
 * Geometry, exact face shapes, the carried lift/scale, and colours are
 * on-device-tuned per the slice DoD — we assert the part hooks render and that
 * the state props switch the STRUCTURE (species → distinct colours, asleep →
 * eyes-open vs eyes-closed) through the public interface, never the pixels.
 */
describe('Nestlings — BirdDrawing', () => {
  it('renders the structural bird parts, each addressable via its data-bird-part hook', () => {
    // AC #1: the faced fledgling is built from addressable parts — body, the
    // folded wing, the beak, and the eyes. We assert presence via the part
    // hooks, not counts or coordinates.
    const { container } = render(<BirdDrawing species="robin" />);

    expect(container.querySelectorAll('[data-bird-part="body"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-bird-part="wing"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-bird-part="beak"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-bird-part="eye"]').length).toBeGreaterThan(0);
  });

  it('selects five distinct species, each painting its body from the palette', () => {
    // AC #2: five visually distinct fledglings are selectable via `species`, each
    // sourcing its colours from slice #1's palette (the variety, no hidden
    // identity per the PRD). We assert each species paints its OWN palette body
    // colour, and that all five bodies are distinct — the species genuinely
    // differ rather than sharing one fill. Exact hues are on-device-tuned; we
    // assert the colour FLOWS from the named palette token, never the tuple.
    const bodyFill = (species: BirdSpecies) =>
      render(<BirdDrawing species={species} />)
        .container.querySelector('[data-bird-part="body"]')
        ?.getAttribute('fill');

    expect(bodyFill('robin')).toBe(palette.robinBody);
    expect(bodyFill('bluebird')).toBe(palette.bluebirdBody);
    expect(bodyFill('sparrow')).toBe(palette.sparrowBody);
    expect(bodyFill('wren')).toBe(palette.wrenBody);
    expect(bodyFill('goldfinch')).toBe(palette.goldfinchBody);

    const allBodies = ['robin', 'bluebird', 'sparrow', 'wren', 'goldfinch'].map((s) =>
      bodyFill(s as BirdSpecies),
    );
    expect(new Set(allBodies).size).toBe(5);
  });

  it('switches the eyes open↔closed with the asleep prop — awake is a different structure from nestled', () => {
    // AC #3: the asleep look (head tucked, eyes closed) is expressible as a prop
    // and proven STATICALLY via the part hooks. The proof is structural, not
    // geometric (geometry is on-device-tuned): an awake bird draws an OPEN eye, a
    // nestled bird draws a CLOSED lid in its place — a different primitive at the
    // eye hook. We assert the eye part renders in both states but that its shape
    // switches, so the face genuinely changes rather than staying open.
    const eyeShape = (asleep: boolean) =>
      render(<BirdDrawing species="robin" asleep={asleep} />)
        .container.querySelector('[data-bird-part="eye"]')?.tagName;

    expect(eyeShape(false)).toBeTruthy();
    expect(eyeShape(true)).toBeTruthy();
    expect(eyeShape(false)).not.toBe(eyeShape(true));
  });

  it('is drawn from SVG primitives only — no <canvas>, no binary assets', () => {
    // AC #4 + ADR-0002: the Critter is code-drawn SVG, never a raster/canvas
    // layer or an image asset. We sweep every species × awake/asleep combo and
    // assert no `<canvas>` (and no `<image>`) ever smuggles in.
    const species: BirdSpecies[] = ['robin', 'bluebird', 'sparrow', 'wren', 'goldfinch'];
    for (const s of species) {
      for (const asleep of [false, true]) {
        const { container } = render(<BirdDrawing species={s} asleep={asleep} />);
        expect(container.querySelectorAll('canvas')).toHaveLength(0);
        expect(container.querySelectorAll('image')).toHaveLength(0);
        expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
      }
    }
  });

  it('applies a lift cue when carried — the bird transforms vs resting at rest', () => {
    // Art deliverable: the carried display state (the bird lifts/scales to the
    // finger — mirrors Balloons' which-one cue) so slice #3 can drive it. The
    // exact lift/scale tuple is on-device-tuned and NOT asserted; we assert only
    // that `carried` PRESENCE applies a transform to the bird group and a resting
    // bird does not — the state is expressed, the geometry stays tunable.
    const groupTransform = (carried: boolean) =>
      render(<BirdDrawing species="robin" carried={carried} />)
        .container.querySelector('[data-bird-part="bird"]')
        ?.getAttribute('transform') ?? '';

    expect(groupTransform(true)).not.toBe('');
    expect(groupTransform(true)).not.toBe(groupTransform(false));
  });

  it('sources every colour from the nestlings palette — no hardcoded HSL', () => {
    // Non-negotiable (ADR-0002, mirrors the balloon/piglet/fish art): every
    // fill/stroke in `BirdDrawing` routes through the local palette, no raw
    // colour strings. We sweep every species × awake/asleep combo and check
    // every colour-bearing attribute on every node — excluding the structural
    // `none` sentinel on stroked outlines — tracing each back to a `palette`
    // value.
    const values = new Set<string>(Object.values(palette));
    const species: BirdSpecies[] = ['robin', 'bluebird', 'sparrow', 'wren', 'goldfinch'];

    for (const s of species) {
      for (const asleep of [false, true]) {
        const { container } = render(<BirdDrawing species={s} asleep={asleep} />);
        const painted = container.querySelectorAll('[fill], [stroke]');
        expect(painted.length).toBeGreaterThan(0);
        for (const node of painted) {
          for (const attr of ['fill', 'stroke'] as const) {
            const colour = node.getAttribute(attr);
            if (colour === null || colour === 'none') continue;
            expect(values).toContain(colour);
          }
        }
      }
    }
  });
});
