import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import { finishableToy } from './test-support/renderApp';
import { isStandalone } from './standalone';

/**
 * Issue #59: in the installed app, the OS edge swipe must never move between
 * Home and a Toy. With flat history every Shell navigation replaces the
 * current entry, so there is nothing behind or ahead to swipe to. In a
 * browser tab, navigation pushes as normal so the back button still works.
 */
function renderWith(flatHistory: boolean) {
  const history = createMemoryHistory({ initialEntries: ['/'] });
  const router = createAppRouter([finishableToy], { history, flatHistory });
  render(<RouterProvider router={router} />);
  return history;
}

async function homeToToyToHome() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('link', { name: 'Finishable' }));
  await user.click(await screen.findByRole('button', { name: 'Home' }));
  await user.click(await screen.findByRole('link', { name: 'Finishable' }));
  // Completion's Home is the other way out of a Toy.
  await user.click(await screen.findByRole('button', { name: 'finish' }));
  const endState = await screen.findByTestId('end-state');
  await user.click(within(endState).getByRole('button', { name: 'Home' }));
  await screen.findByRole('link', { name: 'Finishable' });
}

describe('Flat history (installed app)', () => {
  it('keeps history one entry deep across Home ↔ Toy navigation', async () => {
    const history = renderWith(true);
    await homeToToyToHome();
    expect(history.length).toBe(1);
    expect(history.location.pathname).toBe('/');
  });

  it('pushes as normal in a browser tab, so the back button still works', async () => {
    const history = renderWith(false);
    await homeToToyToHome();
    expect(history.length).toBe(5);
  });
});

describe('isStandalone', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is true when the display-mode media query matches', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(display-mode: standalone)' }));
    expect(isStandalone()).toBe(true);
  });

  it('is true for iOS home-screen apps via navigator.standalone', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('navigator', { ...navigator, standalone: true });
    expect(isStandalone()).toBe(true);
  });

  it('is false in a browser tab', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(isStandalone()).toBe(false);
  });
});
