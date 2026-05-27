import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { ToyEntry } from './registry';
import { registry } from '../toys/registry';

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

  it('renders exactly one Card per registered toy', async () => {
    const toys: ToyEntry[] = [
      { id: 'counting-sheep', title: 'Counting Sheep', component: () => <p>sheep</p> },
      { id: 'bubble-pop', title: 'Bubble Pop', component: () => <p>bubbles</p> },
    ];

    renderApp(toys);

    expect(await screen.findByText('Counting Sheep')).toBeInTheDocument();
    expect(screen.getByText('Bubble Pop')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});

describe('registered toys', () => {
  it('registers Counting Sheep as the one launchable Card', async () => {
    const user = userEvent.setup();
    renderApp(registry);

    const card = await screen.findByText('Counting Sheep');
    expect(screen.getAllByRole('link')).toHaveLength(1);

    await user.click(card);

    // The launcher is gone and the toy's meadow is mounted in its place.
    expect(await screen.findByRole('button', { name: 'Sheep 1' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
