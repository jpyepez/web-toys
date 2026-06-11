import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PigletDrawing } from './PigletDrawing';
import { palette } from './palette';

/**
 * Muddy Puddle — first Critter art tests. `PigletDrawing` is the muddy piglet,
 * drawn from SVG primitives only (ADR-0002); structural pieces are tagged
 * `data-piglet-part` so tests address them without coupling to which primitive
 * draws each one (mirrors `data-fish-part` on the Puffer Fish). The mud caked
 * over the clean piglet is a set of discrete `data-mud-blob` nodes so coverage
 * is observable by COUNTING NODES, never reading pixels (ADR-0006).
 *
 * Geometry, the exact blob count/positions, and colours are on-device-tuned per
 * the slice DoD — we assert the part/blob/tease hooks and the muddy ↔
 * revealed-clean art swap through the public interface, never the shapes.
 */
describe('Muddy Puddle — PigletDrawing', () => {
  it('renders the structural piglet parts, each addressable via its data-piglet-part hook', () => {
    // AC #1: the warm round kawaii piglet is built from addressable parts —
    // body, ears, snout, eyes, blushy cheeks, and a small smile. The muddy
    // state is the default (no `cleaned` prop); the clean piglet is drawn
    // underneath the mud. We assert presence via the part hooks, not counts or
    // coordinates.
    const { container } = render(<PigletDrawing />);

    expect(container.querySelectorAll('[data-piglet-part="body"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-piglet-part="ear"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-piglet-part="snout"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-piglet-part="eye"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-piglet-part="cheek"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-piglet-part="smile"]').length).toBeGreaterThan(0);
  });

  it('cakes the piglet in DISCRETE mud blob nodes — countable, not one merged shape, not a canvas', () => {
    // AC #2 + ADR-0006: the mud is modelled as a set of discrete SVG smudge
    // blobs layered over the clean piglet, each its own node, so slice #3 can
    // observe wipe coverage by COUNTING remaining nodes rather than reading
    // pixels. The exact count is on-device-tuned (slice Notes), so we assert
    // discreteness (more than one separate node) — proving it is not a single
    // merged blob — and that no `<canvas>` smuggles in a pixel layer.
    const { container } = render(<PigletDrawing />);

    expect(container.querySelectorAll('[data-mud-blob]').length).toBeGreaterThan(1);
    expect(container.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('leaves exactly one tease extremity poking out of the mud', () => {
    // AC #3: the mud fully obscures who it is EXCEPT a single tease extremity
    // (here the piglet's ear) poking out, to spark "who's that?" anticipation —
    // the full reveal lands at the clean-snap (slice #3). The tease is drawn as
    // its own node ON TOP of the mud, so "obscured except one bit" is an
    // assertable contract: exactly one `data-piglet-tease` node renders while
    // muddy. (Which extremity, and its geometry, are on-device-tuned.)
    const { container } = render(<PigletDrawing />);

    expect(container.querySelectorAll('[data-piglet-tease]')).toHaveLength(1);
  });

  it('swaps muddy ↔ revealed-clean: `cleaned` removes all mud and the tease, leaving the clean piglet', () => {
    // AC #4: a `cleaned` prop swaps mud-on → the fully-clean piglet (the reveal
    // art). This slice just wires the prop; the threshold logic that flips it is
    // slice #3. Mirrors the Fish's `puffed` art-state swap. The load-bearing,
    // geometry-free signal: cleaned, no mud blobs and no tease-on-top remain —
    // and the same structural piglet parts (drawn underneath the mud) still
    // render, now fully visible.
    const clean = render(<PigletDrawing cleaned />).container;

    expect(clean.querySelectorAll('[data-mud-blob]')).toHaveLength(0);
    expect(clean.querySelectorAll('[data-piglet-tease]')).toHaveLength(0);
    expect(clean.querySelectorAll('[data-piglet-part="body"]').length).toBeGreaterThan(0);
    expect(clean.querySelectorAll('[data-piglet-part="snout"]').length).toBeGreaterThan(0);
  });

  it('sources every colour from the barnyard palette — no hardcoded HSL', () => {
    // Non-negotiable (ADR-0002, mirrors the Fish): every fill/stroke in
    // `PigletDrawing` routes through the local barnyard palette, no raw colour
    // strings. We sweep BOTH states and check every colour-bearing attribute on
    // every node — piglet parts, mud blobs, and the tease — excluding the
    // structural `none` sentinel used on stroked outlines, tracing each back to
    // a `palette` value.
    const values = new Set<string>(Object.values(palette));

    for (const cleanedState of [false, true]) {
      const { container } = render(<PigletDrawing cleaned={cleanedState} />);
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
  });
});
