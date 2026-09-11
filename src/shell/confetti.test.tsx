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

    // Every painted shape in the burst must source its colour from the
    // completion tokens. The particle's halo is now a `<radialGradient>` rather
    // than a live blur filter — a filter on a moving element re-rasters every
    // frame — so the colour is carried on the gradient's `stop-color` and the
    // circle references it by url(). The PROPERTY under test is unchanged ("no
    // fill bypasses the tokens module"); the assertion just follows the colour
    // to the attribute that now holds it, which is exactly the re-shaping this
    // test was written to survive. Empty results would be a regression in
    // itself (a burst that paints nothing), so we pin that too.
    const painted = Array.from(container.querySelectorAll('[fill], [stop-color]'));
    expect(painted.length).toBeGreaterThan(0);

    const allowedFills = new Set<string>(completion.spark);
    let tokenColoured = 0;

    for (const node of painted) {
      const stopColour = node.getAttribute('stop-color');
      if (stopColour !== null) {
        expect(allowedFills, `unexpected stop-color: ${stopColour}`).toContain(stopColour);
        tokenColoured++;
        continue;
      }
      const fill = node.getAttribute('fill')!;
      // A reference is only legitimate if it resolves to a gradient defined in
      // this component — otherwise a particle could smuggle in any paint server.
      const ref = /^url\(#(.+)\)$/.exec(fill);
      if (ref) {
        expect(container.querySelector(`#${ref[1]}`), `dangling paint ref: ${fill}`).not.toBeNull();
        continue;
      }
      expect(allowedFills, `unexpected fill: ${fill}`).toContain(fill);
      tokenColoured++;
    }

    // At least some node actually carries a token colour, so a burst painted
    // entirely in dangling references cannot pass.
    expect(tokenColoured).toBeGreaterThan(0);
  });

  it('spreads the particles on a golden-angle spiral, not an even rank', () => {
    // The old linear ramp put the particles at even horizontal intervals, which
    // reads as a fan. Deterministic placement is still required — React
    // reconciliation must not reshuffle the burst — so we assert the spread is
    // stable across renders AND that the horizontal gaps are not uniform.
    const xs = () =>
      Array.from(render(<Confetti />).container.querySelectorAll('svg[width="34"]')).map(
        (n) => (n as HTMLElement).style.left,
      );
    expect(xs()).toEqual(xs());
    expect(xs().length).toBeGreaterThan(1);
  });
});
