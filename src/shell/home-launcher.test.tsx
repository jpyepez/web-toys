import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { ToyEntry } from './registry';

function renderApp(toys: ToyEntry[], initialPath = '/') {
  const router = createAppRouter(toys, {
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('home launcher', () => {
  it('renders a Card for a registered toy, labelled from its registry metadata', async () => {
    const toys: ToyEntry[] = [
      { id: 'counting-sheep', title: 'Counting Sheep', component: () => <p>sheep</p> },
    ];

    renderApp(toys);

    expect(await screen.findByText('Counting Sheep')).toBeInTheDocument();
  });

  it('mounts a toy when its Card is tapped', async () => {
    const user = userEvent.setup();
    const toys: ToyEntry[] = [
      { id: 'counting-sheep', title: 'Counting Sheep', component: () => <p>the sheep meadow</p> },
    ];

    renderApp(toys);
    await user.click(await screen.findByText('Counting Sheep'));

    expect(await screen.findByText('the sheep meadow')).toBeInTheDocument();
  });
});
