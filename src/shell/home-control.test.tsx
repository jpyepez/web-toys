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

    // The Toy is in play (its current Sheep is on stage — one at a time
    // under the mobile-rethink mechanic, PRD slice #01)...
    expect(await screen.findByRole('button', { name: 'Sheep' })).toBeInTheDocument();
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

  it('re-entering the Toy after a mid-play exit starts fresh — no carried-over loop state', async () => {
    // The Shell behaviour under test: navigating Home then back to the Toy
    // remounts it. Under the mobile-rethink mechanic that "fresh" looks like
    // a fresh single Sheep arriving (no carried-over dismiss counter, no
    // mid-dismiss state), and the Shell's celebration overlay isn't present
    // either (re-entry isn't a Completion).
    const user = userEvent.setup();
    renderAppAt(registry, '/toy/counting-sheep');

    // Mid-play: tap the current Sheep (drives it into dismissing).
    await user.click(await screen.findByRole('button', { name: 'Sheep' }));

    // Bail to launcher and back to the Toy.
    await user.click(screen.getByRole('button', { name: 'Home' }));
    await user.click(await screen.findByRole('link', { name: 'Counting Sheep' }));

    // Re-entry is free: a fresh Sheep is on stage and there's no leftover
    // Completion overlay from before.
    expect(await screen.findByRole('button', { name: 'Sheep' })).toBeInTheDocument();
    expect(screen.queryByText('You did it!')).toBeNull();
  });
});
