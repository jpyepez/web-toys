import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ToyEntry } from './registry';
import { renderApp } from './test-support/renderApp';

/**
 * A stand-in Toy whose final-frame content is unmistakable in the DOM, so we
 * can assert it co-exists with the Shell's celebration overlay rather than
 * being unmounted the moment `onComplete` fires (the ADR-0001 amendment).
 */
const finalFrameToy: ToyEntry = {
  id: 'final-frame',
  title: 'Final Frame',
  component: ({ onComplete }) => (
    <div>
      <p>the meadow</p>
      <button type="button" onClick={onComplete}>
        finish
      </button>
    </div>
  ),
};

describe('Shell layered-concurrent lifecycle', () => {
  it('keeps the Toy mounted under the Shell celebration overlay after onComplete', async () => {
    const user = userEvent.setup();
    renderApp('/toy/final-frame', { toys: [finalFrameToy] });

    // The Toy is showing its world. Trigger Goal-met.
    await user.click(await screen.findByRole('button', { name: 'finish' }));

    // The Shell's celebration overlay is present — the architectural marker
    // that Completion has taken over.
    expect(await screen.findByText('You did it!')).toBeInTheDocument();

    // ...and the Toy's content is still in the DOM at the same time. This is
    // the contract change: the Toy is not unmounted at onComplete; the overlay
    // layers on top of it (ADR-0001 amendment — layered-concurrent).
    expect(screen.getByText('the meadow')).toBeInTheDocument();
  });
});
