import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Preview } from './Preview';
import { palette } from './palette';

/**
 * Penguin Slide — Card preview. The composition is not pinned here: it comes out
 * of `buildFloe`, so pinning it would pin the generator twice. What is asserted
 * is the contract — decorative, the real cast, the real scene, every colour from
 * this Toy's own palette, and no `stroke`.
 */
describe('Penguin Slide — Preview', () => {
  it('renders a decorative SVG, hidden from screen readers', () => {
    const { container } = render(<Preview />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the real penguins, standing and swimming', () => {
    const { container } = render(<Preview />);
    expect(container.querySelectorAll('[data-penguin-part="body"]')).toHaveLength(5);
    expect(container.querySelectorAll('[data-penguin-part="ripple"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('ellipse')).toHaveLength(0);
  });

  it('draws the generated scene, not a second drawing of it', () => {
    const { container } = render(<Preview />);
    const longest = Math.max(...[...container.querySelectorAll('[data-ice-layer] path')].map((p) => (p.getAttribute('d') ?? '').length));
    expect(longest).toBeGreaterThan(400);
  });

  it('sources every colour from the penguin palette', () => {
    const values = new Set<string>(Object.values(palette));
    const { container } = render(<Preview />);
    for (const el of container.querySelectorAll('svg *')) {
      const fill = el.getAttribute('fill');
      if (fill && fill !== 'none' && !fill.startsWith('url(')) expect(values).toContain(fill);
    }
    for (const stop of container.querySelectorAll('stop')) expect(values).toContain(stop.getAttribute('stop-color'));
  });

  it('contains no `stroke` — every line is a filled path', () => {
    const { container } = render(<Preview />);
    expect(container.querySelectorAll('[stroke]')).toHaveLength(0);
    expect(container.querySelectorAll('[stroke-width]')).toHaveLength(0);
  });
});
