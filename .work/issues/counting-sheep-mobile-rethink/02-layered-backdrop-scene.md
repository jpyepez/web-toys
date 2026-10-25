---
slice: 2
title: Layered backdrop — two-tone hills + scenery silhouette + stars
status: done
type: afk
blocked_by: []
parent_prd: counting-sheep-mobile-rethink
stories: [2]
---

## What to build

Replace the meadow's single-tone grass with a layered flat-colour scene that
reads as depth and place: two grass hills in distinct token colours, a mid-
distance silhouette (treeline by default; cottage if on-device review
prefers more "story"), and a small scatter of static stars across the upper
sky. Solid sky and half-moon stay from the polish PRD's slice-#07 revision.

End-to-end through one vertical:

- Three new palette tokens added to `tokens.ts`:
  - `hillNear` — warmer green for the foreground hill
  - `hillDistant` — deeper blue-grey for the distant hill (sits behind
    the foreground, painted earlier in DOM order)
  - `scenery` — deep warm-brown for the mid-distance silhouette
- `MeadowBackdrop.tsx` grows three new structural layers:
  - `data-meadow-layer="hill-distant"` — a soft hill silhouette behind
    everything, painted in `palette.hillDistant`
  - `data-meadow-layer="scenery"` — a mid-distance silhouette (treeline:
    a row of small pine-shape triangles; or cottage: a tiny roofed box)
    sitting between the two hills, painted in `palette.scenery`
  - `data-meadow-layer="hill-near"` — the foreground hill silhouette
    overlapping above the scenery, painted in `palette.hillNear`
- Five-to-seven static stars scattered deterministically across the
  upper-sky region of the backdrop SVG:
  - Each is a small `<circle>` painted in `palette.sheepWool` (cream
    reads as starlight against the dark sky, same token the half-moon
    uses)
  - Positions are deterministic per index (no per-render jitter; no
    twinkle — the polish PRD's out-of-scope rule against idle ambient
    motion still applies)
  - Each carries `data-meadow-layer="star"` so the count is
    structurally assertable
- The existing solid sky rect (`palette.skyUpper`) and the standalone
  half-moon SVG (slice-#07 of the polish PRD) are unchanged.

## Acceptance criteria

- [x] `palette.hillNear`, `palette.hillDistant`, and `palette.scenery`
      exist as HSL-shaped strings (the existing tokens-module test
      pattern: `expect(value).toMatch(/^hsl\(/)`).
- [x] `MeadowBackdrop` renders one element with
      `data-meadow-layer="hill-near"` whose `fill` is `palette.hillNear`.
- [x] `MeadowBackdrop` renders one element with
      `data-meadow-layer="hill-distant"` whose `fill` is
      `palette.hillDistant`.
- [x] `MeadowBackdrop` renders one element with
      `data-meadow-layer="scenery"` whose `fill` is `palette.scenery`.
- [x] `MeadowBackdrop` renders five-to-seven elements with
      `data-meadow-layer="star"`, each filled with `palette.sheepWool`.
- [x] The existing slice-#03 (polish PRD) sky test continues to pass —
      solid `palette.skyUpper` rect for the sky layer, no regression.
- [x] The existing slice-#07 (polish PRD) half-moon assertion still
      passes — the moon path with `data-meadow-layer="moon"` filled
      from a palette token still queryable.
- [x] On-device check (mine, before re-marking done): the scene reads
      as a layered dusk meadow with depth — distant hill, mid-distance
      scenery, foreground hill — and a stable scatter of stars in the
      upper sky on a 390×844 phone viewport.

## Notes

- The polish PRD's slice-#03 tests asserting both
  `data-meadow-layer="grass-distant"` and `data-meadow-layer="grass-
  foreground"` paint from the single `palette.grassSilhouette` token
  are rewritten in this slice — the data-layer names change to
  `hill-distant` / `hill-near`, and the fills move to the two new
  tokens. Both tests stay structurally — the rule is unchanged ("each
  hill paints from a palette token"), only the mechanism changes
  (two tokens, not one).
- The existing `palette.grassSilhouette` token stays on the palette —
  it's no longer consumed by Counting Sheep's live meadow but kept
  available for future Toys that want a single-tone grass.
- Treeline vs cottage is an implementation-time pick. Default
  treeline (simpler silhouette, less load-bearing on the composition).
  If the on-device review prefers cottage, swap the path data; the
  `data-meadow-layer="scenery"` attribute and the `palette.scenery`
  fill don't change.
- Stars positions are deterministic per index so the scene is stable
  across re-renders. No per-render `Math.random()` (idle-motion-like
  feel rejected per polish PRD's out-of-scope rule).
- This slice is independent of slice #01 — they can ship in either
  order. The slice-#01 mechanic runs fine over the new backdrop; this
  slice's backdrop renders fine under the old or new mechanic.
- Spec for the layers + stars is in PRD Implementation Decisions →
  "meadow backdrop layers" and "meadow backdrop stars"
  (`../../prds/counting-sheep-mobile-rethink.md`).
- ADR-0002 (code-drawn SVG): all new layers are SVG primitives.
- **On-device review journey during the kid-handoff DoD (commit
  `12a715a`, `refactor(meadow): pivot dusk -> day`):**
  - The slice's original 100×100 + `preserveAspectRatio="none"` SVG
    stretched stars into vertical ellipses and pine triangles into
    spikes on phone viewports — the same distortion class that forced
    the half-moon out into its own SVG in the polish PRD. Fixed by
    moving the backdrop to a phone-aspect viewBox (`0 0 100 200`) +
    `preserveAspectRatio="xMidYMid slice"`. Every shape now scales
    uniformly; the moon was eventually retired entirely (see pivot
    below), but the slice/aspect fix was the immediate unlock.
  - Palette tunings before the pivot: spread the lightness band
    (deeper sky, lifted hillNear) and warmed/saturated the hill
    greens. Held that scene long enough to confirm it still read
    "kinda lame".
  - Scenery silhouette: spike-triangle treeline rebuilt to cottage +
    organic fir cluster (PRD's named escape hatch + the "more story"
    direction). Held briefly, then retired with the day pivot below.
  - **Atmospheric register pivot — dusk → day.** Reference image:
    bright cyan sky, white cloud clusters, vibrant lime hills, one
    stylised tree. The whole compositional direction the PRD's
    Solution + Story 2 pinned ("place at dusk") **reversed under
    explicit sign-off**. New scene: clouds replace stars + moon;
    single stylised tree replaces cottage + fir cluster; palette
    pivots dusk hues → daytime hues (skyUpper cyan-blue, hillNear
    vibrant lime + tree canopy, hillDistant teal-green, scenery
    warm-brown tree trunk). New token added: `clouds` (cool bright
    white, separate from `sheepWool`'s warm cream so Card + Completion
    surfaces stay editorial). Slice #02's original moon/stars/scenery
    tests retired and rewritten in sanctioned-pivot pattern (the same
    pattern the original slice used to retire the polish PRD's two-
    grass-token test).
  - Cloud `cy` tuned three times: 20–38 (cropped at top on non-phone
    aspects) → 46–64 (too far from sheep) → 78–95 (too clustered low)
    → 30–90 (full upper-sky spread, the final state).
  - Foreground hill curve softened so the surface at the Sheep's x=50
    lands at y≈141 — matching the Sheep's feet position. The Sheep
    now stands ON the hill, not sunk into it.
- The token-name semantics stayed load-bearing through the pivot —
  `skyUpper`, `hillNear`, `hillDistant`, `scenery` all kept their
  names; only values shifted. `scenery` follows the same
  retire-but-keep pattern `grassSilhouette` already established
  (no live scenery LAYER, but the warm-brown token still paints
  tree trunks). Names invariant; atmospheric intent reversed.
