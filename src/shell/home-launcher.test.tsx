import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { ToyEntry } from './registry';
import { palette } from './tokens';
import { registry } from '../toys/registry';

function renderApp(toys: ToyEntry[], initialPath = '/') {
  const router = createAppRouter(toys, {
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('home launcher', () => {
  it('renders a Card for a registered toy, labelled from its registry metadata', async () => {
    const toys: ToyEntry[] = [
      { id: 'counting-sheep', title: 'Counting Sheep', component: () => <p>sheep</p> },
    ];

    renderApp(toys);

    expect(await screen.findByText('Counting Sheep')).toBeInTheDocument();
  });

  it('mounts a toy when its Card is tapped', async () => {
    const user = userEvent.setup();
    const toys: ToyEntry[] = [
      { id: 'counting-sheep', title: 'Counting Sheep', component: () => <p>the sheep meadow</p> },
    ];

    renderApp(toys);
    await user.click(await screen.findByText('Counting Sheep'));

    expect(await screen.findByText('the sheep meadow')).toBeInTheDocument();
  });

  it("paints a Toy's Card with the solid tint declared in its registry entry", async () => {
    // Acceptance criterion #2 — the per-Toy palette is registry-driven: each
    // entry's declared `tint` (a key into the design-tokens palette) resolves
    // to the Card's solid surface colour. Post on-device review of the
    // original gradient mechanism, the Card moved to a minimal solid-tint
    // surface so the small preview-scene + serif title carry the visual
    // load. The literal HSL values live in tokens, so we compare against
    // `palette.sheepWool` rather than a hardcoded CSS string — that keeps
    // the test decoupled from the colour values and pinned to the *mapping*.
    const toys: ToyEntry[] = [
      {
        id: 'counting-sheep',
        title: 'Counting Sheep',
        component: () => <p>sheep</p>,
        tint: 'sheepWool',
      },
    ];

    renderApp(toys);

    const card = await screen.findByRole('link', { name: /Counting Sheep/ });
    // jsdom's CSS parser normalises hsl() to rgb() when serialising
    // background colours back out — so we round-trip the expected value
    // through the same parser. The assertion is "the Card paints the exact
    // palette token the registry name resolves to in tokens"; the probe
    // makes that semantic comparison survive jsdom's colour-notation
    // normalisation.
    const probe = document.createElement('div');
    probe.style.backgroundColor = palette.sheepWool;
    expect(card.style.backgroundColor).toBe(probe.style.backgroundColor);
  });

  it("renders the Toy's declared preview-scene inside its Card", async () => {
    // The slice ships the Card carrying a tiny SVG preview-scene "from
    // inside the Toy". The visual coherence of the scene against the live
    // Toy is on-device per the PRD's Testing Decisions — what's
    // jsdom-testable is the wiring: a Toy that declares a `preview`
    // component on its registry entry has that component mounted inside
    // its Card. We use a sentinel component (not Counting Sheep's actual
    // preview) so the test stays decoupled from the on-device-tuned
    // composition of any particular Toy's miniature scene.
    const PreviewSentinel = () => (
      <svg data-testid="preview-sentinel" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="3" />
      </svg>
    );
    const toys: ToyEntry[] = [
      {
        id: 'sample',
        title: 'Sample',
        component: () => <p>sample toy</p>,
        tint: 'sheepWool',
        preview: PreviewSentinel,
      },
    ];

    renderApp(toys);

    expect(await screen.findByTestId('preview-sentinel')).toBeInTheDocument();
  });

  it('renders exactly one Card per registered toy', async () => {
    const toys: ToyEntry[] = [
      { id: 'counting-sheep', title: 'Counting Sheep', component: () => <p>sheep</p> },
      { id: 'bubble-pop', title: 'Bubble Pop', component: () => <p>bubbles</p> },
    ];

    renderApp(toys);

    expect(await screen.findByText('Counting Sheep')).toBeInTheDocument();
    expect(screen.getByText('Bubble Pop')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});

describe('registered toys', () => {
  it('registers Counting Sheep as the one launchable Card', async () => {
    const user = userEvent.setup();
    renderApp(registry);

    const card = await screen.findByText('Counting Sheep');
    expect(screen.getAllByRole('link')).toHaveLength(1);

    await user.click(card);

    // The launcher is gone and the toy's meadow is mounted in its place.
    // Under the mobile-rethink mechanic only one Sheep is on stage at a time
    // (mobile-rethink PRD, slice #01) so the marker is the single role-named
    // `Sheep` button rather than the old indexed `Sheep 1`.
    expect(await screen.findByRole('button', { name: 'Sheep' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
