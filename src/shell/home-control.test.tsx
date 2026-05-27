import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { ToyEntry } from './registry';
import { registry } from '../toys/registry';

function renderAppAt(toys: ToyEntry[], initialPath: string) {
  const router = createAppRouter(toys, {
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('Always-visible Home control', () => {
  it('shows a Home control while a Toy is mounted and playing', async () => {
    renderAppAt(registry, '/toy/counting-sheep');

    // The Toy is in play (its Sheep are on screen)...
    expect(await screen.findAllByRole('button', { name: /Sheep \d/ })).toHaveLength(5);
    // ...and the Shell offers an always-visible way out, mid-play.
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });

  it('returns to the launcher on a single tap — no confirmation gate', async () => {
    const user = userEvent.setup();
    renderAppAt(registry, '/toy/counting-sheep');

    await user.click(await screen.findByRole('button', { name: 'Home' }));

    // One tap lands us straight back on the launcher: the Toy's Card is shown,
    // with no intermediate confirmation/gate to clear (PRD: no parental gate).
    expect(
      await screen.findByRole('link', { name: 'Counting Sheep' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
