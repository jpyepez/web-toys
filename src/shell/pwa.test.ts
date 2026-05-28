import { describe, it, expect } from 'vitest';
import { pwaManifest } from './pwa';

describe('pwaManifest', () => {
  it("declares standalone display mode so the installed app launches without browser chrome", () => {
    // The single behaviour driving the "full-screen / no browser chrome" acceptance
    // criterion: the manifest's display field must be 'standalone'. Without it, an
    // installed PWA on iOS/Android opens inside a browser tab, defeating the slice.
    expect(pwaManifest.display).toBe('standalone');
  });
});
