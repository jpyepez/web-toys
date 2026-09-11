import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FishDrawing, FISH_MIN_PX, FISH_VW, FISH_MAX_PX, FISH_WIDTH } from './FishDrawing';
import { palette } from './palette';

/**
 * Puffer Fish — Critter art tests. `FishDrawing` is drawn from SVG primitives
 * only (ADR-0002); structural pieces are tagged `data-fish-part` so tests can
 * address them without coupling to the tuned geometry, which is on-device per
 * the slice DoD.
 *
 * WHAT THESE ASSERT NOW. The part hooks and the rest ↔ puffed swap are still the
 * contract — those are what the loop drives. What they are joined by are the
 * house-style rules the old drawing broke: no `stroke` anywhere, no unmodified
 * primitive carrying a form, and the cast's own size discipline, which the scene
 * generator measures everything else against.
 */

describe('Puffer Fish — FishDrawing', () => {
  it('renders the structural fish parts, each addressable via its data-fish-part hook', () => {
    // The load-bearing hooks: the body, its fins and tail, the face. These are
    // what the mechanic tests and the Card address, so they survive the art
    // being rebuilt underneath them.
    const { container } = render(<FishDrawing />);

    expect(container.querySelectorAll('[data-fish-part="body"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="fin"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="tail"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="eye"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="cheek"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="smile"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="belly"]').length).toBeGreaterThan(0);
  });

  it('swaps the face between rest and puffed', () => {
    // At rest the fish has large round eyes (`data-fish-part="eye"`); puffed,
    // they squint to a happy `^w^` (`data-fish-part="eye-squint"`). This is the
    // signature beat the loop's `dismissing` state drives, so the swap is the
    // contract rather than the exact arcs.
    const rest = render(<FishDrawing />).container;
    expect(rest.querySelectorAll('[data-fish-part="eye"]').length).toBeGreaterThan(0);
    expect(rest.querySelectorAll('[data-fish-part="eye-squint"]')).toHaveLength(0);

    const puffed = render(<FishDrawing puffed />).container;
    expect(puffed.querySelectorAll('[data-fish-part="eye-squint"]').length).toBeGreaterThan(0);
    expect(puffed.querySelectorAll('[data-fish-part="eye"]')).toHaveLength(0);
  });

  it('renders no spike part — the silhouette stays round, even when puffed', () => {
    // A puffer fish puffs ROUND, not spiky. "Puffed" must read as
    // bigger/rounder, never as spikes appearing — the silhouette is what a
    // three-year-old recognises the Critter by, and it may not change species
    // between beats.
    const rest = render(<FishDrawing />).container;
    expect(rest.querySelectorAll('[data-fish-part="spike"]')).toHaveLength(0);

    const puffed = render(<FishDrawing puffed />).container;
    expect(puffed.querySelectorAll('[data-fish-part="spike"]')).toHaveLength(0);
  });

  it('contains no `stroke` — every line is a filled path', () => {
    /*
     * The house rule this drawing broke in three places: the smile and both
     * halves of the `^w^` squint were `stroke`d curves with a `stroke-width`.
     *
     * SVG has no variable-width stroke, so a uniform one reads as a different
     * line language from the filled variable-width contour the rest of the
     * collection is drawn with — and that single mismatch is most of what made
     * this Critter look like a different artist from the Sheep on the next Card.
     * Checked in BOTH states, because the squint only exists in one of them.
     */
    for (const puffed of [false, true]) {
      const { container } = render(<FishDrawing puffed={puffed} />);
      expect(container.querySelectorAll('[stroke]'), `puffed=${puffed}`).toHaveLength(0);
      expect(container.querySelectorAll('[stroke-width]'), `puffed=${puffed}`).toHaveLength(0);
    }
  });

  it('carries its forms as perturbed paths, not as bare primitives', () => {
    /*
     * The body, tail, fins and belly used to be a `<circle>` and four
     * `<ellipse>`s. A primitive has no vertices to perturb, which is exactly why
     * unmodified primitives read as software rather than as drawing — so every
     * FORM is now a sampled blob emitted as a path, and `<circle>` survives only
     * for things that are genuinely circular marks: eyes, catchlights, cheeks
     * and spots.
     */
    const { container } = render(<FishDrawing />);

    expect(container.querySelectorAll('ellipse')).toHaveLength(0);
    for (const part of ['body', 'tail', 'fin', 'belly'] as const) {
      for (const el of container.querySelectorAll(`[data-fish-part="${part}"]`)) {
        expect(el.tagName.toLowerCase(), `${part} is drawn as a bare primitive`).toBe('path');
      }
    }
    // And the contour is a real ring: a long even-odd path, not a stroke width.
    const longest = Math.max(
      ...[...container.querySelectorAll('path')].map((p) => (p.getAttribute('d') ?? '').length),
    );
    expect(longest).toBeGreaterThan(400);
  });

  it('states one width, and the three constants the scene reads agree with it', () => {
    /*
     * The reef sizes every ridge, blade, polyp and the sun against a FISH, so
     * `FISH_WIDTH` is the scene's unit and the numeric constants beside it are
     * how the generator and the hook read that unit. The two drifting apart
     * would rescale the whole scene relative to the cast without either file
     * looking wrong on its own, which is precisely the class of bug the
     * generator exists to make impossible.
     */
    expect(FISH_WIDTH).toBe(`clamp(${FISH_MIN_PX}px, ${FISH_VW * 100}vw, ${FISH_MAX_PX}px)`);
    // The dismiss beat balloons the Fish to 1.7x, and it has to stay on screen:
    // at 44vw a 390px phone gives a 172px Fish, 292px puffed.
    expect(390 * FISH_VW * 1.7).toBeLessThan(390);
  });

  it('sources every colour from the reef palette — no hardcoded colour', () => {
    // Every fill in the drawing routes through the local palette, no raw colour
    // strings. Swept across both states, because the puffed art is a different
    // set of elements.
    const values = new Set<string>(Object.values(palette));

    for (const puffedState of [false, true]) {
      const { container } = render(<FishDrawing puffed={puffedState} />);
      const elements = container.querySelectorAll('svg *');
      expect(elements.length).toBeGreaterThan(0);
      for (const el of elements) {
        for (const attr of ['fill', 'stroke'] as const) {
          const colour = el.getAttribute(attr);
          if (colour === null || colour === 'none' || colour.startsWith('url(')) continue;
          expect(values).toContain(colour);
        }
      }
    }
  });
});
