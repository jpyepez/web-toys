import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountingSheep } from './CountingSheep';

describe('Counting Sheep', () => {
  it('renders a meadow of five tappable sheep', () => {
    render(<CountingSheep onComplete={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(5);
  });
});
