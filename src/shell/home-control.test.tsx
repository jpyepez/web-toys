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

  it('re-entering the Toy after a mid-play exit starts fresh — no carried-over done Sheep', async () => {
    const user = userEvent.setup();
    renderAppAt(registry, '/toy/counting-sheep');

    // Partway through play: count a couple of Sheep, then bail out mid-play.
    const sheep = await screen.findAllByRole('button', { name: /Sheep \d/ });
    await user.click(sheep[0]);
    await user.click(sheep[1]);
    expect(sheep[0]).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Home' }));
    await user.click(await screen.findByRole('link', { name: 'Counting Sheep' }));

    // Re-entry is free: a fresh meadow, every Sheep un-done again.
    const replayed = await screen.findAllByRole('button', { name: /Sheep \d/ });
    expect(replayed).toHaveLength(5);
    for (const s of replayed) {
      expect(s).toHaveAttribute('aria-pressed', 'false');
    }
  });
});
