import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountingSheep } from './CountingSheep';

describe('Counting Sheep', () => {
  it('renders a meadow of five tappable sheep', () => {
    render(<CountingSheep onComplete={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('draws each sheep as code SVG, with no image assets', () => {
    const { container } = render(<CountingSheep onComplete={vi.fn()} />);

    for (const sheep of screen.getAllByRole('button')) {
      expect(sheep.querySelector('svg')).toBeInTheDocument();
    }
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});
