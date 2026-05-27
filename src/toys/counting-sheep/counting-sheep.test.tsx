import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('marks a sheep as done when it is tapped', async () => {
    const user = userEvent.setup();
    render(<CountingSheep onComplete={vi.fn()} />);

    const sheep = screen.getByRole('button', { name: 'Sheep 1' });
    expect(sheep).toHaveAttribute('aria-pressed', 'false');

    await user.click(sheep);

    expect(sheep).toHaveAttribute('aria-pressed', 'true');
  });

  it('fires onComplete exactly once when all five distinct sheep are tapped', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<CountingSheep onComplete={onComplete} />);

    for (const sheep of screen.getAllByRole('button')) {
      await user.click(sheep);
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
