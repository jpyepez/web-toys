import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DucklingDrawing } from './DucklingDrawing';
import { LambDrawing } from './LambDrawing';
import { ChickDrawing } from './ChickDrawing';
import { CalfDrawing } from './CalfDrawing';
import { palette } from './palette';

/**
 * Muddy Puddle — the rest of the surprise cast's Critter art (muddy-puddle PRD,
 * slice #05). The four animals that join the piglet — duckling, lamb, chick,
 * calf — each drawn from SVG primitives only (ADR-0002), mirroring the piglet:
 * addressable structural parts (`data-critter-part`), a discrete `data-mud-blob`
 * mud layer (countable, never pixels — ADR-0006), exactly one tease extremity
 * (`data-critter-tease`) poking out, and a muddy↔revealed-clean swap on the
 * `cleaned` prop. Geometry, blob counts/positions, and colour tuples are
 * on-device-tuned per the slice DoD — we assert the part/blob/tease hooks and
 * the art swap through the public interface, never the shapes.
 *
 * One table, swept by every behaviour below, so each animal is held to the same
 * contract the piglet already passes. Each carries its signature feature's part
 * name (the kawaii bit that distinguishes it) so the parametrised assertions
 * stay animal-specific without coupling to geometry.
 */
const NEW_CRITTERS = [
  { id: 'duckling', Drawing: DucklingDrawing, feature: 'beak' },
  { id: 'lamb', Drawing: LambDrawing, feature: 'face' },
  { id: 'chick', Drawing: ChickDrawing, feature: 'beak' },
  { id: 'calf', Drawing: CalfDrawing, feature: 'muzzle' },
] as const;

describe('Muddy Puddle — surprise-cast Critter drawings', () => {
  it.each(NEW_CRITTERS)(
    'renders the $id from palette-sourced SVG primitives with addressable data-critter-part hooks',
    ({ Drawing, feature }) => {
      // AC #1: each new animal is a warm round kawaii Critter built from
      // addressable parts — a body, its signature feature, eyes, and blushy
      // cheeks — drawn from SVG primitives (no `<canvas>`, ADR-0002). We assert
      // the parts via their hooks (never counts or coordinates) and that every
      // fill/stroke routes through the local barnyard palette — no raw colour
      // strings (mirrors the piglet's palette discipline).
      const { container } = render(<Drawing />);

      expect(container.querySelector('canvas')).toBeNull();
      expect(container.querySelectorAll('[data-critter-part="body"]').length).toBeGreaterThan(0);
      expect(container.querySelectorAll(`[data-critter-part="${feature}"]`).length).toBeGreaterThan(0);
      expect(container.querySelectorAll('[data-critter-part="eye"]').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('[data-critter-part="cheek"]').length).toBeGreaterThan(0);

      const values = new Set<string>(Object.values(palette));
      const painted = container.querySelectorAll('[fill], [stroke]');
      expect(painted.length).toBeGreaterThan(0);
      for (const node of painted) {
        for (const attr of ['fill', 'stroke'] as const) {
          const colour = node.getAttribute(attr);
          if (colour === null || colour === 'none') continue;
          expect(values).toContain(colour);
        }
      }
    },
  );

  it.each(NEW_CRITTERS)(
    'cakes the $id in discrete mud blobs with exactly one tease, and `cleaned` reveals the clean animal',
    ({ Drawing }) => {
      // AC #1 (mud + tease) + ADR-0006: muddy is the default. The mud is a set of
      // discrete `data-mud-blob` nodes (countable, never a merged shape or a
      // `<canvas>`, so slice #3's wipe can observe coverage by node count), and
      // exactly one tease extremity (`data-critter-tease`) pokes out on top to
      // spark "who's that?". The exact blob count is on-device-tuned, so we
      // assert discreteness (more than one node), not the number. `cleaned` then
      // swaps to the reveal: all mud and the tease drop, and the same structural
      // parts (drawn underneath) stay, now fully visible. Colours stay
      // palette-sourced even in the muddy state (the mud + tease layer included).
      const muddy = render(<Drawing />).container;

      expect(muddy.querySelector('canvas')).toBeNull();
      expect(muddy.querySelectorAll('[data-mud-blob]').length).toBeGreaterThan(1);
      expect(muddy.querySelectorAll('[data-critter-tease]')).toHaveLength(1);

      const values = new Set<string>(Object.values(palette));
      for (const node of muddy.querySelectorAll('[fill], [stroke]')) {
        for (const attr of ['fill', 'stroke'] as const) {
          const colour = node.getAttribute(attr);
          if (colour === null || colour === 'none') continue;
          expect(values).toContain(colour);
        }
      }

      const clean = render(<Drawing cleaned />).container;
      expect(clean.querySelectorAll('[data-mud-blob]')).toHaveLength(0);
      expect(clean.querySelectorAll('[data-critter-tease]')).toHaveLength(0);
      expect(clean.querySelectorAll('[data-critter-part="body"]').length).toBeGreaterThan(0);
    },
  );
});
