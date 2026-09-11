---
name: critter-art
description: The web-toys house drawing style — how to draw a Toy's Critters and the scene behind them so the cast stays the figure and the background stays the ground. Use when adding a new Toy, migrating an existing Toy's art, writing or changing any Backdrop / scene / palette / Critter / Preview card, picking or deriving any colour in a Toy, adding scenery (trees, hills, clouds, ground, foliage, props, motifs), or when a scene reads as clip-art, busy, flat, washed out, boring, or "two different styles". Triggers on: critter, backdrop, scene, scenery, palette, house style, contour, silhouette, OKLCH, oklch, figure and ground, foreground, background, treeline, canopy, foliage, horizon, ground band, sky, motif, drop shadow, occlusion, halftone, riso, Bruna, paper grain, drawing style, art style, looks like clip art, too busy, washed out, feels flat, doesn't match the birds, lab.html, critter lab.
---

# Critter art

Every Toy is one drawing: a cast of Critters on a scene. The scene's whole job is
to be somewhere for the cast to be, and the failure this style exists to prevent
is a background that becomes a second cast — because a three-year-old then has to
sort what is grabbable from what is decoration before they can play.

**Do not split this skill into "critter" and "scene".** Every failure in this
codebase has happened at the seam between them, never inside one of them. Both
halves are here so the seam has an owner.

## Before you draw

1. Read `src/shell/art/house.ts`. It carries the collection's paper, ink, cast
   lightness/chroma, line weights, the shadow formula and the disorder constants,
   each with the reason it is that number. **Never re-derive these per Toy.**
2. Read the target Toy's `palette.ts`. Each Toy owns its own scene and cast hues
   locally (ADR-0004); only the shared primitives come from `house.ts`.
3. Open the lab: `bun run dev`, then `/lab.html`. **Frame view**, not critter
   view, for anything scene-shaped.

## The one rule everything else serves

**The cast is the darkest, most saturated, most contoured thing on the screen,
and nothing else comes close.** Every rule below is a way of keeping that true
under a specific kind of pressure.

## Colour: two classes, and you must pick one

Authoring is in **OKLCH, never `hsl()`**. `hsl()`'s L is a channel midpoint, not
a lightness, so "these are siblings" is unassertable in it — that is how a sky
once ended up perceptually lighter than the balloon in front of it.

Before choosing any scene colour, answer one question:

```
Is the Critter dragged ACROSS this as a region — sky, foliage, ground, glow?

├── YES → CORRIDOR class
│   • L 0.80–0.92, and the whole corridor spans ≤ 0.15 of lightness.
│   • Separate corridor members from each other with CHROMA and HUE.
│     Never with lightness: the corridor is already spending the entire
│     separation budget on clearing the cast, and there is none left.
│
└── NO → OBJECT class — it is landed on or passed, not lived in
    • L ≥ 0.54, so the INK clears it by 0.30.
    • Its silhouette is carried by the CONTOUR, not by its own value.
```

**Why the split exists:** the corridor rule was once applied to objects too, and
it squeezed air, grass, wood and woven twigs into one 0.10 lightness band — four
materials at the same weight, and the whole scene read as washed out. A region is
governed by the cast; an object is governed by the ink.

**The numbers that are the rule** (the rest live in `house.ts`):

| Constraint | Value | Why |
| --- | --- | --- |
| Cast ↔ corridor ΔL | ≥ 0.30, target 0.40 | 0.30 ≈ WCAG's 3:1 non-text floor. Contrast sensitivity roughly **doubles** between age four and adulthood at the scale a whole Critter is detected at — an adult reviewing this screen is a systematically optimistic instrument. |
| Ink ↔ object ΔL | ≥ 0.30 | Below it the contour stops separating and the Critter loses its own outline exactly where it lands. |
| Scene chroma | ≤ 0.8 × cast chroma | Hue and chroma cannot separate figure from ground (two colours at one lightness differ by at most ~1.15:1), but chroma absolutely competes for *salience*. |
| Paper | the lightest surface in the app | A highlight is paper showing through, never `#fff`. |
| Ink | warm near-black, L ≤ 0.35 | True black against a coloured fill is the harshest pair available. |

**Measure the worst case, never the average.** A Critter is dragged across the
whole frame, so its legibility is set by the worst contrast anywhere it can go.
A minimum over a region is exactly what reviewing a screenshot misses: the mush
zone is a small part of the frame and you never happen to park a Critter in it.

**Value is a budget; AREA is the bill.** A colour that is safe as a hairline is
not safe as a mass. A branch at L 0.55 was correct for years as a pinstripe; the
same 0.55 as a thick bough plus six limbs multiplied the scene's mid-dark area by
an order of magnitude and the cast stopped being the darkest thing in its own
picture — hierarchy inverted, without a single individual colour changing. After
enlarging anything, re-run the squint test below.

**Shadows are a formula.** Always `shade()`, never a picked value, never black —
black kills chroma and makes mud. `shade()` rotates toward the ambient, which
means it can land *cooler* or *warmer* depending on where you start: from a warm
yellow-green leaf at dusk a positive rotation goes cool on its own. Check which
way your hue is actually moving before "correcting" the direction.

## Shape: what may exist behind the cast

Sort every scene shape by class **before** drawing it:

```
Convex, closed, and between 1/8 and 2.5 Critters wide?
├── YES → RIVAL. Do not draw it. Either grow it past 2.5 and crop it
│         with the frame, or shrink it under 1/8 and make it one lobe
│         of a mass. There is no third option.
└── NO
    ├── Elongated and open — limb, fork, twig, stem, wire, rope?
    │     → Allowed at any length that does not span the frame.
    ├── ≥ 2.5 Critters AND cropped by a frame edge — bough, trunk,
    │   moon, hill, wave?
    │     → Allowed.
    └── ≤ 1/8 a Critter AND part of a counted mass — leaf lobes,
        halftone dots, grain?
          → Allowed.
```

The two allowed bands are contiguous with the rival band on purpose: there is no
gap to fall into. A shape at 0.17 Critters is too big to dissolve into a mass and
too small to be cropped scenery — it is a rival, and "it's quite small" is not a
defence. A lone lollipop tree beside the cast is the canonical instance.

**Why:** a conifer crown is convex, closed, Critter-sized and rounded. So is a
fledgling. Twenty crowns behind five birds asks a child to sort twenty-five blobs
into draggable and not — *figure-class rivalry from a mid-frequency object band*.
It was never that the trees were drawn badly.

The escape is that a tree is not only crowns. Limbs, boughs and foliage mass are
every shape class a tree has **except** the rival one, so a forest built from them
is a place containing no Critter-shaped object. Apply the same sort to any
subject: a meadow of limbs-and-mass, not of bushes; a seabed of fronds and
cropped rock, not of pebbles.

## The unit is a CRITTER, not the viewport

Every size in a scene — line weight, lobe radius, how far a limb reaches, how big
a motif is — is a multiple of the Critter's rendered width. Only *positions* are
frame fractions.

**Why:** the shipped Critter is `clamp(120px, 36vw, 190px)`, so it is ~36% of a
phone's width and ~13% of a 1440px desktop's. A bough authored as "17 frame
units" is a believable limb at 36 and a **wall** at 13. The first desktop render
of the Nestlings canopy was exactly that: three brown planks and a log filling
the screen.

Counts follow the frame; sizes follow the Critter. Measured in Critters a phone
is ~2.8 wide by ~6 tall and a 16:10 desktop ~7.6 by ~4.7 — a similar height, well
over twice the width. **A wide viewport gets more scene sideways, never the same
scene enlarged.**

## Composition

The scene this style replaced was three horizontal stripes plus a full-width
pinstripe. Nothing overlapped anything, nothing was cropped, every edge was
horizontal — the most inert composition available, and no amount of texture
rescues it.

- **Nothing abuts.** Every adjacent pair of masses overlaps. Overlap is the only
  depth cue this style has; there is no horizon and no atmospheric fade.
- **Every mass is cropped by a frame edge.** A shape that stops neatly inside the
  viewport reads as a sticker laid on the picture.
- **Nothing spans the frame horizontally** except one cropped ground/bough. A
  line running edge to edge is a rule drawn across the picture.
- **One light direction, obeyed by every element.** Each mass gets a shaded rim
  on its away side, following its own edge — not a copy of the whole silhouette
  offset behind it, which shows through wherever the two outlines diverge and
  reads as pale streaks.
- **The scene must not contradict itself.** A nest on a branch above a flat grass
  field cannot say whether you are up a tree or standing in a field. Decide where
  the camera is and put everything in that one place.
- **The contour belongs to the figure.** Scenery may carry a contour at a
  *fraction* of the cast's — enough to say it is drawn, which is most of the
  difference between illustration and clip-art — and never at parity.
- **A Critter with a contact shadow is standing on something.** A shadow under a
  Critter in open sky is cast by nothing, and it reads as neither perched nor
  airborne. Derive rest positions FROM the scene — have the generator emit the
  points and let the cast read them — rather than maintaining a hand-written
  scatter beside a separately-drawn scene. Two hand-maintained lists of positions
  cannot be kept in agreement; one generator read by both cannot fall out of it.

## Construction

Never a raw `stroke`. SVG has no variable-width stroke, so a uniform one reads as
a different line language from the cast's filled contour ring — that single
mismatch is what makes a scene look like a different artist drew it. See
`PRIMITIVES.md` for which helper to reach for and the ways each one bites.

Every fill traces to a palette token. No literal colour in a component.

Every random draw comes from a seeded `stream(seed, name)`. No bare
`Math.random()` in a render path: the saved config is the deliverable and it is a
lie if the same numbers do not reproduce the same picture.

Never animate a filter attribute.

## The checks — run all four

1. **Squint test.** Render the scene greyscaled and blurred (`filter:
   grayscale(1) blur(3px)`) — roughly what a three-year-old's contrast
   sensitivity resolves. **The cast must be the only dark mass.** If a limb, a
   ground band or a prop reads as dark as a Critter, the hierarchy is inverted;
   lighten it or shrink its area. This is the test that catches area failures,
   which no per-colour check can.
2. **Silhouette test.** Fill every Critter solid black. All of them must stay
   mutually distinguishable — species read from outline (crest, tail, crown), not
   from colour.
3. **Both aspects, in the lab's frame view.** Phone and 16:10. A scene that reads
   on one aspect and falls apart on the other is the normal outcome, not the
   unlucky one, and a single-aspect preview hides it every time.
4. **Assert the rules in a test.** Not as prose. The house rules were written down
   carefully and then broken *in the same session* — a backdrop shipped with zero
   house primitives and ten uniform stroke widths, hours after the document
   forbidding both. See `palette.test.ts` (colour classes) and `canopy.test.ts`
   (shape classes, evaluated at every shipped frame) for the shape these take.

## Already ruled out — do not re-propose

| Rejected | Why |
| --- | --- |
| Treelines, hedges, any row of crown-sized shapes | Figure-class rivalry. Deleted, not kept as an option. |
| A literal receding landscape | <5% of the Bruna/Carle/Harper/Blair/Lionni/Rand corpus; bare paper + flat colour is ~two thirds. UPA's documented method was deleting "walls, floors, horizon lines and skies". |
| A gradient as a "texture-only" background | Reads as an app background. Grain does not rescue it. |
| Peer-sized motifs | ≥ 2.5× the Critter or ≤ 1/8. Never between. |
| A dark ground under a dark-ink cast | The contour stops separating the moment the ground approaches the ink. Needs a light rim primitive instead, which makes every Critter a cutout. |
| `multiply` blend on scene plates | The colours are derived to specific values; multiply invalidates them, and two dark plates make mud. |
| A dark (L < 0.54) foreground mass | Wanted, and refused by the ink rule — the bottom corners are where a hand rests and where Critters get set down. A dark foreground and "the cast stays legible anywhere" cannot both be had. |

## Harvesting

Tune in the lab, hit **Save**, then copy the saved block out of
`src/lab/saved/*.json` into the Toy's config — **read the JSON, never eyeball
values off a screenshot of the panel.** The generator function is shared by the
lab and the Toy, so only numbers move between them. Leave the lab route in place;
the next Toy needs it.
