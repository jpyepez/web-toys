# Primitives

Everything here is in `src/shell/art/` — `geometry.ts`, `oklch.ts`, `rng.ts`,
`print.tsx`. Read the source for signatures; this file is only for **picking the
right one** and for the ways each one bites, all of which have cost a rebuild at
least once.

## Pick by what you are drawing

| Drawing | Use | Never |
| --- | --- | --- |
| A closed form's contour (body, head, bowl) | `contourRing` | a `stroke` |
| A contour on a **sharp or concave** form (crown, star, notched mass) | `grownContour` | `contourRing` — see below |
| A line that is its own object and **ends inside the frame** (leg, twig, whisker, string) | `taperedOutline` | `stroke` |
| A limb, bough, rope, wave — anything that **continues past the frame** | `ribbon` → `polygonPath` | `taperedOutline` — see below |
| A body, bowl, cloud, rock | `blob` | `<ellipse>` / `<circle>` — see below |
| A smooth closed silhouette from sampled points | `closedPath` | — |
| A boundary of **round lobes** (foliage, froth, wool) | arcs, sampled by hand | `|sin|` through `closedPath` — see below |
| An occlusion crescent (under a rim, where two forms meet) | `crescent` | a grey overlay |
| Any repeated element's variation | `stream(seed, name)` + `jitter` | `Math.random()` |
| Any colour | `hex`/`shade`/`tint` on an `Oklch` | a literal, or `hsl()` |

## The bites

**`contourRing` tears itself on sharp vertices.** It builds an outer loop and a
reversed inner loop and fills between them with `evenodd`. At a sharp convex tip
the inner loop crosses itself and `evenodd` reads the crossing as a hole — a
white notch at the point of every crown. `grownContour` grows outward only and
you paint the real fill on top, so there is no inner loop to self-intersect.

**`taperedOutline` narrows to a point at BOTH ends.** Correct for a twig, wrong
for anything the frame cuts off: a limb drawn with it comes to a needle at each
edge and reads as a painted stripe, a lens rather than a branch. `ribbon` keeps
full width at the ends.

**Never ring a centreline.** Offsetting a doubled-back centreline produces a
contour describing a different shape from its fill. Grow the real outline
(`ribbon` with a wider profile, drawn behind the fill) instead.

**A primitive has no vertices to perturb.** `<ellipse>` is why unmodified shapes
read as software rather than as drawing. `blob` modulates the radius with a
low-order periodic function — Molnár's 1% disorder made concrete. `amp` 0.02–0.06
is the useful band; high-frequency wobble reads as a rendering fault, not a hand.

**`closedPath` reproduces cusps faithfully.** Catmull-Rom smooths *between*
points, so it cannot rescue a profile that is already cusped. `Math.abs(sin(x))`
has a cusp at every zero, so a lobe profile built from it comes out as a saw
blade whether you emit it through `polygonPath` (straight joins → visible
triangles) or `closedPath` (smooth triangles). **Round lobes must be built from
arcs** — sample each lobe as an arc in the local frame, step by ~1.55 × the lobe
radius, and sweep ~165°→15° so consecutive lobes just touch. More overlap than
that and x stops being monotonic, which folds the boundary back on itself.

A notch between two round lobes is foliage. A notch between two straight edges is
a tear. A smooth periodic curve is water or a hill — which is why a sine is the
wrong tool for a leaf edge even when it looks close.

**`quadPts` is not uniform in x.** It samples a quadratic, so equal steps in `t`
are nowhere near equal steps in x. Spacing anything along a curve by `t` bunches
it toward the middle. Space by x (or by cumulative arc length) and match to the
nearest sampled point.

**`feTurbulence`'s `baseFrequency` is in user-space units of its viewBox**, not
pixels — the same number in a wider viewBox looks half as coarse. And the
displacement `scale` must stay well under the thinnest thing it touches, or it
shreds twigs instead of roughening them.

**Filters never animate.** Not the attribute, not via Motion. Fixed in two places
already; keep it at zero.

## Print layer

`Plate` (registration offset), `InkMottleFilter`, `HandCutFilter` in `print.tsx`,
plus the screen-space grain overlay.

Scene plates use `normal` blend, **never `multiply`** — the colours are derived to
specific values and multiply invalidates them; two dark plates make mud.

Grain is static, screen-space, never scaled with the scene and never animated, so
it rasterises once. Authoring it inside a scaled viewBox makes it resize with the
phone.

## Colour helpers

`inkOverPaper(colour, paper)` gives the INK you would put on a plate to land on a
target colour after multiplying with the paper; `hex(colour)` gives the landed
colour itself. Scenery that multiplies onto paper wants the ink. **A Critter is
drawn opaquely and wants the landed colour** — a figure that blends with its own
ground stops being a figure, and the first treeline showed straight through the
birds because of this.

`outOfGamut` before shipping any new hue at the cast's lightness and chroma.
`deltaL` is the assertion helper; use it in tests rather than eyeballing.
