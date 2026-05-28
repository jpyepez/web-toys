import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { createAppRouter } from './createAppRouter';
import type { Sound } from './sound';
import { registry } from '../toys/registry';

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
});
