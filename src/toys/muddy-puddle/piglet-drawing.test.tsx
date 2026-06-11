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
});
