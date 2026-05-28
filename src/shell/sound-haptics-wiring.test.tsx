import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { Sound } from './sound';
import type { Haptics } from './haptics';
import { registry } from '../toys/registry';

function fakeSound(): Sound {
  return {
    unlock: vi.fn(),
    baa: vi.fn(),
    celebrate: vi.fn(),
    isMuted: vi.fn(() => false),
    setMuted: vi.fn(),
  };
}

function renderAppAt(
  initialPath: string,
  utils: { sound?: Sound; haptics?: Haptics } = {},
) {
  const router = createAppRouter(registry, {
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    ...utils,
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('Shell sound + haptics wiring', () => {
  it('provides its sound/haptics to the mounted Toy through the contract', async () => {
    const user = userEvent.setup();
    const sound = fakeSound();
    const haptics: Haptics = { tick: vi.fn() };
    renderAppAt('/toy/counting-sheep', { sound, haptics });

    const sheep = await screen.findAllByRole('button', { name: /Sheep \d/ });
    await user.click(sheep[0]);

    // The Toy never imports audio itself — the baa/tick it produced came from
    // the utilities the Shell threaded in.
    expect(sound.baa).toHaveBeenCalled();
    expect(haptics.tick).toHaveBeenCalled();
  });

  it('plays a celebratory sound when the Toy reaches Completion', async () => {
    const user = userEvent.setup();
    const sound = fakeSound();
    renderAppAt('/toy/counting-sheep', { sound });

    // Reach the Goal: tap all five sheep.
    for (const sheep of await screen.findAllByRole('button', { name: /Sheep \d/ })) {
      await user.click(sheep);
    }
    await screen.findByText('You did it!');

    expect(sound.celebrate).toHaveBeenCalled();
  });

  it('unlocks audio on the Card tap — not on page load', async () => {
    const user = userEvent.setup();
    const sound = fakeSound();
    renderAppAt('/', { sound });

    // On the launcher, before any gesture, audio stays locked (mobile constraint).
    await screen.findByRole('link', { name: 'Counting Sheep' });
    expect(sound.unlock).not.toHaveBeenCalled();

    // The first user gesture is the Card tap — that is what unlocks it.
    await user.click(screen.getByRole('link', { name: 'Counting Sheep' }));

    expect(sound.unlock).toHaveBeenCalled();
  });

  it('produces sound by synthesis only — no <audio> or <img> assets (ADR-0002)', async () => {
    const user = userEvent.setup();
    // The real (jsdom-inert) engine — exercising the actual synthesis path.
    renderAppAt('/toy/counting-sheep');

    // Drive every sound moment: a baa per tap, then the Completion flourish.
    for (const sheep of await screen.findAllByRole('button', { name: /Sheep \d/ })) {
      await user.click(sheep);
    }
    await screen.findByText('You did it!');

    // Nothing media-file-backed entered the tree — sound is all Web Audio.
    expect(document.querySelectorAll('audio')).toHaveLength(0);
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });
});
