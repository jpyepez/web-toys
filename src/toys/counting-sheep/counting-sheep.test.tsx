import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CountingSheep } from './CountingSheep';
import { palette } from './palette';

/**
 * Counting Sheep — what the scene actually paints.
 *
 * The mechanic-level assertions (one-Sheep-at-a-time, tap-advances-loop, re-tap
 * safety, 5th-tap `onComplete`, terminal `completed`) live in
 * `counting-sheep-mechanic.test.tsx`; the scene's shape-class rules live in
 * `meadow.test.ts` and its colour rules in `palette.test.ts`. This file covers
 * the seam between them: that the composition the generator describes is the one
 * the component paints, out of this Toy's own palette.
 *
 * Several tests here are DELETIONS, and they are the most valuable ones. The
 * suite this replaces asserted that the scene painted four cloud clusters, a
 * tree canopy and a tree trunk — it pinned the rivals in place, so any attempt
 * to remove them would have failed the build. A test can hold a bug still just
 * as firmly as it can hold a contract, and the only defence is that the thing
 * being asserted is a rule rather than an inventory.
 */
const renderToy = () => render(<CountingSheep onComplete={vi.fn()} />);

describe('Counting Sheep — scene + palette', () => {
  it('paints the open sky from the meadow palette', () => {
    const { container } = renderToy();
    const sky = container.querySelector('[data-meadow-layer="sky"]');
    expect(sky).not.toBeNull();
    const stops = Array.from(sky!.querySelectorAll('stop')).map((s) => s.getAttribute('stop-color'));
    expect(stops).toEqual([palette.skyHigh, palette.sky]);
  });

  it('paints one oversized sun, cropped rather than floating clear of every edge', () => {
    // The single oversized motif that replaces the four cloud clusters. Its size
    // is asserted against a Sheep in `meadow.test.ts`; what matters here is that
    // it is painted from the scene's own token and sits BEHIND the rest, so the
    // bough and the banks cut into it. A disc laid on top of the sky is a
    // sticker; a disc the scene crops is a distance.
    const { container } = renderToy();
    const sun = container.querySelector('[data-meadow-layer="sun"]');
    expect(sun).not.toBeNull();
    expect(sun!.getAttribute('fill')).toBe(palette.sun);

    const layers = Array.from(container.querySelectorAll('[data-meadow-layer]')).map((el) =>
      el.getAttribute('data-meadow-layer'),
    );
    expect(layers.indexOf('sun')).toBeLessThan(layers.indexOf('ground'));
  });

  it('paints the walking line from the near-bank token, in front of the far banks', () => {
    const { container } = renderToy();
    const ground = container.querySelector('[data-meadow-layer="ground"]');
    expect(ground).not.toBeNull();
    expect(ground!.querySelector('path')!.getAttribute('fill')).toBe(palette.bankNear);

    const layers = Array.from(container.querySelectorAll('[data-meadow-layer]')).map((el) =>
      el.getAttribute('data-meadow-layer'),
    );
    // Paint order IS depth order, and every adjacent pair overlaps rather than
    // abutting — abutting is what made the old three-stripe scene read as
    // stripes.
    if (layers.includes('bank')) {
      expect(layers.indexOf('bank')).toBeLessThan(layers.indexOf('ground'));
    }
    expect(layers.indexOf('ground')).toBeLessThan(layers.indexOf('tuft'));
  });

  it('stands grass and flowers on the line, each from its own token', () => {
    const { container } = renderToy();
    const tufts = container.querySelectorAll('[data-meadow-layer="tuft"]');
    expect(tufts.length).toBeGreaterThan(0);
    for (const tuft of tufts) {
      expect([palette.tuft, palette.tuftShade]).toContain(tuft.getAttribute('fill'));
    }

    const flowers = container.querySelectorAll('[data-meadow-layer="flower"]');
    expect(flowers.length).toBeGreaterThan(0);
    const petals = flowers[0].querySelectorAll('circle');
    expect(petals.length).toBeGreaterThan(1);
    expect(petals[0].getAttribute('fill')).toBe(palette.flower);
  });

  it('carries the foreground grass in front of everything else', () => {
    // The repoussoir — the third plane, and the strongest "this is a place" cue
    // the scene has. It is painted last so it is genuinely in front.
    const { container } = renderToy();
    const layers = Array.from(container.querySelectorAll('[data-meadow-layer]')).map((el) =>
      el.getAttribute('data-meadow-layer'),
    );
    expect(layers).toContain('fore');
    expect(layers.indexOf('fore')).toBe(layers.length - 1);
  });

  it('has no clouds, no tree and no hill stripes left in it', () => {
    /*
     * The regression guard, and the reason this suite was rewritten rather than
     * patched. Four cloud clusters and a lollipop tree were CONVEX, CLOSED and
     * inside the Sheep's own size band — 0.29 and 0.17 of a Sheep on a phone —
     * and the clouds shared the Sheep's colour class besides. The old tests
     * asserted their presence and their counts, which means the suite was
     * actively holding the defect in place.
     */
    const { container } = renderToy();
    for (const retired of ['cloud', 'tree-canopy', 'tree-trunk', 'hill-near', 'hill-distant']) {
      expect(
        container.querySelector(`[data-meadow-layer="${retired}"]`),
        `\`${retired}\` is back in the scene`,
      ).toBeNull();
    }
  });

  it('draws the Sheep with a fleece at the cast lightness and a real contour', () => {
    const { container } = renderToy();
    const wool = container.querySelector('[data-sheep-part="wool"]');
    expect(wool).not.toBeNull();
    // The first Sheep the loop sends on is `terracotta`; the fleece is its BODY
    // colour, not a near-paper cream. This is the migration in one assertion.
    expect(wool!.getAttribute('fill')).toBe(palette.terracottaBody);
    expect(wool!.getAttribute('fill')).not.toBe(palette.paper);

    // The catchlight is the paper showing through, never `#fff`.
    const shine = container.querySelector('[data-sheep-part="eye-shine"]');
    expect(shine!.getAttribute('fill')).toBe(palette.paper);

    // And it stands on something: a Critter without a contact shadow floats,
    // which is exactly what this one did above a hill it had no agreement with.
    expect(container.querySelector('[data-sheep-part="contact"]')).not.toBeNull();
  });

  it('contains no `stroke` anywhere — every line is a filled tapered path', () => {
    /*
     * The house rule with the shortest distance between "written down" and
     * "broken": SVG has no variable-width stroke, so a uniform one reads as a
     * different line language from the cast's filled contour ring, and that
     * single mismatch is what makes a scene look like a different artist drew
     * it. This Toy had ten of them — two hill paths, a trunk rect, four cloud
     * clusters, the leg rects and a stroked smile.
     */
    const { container } = renderToy();
    expect(container.querySelectorAll('[stroke]')).toHaveLength(0);
    expect(container.querySelectorAll('[stroke-width]')).toHaveLength(0);
  });
});
