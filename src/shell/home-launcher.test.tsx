import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { ToyEntry } from './registry';
import { ink } from './tokens';
import { palette } from '../toys/counting-sheep/palette';
import { palette as oceanPalette } from '../toys/puffer-fish/palette';
import { palette as barnyardPalette } from '../toys/muddy-puddle/palette';
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

  it("backs a Toy's preview cover with the concrete CSS color in its `tint`", async () => {
    // `tint` is a concrete CSS color string, not a key into the shared palette
    // (ADR-0004). The redesigned Card paints it directly as the backing of the
    // preview cover (`data-card-cover`) — a real per-Toy surface — with no
    // `palette[...]` indirection, so a Toy's tint comes from its own world
    // rather than the meadow grab-bag. We use an arbitrary colour unrelated to
    // any palette token to prove the Card paints the literal string it's given,
    // not a looked-up value.
    const tint = 'hsl(200 50% 60%)';
    const Dot = () => <svg data-testid="dot" viewBox="0 0 10 10" />;
    const toys: ToyEntry[] = [
      {
        id: 'counting-sheep',
        title: 'Counting Sheep',
        component: () => <p>sheep</p>,
        tint,
        preview: Dot,
      },
    ];

    renderApp(toys);

    const card = await screen.findByRole('link', { name: /Counting Sheep/ });
    const cover = card.querySelector('[data-card-cover]') as HTMLElement;
    expect(cover).not.toBeNull();
    // jsdom's CSS parser normalises hsl() to rgb() when serialising
    // background colours back out — so round-trip the expected value through
    // the same parser before comparing.
    const probe = document.createElement('div');
    probe.style.backgroundColor = tint;
    expect(cover.style.backgroundColor).toBe(probe.style.backgroundColor);
  });

  it('leaves the preview cover untinted when the entry declares no `tint`', async () => {
    // `tint` stays optional. A Toy that hasn't picked a tint renders a preview
    // cover with no backing colour — it falls through to the Card's shared
    // paper surface rather than being forced to declare one. We assert the
    // cover's painted background is empty, the same un-set state a bare `<div>`
    // reports through jsdom.
    const Dot = () => <svg data-testid="dot" viewBox="0 0 10 10" />;
    const toys: ToyEntry[] = [
      { id: 'no-tint', title: 'No Tint', component: () => <p>plain</p>, preview: Dot },
    ];

    renderApp(toys);

    const card = await screen.findByRole('link', { name: /No Tint/ });
    const cover = card.querySelector('[data-card-cover]') as HTMLElement;
    expect(cover).not.toBeNull();
    expect(cover.style.backgroundColor).toBe('');
  });

  it("inks the Card title from the Shell-owned `ink` token, not a Toy palette colour", async () => {
    // Acceptance criterion #2 — the Card title's type colour is a Shell
    // chrome primitive (it frames every Toy's Card identically), so it
    // sources `tokens.ink` rather than borrowing the meadow palette's
    // `sheepSilhouette`. Per ADR-0004 this peels one of the Card's two
    // couplings to the meadow palette ahead of the palette move (slice #04).
    // We assert the *mapping* (title colour resolves to the `ink` token),
    // not a literal HSL string — the tuple is on-device-tuned per the slice
    // DoD. jsdom normalises hsl() to rgb() on the way back out, so we
    // round-trip `ink` through the same parser via a probe element, exactly
    // as the tint test does for `sheepWool`.
    const toys: ToyEntry[] = [
      { id: 'counting-sheep', title: 'Counting Sheep', component: () => <p>sheep</p> },
    ];

    renderApp(toys);

    const title = await screen.findByText('Counting Sheep');
    const probe = document.createElement('div');
    probe.style.color = ink;
    expect(title.style.color).toBe(probe.style.color);
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
  it('registers Counting Sheep, Puffer Fish and Muddy Puddle as the three launchable Cards', async () => {
    // Muddy Puddle slice #08 (AC #1/#2): the registry now declares a third real
    // Toy, so the Home reads as a small *collection* of three Cards. This test
    // supersedes the earlier "two launchable Cards" assertion: adding the
    // muddy-puddle entry is the behaviour change the slice ships, so the
    // launcher's expected Card count moves from 2 → 3 here (the same way slice
    // #09 moved it 1 → 2 when the fish landed). Each Card carries its title and
    // routes to its own Toy; the per-Card tint + preview wiring is asserted in
    // the focused tests below.
    renderApp(registry);

    expect(await screen.findByText('Counting Sheep')).toBeInTheDocument();
    expect(screen.getByText('Puffer Fish')).toBeInTheDocument();
    expect(screen.getByText('Muddy Puddle')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);

    // The Counting Sheep Card still backs its preview cover with the cream tint,
    // sourced from the Sheep-local palette (`palette.sheepWool`, ADR-0004 —
    // slice #04). Pinned to the same palette the registry entry reads from so it
    // stays a single source of truth; round-tripped through jsdom's parser as
    // the generic tint test does.
    const sheepCard = screen.getByRole('link', { name: /Counting Sheep/ });
    const sheepCover = sheepCard.querySelector('[data-card-cover]') as HTMLElement;
    const sheepProbe = document.createElement('div');
    sheepProbe.style.backgroundColor = palette.sheepWool;
    expect(sheepCover.style.backgroundColor).toBe(sheepProbe.style.backgroundColor);
  });

  it("backs the Puffer Fish preview cover from its own ocean-palette tint", async () => {
    // AC #4: the fish Card's tint is a concrete CSS color string the Toy
    // supplies from its OWN world — `oceanPalette.water` — not a key into a
    // shared palette grab-bag (ADR-0004 / slice #03's tint→color-string
    // contract, now exercised end-to-end against a real second Toy). It backs
    // the fish's preview cover. Pinned to the same ocean-palette token the
    // registry entry reads from so it stays a single source of truth;
    // round-tripped through jsdom's parser (which normalises hsl() → rgb())
    // exactly as the sheep tint check does.
    renderApp(registry);

    const fishCard = await screen.findByRole('link', { name: /Puffer Fish/ });
    const fishCover = fishCard.querySelector('[data-card-cover]') as HTMLElement;
    const probe = document.createElement('div');
    probe.style.backgroundColor = oceanPalette.water;
    expect(fishCover.style.backgroundColor).toBe(probe.style.backgroundColor);
  });

  it("hosts the Puffer Fish's own preview-scene inside its Card", async () => {
    // AC #1: the fish entry declares a `preview`, and the Card mounts it. We
    // assert the real fish preview is wired (not just any sentinel) by finding
    // the round-fish body it draws — the same `data-fish-part="body"` hook the
    // miniature scene carries — inside the Puffer Fish Card. The live Toy isn't
    // mounted on Home, so this hook can only come from the Card's preview,
    // proving the registry entry's `preview` resolves to the fish's own scene.
    renderApp(registry);

    const fishCard = await screen.findByRole('link', { name: /Puffer Fish/ });
    expect(fishCard.querySelector('[data-fish-part="body"]')).not.toBeNull();
  });

  it('routes to the Puffer Fish Toy when its Card is tapped', async () => {
    // AC #2: tapping the Puffer Fish Card launches its Toy. The fish loop
    // bootstraps with one fish swimming in, queryable as the accessible button
    // labelled "Fish" (mirrors the Sheep's role-named marker). After the tap the
    // launcher is gone — the Toy is mounted in its place, not alongside it.
    const user = userEvent.setup();
    renderApp(registry);

    await user.click(await screen.findByText('Puffer Fish'));

    expect(await screen.findByRole('button', { name: 'Fish' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it("backs the Muddy Puddle preview cover from its own barnyard-palette tint", async () => {
    // AC #3 (tint surface): the Muddy Puddle Card's tint is a concrete CSS color
    // string the Toy supplies from its OWN world — `barnyardPalette.sky`, the
    // open sky the live scene sits in — not a key into a shared palette grab-bag
    // (ADR-0004 / the tint→color-string contract). It backs the Card's preview
    // cover. Pinned to the same barnyard-palette token the registry entry reads
    // from so it stays a single source of truth; round-tripped through jsdom's
    // parser (which normalises hsl() → rgb()) exactly as the sheep/fish tint
    // checks do.
    renderApp(registry);

    const card = await screen.findByRole('link', { name: /Muddy Puddle/ });
    const cover = card.querySelector('[data-card-cover]') as HTMLElement;
    const probe = document.createElement('div');
    probe.style.backgroundColor = barnyardPalette.sky;
    expect(cover.style.backgroundColor).toBe(probe.style.backgroundColor);
  });

  it("hosts the Muddy Puddle's own preview-scene inside its Card", async () => {
    // AC #3 (preview): the muddy-puddle entry declares a `preview`, and the Card
    // mounts it. We assert the REAL muddy-puddle preview is wired (not just any
    // sentinel) by finding the clean-piglet body it draws — the same
    // `data-piglet-part="body"` hook the live `PigletDrawing` carries — inside
    // the Muddy Puddle Card. The live Toy isn't mounted on Home, so this hook
    // can only come from the Card's preview, proving the entry's `preview`
    // resolves to the muddy critter's own scene.
    renderApp(registry);

    const card = await screen.findByRole('link', { name: /Muddy Puddle/ });
    expect(card.querySelector('[data-piglet-part="body"]')).not.toBeNull();
  });

  it('routes to the Muddy Puddle Toy when its Card is tapped', async () => {
    // AC #4: tapping the Muddy Puddle Card mounts the playable Toy through the
    // standard contract. The loop bootstraps to `arriving` with one muddy
    // Critter trotting in — observable through the public surface as the on-stage
    // `role="img"` Critter (the cast is shuffled, so we assert the role, not a
    // specific animal). After the tap the launcher is gone — the Toy is mounted
    // in its place, not alongside it (mirrors the fish routing check).
    const user = userEvent.setup();
    renderApp(registry);

    await user.click(await screen.findByText('Muddy Puddle'));

    expect(await screen.findByRole('img')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
