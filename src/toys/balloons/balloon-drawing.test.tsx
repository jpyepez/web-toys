import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BalloonDrawing } from './BalloonDrawing';
import { palette, shadeOf, BALLOONS } from './palette';

/**
 * Balloons — faced Critter art tests. `BalloonDrawing` is a stateless, code-drawn
 * SVG balloon whose appearance is a PURE FUNCTION of a continuous `fill` prop
 * (0→1): limp/sad at 0, swelling and brightening to plump/happy at 1 (ADR-0002,
 * SVG primitives only). Structural pieces are tagged `data-balloon-part` so tests
 * address them without coupling to which primitive draws each one (mirrors
 * `data-piglet-part` / `data-fish-part`).
 *
 * Geometry, exact face shapes, colours, and the swell curve are on-device-tuned
 * per the slice DoD — we assert the part hooks render and that `fill` drives the
 * state (monotonic/reversible inflation, sad→happy face) through the public
 * interface, never the pixels or the curve itself.
 *
 * WHAT THE MIGRATION ADDED HERE. The old drawing passed every test in this file
 * while being an `<ellipse>` with `<circle>` eyes, a `stroke`d mouth and a
 * `stroke`d string — because none of those tests could see construction. The
 * three checks at the bottom are the ones that can: no `stroke` anywhere, a
 * contour ring under the body, and a catchlight that is the PAPER rather than
 * `#fff`. They are the difference between "this renders" and "this is drawn in
 * the house style", and every one of them was false when the file shipped.
 */
describe('Balloons — BalloonDrawing', () => {
  it('renders the structural balloon parts, each addressable via its data-balloon-part hook', () => {
    // AC #1: the faced balloon is built from addressable parts — body, eyes, a
    // mouth, and the string tying it down. We assert presence via the part
    // hooks, not counts or coordinates.
    const { container } = render(<BalloonDrawing fill={0} />);

    expect(container.querySelectorAll('[data-balloon-part="body"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-balloon-part="eye"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-balloon-part="mouth"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-balloon-part="string"]').length).toBeGreaterThan(0);
  });

  it('swells the body monotonically with fill — more fill, more inflation', () => {
    // AC #2: appearance is driven by `fill` — a HIGHER prop yields a MORE
    // inflated balloon, a LOWER prop a less-inflated one (the leak in slice #3
    // walks it back down, so the mapping must be monotonic/reversible, not a
    // binary flip). The body swells via a `scale(…)` transform on the inflating
    // group; we read that scale at fill 0, a mid value, and 1 and assert it
    // strictly increases. The exact curve is on-device-tuned — we assert the
    // DIRECTION (monotonic), never the values.
    const scaleAt = (fill: number): number => {
      const { container } = render(<BalloonDrawing fill={fill} />);
      const balloon = container.querySelector('[data-balloon-part="balloon"]');
      const transform = balloon?.getAttribute('transform') ?? '';
      const match = transform.match(/scale\(\s*([\d.]+)/);
      expect(match, `expected a scale() transform, got "${transform}"`).not.toBeNull();
      return Number(match![1]);
    };

    expect(scaleAt(0)).toBeLessThan(scaleAt(0.5));
    expect(scaleAt(0.5)).toBeLessThan(scaleAt(1));
  });

  it('transitions the face sad→happy with fill — the mouth reshapes and the blush brightens', () => {
    // AC #2: the face is driven by `fill` too — sad/limp at 0, brightening to
    // happy at 1. The expression changes by SHAPE (the mouth path), so we assert
    // the mouth `d` at fill 0 differs from fill 1 (a frown vs a smile, not a
    // binary swap of a fixed face), and that the happy blush brightens as it
    // fills (cheek opacity rises). Exact shapes/curve are on-device-tuned — we
    // assert the face MOVES with fill and the blush DIRECTION, never the paths.
    const sad = render(<BalloonDrawing fill={0} />).container;
    const happy = render(<BalloonDrawing fill={1} />).container;

    const mouthD = (c: ParentNode) =>
      c.querySelector('[data-balloon-part="mouth"]')?.getAttribute('d');
    expect(mouthD(sad)).not.toBe(mouthD(happy));

    const cheekOpacity = (c: ParentNode) =>
      Number(c.querySelector('[data-balloon-part="cheek"]')?.getAttribute('opacity') ?? '0');
    expect(cheekOpacity(sad)).toBeLessThan(cheekOpacity(happy));
  });

  it('paints the body in the supplied palette colour — distinct colours render distinctly', () => {
    // AC #3: the balloon accepts a body colour from slice #1's palette (the five
    // distinct `balloon1`…`balloon5` fills give the bunch its variety, no hidden
    // identity per the PRD). Two different palette colours must paint two
    // distinct bodies — the colour flows through to the body fill.
    const bodyFill = (color: string) =>
      render(<BalloonDrawing fill={0.5} color={color} />)
        .container.querySelector('[data-balloon-part="body"]')
        ?.getAttribute('fill');

    expect(bodyFill(palette.balloon1)).toBe(palette.balloon1);
    expect(bodyFill(palette.balloon2)).toBe(palette.balloon2);
    expect(bodyFill(palette.balloon1)).not.toBe(bodyFill(palette.balloon2));
  });

  it('is drawn from SVG primitives only — no <canvas>, no binary assets', () => {
    // AC #4 + ADR-0002: the Critter is code-drawn SVG, never a raster/canvas
    // layer or an image asset. We sweep the full fill range and assert no
    // `<canvas>` (and no `<image>`) ever smuggles in.
    for (const fill of [0, 0.5, 1]) {
      const { container } = render(<BalloonDrawing fill={fill} />);
      expect(container.querySelectorAll('canvas')).toHaveLength(0);
      expect(container.querySelectorAll('image')).toHaveLength(0);
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    }
  });

  it('draws every line as a filled tapered path — there is no stroke in the file', () => {
    /*
     * The single loudest tell that a drawing came out of a vector editor rather
     * than a hand. SVG has no variable-width stroke — `stroke-width` is one
     * value in both SVG 1.1 and SVG 2 — so a contour that swells underneath and
     * lightens on top has to be a filled ring either way, and a uniform stroke
     * beside the scene's tapered scenery reads as two different artists.
     *
     * This drawing had two of them: the mouth and the string.
     */
    for (const fill of [0, 0.5, 1]) {
      const { container } = render(<BalloonDrawing fill={fill} />);
      for (const el of container.querySelectorAll('svg *')) {
        const stroke = el.getAttribute('stroke');
        expect(stroke === null || stroke === 'none', `${el.tagName} carries a stroke`).toBe(true);
        expect(el.getAttribute('stroke-width'), `${el.tagName} carries a stroke-width`).toBeNull();
      }
    }
  });

  it('carries a contour and an occlusion derived from its own body colour', () => {
    /*
     * The house style in two claims. The contour is the collection's one dark
     * and it belongs to the figure; the occlusion is `shade()` of THIS balloon
     * — never a picked grey and never black, which kills chroma and makes mud.
     *
     * Asserted per body colour, because a shared shadow across the five would
     * mean the occlusion had stopped being derived from the balloon it sits in,
     * which is the failure a single-colour test cannot see.
     */
    for (const color of BALLOONS) {
      const { container } = render(<BalloonDrawing fill={0.6} color={color} />);
      const fills = [...container.querySelectorAll('[fill]')].map((el) => el.getAttribute('fill'));
      expect(fills, `${color}: no contour ink`).toContain(palette.contour);
      expect(fills, `${color}: no derived occlusion`).toContain(shadeOf(color));
    }
  });

  it('makes the catchlight the paper, never pure white', () => {
    // It was `hsl(0 0% 100%)`. Nothing in this collection is pure white — the
    // lightest surface in the app is the paper at L 0.94, and a highlight is
    // that paper showing through.
    const { container } = render(<BalloonDrawing fill={1} />);
    const shine = container.querySelectorAll('[data-balloon-part="eye-shine"]');
    expect(shine.length).toBeGreaterThan(0);
    for (const el of shine) {
      expect(el.getAttribute('fill')).toBe(palette.paper);
      expect(el.getAttribute('fill')).not.toBe('#ffffff');
    }
  });

  it('draws its string to wherever the scene says the peg is', () => {
    /*
     * The string used to be a fixed `M50 92 Q54 110 50 132` in the drawing's own
     * box, which meant it pointed at whatever was 40 units below the knot —
     * nothing in particular, and certainly not the peg, which was drawn in a
     * separate layer that stretched with the viewport. The Toy now hands in the
     * vector from this balloon's anchor to the scene's tether, so the string
     * lands on the stake at every aspect ratio.
     */
    const pathFor = (tail: { dx: number; dy: number }) =>
      render(<BalloonDrawing fill={0.5} tail={tail} />)
        .container.querySelector('[data-balloon-part="string"]')!
        .getAttribute('d')!;

    const short = pathFor({ dx: 0, dy: 30 });
    const long = pathFor({ dx: -40, dy: 120 });
    expect(short).not.toBe(long);
    // `dx` is the tether MINUS the anchor, so a negative dx puts the peg to the
    // left and the balloon to its right — and the string has to trail down-LEFT
    // to reach it. The sign has to survive, or half the bunch ties off on the
    // wrong side of the stake.
    const xs = (d: string) => [...d.matchAll(/(-?\d+\.?\d*),/g)].map((m) => Number(m[1]));
    expect(Math.max(...xs(long))).toBeLessThan(Math.max(...xs(short)));
  });

  it('sources every colour from the sky palette — no hardcoded HSL', () => {
    // Non-negotiable (ADR-0002, mirrors the piglet/fish): every fill/stroke in
    // `BalloonDrawing` routes through the local sky palette, no raw colour
    // strings. We sweep the fill range and check every colour-bearing attribute
    // on every node — excluding the structural `none` sentinel on stroked
    // outlines — tracing each back to a `palette` value. The body colour comes
    // IN via the prop, which is itself a palette value, so we pass one.
    const values = new Set<string>(Object.values(palette));

    for (const fill of [0, 0.5, 1]) {
      const { container } = render(<BalloonDrawing fill={fill} color={palette.balloon3} />);
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
