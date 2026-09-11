/**
 * The canopy — the scene generator for "inside the tree".
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT A TREELINE. The scene it replaces was three
 * horizontal stripes (sky / halftone dome / grass) plus a full-width pinstripe
 * branch. Nothing overlapped anything, nothing was cropped, every edge was
 * horizontal — which is the most inert composition available, and no amount of
 * texture rescues it. It also contradicted itself: a nest on a branch directly
 * above a flat grass field, both at the same depth, so the picture could not say
 * whether you were up a tree or standing in a meadow.
 *
 * The earlier treeline attempt failed for a reason worth stating precisely,
 * because the reason is also the licence for this one. A conifer crown is a
 * CONVEX, CLOSED, BIRD-SIZED, ROUNDED shape. So is a fledgling. Twenty of them
 * behind five birds asks a three-year-old to sort twenty-five blobs into
 * draggable and not — figure-class rivalry from a mid-frequency object band.
 *
 * But a tree is not only crowns. Sorted by shape class:
 *
 *   | class          | shape                          | rival? |
 *   | crown, bush    | convex, closed, bird-sized     | YES    |
 *   | limb, fork     | elongated, open, linear        | no     |
 *   | bough, trunk   | cropped, >= 2.5x a bird        | no     |
 *   | leaf lobe      | <= 1/8 a bird, reads as a mass | no     |
 *
 * So a forest built from limbs, boughs and foliage MASS — with no crowns in it —
 * is a forest containing no bird-shaped object. That is the whole unlock, and it
 * is enforced here rather than trusted: `check()` returns the violations, and
 * `palette.test.ts` asserts them at the sizes this Toy actually ships.
 *
 * It pays off two open problems for free. Limbs crossing the frame give the
 * loose birds something to PERCH on, so their contact shadows stop being a lie
 * told in mid-air — `perches` is exported for exactly that, and the cast's rest
 * positions are derived from it rather than hand-placed next to it. And a canopy
 * extends on a wide viewport by LENGTHENING limbs and opening more sky-holes,
 * never by repeating objects, which is why 16:10 stops being an empty field.
 *
 * FRAME SPACE. Everything is authored in a `0..100` x `0..h` box whose aspect
 * MATCHES the viewport's, so nothing is ever stretched: at 9:19.5 `h` is ~216,
 * at 16:10 it is ~62, and the generator composes for the box it is given. That
 * is why this is a function of the frame rather than a fixed viewBox — a scene
 * sliced or stretched from one authored aspect is what made the old nest smear
 * sideways on desktop.
 *
 * THE UNIT IS A BIRD, NOT THE FRAME. Every SIZE here — limb thickness, bough
 * thickness, leaf lobe, moon, how far a limb reaches — is a multiple of `birdW`,
 * a bird's width in frame units. Only POSITIONS are frame fractions.
 *
 * That split is not tidiness, it is the whole responsive story, and getting it
 * wrong is visible immediately: the shipped Critter is `clamp(120px, 36vw,
 * 190px)`, so a bird is 36 frame units on a phone and ~13 on a 1440px desktop —
 * nearly 3x smaller relative to the frame. A bough authored as "17 units" is a
 * believable limb at 36 and a WALL at 13. The first desktop render of this scene
 * was exactly that: three brown planks and a log filling the screen.
 *
 * The frames differ in one honest way, and the counts follow it. Measured in
 * birds, a phone is ~2.8 wide by ~6 tall and a desktop ~10.3 by ~6.5 — the same
 * height, nearly four times the width. So a wide viewport gets MORE tree
 * sideways (more limbs entering, more hanging masses, more sky-holes between
 * them) and never the same tree enlarged.
 */

import {
  closeAgainst,
  closedPath,
  lobedBand,
  lobedEdge,
  polygonPath,
  quadPts,
  ribbon,
  taperedOutline,
  type Pt,
} from '../../shell/art/geometry';
import { stream } from '../../shell/art/rng';

/**
 * Scenery contour weight, as a fraction of the thing it outlines. Well under the
 * cast's, and hardcoded rather than exposed: the contour belongs to the FIGURE,
 * and a background drawn with a bird's line weight becomes a character. This is
 * enough line to say the limbs are DRAWN — which is most of the difference
 * between an illustration and clip art — and not enough to compete.
 */
const INK_RATIO = 0.2;

/** The box the scene is composed into. `w` is always 100; `h` follows the viewport aspect. */
export type Frame = { w: number; h: number };

/**
 * Every taste decision in the canopy. The RULES (what makes it this idea) are
 * hardcoded below; these are the numbers nobody has settled yet.
 */
export type CanopyConfig = {
  /** How far the top foliage ceiling hangs down, as a fraction of frame height. */
  ceilingDepth: number;
  /** How far the ceiling's own underside varies, as a fraction of `ceilingDepth`. */
  ceilingRelief: number;
  /**
   * Leaf-lobe radius, as a fraction of a bird's width. RULE: <= 1/8, or a lobe
   * becomes a countable object and we are back to the treeline one octave down.
   */
  lobeRatio: number;
  lobeVariance: number;
  /** Hanging clusters below the ceiling — the things that make sky-holes. */
  massCount: number;
  massDepth: number;
  /**
   * How densely the frame is threaded with perch limbs. 1 is the composed
   * default; it scales both how many HEIGHTS there is room for and how many
   * limbs sit at each one. It is a density rather than a count because the two
   * axes are governed by different things — see the rank loop.
   */
  limbDensity: number;
  /** Limb thickness, as a multiple of a bird's width. */
  limbThickness: number;
  /** How far a limb reaches, in BIRD WIDTHS — clamped so it always crosses a
   *  narrow frame and never spans a wide one. */
  limbReach: number;
  /** How steeply limbs rake. 0 makes them parallel, which reads as a ladder. */
  limbRake: number;
  twigCount: number;
  /**
   * The leafy fringe running ALONG a limb, as a multiple of the lobe radius.
   *
   * This is what fills the open middle of the frame, and its shape class is why
   * it can. A pom-pom of leaves at a limb's tip would be a closed, convex,
   * roughly bird-sized silhouette — the crown, readmitted through the back door.
   * A fringe running along the limb stays ELONGATED and stays attached, so it is
   * foliage without ever becoming an object to sort.
   */
  leafDepth: number;
  /** Perches per limb. The cast size divided across the limbs. */
  perchesPerLimb: number;
  /** The bough the nest is cradled in, as a multiple of a bird's width. Thick,
   *  and cropped by both edges. */
  boughThickness: number;
  /** Bottom foliage (repoussoir). 0 turns it off. Fraction of frame height. */
  understoryDepth: number;
  /**
   * The moon, as a multiple of a bird's width. RULE: 0 (off) or >= 2.5, never
   * between — a disc the size of a bird is a sixth character.
   */
  moonScale: number;
  moonX: number;
  moonY: number;
  /** Drifting seed fluff — the only moving thing in the scene. */
  moteCount: number;
};

export const CANOPY_DEFAULTS: CanopyConfig = {
  ceilingDepth: 0.22,
  ceilingRelief: 0.55,
  lobeRatio: 0.075,
  lobeVariance: 0.55,
  massCount: 4,
  massDepth: 0.15,
  limbDensity: 1,
  limbThickness: 0.115,
  limbReach: 3.4,
  limbRake: 0.1,
  twigCount: 3,
  leafDepth: 4.2,
  perchesPerLimb: 2,
  boughThickness: 0.46,
  understoryDepth: 0.2,
  moonScale: 3.0,
  moonX: 76,
  moonY: 0.44,
  moteCount: 3,
};

/* ------------------------------------------------------------------ *
 * The generator
 * ------------------------------------------------------------------ */

export type Limb = {
  body: string;
  ink: string;
  twigs: string[];
  /** The leafy fringe running along this limb — what fills the open middle. */
  leaves: string;
};

/* ------------------------------------------------------------------ *
 * The generator
 * ------------------------------------------------------------------ */

export type CanopyArt = {
  ceiling: { fill: string; relief: string };
  masses: { fill: string; relief: string }[];
  limbs: Limb[];
  bough: { body: string; ink: string; leaves: string; top: number };
  understory: { fill: string } | null;
  moon: { cx: number; cy: number; r: number } | null;
  motes: { cx: number; cy: number; r: number; delay: number; amp: number }[];
  /** Perch points in frame units, ordered top-to-bottom. The cast reads these. */
  perches: Pt[];
};

/**
 * Build the whole canopy. Pure: same `(cfg, frame, birdW, seed)` in, same paths
 * out, every random draw from a named seeded stream.
 *
 * `birdW` is a bird's width IN FRAME UNITS, and it is a parameter rather than a
 * constant because the size rules are all expressed against it — a lobe is
 * "1/8 of a bird", not "3 units". At 390px wide with a 140px bird that is 36; on
 * a desktop frame it is smaller, and the foliage grain has to follow it or the
 * scene silently changes class as the viewport grows.
 */
export function buildCanopy(
  cfg: CanopyConfig,
  frame: Frame,
  birdW: number,
  seed: number,
  castSize = 5,
): CanopyArt {
  const { w, h } = frame;
  const rnd = stream(seed, 'canopy');
  const lobeR = Math.max(0.8, birdW * cfg.lobeRatio);
  const bleed = w * 0.08;
  /*
   * The bird is the unit. These are the four sizes the whole scene is built
   * from, resolved once, in frame units — see the header for why authoring them
   * as raw frame numbers turned the desktop render into a stack of planks.
   */
  const limbW = birdW * cfg.limbThickness;
  const boughW = birdW * cfg.boughThickness;
  /** How wide the frame is, measured in birds. ~2.8 on a phone, ~10 at 16:10. */
  const birdsWide = w / birdW;
  /** A wide frame gets more tree SIDEWAYS, never the same tree enlarged. */
  const wideness = Math.min(2.4, Math.max(1, birdsWide / 2.8));

  /* --- the ceiling: one continuous mass hanging from the top edge ----
   * Continuous on purpose. Separate clumps along the top edge would each be a
   * closed convex shape again; a single band that the frame crops on both sides
   * cannot be counted, and it is what puts a ROOF on the scene — the thing that
   * makes the sky read as glimpsed rather than as an empty field. */
  const ceilY = h * cfg.ceilingDepth;
  const relief = ceilY * cfg.ceilingRelief;
  const ceilPhase = rnd() * Math.PI * 2;
  const ceilPts = lobedEdge(
    -bleed,
    w + bleed,
    (t) =>
      // Two low harmonics, never one: a single sine is a wave, and the beat
      // between two is what stops the underside reading as a ripple.
      ceilY +
      relief * 0.6 * Math.sin(t * Math.PI * 1.7 + ceilPhase) +
      relief * 0.4 * Math.sin(t * Math.PI * 4.3 + ceilPhase * 1.7),
    lobeR,
    cfg.lobeVariance,
    rnd,
    1,
  );
  const ceiling = {
    fill: closeAgainst(-bleed, ceilPts, bleed),
    /*
     * The shaded rim along the underside — one light direction, obeyed by every
     * element, where the old background had no occlusion anywhere.
     *
     * A BAND that follows the scalloped edge, not the whole silhouette shifted
     * up: a shifted copy shows through wherever the two outlines diverge, which
     * came out as pale vertical streaks running up into the mass. Following the
     * edge is also what the tradition actually does — the shading is a rim on
     * the form, not a second form behind it.
     */
    relief: closedPath([
      ...ceilPts,
      ...[...ceilPts].reverse().map(([x, y]) => [x, y - relief * 0.42] as Pt),
    ]),
  };

  /* --- hanging masses: what makes the sky-holes -----------------------
   * These hang BELOW the ceiling and overlap it, so depth comes from occlusion
   * rather than from a horizon. Each is anchored to the top edge too (they are
   * cropped, not floating) and each is far wider than it is deep, so none of
   * them is convex-and-bird-sized. */
  const masses: CanopyArt['masses'] = [];
  const massN = Math.max(1, Math.round(cfg.massCount * wideness));
  for (let i = 0; i < massN; i++) {
    // Spread across the whole width on a golden-ratio walk, never evenly: an
    // even rank of masses reads as a grid, and clustering them at the two edges
    // (which is what alternating sides did) leaves a wide frame hollow in the
    // middle. Width is in BIRDS, so a mass is the same size relative to the cast
    // at every aspect.
    const cx = w * (((i * 0.618 + 0.11) % 1) * 1.1 - 0.05);
    const half = Math.min(w * 0.45, birdW * (1.15 + rnd() * 0.95));
    const depth = h * cfg.massDepth * (0.7 + rnd() * 0.6);
    const top = ceilY * (0.25 + rnd() * 0.4);
    const pts = lobedEdge(
      cx - half,
      cx + half,
      (t) => top + depth * Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.7,
      lobeR * (0.8 + rnd() * 0.5),
      cfg.lobeVariance,
      rnd,
      1,
    );
    masses.push({
      fill: closeAgainst(-bleed, pts, bleed),
      // A rim band following the scalloped edge, exactly as the ceiling's is.
      // The shifted-silhouette version showed through wherever the two outlines
      // diverged, which came out as pale vertical streaks running up into the
      // mass — the most visible artefact in the whole first canopy render.
      relief: closedPath([
        ...pts,
        ...[...pts].reverse().map(([x, y]) => [x, y - depth * 0.22] as Pt),
      ]),
    });
  }

  /* --- the bough: the thing the nest is cradled in --------------------
   * Cropped by BOTH side edges, so it continues past the frame and is never an
   * object you could count. `ribbon` (not `taperedOutline`) keeps it full width
   * at the edges — tapering both ends turns a limb into a lens.
   *
   * It has to be THICK. At pinstripe width it is a rule drawn across the
   * picture, which is exactly what the branch it replaces was, and a nest
   * balanced on a line reads as balanced rather than as cradled. It also carries
   * its own foliage below, so the bottom of the frame is a leafy bough and not a
   * bar with a gap under it.
   */
  const boughY = h * 0.8;
  const boughPts = quadPts(
    [-bleed, boughY - boughW * 0.34],
    [w * 0.46, boughY + boughW * 0.3],
    [w + bleed, boughY - boughW * 0.5],
    24,
  );
  const bPhase = rnd() * Math.PI * 2;
  const bHalf = (t: number) => (boughW / 2) * (0.88 + 0.12 * Math.sin(t * Math.PI * 2.7 + bPhase));
  const bLobes = Math.max(4, Math.round(w / (lobeR * 2.4)));
  const bLeaf = (t: number) =>
    bHalf(t) + lobeR * cfg.leafDepth * 0.8 * (0.4 + 0.6 * Math.abs(Math.sin(t * bLobes * Math.PI)));
  const bough = {
    body: polygonPath(ribbon(boughPts, bHalf, (t) => bHalf(t) * 0.92)),
    ink: polygonPath(
      ribbon(
        boughPts,
        (t) => bHalf(t) + limbW * INK_RATIO * 1.2,
        (t) => bHalf(t) * 0.92 + limbW * INK_RATIO * 0.55,
      ),
    ),
    /*
     * Foliage above AND below the bough — leaves sprout off a bough, they do not
     * hang under it like a valance. The upper side is suppressed across the
     * middle third, because that is where the nest sits and where the child is
     * aiming: foliage is allowed to frame the drop zone and never to cover it.
     */
    leaves:
      cfg.leafDepth > 0.05
        ? lobedBand(
            boughPts,
            bLeaf,
            (t) => bHalf(t) + (bLeaf(t) - bHalf(t)) * 0.9 * Math.min(1, Math.abs(t - 0.5) / 0.24),
            lobeR,
            cfg.lobeVariance,
            rnd,
          )
        : '',
    /** Where the nest sits: the bough's upper surface at the nest's x. */
    top: boughY - boughW * 0.42,
  };

  /* --- perch limbs ----------------------------------------------------
   * Each ENTERS at a side edge, reaches `limbReach` across, and terminates in a
   * fork. None spans the frame: a line that runs edge to edge is a rule drawn
   * across the picture, which is what the old branch was.
   *
   * They are spaced through the open middle band between the ceiling and the
   * bough — the zone the birds wait in — because a limb the birds cannot stand
   * on does not solve the floating. */
  const limbs: Limb[] = [];
  const perches: Pt[] = [];
  /*
   * The band the perch limbs live in, and it is deliberately as tall as the
   * scene allows. A bird stands about its own width high, so the number of birds
   * that can be stacked without one's head ending up in another's belly is set
   * directly by this height — squeeze it and the generator simply cannot offer
   * the cast five places to stand.
   */
  const band0 = ceilY + h * 0.03;
  const band1 = boughY - h * 0.09;
  /*
   * RANKS, not a count. The two axes are governed by different things, and
   * conflating them is what produced a ladder of six parallel limbs on desktop.
   *
   * How many HEIGHTS there is room for is set by the vertical band, and that
   * band is almost identical on both frames measured in birds (~2.6 of them),
   * so both get about three ranks. How many limbs sit at each height is set by
   * WIDTH: a phone is 2.8 birds wide and holds one, a 16:10 frame is 10 birds
   * wide and holds two entering from opposite sides with a sky-hole between.
   * That is the honest difference between the frames, and following it is what
   * stops a wide viewport being either empty or striped.
   */
  const ranks = Math.max(2, Math.min(4, Math.round(((band1 - band0) / birdW) * cfg.limbDensity)));
  // Deliberately conservative. At one limb per 3.4 birds of width a 16:10 frame
  // came out with twelve of them, and twelve raked limbs is not a tree — it is
  // scaffolding. A wide frame wants more tree than a phone, not a thicket: the
  // sky-holes between the limbs are as much of the picture as the limbs are.
  const perRank = Math.max(1, Math.min(2, Math.round((birdsWide / 4.5) * cfg.limbDensity)));
  let li = -1;
  for (let r = 0; r < ranks; r++) {
    for (let c = 0; c < perRank; c++) {
      li++;
      /*
       * Ranks are spaced EVENLY, with only a small golden-ratio jitter on top.
       *
       * A golden-ratio walk over the whole band was the first attempt, on the
       * reasoning that even rungs read as a ladder. They do — but the rake and
       * the dip already break that, and walking the band instead left two limbs
       * 25 units apart in a 100-unit band, which is closer than a bird is tall.
       * The cast then had nowhere to stand without overlapping. Even spacing is
       * what actually guarantees a bird's worth of room per rank; the jitter is
       * what keeps the ranks from lining up exactly.
       */
      const t = (r + 0.5) / ranks + (((li * 0.618) % 1) - 0.5) * 0.1;
      const y = band0 + (band1 - band0) * Math.min(0.97, Math.max(0.03, t));
      // Alternate on the GLOBAL index, not the column. Alternating within a rank
      // put two of every three limbs on the left at perRank 3, which packed one
      // side of a wide frame and left the other bare.
      const fromLeft = li % 2 === 0;
      // Reach is in birds, then clamped: on a narrow frame a limb must still get
      // properly into the picture, and on a wide one it must stop short of the
      // far edge — a limb that reaches the other side is a rule drawn across the
      // picture, which is the thing this whole scene replaces. The jitter is
      // wide on purpose: limbs whose tips all land on the same vertical leave a
      // seam of bare sky straight down the middle of the frame.
      const reach = Math.min(
        w * 0.92,
        Math.max(w * 0.4, birdW * cfg.limbReach * (0.7 + rnd() * 0.75)),
      );
      const x0 = fromLeft ? -bleed : w + bleed;
      const x1 = fromLeft ? Math.min(w * 0.94, reach) : Math.max(w * 0.06, w - reach);
      // Each limb RAKES: it enters at one height and leaves at another. Without
      // it every limb is horizontal and the scene is stripes again, one layer in.
      // Rake sign follows the RANK, not the running index. Tying it to the same
      // parity as the entry side made every limb slope the same way, which is a
      // ladder rotated rather than a ladder broken.
      const rake = (0.35 + rnd() * 0.65) * cfg.limbRake * h * (r % 2 === 0 ? 1 : -1);
      const dip = (0.015 + rnd() * 0.03) * h;
      const spine = quadPts(
        [x0, y - rake],
        [(x0 + x1) / 2, y + dip + rake * 0.2],
        [x1, y + rake],
        24,
      );
      const half = (s2: number) => (limbW / 2) * (1 - 0.72 * s2) * (0.88 + 0.12 * Math.sin(s2 * 9));

      /*
       * The leafy fringe. Its lobes are carried in the spine's own moving frame,
       * so foliage grows ALONG the limb rather than sitting on the end of it as
       * a pom-pom — a pom-pom would be a closed, convex, bird-sized silhouette,
       * which is the crown readmitted through the back door. It fades in from
       * the frame edge because leaves cluster toward the tips, and that gradient
       * is what stops it reading as a furry pipe.
       */
      const leafR = lobeR * cfg.leafDepth;
      /*
       * Foliage swells away from the frame edge and then CLOSES BACK DOWN at the
       * tip. The falling half is not decoration: `fringe` joins its two runs with
       * a straight line, so a fringe still at full depth when the limb ends shuts
       * with a hard vertical cut — and with several limbs ending near the same x
       * those cuts lined up into a straight-sided column of bare sky down the
       * middle of a wide frame. Closing to a point lets the limb end in leaves.
       */
      const grow = (s2: number) =>
        Math.min(1, Math.max(0, (s2 - 0.08) / 0.4)) * Math.min(1, Math.max(0, (1 - s2) / 0.16));
      const leafHalf = (s2: number) => half(s2) + leafR * grow(s2);
      limbs.push({
        body: polygonPath(ribbon(spine, half, (s2) => half(s2) * 0.9)),
        ink: polygonPath(
          ribbon(
            spine,
            (s2) => half(s2) + limbW * INK_RATIO,
            (s2) => half(s2) * 0.9 + limbW * INK_RATIO * 0.45,
          ),
        ),
        leaves:
          cfg.leafDepth > 0.05
            ? lobedBand(spine, (s2) => leafHalf(s2) * 0.72, leafHalf, lobeR, cfg.lobeVariance, rnd)
            : '',
        twigs: Array.from({ length: Math.round(cfg.twigCount) }, (_, k) => {
          const st = 0.4 + (k / Math.max(1, cfg.twigCount)) * 0.5;
          const idx = Math.min(spine.length - 1, Math.round(st * (spine.length - 1)));
          const [ox, oy] = spine[idx];
          const up = k % 2 === 0 ? -1 : 0.5;
          const len = limbW * (2 + rnd() * 2.4);
          const dx = (fromLeft ? 1 : -1) * len * (0.5 + rnd() * 0.5);
          return taperedOutline(
            quadPts([ox, oy], [ox + dx * 0.5, oy + up * len * 0.4], [ox + dx, oy + up * len * 0.85], 8),
            limbW * 0.4,
            0.3,
          );
        }),
      });

      /*
       * Perches, sampled ON the spine rather than guessed near it, and placed by
       * X and then matched to the nearest spine point. The spine is a quadratic,
       * so equal steps in `t` are nowhere near equal steps in x — spacing perches
       * by `t` bunched them into the middle of the frame and sat two birds on
       * top of each other. Deriving the cast's rest positions from this is the
       * whole reason the birds stop floating.
       */
      // Deliberately MORE candidates than there are birds, and offset per limb.
      // The chooser is a selection, so it needs something to select from: with
      // one candidate per bird every limb offered the same handful of x values,
      // two of them landed on the identical x, and no amount of clever choosing
      // could separate birds the generator never gave anywhere else to stand.
      const per = Math.max(2, Math.round(cfg.perchesPerLimb) + 2);
      const phase = (rnd() - 0.5) * 0.7;
      const inner = birdW * 0.6;
      const lo = Math.max(inner, Math.min(x0, x1) + inner * 0.4);
      const hi = Math.min(w - inner, Math.max(x0, x1) - inner * 0.4);
      for (let k = 0; k < per; k++) {
        if (hi - lo < inner) break;
        const u = Math.min(0.95, Math.max(0.05, (k + 0.5 + phase) / per));
        const want = lo + u * (hi - lo);
        let best = 0;
        for (let q = 1; q < spine.length; q++) {
          if (Math.abs(spine[q][0] - want) < Math.abs(spine[best][0] - want)) best = q;
        }
        const [px, py] = spine[best];
        if (px < inner || px > w - inner) continue;
        perches.push([px, py - half(best / (spine.length - 1))]);
      }
    }
  }

  /* --- understory: the repoussoir -------------------------------------
   * The dark cropped foreground mass that turns two planes into three, and the
   * single strongest "this is a place" cue available.
   *
   * CORNER-WEIGHTED, not a band. A full-width scallop along the bottom edge is a
   * hedge — another horizontal stripe, which is the thing being fixed. Weighting
   * it to the two bottom corners does the repoussoir's actual job (framing the
   * view from the sides) AND keeps it out of the middle, which is where the
   * nest's drop zone is. A foreground mass over the target the child is aiming
   * at would be the one genuinely unforgivable version of this element.
   */
  const understory =
    cfg.understoryDepth > 0.001
      ? {
          fill: closeAgainst(
            h + bleed,
            lobedEdge(
              -bleed,
              w + bleed,
              (t) => {
                // 1 at both edges, ~0 across the middle. The falloff is steeper
                // than it was: at a gentler power the "corner" mass reached most
                // of the way across and read as a hedge — one more horizontal
                // band, which is the failure this whole scene replaces, and a
                // large dark region competing with the cast besides.
                const edge = Math.max(0, 1 - Math.abs(t - 0.5) / 0.46) ** 2.6;
                const corner = 1 - edge;
                return h - h * cfg.understoryDepth * (0.08 + 0.92 * corner);
              },
              lobeR * 1.3,
              cfg.lobeVariance,
              rnd,
              -1,
            ),
            bleed,
          ),
        }
      : null;

  /* --- the moon: one oversized cropped disc ---------------------------
   * Behind everything, so the ceiling and the masses crop it. That occlusion is
   * what makes it sit in depth instead of being a sticker on the sky. */
  const moon =
    cfg.moonScale > 0.01
      ? { cx: cfg.moonX, cy: h * cfg.moonY, r: (birdW * cfg.moonScale) / 2 }
      : null;

  /* --- motes: the only moving thing -----------------------------------
   * Seed fluff. Tiny by rule (a mote at bird scale would be a sixth character),
   * few, and slow. This is the cheapest literal "alive" available and the only
   * animation the background gets. */
  const motes = Array.from({ length: Math.round(cfg.moteCount) }, () => ({
    cx: w * (0.1 + rnd() * 0.8),
    cy: h * (cfg.ceilingDepth + 0.05 + rnd() * 0.5),
    r: Math.max(0.35, birdW * (0.012 + rnd() * 0.012)),
    delay: rnd() * 6,
    amp: h * (0.02 + rnd() * 0.03),
  }));

  return {
    ceiling,
    masses,
    limbs,
    bough,
    understory,
    moon,
    motes,
    perches: choosePerches(perches, castSize, birdW, w),
  };
}

/**
 * Pick exactly `castSize` perches out of the candidates the limbs offered.
 *
 * Two things go wrong if you just take them in order. Too many, and the frame
 * fills with birds — the generator offers more perches than there are
 * fledglings on purpose, so that the choice has something to choose from. And
 * two perches close in x on limbs one above the other put one bird's head
 * through another's feet, which is what the first pass did to three of the five.
 *
 * So: walk candidates top-to-bottom and take one only if it clears every
 * already-taken perch by a bird's width in x OR sits far enough below it in y.
 * If that leaves us short, the separation is relaxed rather than dropping a
 * bird — the cast size is the Goal and is not negotiable, the spacing is.
 */
function choosePerches(all: Pt[], castSize: number, birdW: number, w: number): Pt[] {
  if (all.length === 0) return [];
  /*
   * NON-OVERLAP is the hard constraint, and it is the only hard one. A drawn
   * bird is about as tall as it is wide, so two perches clash when they are
   * closer than roughly a bird in BOTH axes. Demanding more than that as a gate
   * was a mistake worth naming: asking for "a fair share of the frame's width"
   * fixed the wide frame and broke the narrow one, because a phone is only ~2.8
   * birds across and five birds simply do not fit side by side there. Five birds
   * on a phone MUST stack vertically.
   */
  const sepX = birdW * 0.85;
  // Taller than wide, because a perch is where the FEET are and the bird stands
  // up from it: the drawn body reaches about 1.1 bird-widths above its own feet,
  // so two perches a bird-width apart vertically still put one bird's head
  // through the other's belly.
  const sepY = birdW * 1.05;
  const clashes = (p: Pt, out: Pt[], k: number) =>
    out.some((q) => Math.abs(q[0] - p[0]) < sepX * k && Math.abs(q[1] - p[1]) < sepY * k);

  /*
   * Spread is then a PREFERENCE, not a gate — farthest-point selection. Each
   * next bird is the legal candidate furthest from every bird already placed, so
   * a wide frame spreads them sideways and a narrow one stacks them down the
   * scene, from the same rule and with no per-aspect special case.
   */
  const pick = (k: number): Pt[] => {
    const pool = [...all];
    // Start at the top, so the cast reads as descending toward the nest the
    // child is being asked to carry them to.
    let seed = 0;
    for (let i = 1; i < pool.length; i++) if (pool[i][1] < pool[seed][1]) seed = i;
    const out: Pt[] = [pool.splice(seed, 1)[0]];
    while (out.length < castSize && pool.length > 0) {
      let bestI = -1;
      let bestD = -1;
      for (let i = 0; i < pool.length; i++) {
        if (clashes(pool[i], out, k)) continue;
        const d = Math.min(...out.map((q) => Math.hypot(q[0] - pool[i][0], q[1] - pool[i][1])));
        if (d > bestD) {
          bestD = d;
          bestI = i;
        }
      }
      if (bestI < 0) break;
      out.push(pool.splice(bestI, 1)[0]);
    }
    return out;
  };

  for (const k of [1, 0.85, 0.7, 0.55, 0.4, 0.25]) {
    const got = pick(k);
    if (got.length >= castSize) return got;
  }
  // Nothing the limbs offered can hold the whole cast without overlap, so spread
  // what there is evenly across the frame's inner band, keeping each perch's own
  // y — the birds still stand on something, which is the part that matters.
  const out = pick(0);
  return out.map((p, i) => [
    out.length === 1 ? w / 2 : birdW * 0.6 + ((w - birdW * 1.2) * i) / (out.length - 1),
    p[1],
  ] as Pt);
}

/* ------------------------------------------------------------------ *
 * The rules, as a check rather than as a comment
 * ------------------------------------------------------------------ */

export type CanopyViolation = { rule: string; message: string };

/**
 * The shape-class rules that keep the background out of the cast's league,
 * evaluated for a given bird size. These are the lines that, left as prose,
 * were written down and then broken in the same session — so they run.
 */
export function check(cfg: CanopyConfig, birdW: number): CanopyViolation[] {
  const v: CanopyViolation[] = [];
  const lobe = birdW * cfg.lobeRatio * 2;
  if (lobe > birdW / 4) {
    v.push({
      rule: 'LOBE',
      message: `A leaf lobe is ${(lobe / birdW).toFixed(2)}x a bird — above 1/4 it stops reading as a mass and becomes countable.`,
    });
  }
  if (cfg.moonScale > 0.01 && cfg.moonScale < 2.5) {
    v.push({
      rule: 'PEER SIZE',
      message: `The moon is ${cfg.moonScale.toFixed(1)}x a bird. A background shape must be >= 2.5x the cast or <= 1/8 of it — the band between is a sixth character.`,
    });
  }
  // `boughThickness` is a MULTIPLE of a bird, not a frame measurement — this
  // check compared it against frame units until the unit change and then fired
  // on every frame, which is the exact class of bug the rest of this file exists
  // to catch, one level up.
  if (cfg.boughThickness < 0.25) {
    v.push({
      rule: 'BOUGH',
      message: 'The bough is too thin to cradle a nest — it reads as a line drawn across the picture rather than as something the nest sits in.',
    });
  }
  // Nothing here checks reach against a span: the generator CLAMPS reach to 92%
  // of the frame, so a config can no longer produce one. What a config CAN still
  // do is make a limb too short to be a branch — a stub entering the frame and
  // stopping is a mark, and a bird cannot stand on it.
  if (cfg.limbReach < 1.2) {
    v.push({
      rule: 'STUB',
      message: `A limb reaching ${cfg.limbReach.toFixed(1)} birds is a mark entering the frame, not a branch — and there is nowhere on it to perch.`,
    });
  }
  // The understory is corner-weighted — across the middle third it is only ~15%
  // of this depth — so the number that matters for the drop zone is well under
  // the nominal one. Past ~0.3 even the middle starts climbing into the nest.
  if (cfg.understoryDepth > 0.3) {
    v.push({
      rule: 'DROP ZONE',
      message: 'The understory reaches into the nest band — the foreground mass may frame where the child is aiming, never cover it.',
    });
  }
  return v;
}
