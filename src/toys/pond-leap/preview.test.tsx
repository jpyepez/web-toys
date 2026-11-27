import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Preview } from './Preview';
import { palette } from './palette';

describe('Pond Leap — Preview', () => {
  it('renders a decorative SVG, hidden from screen readers', () => {
    const { container } = render(<Preview />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the real frog, on real pads', () => {
    const { container } = render(<Preview />);
    expect(container.querySelector('[data-frog-figure]')).not.toBeNull();
    expect(container.querySelectorAll('[data-pad-figure]').length).toBeGreaterThanOrEqual(2);
  });

  it('sources every colour from the Pond Leap palette, with no stroke', () => {
    const values = new Set<string>(Object.values(palette));
    const { container } = render(<Preview />);
    for (const el of container.querySelectorAll('svg *')) {
      const fill = el.getAttribute('fill');
      if (fill && fill !== 'none') expect(values).toContain(fill);
    }
    expect(container.querySelectorAll('[stroke], [stroke-width], ellipse')).toHaveLength(0);
  });
});
