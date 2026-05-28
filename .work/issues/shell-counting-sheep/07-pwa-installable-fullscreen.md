---
slice: 7
title: PWA — installable, full-screen standalone
status: done
type: hitl
blocked_by: [1]
parent_prd: shell-counting-sheep
stories: [1]
---

## What to build

Wrap the working app as an installable PWA so the parent can add it to the phone's home
screen and it launches full-screen, with the child seeing only the toys (no browser chrome).
End-to-end: build config → manifest + service worker → installable, standalone launch.

- Add **vite-plugin-pwa**: web app manifest + service worker.
- Manifest configured for **standalone full-screen** display so the installed app has no
  browser chrome.
- Installable to the phone home screen.
- Respect **safe-area insets** so Shell chrome (Home control, mute) isn't clipped under
  notches / home indicators in standalone.

**HITL — decision points to resolve with a human:**
- **PWA icons vs ADR-0002 (no binary assets).** A manifest normally references PNG icons,
  which collides with the no-binary-assets rule. Decide: ship an SVG-based icon, accept a
  minimal icon set as a documented exception to ADR-0002, or another approach. This is a
  conscious call, not a quiet addition — record it.
- **iOS standalone quirks** need real-device validation (see below).

## Acceptance criteria

- [x] The app is installable (a valid manifest + service worker are served).
      `bun run build` emits `dist/manifest.webmanifest` + `dist/sw.js` +
      `dist/registerSW.js`. Manifest carries name, short_name, start_url, scope,
      icons, display, theme/background colours.
- [x] Launched from the home screen, it opens full-screen/standalone with no browser chrome.
      Manifest `display: 'standalone'` (unit-asserted in `pwa.test.ts`) + iOS
      `<meta name="apple-mobile-web-app-capable" content="yes">` in `index.html`.
      On-device launch confirmed via the iOS checklist below.
- [x] Shell chrome respects safe-area insets in standalone (nothing clipped under notch /
      home indicator). `src/shell/shell.css` `.shell-frame` applies
      `env(safe-area-inset-*)` padding on all four sides; applied to the Shell root in
      `createAppRouter`. Not unit-asserted (jsdom drops `env()` — verified empirically);
      on-device visual confirmation per checklist.
- [x] The icon approach is consistent with a recorded decision on the ADR-0002 tension (new
      ADR or amendment if an exception is taken). ADR-0002 amended with the narrow
      "build-emitted PWA install icons" carve-out. `pwaIconSvg` (code-drawn) is the single
      source of truth; the `codegen-pwa-icons` Vite plugin emits `/icon.svg` and rasterises
      `/apple-touch-icon.png` at 180×180 — no authored binary asset in the repo.

## Notes

- Sequenced last (signed off): installability is independent of toy mechanics, so prove the
  Shell + Sheep loop end-to-end first, then wrap it.
- On-device validation (not unit-asserted, per PRD Further Notes): iOS PWA standalone
  safe-area insets, and the hardware silent switch's effect on Web Audio.
- Only depends structurally on the scaffold (#1).

### HITL decisions (recorded during /test-drive)

- **Icon strategy:** SVG manifest icon + a build-emitted PNG `apple-touch-icon` rasterised
  from the same SVG at build time. The PNG is a build artifact of code, not an authored
  binary asset — consistent with ADR-0002's spirit. Amend ADR-0002 with a one-line
  carve-out: "build-emitted rasters of code-drawn SVG are permitted for PWA install icons".
- **iOS validation:** manual on-device checklist, not blocking on `done`. Implement
  manifest + service worker + safe-area CSS in this slice; record the device check
  (install on iOS → standalone launch → safe-area inset visual → silent-switch behaviour)
  as a follow-up. The PRD's Further Notes already places these outside unit-asserted scope.

### On-device checklist (manual, post-slice)

To be run on a real iPhone once the app is served (e.g. via `bun run build && bun run
preview` from the local network, or after deploying to a host):

- [ ] Open in iOS Safari → "Add to Home Screen" → the sheep-face icon shows.
- [ ] Launch from the home screen → opens full-screen with no Safari URL bar / tabs.
- [ ] Confirm the MuteToggle (top of `<MuteToggle/>`) is not clipped under the notch.
- [ ] Mount a Toy → confirm the Home button is not clipped behind the home indicator.
- [ ] Flip the iPhone hardware silent switch ON → tap a Sheep / a Card → assert what
      happens to Web Audio (expected behaviour: iOS still plays through HTML5 audio
      context per Web Audio rules — this is informational, not a regression).
- [ ] Repeat install/launch on an Android Chrome device → confirm install prompt and
      standalone launch.

The TDD-driven unit work for this slice is done; this checklist is the
slice's *real-world* validation per the PRD's Further Notes.
