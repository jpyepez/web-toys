import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FrogDrawing, frogPx } from './FrogDrawing';
import { PadDrawing } from './PadDrawing';
import { palette } from './palette';

/** The frog Critter and the pads — their construction contract, not exact geometry. */
describe('Pond Leap — FrogDrawing', () => {
  it('draws a body, belly, eye bumps, eyes, thighs, arms, feet, nostrils and a mouth', () => {
    const { container } = render(<FrogDrawing />);
    for (const part of ['body', 'belly', 'bump', 'eye', 'thigh', 'arm', 'foot', 'nostril', 'mouth']) {
      expect(container.querySelector(`[data-frog-part="${part}"]`), part).not.toBeNull();
    }
  });

  it('is not mirrored: its two eye bumps differ', () => {
    const { container } = render(<FrogDrawing />);
    const [a, b] = [...container.querySelectorAll('[data-frog-part="bump"] path:nth-child(2)')].map((p) => p.getAttribute('d'));
    expect(a).not.toBe(b);
  });

  it('closes its eyes happily in the Outro pose', () => {
    const { container } = render(<FrogDrawing pose="happy" />);
    expect(container.querySelector('[data-frog-part="eye"] circle')).toBeNull();
    expect(container.querySelectorAll('[data-frog-part="eye"]')).toHaveLength(2);
  });

  it('uses no stroke, no ellipse, and only palette colours', () => {
    const values = new Set<string>(Object.values(palette));
    for (const node of [<FrogDrawing key="a" />, <FrogDrawing key="b" pose="happy" />, <PadDrawing key="c" index={2} bloom />]) {
      const { container, unmount } = render(node);
      expect(container.querySelectorAll('[stroke], [stroke-width], ellipse')).toHaveLength(0);
      for (const el of container.querySelectorAll('[fill]')) expect(values).toContain(el.getAttribute('fill'));
      unmount();
    }
  });

  it('sizes the frog the way FROG_WIDTH does: 17vw, from 60 to 92 px', () => {
    expect(frogPx(300)).toBe(60);
    expect(frogPx(390)).toBeCloseTo(66.3);
    expect(frogPx(1440)).toBe(92);
  });
});

describe('Pond Leap — PadDrawing', () => {
  it('draws no two pads alike', () => {
    const shapes = [0, 1, 2].map((i) => {
      const { container, unmount } = render(<PadDrawing index={i} />);
      const d = container.querySelector('[data-pad-figure] path:nth-of-type(2)')?.getAttribute('d');
      unmount();
      return d;
    });
    expect(new Set(shapes).size).toBe(3);
  });

  it('crowns only the last pad with blossoms', () => {
    expect(render(<PadDrawing index={5} bloom />).container.querySelectorAll('[data-pad-blossom]').length).toBeGreaterThan(0);
    expect(render(<PadDrawing index={1} />).container.querySelector('[data-pad-blossom]')).toBeNull();
  });
});
