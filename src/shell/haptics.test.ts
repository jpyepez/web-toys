import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHaptics } from './haptics';

describe('haptics utility', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('vibrates the device on a tick where the Vibration API is supported', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });

    createHaptics().tick();

    expect(vibrate).toHaveBeenCalled();
  });

  it('does nothing and never throws where the Vibration API is absent', () => {
    vi.stubGlobal('navigator', {});

    expect(() => createHaptics().tick()).not.toThrow();
  });
});
