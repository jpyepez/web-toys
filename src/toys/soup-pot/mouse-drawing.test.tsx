import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MouseDrawing, mousePx } from './MouseDrawing';
import { MOUSE_KINDS, palette } from './palette';

/** The mouse Critter — its construction contract, not its exact geometry. */
describe('Soup Pot — MouseDrawing', () => {
  it('draws each kind with a head, ears, muzzle, eyes, nose, whiskers, paws and a tail', () => {
    for (const kind of MOUSE_KINDS) {
      const { container, unmount } = render(<MouseDrawing kind={kind} />);
      for (const part of ['head', 'ear', 'muzzle', 'eye', 'nose', 'whisker', 'paw', 'tail']) {
        expect(container.querySelector(`[data-mouse-part="${part}"]`), `${kind} ${part}`).not.toBeNull();
      }
      unmount();
    }
  });

  it('tells the three kinds apart by OUTLINE, not only by colour', () => {
    // The silhouette test, as far as jsdom can run it: the ears differ in every
    // kind, and only the tufted mouse has a tuft.
    const ears = MOUSE_KINDS.map((kind) => {
      const { container, unmount } = render(<MouseDrawing kind={kind} />);
      const d = [...container.querySelectorAll('[data-mouse-part="ear"] path:nth-child(2)')].map((p) => p.getAttribute('d')).join('|');
      unmount();
      return d;
    });
    expect(new Set(ears).size).toBe(3);
    const tuft = render(<MouseDrawing kind="tuft" />);
    expect(tuft.container.querySelector('[data-mouse-part="tuft"]')).not.toBeNull();
    const round = render(<MouseDrawing kind="roundEars" />);
    expect(round.container.querySelector('[data-mouse-part="tuft"]')).toBeNull();
  });

  it('closes its eyes happily in the Outro pose', () => {
    const { container } = render(<MouseDrawing kind="floppy" pose="happy" />);
    expect(container.querySelector('[data-mouse-part="eye"] circle')).toBeNull();
    expect(container.querySelectorAll('[data-mouse-part="eye"]')).toHaveLength(2);
  });

  it('uses no stroke, no ellipse, and only palette colours', () => {
    const values = new Set<string>(Object.values(palette));
    for (const pose of ['watching', 'happy'] as const) {
      for (const kind of MOUSE_KINDS) {
        const { container, unmount } = render(<MouseDrawing kind={kind} pose={pose} />);
        expect(container.querySelectorAll('[stroke], ellipse')).toHaveLength(0);
        for (const el of container.querySelectorAll('[fill]')) expect(values).toContain(el.getAttribute('fill'));
        unmount();
      }
    }
  });

  it('takes presses only on the painted mouse when interactive', () => {
    const { container } = render(<MouseDrawing kind="tuft" interactive />);
    expect((container.querySelector('svg') as SVGElement).style.pointerEvents).toBe('none');
    expect((container.querySelector('[data-mouse-part="mouse"]') as SVGElement).style.pointerEvents.toLowerCase()).toBe('visiblepainted');
  });

  it('sizes a mouse by the viewport width AND height, within a tappable clamp', () => {
    expect(mousePx(390, 844)).toBeCloseTo(85.8);
    expect(mousePx(600, 600)).toBe(90);
    expect(mousePx(1440, 900)).toBe(132);
    expect(mousePx(300, 300)).toBe(76);
  });
});
