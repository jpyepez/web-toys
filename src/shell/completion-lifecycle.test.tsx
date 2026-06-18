import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

  it('shows the end state (Play again / Home) from the moment the celebration mounts', async () => {
    // The polish PRD slice #06 delay (`CELEBRATION_MS = 2200`) retired during
    // the mobile-rethink PRD's on-device kid-handoff DoD — its load-bearing
    // justification was "cover the slice #05 Toy-side group-Outro
    // choreography", and the mobile-rethink PRD explicitly retired that
    // group-Outro in favour of the per-Sheep exit. The end-state controls
    // now render from Completion's mount; the Confetti burst plays alongside
    // them. Scoped to `end-state` so we don't collide with the chrome Home
    // pill that stays visible during the celebration (layered-concurrent
    // contract — ADR-0001 amendment).
    const user = userEvent.setup();
    renderAppAt([finishableToy], '/toy/finishable');

    await user.click(await screen.findByRole('button', { name: 'finish' }));

    await screen.findByText('You did it!');
    const endState = await screen.findByTestId('end-state');
    expect(within(endState).getByRole('button', { name: 'Play again' })).toBeInTheDocument();
    expect(within(endState).getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });

  it('returns to the launcher when Home is tapped from the end state', async () => {
    const user = userEvent.setup();
    renderAppAt([finishableToy], '/toy/finishable');

    await user.click(await screen.findByRole('button', { name: 'finish' }));
    const endState = await screen.findByTestId('end-state', undefined, { timeout: 3000 });
    await user.click(within(endState).getByRole('button', { name: 'Home' }));

    // The launcher is back: the Toy's Card is shown and the Completion is gone.
    expect(await screen.findByRole('link', { name: 'Finishable' })).toBeInTheDocument();
    expect(screen.queryByText('You did it!')).toBeNull();
  });

  it('resets the Toy on Play again — Goal re-reachable from a fresh start', async () => {
    // Shell behaviour: tapping Play again bumps the `playId` key in
    // ToyHost, which forces a fresh Toy mount (any mid-Goal state thrown
    // away). The mobile-rethink Counting Sheep mechanic makes driving 5
    // taps to Completion a multi-second fake-timer walk; the Shell's
    // reset responsibility is Counting-Sheep-agnostic, so this test uses
    // `finishableToy` to assert the contract directly. Counting Sheep's
    // own reset (loop back to the first arriving Sheep) is covered by
    // the home-control re-entry test, which exercises the equivalent
    // route-driven remount.
    const user = userEvent.setup();
    renderAppAt([finishableToy], '/toy/finishable');

    // Reach the Goal.
    await user.click(await screen.findByRole('button', { name: 'finish' }));
    const endState = await screen.findByTestId('end-state', undefined, { timeout: 3000 });
    await user.click(within(endState).getByRole('button', { name: 'Play again' }));

    // After Play again, the Toy is mounted fresh and the Goal can be reached
    // again — `onComplete` fires a second time, summoning a second
    // celebration overlay.
    expect(screen.queryByText('You did it!')).toBeNull();
    await user.click(await screen.findByRole('button', { name: 'finish' }));
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

  // The polish PRD slice #06 "celebration beat covers ~2200ms" test retires
  // with the delay itself. Its load-bearing rule ("end state hidden until
  // the Toy-side Outro plays") binds to a feature (the slice #05 group-Outro)
  // that the mobile-rethink PRD explicitly retired. The end-state-from-mount
  // contract is asserted by the rewritten test above; pinning a specific
  // delay-shape any further would re-couple to a retired feature.

  it('holds the celebration for winDelayMs after onComplete, then shows it', async () => {
    // A Toy with a declared win-animation beat: `onComplete` fires the instant
    // the Goal is met (at the START of its win animation), and the Shell holds
    // the Completion overlay for `winDelayMs` so the critter finishes its dance
    // before the dialogue lands (e.g. balloons floating off over FLOAT_AWAY_MS).
    const delayedToy: ToyEntry = { ...finishableToy, winDelayMs: 300 };
    const user = userEvent.setup();
    renderAppAt([delayedToy], '/toy/finishable');

    await user.click(await screen.findByRole('button', { name: 'finish' }));

    // Synchronously after the Goal is met the hold is still running: the win
    // animation plays on, no dialogue yet.
    expect(screen.queryByText('You did it!')).toBeNull();

    // Once the hold elapses, the celebration lands.
    expect(await screen.findByText('You did it!')).toBeInTheDocument();
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
