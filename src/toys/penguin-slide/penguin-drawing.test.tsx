import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PenguinDrawing, penguinPx } from './PenguinDrawing';
import { PENGUIN_KINDS, palette } from './palette';

/** The penguin Critter — its construction contract, not its exact geometry. */
describe('Penguin Slide — PenguinDrawing', () => {
  it('draws each kind with a body, belly, eyes, beak, flippers and feet', () => {
    for (const kind of PENGUIN_KINDS) {
      const { container, unmount } = render(<PenguinDrawing kind={kind} />);
      for (const part of ['body', 'belly', 'eye', 'beak', 'flipper', 'foot']) {
        expect(container.querySelector(`[data-penguin-part="${part}"]`), `${kind} ${part}`).not.toBeNull();
      }
      unmount();
    }
  });

  it('tells the five kinds apart by OUTLINE, not only by colour', () => {
    // The silhouette test, as far as jsdom can run it: every kind's body
    // outline differs, and the cues that change it are where they should be.
    const outlines = PENGUIN_KINDS.map((kind) => {
      const { container, unmount } = render(<PenguinDrawing kind={kind} />);
      const d = container.querySelector('[data-penguin-part="body"]')!.getAttribute('d');
      unmount();
      return d;
    });
    expect(new Set(outlines).size).toBe(5);
    const { container } = render(<PenguinDrawing kind="rockhopper" />);
    expect(container.querySelectorAll('[data-penguin-part="crest"]').length).toBe(2);
    const gentoo = render(<PenguinDrawing kind="gentoo" />);
    expect(gentoo.container.querySelector('[data-penguin-part="tail"]')).not.toBeNull();
  });

  it('swims with its feet hidden and a ripple at the waterline', () => {
    const { container } = render(<PenguinDrawing kind="emperor" pose="swimming" />);
    expect(container.querySelector('[data-penguin-part="foot"]')).toBeNull();
    expect(container.querySelector('[data-penguin-part="ripple"]')).not.toBeNull();
  });

  it('uses no stroke, no ellipse, and only palette colours', () => {
    const values = new Set<string>(Object.values(palette));
    for (const pose of ['standing', 'sliding', 'swimming'] as const) {
      const { container, unmount } = render(<PenguinDrawing kind="chick" pose={pose} />);
      expect(container.querySelectorAll('[stroke], ellipse')).toHaveLength(0);
      for (const el of container.querySelectorAll('[fill]')) expect(values).toContain(el.getAttribute('fill'));
      unmount();
    }
  });

  it('takes presses only on the painted penguin when interactive', () => {
    const { container } = render(<PenguinDrawing kind="fairy" interactive />);
    expect((container.querySelector('svg') as SVGElement).style.pointerEvents).toBe('none');
    expect((container.querySelector('[data-penguin-part="penguin"]') as SVGElement).style.pointerEvents.toLowerCase()).toBe('visiblepainted');
  });

  it('sizes a penguin by the viewport width AND height, within a tappable clamp', () => {
    expect(penguinPx(390, 844)).toBeCloseTo(85.8);
    expect(penguinPx(600, 600)).toBe(90);
    expect(penguinPx(1440, 900)).toBe(132);
    expect(penguinPx(300, 300)).toBe(76);
  });
});
