import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Confetti } from './Confetti';
import { palette } from './tokens';

describe('Shell celebration burst', () => {
  it('paints every particle with a colour from the design-tokens palette (no hardcoded hexes)', () => {
    // Slice #06 — the celebration burst is restyled to the dawn family the
    // rest of the polish PRD lives in. The visual choices (particle count,
    // drift, blur softness, duration) are on-device per the slice DoD; the
    // *non-negotiable* structural rule is that no fill bypasses the tokens
    // module. Asserting through the rendered DOM keeps this honest against
    // any future re-shape of the component (different SVG primitives, fewer
    // particles, different layout) — the property under test is "fills come
    // from `palette`", not "uses a particular helper".
    const { container } = render(<Confetti />);

    // Every painted shape in the burst — whatever SVG primitive carries the
    // fill — must source its colour from the palette. Empty results would be
    // a regression in itself (a burst that paints nothing), so we also pin
    // that the burst actually renders particles.
    const painted = Array.from(container.querySelectorAll('[fill]'));
    expect(painted.length).toBeGreaterThan(0);

    const allowedFills = new Set<string>(Object.values(palette));
    for (const node of painted) {
      const fill = node.getAttribute('fill');
      expect(allowedFills, `unexpected fill: ${fill}`).toContain(fill);
    }
  });
});
