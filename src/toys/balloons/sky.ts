/**
 * The sky — the scene generator for "a bunch tied down under a big afternoon".
 *
 * WHY THIS EXISTS, AND WHY THE CLOUDS ARE NOT CIRCLES ANY MORE. The scene it
 * replaces was a flat sky rect, five `<circle>` cloud puffs, a full-width grass
 * path and a `<rect>` peg with an `<ellipse>` cap. Nothing overlapped anything,
 * nothing was cropped, every edge was horizontal — the most inert composition
 * available, and no amount of texture rescues it.
 *
 * The clouds were the sharpest failure, and naming it precisely is what licenses
 * everything below. A cloud circle there was CONVEX, CLOSED, ROUNDED and — at
 * r 6 to 9 in a square slice viewBox — between 0.25 and 0.31 of a balloon wide
 * on a phone. So is a balloon. Five of them behind five balloons asks a
 * three-year-old to sort ten rounded blobs into "hold this" and "not this",
 * which is figure-class rivalry from a background object in the cast's own size
 * band. And in THIS Toy the collision is worse than generic: a cloud is not
 * merely balloon-SIZED, it is the same silhouette a balloon has. The peg's
 * `<ellipse>` cap was the same error one octave down.
 *
 * Sorted by shape class, with a balloon as the unit:
 *
 *   | class                      | shape                          | rival? |
 *   | cloud puff, peg cap        | convex, closed, balloon-sized  | YES    |
 *   | grass blade, string, peg   | elongated, open, linear        | no     |
 *   | cloud bank, ground, bank   | cropped, >= 2.5x a balloon     | no     |
 *   | cloud lobe, mote           | <= 1/8 a balloon, in a mass    | no     |
 *
 * So a sky built from cropped cloud BANKS, a cropped ground line, grass blades
 * and a stake — with no free-standing puffs in it — is an afternoon containing
 * no balloon-shaped object. That is the whole unlock, and it is enforced here
 * rather than trusted: `check()` returns the violations and `sky.test.ts`
 * asserts them at the sizes this Toy actually ships.
 *
 * IT ALSO TIES THE STRINGS TO THE PEG. The scene emits `tether` — the top of the
 * stake — and `anchors`, the knot point each balloon in the bunch hangs from.
 * Those used to be two independently-maintained numbers: the peg was drawn at
 * x 50 of a `preserveAspectRatio="none"` band that STRETCHED with the viewport,
 * and the balloons were placed at hand-tuned `left`/`top` percentages of the
 * Toy's `<main>`, each with a fixed-length string drawn in its own box that
 * pointed at nothing. On a phone they looked tied; at any other aspect the peg
 * slid out from under the bunch and five strings ended in mid-air. Two
 * hand-maintained positions cannot be kept in agreement; one generator read by
 * both cannot fall out of it.
 *
 * FRAME SPACE. Everything is authored in a `0..100` x `0..h` box whose aspect
 * MATCHES the viewport's, so nothing is ever stretched or sliced: at 9:19.5 `h`
 * is ~216, at 16:10 it is ~62.5, and the generator composes for the box it is
 * given.
 *
 * THE UNIT IS A BALLOON, NOT THE FRAME. Every SIZE here — cloud span, lobe
 * radius, blade height, peg height, how wide the bunch fans — is a multiple of
 * `balloonW`, a balloon's width in frame units. Only POSITIONS are frame
 * fractions. A phone is ~3.6 balloons across and a 16:10 desktop ~7.6, so a wide
 * viewport gets MORE sky sideways, never the same sky enlarged.
 */

import {
  closeAgainst,
  closedPath,
  lobedEdge,
  polygonPath,
  quadPts,
  ribbon,
  taperedOutline,
  type Pt,
} from '../../shell/art/geometry';
import { line as houseLine } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { KNOT_OFFSET } from './balloon-metrics';

/**
 * Scenery contour weight, as a fraction of the CAST's contour — not of the thing
 * being outlined.
 *
 * That distinction is the whole point. Sizing the line off the peg's own
 * thickness means a thicker peg gets a heavier line, so the scenery's weight
 * ends up set by the scenery. The contour belongs to the FIGURE: this is enough
 * line to say the peg is DRAWN — which is most of the difference between an
 * illustration and clip art — and, at half the cast's weight, not enough to
 * compete.
 */
const SCENERY_CONTOUR_RATIO = 0.5;

/** The box the scene is composed into. `w` is always 100; `h` follows the aspect. */
export type Frame = { w: number; h: number };

/**
 * Every taste decision in the sky. The RULES (what makes it this idea) are
 * hardcoded below; these are the numbers nobody has settled yet.
 */
export type SkyConfig = {
  /** Where the ground line sits, as a fraction of frame height. LOW by design:
   *  the tall sky above is the load-bearing space, the ground is just the thing
   *  the bunch is tied to. */
  groundY: number;
  /** How far the ground line undulates, in BALLOON widths. A field is not flat,
   *  and a dead-level line is a rule drawn across the picture. */
  groundRelief: number;
  /** How many far banks a WIDE frame gets. Scaled by the frame's width in
   *  balloons, and zero on a phone, where no legal bank fits. */
  bankCount: number;
  /** How far a bank reaches in from its edge, in BALLOONS. Must be >= 2.5, or
   *  the bank lands in the cast's own size band and becomes a sixth character. */
  bankSpread: number;
  /** How high a bank crests above the ground line, as a fraction of height. */
  bankRise: number;
  /** How many cloud banks a WIDE frame gets. Never a free-standing puff — see
   *  the header; each is anchored to a top corner and cropped by two edges. */
  cloudCount: number;
  /** A cloud bank's span, in BALLOONS. Must be >= 2.5, for the same reason a
   *  bank must be: below it the bank IS the thing it replaced. */
  cloudSpan: number;
  /** How far a bank hangs below the top edge, as a fraction of frame height. */
  cloudDepth: number;
  /** A cloud lobe's RADIUS as a fraction of a balloon. The rule is on the
   *  diameter: <= 1/4, or a lobe stops dissolving into the mass and becomes a
   *  puff again — the rival readmitted as a mass of small rivals. */
  lobeRatio: number;
  lobeVariance: number;
  /** Grass tufts per balloon-width of frame. A density, not a count: the number
   *  follows the frame while the SIZE follows the balloon. */
  tuftDensity: number;
  /** Tuft height, in BALLOON widths. */
  tuftHeight: number;
  /** Tuft width, in BALLOON widths. Held well under the height so a tuft stays
   *  ELONGATED — a tuft as wide as it is tall is a bush, which is a rival. */
  tuftWidth: number;
  bladesPerTuft: number;
  /** Foreground grass depth, as a fraction of frame height. Corner-weighted. */
  foreDepth: number;
  /** Foreground blade height, in BALLOON widths. */
  foreHeight: number;
  /** The peg's height above the ground line, in BALLOONS. */
  pegHeight: number;
  /** The peg's thickness, in BALLOONS. Held well under the height so the stake
   *  stays in the elongated-open class. */
  pegThickness: number;
  /** Where the peg is driven in, as a fraction of frame width. */
  pegX: number;
  /** How wide the bunch fans, in BALLOONS — the span of the upper row's knots. */
  bunchSpread: number;
  /** How far the upper row's knots sit above the tether, in BALLOONS. */
  bunchRise: number;
  /** How far the lower row hangs below the upper one, in BALLOONS. */
  bunchStagger: number;
  /** Drifting seed fluff — the only moving thing in the scene. */
  moteCount: number;
};

export const SKY_DEFAULTS: SkyConfig = {
  groundY: 0.86,
  groundRelief: 0.1,
  bankCount: 2,
  bankSpread: 2.8,
  bankRise: 0.055,
  cloudCount: 1.2,
  cloudSpan: 2.9,
  cloudDepth: 0.17,
  lobeRatio: 0.06,
  lobeVariance: 0.62,
  tuftDensity: 2.4,
  tuftHeight: 0.3,
  tuftWidth: 0.18,
  bladesPerTuft: 5,
  foreDepth: 0.06,
  foreHeight: 0.42,
  pegHeight: 0.7,
  pegThickness: 0.1,
  pegX: 0.5,
  bunchSpread: 2.2,
  bunchRise: 1.8,
  bunchStagger: 0.9,
  moteCount: 3,
};

/* ------------------------------------------------------------------ *
 * The generator
 * ------------------------------------------------------------------ */

export type Tuft = { blades: string[]; x: number };

export type SkyArt = {
  /** Cloud banks, each anchored to a top corner and cropped by two edges. */
  clouds: { fill: string; relief: string }[];
  /** Far ground planes, back to front. Empty on a narrow frame by design. */
  banks: { fill: string; relief: string }[];
  /** The near ground plane — the ONE shape allowed to cross the frame. */
  ground: { fill: string; relief: string };
  tufts: Tuft[];
  fore: { base: string; blades: string[] } | null;
  /** The stake the whole bunch is tied to. Ink first, then the fill on top. */
  peg: { ink: string; body: string };
  motes: { cx: number; cy: number; r: number; delay: number; amp: number }[];
  /** The ground line, sampled left to right across the full frame. */
  line: Pt[];
  /** The top of the peg — the point every string in the bunch ties to. */
  tether: Pt;
  /**
   * Where each balloon's KNOT hangs, in the order the bunch renders them.
   *
   * The upper row comes first so the lower row paints over it: a lower balloon's
   * string is short and a raised one's is long, so the long ones have to pass
   * BEHIND the balloons between them and the peg. Emitting the rows in the other
   * order draws five strings across the front of the bunch.
   */
  anchors: Pt[];
};

/** The ground line's height at any x — a linear read of the sampled `line`. */
export function groundYAt(line: readonly Pt[], x: number): number {
  if (line.length === 0) return 0;
  if (x <= line[0][0]) return line[0][1];
  const last = line[line.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < line.length; i++) {
    if (line[i][0] >= x) {
      const [x0, y0] = line[i - 1];
      const [x1, y1] = line[i];
      const f = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * f;
    }
  }
  return last[1];
}

/**
 * Build the whole sky. Pure: same `(cfg, frame, balloonW, seed, bunchSize)` in,
 * same paths out, every random draw from a named seeded stream.
 *
 * `balloonW` is a balloon's width IN FRAME UNITS, and it is a parameter rather
 * than a constant because every size rule is expressed against it — a cloud bank
 * is "three balloons across", never "84 units".
 */
export function buildSky(
  cfg: SkyConfig,
  frame: Frame,
  balloonW: number,
  seed: number,
  bunchSize: number,
): SkyArt {
  const { w, h } = frame;
  const rnd = stream(seed, 'sky');
  const bleed = w * 0.08;
  const lobeR = Math.max(0.5, balloonW * cfg.lobeRatio);
  /** How wide the frame is, measured in balloons. ~3.6 on a phone, ~7.6 at 16:10. */
  const balloonsWide = w / balloonW;
  /*
   * The cast's own contour, converted into frame units — a balloon is drawn in a
   * 100-wide box rendered `balloonW` frame units across, so its line scales with
   * it. Everything the scene outlines is measured against this.
   */
  const castContour = houseLine.contour * (balloonW / 100);
  const inkW = castContour * SCENERY_CONTOUR_RATIO;

  /* --- the ground line -------------------------------------------------
   * The ONE shape allowed to cross the frame horizontally, and it is cropped by
   * both side edges so it reads as continuing past them.
   *
   * A SMOOTH curve, deliberately — and this is one of two places in the
   * collection where a sine is the right tool rather than the wrong one. A
   * smooth periodic curve reads as a hill, because that is what a hill is; the
   * lobed-arc emitter the clouds use would turn this ground into foliage. Two
   * low harmonics, never one: the beat between them is what stops it reading as
   * a single wave.
   */
  const groundY = h * cfg.groundY;
  const relief = balloonW * cfg.groundRelief;
  const gPhase = rnd() * Math.PI * 2;
  const groundAt = (x: number) => {
    const t = (x + bleed) / (w + bleed * 2);
    return (
      groundY +
      relief * 0.62 * Math.sin(t * Math.PI * 1.6 + gPhase) +
      relief * 0.38 * Math.sin(t * Math.PI * 3.9 + gPhase * 1.7)
    );
  };
  const line: Pt[] = [];
  for (let i = 0; i <= 72; i++) {
    const x = -bleed + ((w + bleed * 2) * i) / 72;
    line.push([x, groundAt(x)]);
  }
  const ground = {
    fill: closedPath([...line, [w + bleed, h + bleed], [-bleed, h + bleed]]),
    /*
     * The lit crest, as a BAND following the ground line rather than the whole
     * silhouette shifted up. A shifted copy shows through wherever the two
     * outlines diverge, which comes out as pale streaks.
     */
    relief: closedPath([
      ...line,
      ...[...line].reverse().map(([x, y]) => [x, y + relief * 1.1 + balloonW * 0.02] as Pt),
    ]),
  };

  /* --- cloud banks -----------------------------------------------------
   * Each is anchored to a TOP CORNER, deepest at the side edge it enters from
   * and rising back to the top edge at its free end — so it is cropped by two
   * frame edges and can never be counted as an object. Its underside is built
   * from circular lobes with NOTCHES between them, which is what a cloud in this
   * tradition is; a smooth periodic curve there would read as a hill in the sky.
   *
   * Anchored at a corner rather than spanning the width on purpose. The canopy's
   * full-width ceiling is right for a Toy that is UNDER a tree and wrong for one
   * whose whole subject is an open sky — a roof is the one thing this scene must
   * not have, because the balloons have to look like they can leave.
   */
  const clouds: SkyArt['clouds'] = [];
  const cloudSpan = balloonW * cfg.cloudSpan;
  // Capped at TWO — one per top corner. A third has nowhere new to go: the
  // sides alternate, so it lands back on top of the first and the pair reads as
  // one lumpy mass rather than as two cropped corners with sky between them.
  const cloudN = Math.max(1, Math.min(2, Math.round(cfg.cloudCount * (balloonsWide / 3.6))));
  for (let i = 0; i < cloudN; i++) {
    const fromLeft = i % 2 === 0;
    /*
     * The random factor is FLOORED at 2.6 balloons rather than left to swing
     * down to 0.85 of the configured span. At `cloudSpan` 2.9 that low end is
     * 2.465 balloons — under the 2.5 the whole cloud argument rests on, so one
     * roll of the dice would have put a bank back inside the cast's size band
     * without the config ever looking wrong. A rule enforced on a config and not
     * on the number the generator actually draws with is not enforced.
     */
    const span = Math.max(
      balloonW * 2.6,
      Math.min(w * 0.72, cloudSpan * (0.85 + rnd() * 0.4)),
    );
    const x0 = fromLeft ? -bleed : w + bleed - span;
    const x1 = fromLeft ? -bleed + span : w + bleed;
    // Staggered in depth as well as in side, so two banks never read as a
    // matched pair — which is a row, one octave up from a treeline.
    const depth = h * cfg.cloudDepth * (0.75 + rnd() * 0.5) * (1 - i * 0.22);
    const phase = rnd() * Math.PI * 2;
    const baseline = (t: number) => {
      /*
       * Measured from the TOP EDGE, not from `-bleed`. The bleed is a fraction
       * of the frame's WIDTH, and spending it on the vertical made the bank's
       * depth aspect-dependent in the worst direction: on a 16:10 frame those 8
       * width units are 13% of the height, which swallowed most of the bank and
       * left a sliver in the corner, while on a phone the same number barely
       * registered. A size authored against one axis and spent on the other
       * changes class as the frame grows — the same failure as authoring a bough
       * in frame units.
       */
      const u = fromLeft ? t : 1 - t;
      const fall = 1 - Math.pow(u, 1.6);
      return depth * fall + depth * 0.09 * Math.sin(t * Math.PI * 3.3 + phase);
    };
    const pts = lobedEdge(x0, x1, baseline, lobeR * (0.85 + rnd() * 0.4), cfg.lobeVariance, rnd, 1);
    if (pts.length < 3) continue;
    clouds.push({
      fill: closeAgainst(-bleed, pts, bleed),
      // A rim band FOLLOWING the scalloped edge, exactly as the canopy's is. The
      // shifted-silhouette version showed through wherever the two outlines
      // diverged and came out as pale vertical streaks running up into the mass.
      relief: closedPath([
        ...pts,
        ...[...pts].reverse().map(([x, y]) => [x, y - depth * 0.2] as Pt),
      ]),
    });
  }

  /* --- far banks -------------------------------------------------------
   * Each ENTERS at a side edge, crests above the ground line, and settles back
   * below it — so it is cropped by that edge and never a free-standing hill.
   *
   * They exist only where a LEGAL one fits. A bank must be at least 2.5 balloons
   * wide to clear the cast's size band; on a phone 2.5 balloons is ~70 frame
   * units against a 100-unit frame, which fits but leaves no room for a second,
   * so the count follows the frame. A wide viewport gets more sky SIDEWAYS.
   */
  const banks: SkyArt['banks'] = [];
  const bankW = balloonW * cfg.bankSpread;
  const bankRoom = Math.floor((w * 0.86) / bankW);
  const bankN = Math.max(
    0,
    Math.min(3, Math.min(bankRoom, Math.round(cfg.bankCount * (balloonsWide - 3) * 0.4))),
  );
  for (let i = 0; i < bankN; i++) {
    const fromLeft = i % 2 === 0;
    const reach = Math.min(w * 0.86, bankW * (0.85 + rnd() * 0.4));
    const x0 = fromLeft ? -bleed : w + bleed;
    const x1 = fromLeft ? reach : w - reach;
    const rise = h * cfg.bankRise * (0.7 + rnd() * 0.6);
    const crestY = groundAt((x0 + x1) / 2) - rise * (1 + i * 0.35);
    const pts: Pt[] = [];
    const n = 40;
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = x0 + (x1 - x0) * t;
      // A single smooth shoulder: high at the frame edge, easing down to meet
      // the ground line at the far end. `t^1.7` keeps the crest broad near the
      // edge instead of peaking into a dome, which would be a closed hill.
      const fall = Math.pow(t, 1.7);
      pts.push([x, crestY + (groundAt(x) - crestY) * fall]);
    }
    const far = fromLeft ? w + bleed : -bleed;
    banks.push({
      fill: closedPath([...pts, [far, h + bleed], [x0, h + bleed]]),
      relief: closedPath([
        ...pts,
        ...[...pts].reverse().map(([x, y]) => [x, y + rise * 0.3] as Pt),
      ]),
    });
  }

  /* --- grass tufts -----------------------------------------------------
   * BLADES, not clumps. A tuft is a fan of separate tapered lines that never
   * closes at the top, which keeps it in the elongated-open class however tall
   * it gets. A round clump of the same size is a bush, and a bush at this scale
   * is a cloud puff sitting on the ground.
   */
  const tufts: Tuft[] = [];
  const tuftN = Math.max(3, Math.round(cfg.tuftDensity * balloonsWide));
  const tuftH = balloonW * cfg.tuftHeight;
  const tuftW = balloonW * cfg.tuftWidth;
  for (let i = 0; i < tuftN; i++) {
    // A jittered walk rather than uniform scatter: uniform random has energy at
    // very low spatial frequencies, which shows up as clumps and conspicuous
    // bare stretches along the line.
    const x = ((i + 0.5 + (rnd() - 0.5) * 0.7) / tuftN) * (w + bleed * 2) - bleed;
    const baseY = groundAt(x) + tuftH * 0.08;
    const blades: string[] = [];
    const count = Math.max(2, Math.round(cfg.bladesPerTuft * (0.6 + rnd() * 0.8)));
    for (let k = 0; k < count; k++) {
      const u = count === 1 ? 0 : k / (count - 1) - 0.5;
      // The fan spans exactly `tuftWidth`. A lean multiplier above 1 would mean
      // a tuft authored as 0.18 balloons wide came out wider than it is tall, so
      // the config would say "elongated" while the generator drew a clump — and
      // the rule checked against it would pass on a lie.
      const lean = u * tuftW * (0.9 + rnd() * 0.2);
      const len = tuftH * (0.85 + rnd() * 0.4);
      blades.push(
        taperedOutline(
          quadPts(
            [x + u * tuftW * 0.15, baseY],
            [x + lean * 0.45, baseY - len * 0.62],
            [x + lean, baseY - len],
            10,
          ),
          Math.max(0.3, balloonW * 0.022),
          // Front-loaded: a blade is thickest near the root and lifts to a point.
          0.18,
        ),
      );
    }
    tufts.push({ blades, x });
  }

  /* --- the foreground grass: the repoussoir ----------------------------
   * CORNER-WEIGHTED, not a band. A full-width fringe along the bottom edge is
   * one more horizontal stripe, which is the thing being fixed — and worse, it
   * would sit across the middle of the bottom, which is where the peg is driven
   * in and where a hand rests.
   */
  const fore =
    cfg.foreDepth > 0.001
      ? (() => {
          const depth = h * cfg.foreDepth;
          // The two corners are NOT the same depth. A weight symmetric about the
          // centre draws a perfect bowl across the bottom of the frame — a single
          // symmetric shape, which is one more inert edge and the exact thing
          // corner-weighting was supposed to avoid.
          const lean = 0.55 + rnd() * 0.35;
          const weight = (t: number) => {
            // 0 across a FLAT middle, rising to 1 at both edges. Weighting
            // straight off the distance from centre gives a curve with a single
            // minimum, so the base band dives to a point at t = 0.5 and the
            // corner grass comes out as one hard chevron pointing down the
            // middle of the frame — right where the peg is.
            const d = Math.abs(t - 0.5);
            const w = Math.min(1, Math.max(0, (d - 0.12) / 0.24)) ** 1.5;
            return w * (t < 0.5 ? 1 : lean);
          };
          const base: Pt[] = [];
          const n = 48;
          for (let k = 0; k <= n; k++) {
            const t = k / n;
            base.push([-bleed + (w + bleed * 2) * t, h - depth * (0.06 + 0.94 * weight(t))]);
          }
          const blades: string[] = [];
          const bladeH = balloonW * cfg.foreHeight;
          const bladeN = Math.max(8, Math.round(balloonsWide * 8));
          for (let k = 0; k < bladeN; k++) {
            const t = (k + 0.5 + (rnd() - 0.5) * 0.8) / bladeN;
            const wgt = weight(t);
            if (wgt < 0.12) continue;
            const x = -bleed + (w + bleed * 2) * t;
            const baseY = h - depth * (0.06 + 0.94 * wgt) + depth * 0.15;
            const len = bladeH * wgt * (0.55 + rnd() * 0.8);
            const lean = (rnd() - 0.5) * len * 0.55;
            blades.push(
              taperedOutline(
                quadPts(
                  [x, baseY + len * 0.1],
                  [x + lean * 0.4, baseY - len * 0.6],
                  [x + lean, baseY - len],
                  10,
                ),
                Math.max(0.4, balloonW * 0.028),
                0.16,
              ),
            );
          }
          return {
            base: closedPath([...base, [w + bleed, h + bleed], [-bleed, h + bleed]]),
            blades,
          };
        })()
      : null;

  /* --- the peg: what the whole bunch hangs off -------------------------
   * A driven stake — elongated and open, so it carries no licence problem at any
   * length that does not span the frame. It replaces a `<rect>` post with an
   * `<ellipse>` cap, and the cap is the piece that had to go: a small convex
   * closed oval on top of a post is the cloud puff's shape class, one octave
   * down, sitting at the exact point the child's eye is drawn to.
   *
   * `ribbon` rather than `taperedOutline`, because the foot continues below the
   * ground line rather than ending in mid-air — a stake tapered to a needle at
   * the bottom is a stake that is not driven into anything. Its buried end is
   * covered by the grass drawn in front of it.
   */
  const pegX = w * cfg.pegX;
  const pegH = balloonW * cfg.pegHeight;
  const pegW = balloonW * cfg.pegThickness;
  const pegFootY = groundAt(pegX) + pegH * 0.3;
  // A slight lean — a stake driven by hand is never plumb, and a perfectly
  // vertical post in a scene with no other vertical is a rule drawn up the
  // picture.
  const pegLean = pegW * 0.55;
  const pegTop: Pt = [pegX + pegLean, groundAt(pegX) - pegH];
  const pegSpine = quadPts([pegX, pegFootY], [pegX + pegLean * 0.4, pegFootY - pegH * 0.6], pegTop, 12);
  // Thicker at the foot, thinner at the head: a stake is shaved to a point to be
  // driven, and the taper is most of what stops it reading as a rectangle.
  const pegHalf = (t: number) => (pegW / 2) * (1 - 0.28 * t);
  const peg = {
    // Line on BOTH sides, heavier underneath. A contour present on one side only
    // reads as a flat plank lit from above rather than as a drawn form.
    ink: polygonPath(ribbon(pegSpine, (t) => pegHalf(t) + inkW, (t) => pegHalf(t) + inkW * 0.8)),
    body: polygonPath(ribbon(pegSpine, pegHalf)),
  };

  /* --- the bunch: where the balloons actually hang ----------------------
   * Emitted BY THE SCENE, not maintained beside it. Every knot is placed
   * relative to the tether, so the strings land on the peg at every aspect
   * instead of at the one the percentages were tuned on.
   *
   * TWO ROWS, not an arch of five. Five balloons at 28vw each need 140vw of
   * width to sit side by side, and a phone frame is 3.6 balloons across — a
   * single row is either off the screen or a stack. The upper row takes the odd
   * one, spans the full fan, and arches so its middle sits highest; the lower
   * row is inset between the gaps and hangs a stagger below. That is what a
   * bunch on a string actually does, and it also keeps every balloon presenting
   * its own crown to a finger.
   */
  const anchors: Pt[] = [];
  const upperN = Math.ceil(bunchSize / 2);
  const lowerN = bunchSize - upperN;
  const spread = balloonW * cfg.bunchSpread;
  const rise = balloonW * cfg.bunchRise;
  const stagger = balloonW * cfg.bunchStagger;
  /*
   * A knot is clamped so the whole drawing stays in the frame: half a balloon
   * from each side edge, and `KNOT_OFFSET` balloons below the top edge, which is
   * exactly how far the crown reaches above its own knot. Clamping here rather
   * than in the Toy is what keeps the strings honest — a clamped balloon still
   * ties to the peg, because the string is drawn from wherever the knot ended
   * up.
   */
  const place = (x: number, y: number): Pt => [
    Math.min(w - balloonW * 0.5, Math.max(balloonW * 0.5, x)),
    Math.min(groundAt(x) - pegH * 0.2, Math.max(balloonW * KNOT_OFFSET + balloonW * 0.06, y)),
  ];
  const row = (n: number, span: number, baseY: number, arch: number) => {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      // Never mirrored: each balloon carries its own small offset, so the fan is
      // a bunch rather than a diagram of one.
      const jx = (rnd() - 0.5) * balloonW * 0.08;
      const jy = (rnd() - 0.5) * balloonW * 0.12;
      anchors.push(
        place(
          pegTop[0] + t * span + jx,
          baseY - arch * (1 - Math.abs(t) * 2) + jy,
        ),
      );
    }
  };
  // Upper row first: see `anchors` on why the paint order is the string order.
  row(upperN, spread, pegTop[1] - rise, balloonW * 0.18);
  row(lowerN, spread * 0.5, pegTop[1] - rise + stagger, balloonW * 0.1);

  /* --- motes: the only moving thing --------------------------------------
   * Seed fluff drifting up through the sky. Tiny by rule — a mote at balloon
   * scale would be a sixth character — few, and slow. The cheapest literal
   * "alive" available, and the only animation the background gets.
   */
  const motes = Array.from({ length: Math.round(cfg.moteCount) }, () => ({
    cx: w * (0.08 + rnd() * 0.84),
    cy: h * (0.12 + rnd() * 0.5),
    r: Math.max(0.3, balloonW * (0.012 + rnd() * 0.012)),
    delay: rnd() * 6,
    amp: h * (0.02 + rnd() * 0.03),
  }));

  return { clouds, banks, ground, tufts, fore, peg, motes, line, tether: pegTop, anchors };
}

/* ------------------------------------------------------------------ *
 * The rules, as a check rather than as a comment
 * ------------------------------------------------------------------ */

export type SkyViolation = { rule: string; message: string };

/**
 * The shape-class rules that keep the background out of the cast's league,
 * evaluated for a given balloon size. These exist as a check rather than as
 * prose because the house rules were written down carefully and then broken in
 * the same session that wrote them — a rule you can read and still not apply is
 * not a rule; a rule that fails the build is.
 */
export function check(cfg: SkyConfig, balloonW: number): SkyViolation[] {
  const v: SkyViolation[] = [];

  if (cfg.cloudSpan < 2.5) {
    v.push({
      rule: 'CLOUD',
      message: `A cloud bank spanning ${cfg.cloudSpan.toFixed(1)} balloons is a free-standing puff in the cast's own size band — which is exactly what the five circles were at 0.25 to 0.31 of a balloon, and worse here than anywhere else in the collection because a puff is not merely balloon-SIZED, it is balloon-SHAPED. Grow it past 2.5 and let the frame crop it, or do not draw it.`,
    });
  }

  // The puff's shape class, checked one level down: a lobe big enough to be
  // counted is the cloud readmitted as a mass of small clouds.
  const lobe = cfg.lobeRatio * 2;
  if (lobe > 0.25) {
    v.push({
      rule: 'LOBE',
      message: `A cloud lobe is ${lobe.toFixed(2)}x a balloon — above 1/4 it stops reading as a mass and becomes countable.`,
    });
  }

  if (cfg.bankSpread < 2.5) {
    v.push({
      rule: 'BANK',
      message: `A bank reaching ${cfg.bankSpread.toFixed(1)} balloons is a free-standing hill in the cast's own size band. Grow it past 2.5 and let the frame crop it, or do not draw it — a narrow frame simply gets none.`,
    });
  }

  // A tuft has to stay ELONGATED to keep its licence. As soon as it is as wide
  // as it is tall it is a bush, and a bush is a cloud puff on the ground.
  if (cfg.tuftHeight < cfg.tuftWidth * 1.5) {
    v.push({
      rule: 'TUFT',
      message: `A tuft is ${cfg.tuftHeight.toFixed(2)} tall by ${cfg.tuftWidth.toFixed(2)} wide in balloons. Below 1.5x it stops being a fan of blades and becomes a closed clump — a bush, which is a rival.`,
    });
  }

  // The peg keeps its licence by being ELONGATED and OPEN. A squat post is a
  // convex closed shape at cast scale, and it sits at the one point in the frame
  // the child's eye is already on — which is what the `<ellipse>` cap was.
  if (cfg.pegHeight < cfg.pegThickness * 3) {
    v.push({
      rule: 'PEG',
      message: `The peg is ${cfg.pegHeight.toFixed(2)} tall by ${cfg.pegThickness.toFixed(2)} thick in balloons. Below 3x it stops being a stake and becomes a block sitting under the bunch.`,
    });
  }

  // The foreground is the repoussoir, and the one place it must never reach is
  // the middle of the bottom band — that is where the peg is driven in, where
  // the bunch is tied, and where a hand rests.
  if (cfg.foreDepth > 0.3) {
    v.push({
      rule: 'TETHER ZONE',
      message: 'The foreground grass reaches into the band the peg stands in — the near mass may frame the stage, never cover it.',
    });
  }

  /*
   * A knob below the generator's own floor stops responding, and stops
   * responding SILENTLY: the slider moves and the picture does not. A knob that
   * does not mean what it is named is worse than a hardcoded number, because
   * every rule checked against it then passes on a lie.
   */
  if (cfg.lobeRatio * balloonW < 0.5) {
    v.push({
      rule: 'CLAMPED',
      message: `A cloud lobe of ${(cfg.lobeRatio * balloonW).toFixed(2)} frame units is under the generator's 0.5 floor — the knob has stopped changing the picture.`,
    });
  }

  // The bunch has to leave the sky it is meant to rise into. A fan that reaches
  // most of the way up the frame turns the Toy's load-bearing space into a
  // margin, and the balloons stop looking like they have anywhere to go.
  if (cfg.bunchRise > 3) {
    v.push({
      rule: 'HEADROOM',
      message: `The bunch rises ${cfg.bunchRise.toFixed(1)} balloons above the peg. The tall sky above it is this Toy's load-bearing space — a bunch that fills it has nowhere to float away to.`,
    });
  }

  return v;
}
