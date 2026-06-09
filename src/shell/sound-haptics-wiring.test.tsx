import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { Sound } from './sound';
import type { Haptics } from './haptics';
import type { ToyEntry } from './registry';
import { registry } from '../toys/registry';

/**
 * Stand-in Toy used in tests that assert Shell-side behaviour at the
 * `onComplete` boundary (celebration sound, no-binary-assets sweep). Using
 * this rather than driving Counting Sheep's full 5-tap loop keeps the
 * assertion focused on the Shell — the Counting Sheep mechanic's own
 * 5th-tap-fires-onComplete coverage lives in
 * `src/toys/counting-sheep/counting-sheep-mechanic.test.tsx`. Mirrors the
 * `finishableToy` fixture used in `completion-lifecycle.test.tsx`; lifting
 * it into a shared fixture is tracked in
 * `.work/notes/shared-render-app-test-helper.md`.
 */
const finishableToy: ToyEntry = {
  id: 'finishable',
  title: 'Finishable',
  component: ({ onComplete }) => (
    <button type="button" onClick={onComplete}>
      finish
    </button>
  ),
};

function fakeSound(): Sound {
  return {
    unlock: vi.fn(),
    play: vi.fn(),
    celebrate: vi.fn(),
    isMuted: vi.fn(() => false),
    setMuted: vi.fn(),
  };
}

function renderAppAt(
  initialPath: string,
  utils: { sound?: Sound; haptics?: Haptics; toys?: ToyEntry[] } = {},
) {
  const { toys = registry, ...rest } = utils;
  const router = createAppRouter(toys, {
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    ...rest,
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

    // Tap the single on-stage Sheep — under the mobile-rethink mechanic the
    // current Sheep is queryable from the moment it arrives, no need to
    // disambiguate by index.
    await user.click(await screen.findByRole('button', { name: 'Sheep' }));

    // The Toy never imports audio itself — the bleat/tick it produced came from
    // the utilities the Shell threaded in (the Sheep's tap calls sound.play
    // with its local recipe).
    expect(sound.play).toHaveBeenCalled();
    expect(haptics.tick).toHaveBeenCalled();
  });

  it('plays a celebratory sound when the Toy reaches Completion', async () => {
    // Shell behaviour: when ANY Toy fires `onComplete`, the Shell calls
    // `sound.celebrate()`. The mobile-rethink mechanic makes driving
    // Counting Sheep to Completion a multi-second fake-timer walk, but
    // the Shell-side responsibility is Counting-Sheep-agnostic, so this
    // test uses the `finishableToy` stand-in to assert it directly.
    // Counting Sheep's own 5th-tap → `onComplete` is covered by the
    // mechanic test in `counting-sheep-mechanic.test.tsx`.
    const user = userEvent.setup();
    const sound = fakeSound();
    renderAppAt('/toy/finishable', { sound, toys: [finishableToy] });

    await user.click(await screen.findByRole('button', { name: 'finish' }));
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
    // Shell-side ADR-0002 sweep: even with the real (jsdom-inert) audio
    // engine and the Shell's Completion overlay mounted, nothing media-
    // file-backed enters the tree. Driven against the `finishableToy`
    // stand-in for the same reason as the celebration-sound test above —
    // the Counting Sheep-side ADR-0002 compliance is pinned by
    // counting-sheep.test.tsx's wool / silhouette palette assertions (which
    // would catch any swap from SVG to img).
    const user = userEvent.setup();
    renderAppAt('/toy/finishable', { toys: [finishableToy] });

    await user.click(await screen.findByRole('button', { name: 'finish' }));
    await screen.findByText('You did it!');

    expect(document.querySelectorAll('audio')).toHaveLength(0);
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });
});
