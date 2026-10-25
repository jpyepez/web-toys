# Toy backdrops are bottom-anchored layered scenes, not one sliced portrait viewBox

Counting Sheep's meadow was first built as a single phone-aspect SVG
(`viewBox="0 0 100 200"`, `preserveAspectRatio="xMidYMid slice"`) with the Sheep
positioned at a fixed `bottom: 30%` of the viewport. That works on a phone, where the
portrait viewBox fills the screen and the hills land near the bottom. On a landscape
desktop it breaks: `slice` scales a portrait viewBox by *width* and crops the top/bottom
about the vertical centre, shoving the hills (low in the viewBox) far down — while the
Sheep stays at 30% of the *viewport*. Horizon and critter are then in two unrelated
reference frames that drift apart as the aspect ratio widens, and the Sheep floats above
the ground.

We decided: **a Toy backdrop is a set of bottom-anchored layers whose ground band shares
one CSS length with the critter's feet — never a single sliced portrait viewBox the
critter is positioned over independently.** Concretely, for the meadow:

- **Sky + round detail** (clouds) — a square (`0 0 100 100`) `xMidYMid slice` SVG filling
  the viewport; flat fills cover any aspect and round shapes stay round under the uniform
  slice scale.
- **Ground** — a bottom-anchored SVG whose height is a CSS length (`--meadow-ground`, a
  `dvh` clamp) and whose `preserveAspectRatio="none"` maps the viewBox straight onto that
  box, so the horizon sits at a *fixed fraction of the viewport* at every aspect ratio.
  Gentle hill curves stretch horizontally — fine for rolling hills, wrong for round
  things, which is why round things live in the slice layer.
- **The critter** anchors its feet to the same length (`bottom: calc(var(--meadow-ground)
  * k)`), with the variable defined on the common `<main>` ancestor so it cascades to both
  the backdrop and the critter.

We chose this over (a) tuning the single-viewBox `preserveAspectRatio` / anchor — no
`slice` anchor gives a consistent sky/ground split across both portrait and landscape —
and (b) one `preserveAspectRatio="none"` SVG for the whole scene, which keeps the horizon
fixed but squashes round shapes (clouds become tall ellipses on a portrait phone, the
primary target).

## Consequences

- **A round element that must contrast against a same-colour layer gets the contrast from
  position, not colour.** The tree canopy is `palette.hillNear` (locked by the slice's
  test contract), so on a phone it vanishes into the same-lime near hill — it has to be
  lifted above the crest against the sky and given a long trunk crossing into the grass to
  read as rooted.
- **Backdrop layout is an on-device, cross-aspect check, not a unit-tested one.** The
  scene tests assert layer presence + palette-token fills only (geometry is on-device per
  the slice DoD), so the desktop-floating-critter class of bug is invisible to them —
  catch it with a landscape *and* portrait screenshot pass.
- **Each Toy owns its own ground length and layer geometry locally**
  ([[0004-shared-modules-expose-primitives-toys-own-assets]]); the scene stays code-drawn
  SVG ([[0002-no-binary-assets-everything-code-generated]]).
