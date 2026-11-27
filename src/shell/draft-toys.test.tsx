import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { visibleToys, type ToyEntry } from './registry';
import { renderApp } from './test-support/renderApp';

// A Draft Toy has a Card only in a Preview Deployment (issue 56): the owner
// plays it from the PR's Vercel link, and merging doesn't put it on Home in
// production until the ticket that ships it removes `draft`.
const sketch: ToyEntry = {
  id: 'sketch',
  title: 'Sketch',
  component: () => <p>the sketch Toy</p>,
  draft: true,
};
const live: ToyEntry = {
  id: 'live',
  title: 'Live',
  component: () => <p>the live Toy</p>,
};
const toys = [sketch, live];

const home = () => screen.findByText('Tiny toys for tiny humans');

describe('visibleToys', () => {
  it('keeps Draft Toys in a Preview Deployment', () => {
    expect(visibleToys(toys, 'preview')).toEqual([sketch, live]);
  });

  it('drops Draft Toys in production and keeps live ones', () => {
    expect(visibleToys(toys, 'production')).toEqual([live]);
  });
});

describe('Draft Toys in a Preview Deployment', () => {
  it("renders the Draft Toy's Card with a draft mark", async () => {
    renderApp('/', { toys: visibleToys(toys, 'preview') });

    const card = await screen.findByRole('link', { name: /Sketch/ });
    expect(card).toHaveTextContent(/draft/i);
  });

  it("mounts the Draft Toy from its route", async () => {
    renderApp('/toy/sketch', { toys: visibleToys(toys, 'preview') });

    expect(await screen.findByText('the sketch Toy')).toBeInTheDocument();
  });

  it('puts no draft mark on a live Toy', async () => {
    renderApp('/', { toys: visibleToys(toys, 'preview') });

    const card = await screen.findByRole('link', { name: /Live/ });
    expect(card).not.toHaveTextContent(/draft/i);
  });
});

describe('Draft Toys in production', () => {
  it('has no Card for a Draft Toy', async () => {
    renderApp('/', { toys: visibleToys(toys, 'production') });

    expect(await screen.findByRole('link', { name: /Live/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Sketch/ })).toBeNull();
  });

  it("sends the Draft Toy's route to Home without mounting it", async () => {
    const router = renderApp('/toy/sketch', { toys: visibleToys(toys, 'production') });

    expect(await home()).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.queryByText('the sketch Toy')).toBeNull();
  });
});

describe('an unknown Toy id', () => {
  it('goes to Home', async () => {
    const router = renderApp('/toy/no-such-toy', { toys });

    expect(await home()).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});
