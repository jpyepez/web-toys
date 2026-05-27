import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { ToyEntry } from './registry';

/** A stand-in Toy: a real component whose only interaction fires onComplete. */
const finishableToy: ToyEntry = {
  id: 'finishable',
  title: 'Finishable',
  component: ({ onComplete }) => (
    <button type="button" onClick={onComplete}>
      finish
    </button>
  ),
};

function renderAppAt(toys: ToyEntry[], initialPath: string) {
  const router = createAppRouter(toys, {
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('Shell Completion lifecycle', () => {
  it('shows the celebration when the mounted Toy fires onComplete', async () => {
    const user = userEvent.setup();
    renderAppAt([finishableToy], '/toy/finishable');

    await user.click(await screen.findByRole('button', { name: 'finish' }));

    expect(await screen.findByText('You did it!')).toBeInTheDocument();
  });
});
