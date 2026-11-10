import { describe, it, expect } from 'vitest';
import { fakeSound } from './fakes';

describe('fakeSound', () => {
  it('starts unmuted and tracks setMuted', () => {
    const sound = fakeSound();
    expect(sound.isMuted()).toBe(false);
    sound.setMuted(true);
    expect(sound.isMuted()).toBe(true);
    expect(sound.setMuted.mock.calls).toEqual([[true]]);
  });
});
