import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FishDrawing } from './FishDrawing';
import { palette } from './palette';

/**
 * Puffer Fish — Critter art tests. `FishDrawing` is drawn from SVG primitives
 * only (ADR-0002); structural pieces are tagged `data-fish-part` so tests can
 * address them without coupling to which primitive draws each one (mirrors
 * `data-sheep-part` on the Sheep). Geometry, colours, and the puff scale are
 * on-device-tuned per the slice DoD — we assert the part hooks and the
 * rest ↔ puffed art swap through the public interface, never the shapes.
 */
describe('Puffer Fish — FishDrawing', () => {
  it('renders the structural fish parts, each addressable via its data-fish-part hook', () => {
    // AC #2: the smooth round kawaii puffer is built from addressable parts —
    // body, fins + tail, large eyes, blushy cheeks, and a small smile. The
    // rest state is the default (no `puffed` prop). We assert presence via the
    // part hooks, not counts or coordinates.
    const { container } = render(<FishDrawing />);

    expect(container.querySelectorAll('[data-fish-part="body"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="fin"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="tail"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="eye"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="cheek"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-fish-part="smile"]').length).toBeGreaterThan(0);
  });

  it('swaps rest ↔ puffed art: puffed exposes the squint ^w^ eyes, rest does not', () => {
    // AC #3: the `puffed` prop swaps the art. The load-bearing, geometry-free
    // signal of the swap is the eyes — at rest they are large round eyes
    // (`data-fish-part="eye"`); puffed, they squint to a happy `^w^`
    // (`data-fish-part="eye-squint"`). The cheeks puffing out and fins
    // splaying are coordinate changes on the same hooks (visual, on-device per
    // the slice DoD), so the squint swap is what we assert through the
    // interface: each state shows its own eye art and not the other's.
    const rest = render(<FishDrawing />).container;
    expect(rest.querySelectorAll('[data-fish-part="eye"]').length).toBeGreaterThan(0);
    expect(rest.querySelectorAll('[data-fish-part="eye-squint"]')).toHaveLength(0);

    const puffed = render(<FishDrawing puffed />).container;
    expect(puffed.querySelectorAll('[data-fish-part="eye-squint"]').length).toBeGreaterThan(0);
    expect(puffed.querySelectorAll('[data-fish-part="eye"]')).toHaveLength(0);
  });

  it('renders no spike part — the silhouette stays round, even when puffed', () => {
    // AC #4: a puffer fish puffs ROUND, not spiky. The kawaii reference is
    // smooth in both states; "puffed" must read as bigger/rounder, never as
    // spikes appearing. We assert the absence of a `spike` part hook in both
    // states (the puffed state especially, where a literal puffer would grow
    // them). The body staying smooth is geometry (on-device per the slice
    // DoD); the load-bearing rule we can assert is "no spike part exists."
    const rest = render(<FishDrawing />).container;
    expect(rest.querySelectorAll('[data-fish-part="spike"]')).toHaveLength(0);

    const puffed = render(<FishDrawing puffed />).container;
    expect(puffed.querySelectorAll('[data-fish-part="spike"]')).toHaveLength(0);
  });

  it('sources every colour from the ocean palette — no hardcoded HSL', () => {
    // AC #5: every fill in `FishDrawing` routes through the local ocean
    // palette, no raw colour strings. We sweep both states and check every
    // colour-bearing attribute (`fill`/`stroke`) on every part — excluding
    // the structural `none` sentinel used on stroked outlines — traces back
    // to a `palette` value. Mirrors the Sheep's "every part traces to a
    // palette token" rule, generalised across the rest ↔ puffed swap.
    const values = new Set<string>(Object.values(palette));

    for (const puffedState of [false, true]) {
      const { container } = render(<FishDrawing puffed={puffedState} />);
      const parts = container.querySelectorAll('[data-fish-part]');
      expect(parts.length).toBeGreaterThan(0);
      for (const part of parts) {
        for (const attr of ['fill', 'stroke'] as const) {
          const colour = part.getAttribute(attr);
          if (colour === null || colour === 'none') continue;
          expect(values).toContain(colour);
        }
      }
    }
  });
});
