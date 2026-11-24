import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SoupPot } from './SoupPot';
import { GOAL_ANGLE } from './stir';
import { palette } from './palette';

/**
 * Soup Pot's scene, stage beats and Outro, observed at the boundary: which
 * layers are present at which stage, never how they look.
 */

const pt = (a: number) => ({ clientX: 100 * Math.cos(a), clientY: 100 * Math.sin(a) });

const setup = () => {
  const onComplete = vi.fn();
  render(<SoupPot onComplete={onComplete} />);
  const el = screen.getByRole('main');
  let at = 0;
  const stir = (total: number) => {
    fireEvent.pointerDown(el, { pointerId: 1, ...pt(at) });
    for (let done = 0; done < total; ) {
      const step = Math.min(0.2, total - done);
      at += step;
      done += step;
      fireEvent.pointerMove(el, { pointerId: 1, ...pt(at) });
    }
    fireEvent.pointerUp(el, { pointerId: 1 });
  };
  return { el, onComplete, stir };
};

describe('Soup Pot — scene and Outro', () => {
  it('fills the viewport, so the pot at the frame centre is the centre the Stir measures', () => {
    const { el } = setup();
    expect(el.style.position).toBe('fixed');
    expect(el.style.inset).toBe('0px');
    expect(el.style.touchAction).toBe('none');
  });

  it('draws the counter, the pot, the soup, the ladle and three mice', () => {
    const { el } = setup();
    for (const layer of ['counter', 'towel', 'pot', 'soup', 'ladle']) {
      expect(el.querySelector(`[data-kitchen-layer="${layer}"]`), layer).not.toBeNull();
    }
    expect(el.querySelectorAll('[data-mouse]')).toHaveLength(3);
  });

  it('starts as plain broth: no bubbles, no steam', () => {
    const { el } = setup();
    expect(el.querySelector('[data-soup-bubbles]')).toBeNull();
    expect(el.querySelector('[data-kitchen-layer="steam"]')).toBeNull();
  });

  it('bubbles from the second beat and steams from the third', () => {
    const { el, stir } = setup();
    stir(GOAL_ANGLE / 2 + 0.05);
    expect(el.querySelector('[data-soup-bubbles]')).not.toBeNull();
    expect(el.querySelector('[data-kitchen-layer="steam"]')).toBeNull();
    stir(GOAL_ANGLE / 4);
    expect(el.querySelector('[data-kitchen-layer="steam"]')).not.toBeNull();
  });

  it('bursts the blorp and closes the mice\'s eyes happily once the soup is ready', () => {
    const { el, stir, onComplete } = setup();
    expect(el.querySelector('[data-kitchen-layer="blorp"]')).toBeNull();
    stir(GOAL_ANGLE + 0.3);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(el.querySelector('[data-kitchen-layer="blorp"]')).not.toBeNull();
    expect(el.querySelectorAll('[data-mouse-part="eye"] circle')).toHaveLength(0);
  });

  it('uses no stroke and no ellipse, and only palette colours', () => {
    const { el, stir } = setup();
    stir(GOAL_ANGLE + 0.3);
    const values = new Set<string>(Object.values(palette));
    expect(el.querySelectorAll('[stroke], [stroke-width], ellipse')).toHaveLength(0);
    for (const node of el.querySelectorAll('svg [fill]')) expect(values).toContain(node.getAttribute('fill'));
  });
});
