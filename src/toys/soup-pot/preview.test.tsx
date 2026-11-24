import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Preview } from './Preview';
import { palette } from './palette';

/**
 * Soup Pot — Card preview. The composition is not pinned: it comes out of
 * `buildKitchen`, so pinning it would pin the generator twice. What is asserted
 * is the contract — decorative, the real cast, the real scene, every colour from
 * this Toy's own palette, and no `stroke`.
 */
describe('Soup Pot — Preview', () => {
  it('renders a decorative SVG, hidden from screen readers', () => {
    const { container } = render(<Preview />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the real mice around a real, half-cooked pot', () => {
    const { container } = render(<Preview />);
    expect(container.querySelectorAll('[data-mouse-part="head"]')).toHaveLength(3);
    expect(container.querySelector('[data-kitchen-layer="pot"]')).not.toBeNull();
    expect(container.querySelector('[data-kitchen-layer="ladle"]')).not.toBeNull();
    expect(container.querySelector('[data-soup-bubbles]')).not.toBeNull();
  });

  it('sources every colour from the Soup Pot palette', () => {
    const values = new Set<string>(Object.values(palette));
    const { container } = render(<Preview />);
    for (const el of container.querySelectorAll('svg *')) {
      const fill = el.getAttribute('fill');
      if (fill && fill !== 'none' && !fill.startsWith('url(')) expect(values).toContain(fill);
    }
  });

  it('contains no `stroke` and no `ellipse` — every line is a filled path', () => {
    const { container } = render(<Preview />);
    expect(container.querySelectorAll('[stroke], [stroke-width], ellipse')).toHaveLength(0);
  });
});
