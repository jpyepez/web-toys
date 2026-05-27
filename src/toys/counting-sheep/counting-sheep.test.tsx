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

  it('does not fire onComplete before every sheep has been tapped', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<CountingSheep onComplete={onComplete} />);

    const sheep = screen.getAllByRole('button');
    for (const s of sheep.slice(0, sheep.length - 1)) {
      await user.click(s);
    }

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('re-tapping a done sheep does not count it again or fire onComplete early', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<CountingSheep onComplete={onComplete} />);

    const sheep = screen.getAllByRole('button');
    // Count four distinct sheep, then hammer the first one — re-taps must not
    // advance the Goal nor un-mark the sheep.
    for (const s of sheep.slice(0, 4)) {
      await user.click(s);
    }
    await user.click(sheep[0]);
    await user.click(sheep[0]);
    await user.click(sheep[0]);

    expect(onComplete).not.toHaveBeenCalled();
    expect(sheep[0]).toHaveAttribute('aria-pressed', 'true');
  });
});
