import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import { createSound, type Sound } from './sound';
import { registry } from '../toys/registry';

/** Minimal Storage shim — the persistence boundary in tests. */
function fakeStorage(backing: Map<string, string> = new Map()): Storage {
  return {
    get length() {
      return backing.size;
    },
    key: (i: number) => Array.from(backing.keys())[i] ?? null,
    getItem: (k: string) => backing.get(k) ?? null,
    setItem: (k: string, v: string) => {
      backing.set(k, v);
    },
    removeItem: (k: string) => {
      backing.delete(k);
    },
    clear: () => {
      backing.clear();
    },
  };
}

function fakeSound(): Sound {
  // The mute toggle reads isMuted() to render its label, and writes through
  // setMuted(). Default to unmuted so the toggle starts in the "sound on" state.
  let muted = false;
  return {
    unlock: vi.fn(),
    baa: vi.fn(),
    celebrate: vi.fn(),
    isMuted: vi.fn(() => muted),
    setMuted: vi.fn((next: boolean) => {
      muted = next;
    }),
  };
}

function renderAppAt(initialPath: string, sound?: Sound) {
  const router = createAppRouter(registry, {
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    sound,
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('Shell mute toggle', () => {
  it('silences the sound utility when tapped — through the public Shell surface', async () => {
    const user = userEvent.setup();
    const sound = fakeSound();
    renderAppAt('/', sound);

    // Wait for the launcher to mount, then the toggle should be in the Shell chrome.
    await screen.findByRole('link', { name: 'Counting Sheep' });
    await user.click(screen.getByRole('button', { name: /mute/i }));

    // The Shell wrote through to the sound utility — that's the contract the
    // baa()/celebrate() silencing already covered in the unit tests rides on.
    expect(sound.setMuted).toHaveBeenCalledWith(true);
  });

  it('honors a stored mute preference on a fresh load (reload simulation)', async () => {
    // Simulate reopening the app after a prior session muted it: localStorage
    // already has the flag set when the Sound utility constructs.
    const storage = fakeStorage(new Map([['web-toys:muted', '1']]));
    const sound = createSound({ storage });
    renderAppAt('/', sound);

    // The toggle picked up the restored state — its label is the un-mute action,
    // and the underlying utility reports muted. No tap was needed this session.
    expect(await screen.findByRole('button', { name: /unmute/i })).toBeInTheDocument();
    expect(sound.isMuted()).toBe(true);
  });
});
