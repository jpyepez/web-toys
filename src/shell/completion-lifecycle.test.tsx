import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { ToyEntry } from './registry';
import { registry } from '../toys/registry';

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

  it('reveals the end state (Play again / Home) only after the celebration beat', async () => {
    const user = userEvent.setup();
    renderAppAt([finishableToy], '/toy/finishable');

    await user.click(await screen.findByRole('button', { name: 'finish' }));

    // Celebration is up, but the end-state controls have not arrived yet.
    await screen.findByText('You did it!');
    expect(screen.queryByRole('button', { name: 'Play again' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Home' })).toBeNull();

    // After the beat, the end state offers Play again and Home.
    expect(
      await screen.findByRole('button', { name: 'Play again' }, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });

  it('returns to the launcher when Home is tapped from the end state', async () => {
    const user = userEvent.setup();
    renderAppAt([finishableToy], '/toy/finishable');

    await user.click(await screen.findByRole('button', { name: 'finish' }));
    await user.click(
      await screen.findByRole('button', { name: 'Home' }, { timeout: 2000 }),
    );

    // The launcher is back: the Toy's Card is shown and the Completion is gone.
    expect(await screen.findByRole('link', { name: 'Finishable' })).toBeInTheDocument();
    expect(screen.queryByText('You did it!')).toBeNull();
  });

  it('resets Counting Sheep on Play again — all sheep tappable, Goal re-reachable', async () => {
    const user = userEvent.setup();
    renderAppAt(registry, '/toy/counting-sheep');

    // Reach the Goal: tap all five sheep.
    for (const sheep of await screen.findAllByRole('button', { name: /Sheep \d/ })) {
      await user.click(sheep);
    }

    await user.click(
      await screen.findByRole('button', { name: 'Play again' }, { timeout: 2000 }),
    );

    // Fresh meadow: five sheep, every one un-done again.
    const replayed = await screen.findAllByRole('button', { name: /Sheep \d/ });
    expect(replayed).toHaveLength(5);
    for (const sheep of replayed) {
      expect(sheep).toHaveAttribute('aria-pressed', 'false');
    }

    // The Goal can be reached again, firing onComplete a second time.
    for (const sheep of replayed) {
      await user.click(sheep);
    }
    expect(await screen.findByText('You did it!')).toBeInTheDocument();
  });

  it('celebrates with a code-drawn confetti burst — no image assets (ADR-0002)', async () => {
    const user = userEvent.setup();
    renderAppAt([finishableToy], '/toy/finishable');

    await user.click(await screen.findByRole('button', { name: 'finish' }));

    const burst = await screen.findByTestId('confetti');
    expect(burst).toBeInTheDocument();
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });

  it('never reaches the end state without onComplete — no timer or fail path', async () => {
    renderAppAt([finishableToy], '/toy/finishable');

    // The Toy is in play, and stays there well past the celebration-beat
    // window without anyone firing onComplete: nothing but the Goal advances
    // the lifecycle (ADR-0001 — no timer cutoff, no fail state).
    expect(await screen.findByRole('button', { name: 'finish' })).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 900));

    expect(screen.queryByText('You did it!')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Play again' })).toBeNull();
    expect(screen.getByRole('button', { name: 'finish' })).toBeInTheDocument();
  });
});
