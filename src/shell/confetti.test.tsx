import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Confetti } from './Confetti';
import { completion } from './tokens';

describe('Shell celebration burst', () => {
  it('paints every particle with a colour from the Shell completion tokens (no hardcoded hexes)', () => {
    // Slice #06 — the celebration burst is restyled to a warm-light family.
    // The visual choices (particle count, drift, blur softness, duration) are
    // on-device per the slice DoD; the *non-negotiable* structural rule is
    // that no fill bypasses the tokens module. Slice #04 moved the source from
    // the meadow `palette` (a Toy's scene asset) to the Shell-owned
    // `completion.spark` tokens (a cross-Toy Completion primitive, ADR-0004),
    // tightening the allowed set to exactly the celebration sparks. Asserting
    // through the rendered DOM keeps this honest against any future re-shape
    // of the component — the property under test is "fills come from the Shell
    // completion tokens", not "uses a particular helper".
    const { container } = render(<Confetti />);

    // Every painted shape in the burst — whatever SVG primitive carries the
    // fill — must source its colour from the completion tokens. Empty results
    // would be a regression in itself (a burst that paints nothing), so we
    // also pin that the burst actually renders particles.
    const painted = Array.from(container.querySelectorAll('[fill]'));
    expect(painted.length).toBeGreaterThan(0);

    const allowedFills = new Set<string>(completion.spark);
    for (const node of painted) {
      const fill = node.getAttribute('fill');
      expect(allowedFills, `unexpected fill: ${fill}`).toContain(fill);
    }
  });
});
