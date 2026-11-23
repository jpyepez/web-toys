# iOS Startup Images

This project will **not** ship `apple-touch-startup-image` splash screens for the installed
iOS app. iOS shows its own launch screen (a snapshot of the last launch), and the app's first
paint takes over from there.

## Why this is out of scope

iOS ignores the manifest's `background_color`. A startup image is the only way to control the
iOS splash, and it means one PNG for each device screen size, times two for the Light and Dark
**Home theme**. That is dozens of files for a splash that shows for about half a second.

They could be rasterised at build time, as the apple-touch-icon already is, so they would not
strictly break [[0002-no-binary-assets-everything-code-generated]]. The objection is the cost:
a size matrix that has to follow every new iPhone, for a moment a child never notices. The one
real problem, white frames on a dark launch (WebKit bug 311569), is an iOS bug that a startup
image would not fix.

## Considered

- 2026-11-23: raised during the grill for issue #29 (status bar follows the Home theme), while
  working out how to avoid a wrong-colour flash at launch. Rejected.
