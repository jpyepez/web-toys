import { render } from '@testing-library/react';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from '../createAppRouter';
import type { ToyEntry } from '../registry';
import type { Sound } from '../sound';
import type { Haptics } from '../haptics';
import { registry } from '../../toys/registry';

/**
 * Stand-in Toy for tests that assert Shell-side behaviour at the `onComplete`
 * boundary: a real component whose only interaction fires onComplete. Using
 * it rather than driving Counting Sheep's full 5-tap loop keeps the assertion
 * on the Shell; that mechanic's own 5th-tap-fires-onComplete coverage lives
 * in `src/toys/counting-sheep/counting-sheep-mechanic.test.tsx`.
 */
export const finishableToy: ToyEntry = {
  id: 'finishable',
  title: 'Finishable',
  component: ({ onComplete }) => (
    <button type="button" onClick={onComplete}>
      finish
    </button>
  ),
};

/**
 * Builds the app router over a memory history at `initialPath` and renders it.
 * Toys default to the real `registry`; `sound` / `haptics` default to the
 * Shell's own (pass fakes to observe them).
 */
export function renderApp(
  initialPath = '/',
  options: { toys?: ToyEntry[]; sound?: Sound; haptics?: Haptics } = {},
) {
  const { toys = registry, ...utils } = options;
  const router = createAppRouter(toys, {
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    ...utils,
  });
  render(<RouterProvider router={router} />);
  return router;
}
