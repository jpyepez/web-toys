import { describe, it, expect } from 'vitest';
import { pwaManifest } from './pwa';

describe('pwaManifest', () => {
  it("declares standalone display mode so the installed app launches without browser chrome", () => {
    // The single behaviour driving the "full-screen / no browser chrome" acceptance
    // criterion: the manifest's display field must be 'standalone'. Without it, an
    // installed PWA on iOS/Android opens inside a browser tab, defeating the slice.
    expect(pwaManifest.display).toBe('standalone');
  });

  it("declares an SVG icon entry so Android/Chrome PWA install renders the code-drawn brand icon", () => {
    // Per slice #07's HITL decision: the manifest references an SVG icon (built
    // from code-drawn primitives, consistent with ADR-0002's spirit). iOS uses
    // a separate apple-touch-icon link in index.html — not the manifest — so the
    // SVG entry here is exclusively for Android/Chrome's install path.
    expect(pwaManifest.icons).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'image/svg+xml' })]),
    );
  });
});
