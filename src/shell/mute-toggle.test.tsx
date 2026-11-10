import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createSound } from './sound';
import { fakeSound, fakeStorage } from '../test/fakes';
import { renderApp } from './test-support/renderApp';

describe('Shell mute toggle', () => {
  it('silences the sound utility when tapped — through the public Shell surface', async () => {
    const user = userEvent.setup();
    const sound = fakeSound();
    renderApp('/', { sound });

    // Wait for the launcher to mount, then the toggle should be in the Shell chrome.
    await screen.findByRole('link', { name: 'Counting Sheep' });
    await user.click(screen.getByRole('button', { name: /mute/i }));

    // The Shell wrote through to the sound utility — that's the contract the
    // play()/celebrate() silencing already covered in the unit tests rides on.
    expect(sound.setMuted).toHaveBeenCalledWith(true);
  });

  it('honors a stored mute preference on a fresh load (reload simulation)', async () => {
    // Simulate reopening the app after a prior session muted it: localStorage
    // already has the flag set when the Sound utility constructs.
    const storage = fakeStorage(new Map([['web-toys:muted', '1']]));
    const sound = createSound({ storage });
    renderApp('/', { sound });

    // The toggle picked up the restored state — its label is the un-mute action,
    // and the underlying utility reports muted. No tap was needed this session.
    expect(await screen.findByRole('button', { name: /unmute/i })).toBeInTheDocument();
    expect(sound.isMuted()).toBe(true);
  });
});
