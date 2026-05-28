import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { ToyEntry } from './registry';

function renderApp(toys: ToyEntry[], initialPath = '/') {
  const router = createAppRouter(toys, {
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  render(<RouterProvider router={router} />);
}

describe('Shell safe-area insets', () => {
  it("insets the Shell root from the device's top unsafe area so chrome is not clipped under the notch", async () => {
    const toys: ToyEntry[] = [
      { id: 'counting-sheep', title: 'Counting Sheep', component: () => <p>sheep</p> },
    ];

    renderApp(toys);
    // Wait for the launcher to mount so we know the Shell frame is on the page.
    await screen.findByText('Counting Sheep');

    // The Shell's root frame respects iOS standalone safe areas: in this slice we
    // assert the top side as the tracer. Other sides arrive in the next cycle.
    const shellRoot = screen.getByTestId('shell-root');
    expect(shellRoot).toHaveStyle({ paddingTop: 'env(safe-area-inset-top)' });
  });
});
