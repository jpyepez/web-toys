/**
 * The reef — the scene generator for "hovering over the sand".
 *
 * WHY THIS EXISTS, AND WHY IT HAS NO CORAL CLUMPS IN IT. The scene it replaces
 * was a water gradient, three god-rays, five bubbles, a full-width sand band and
 * two branchy coral clumps. Nothing overlapped anything, nothing was cropped,
 * the sand met the water along a single curve that crossed the whole frame — the
 * most inert composition available, in three separately-positioned layers that
 * agreed with each other on a phone and came apart at 16:10.
 *
 * The coral was the sharpest failure, and naming it precisely is what licenses
 * everything below. Each clump was CONVEX, CLOSED, ROUNDED and drawn at
 * `clamp(38px, 9vmin, 84px)` — 0.35 of a Fish on a phone and 0.38 on a desktop.
 * So is a puffer. Two of them flanking one Fish asks a three-year-old to sort
 * three rounded blobs into tappable and not — figure-class rivalry, from a
 * background object squarely inside the cast's own size band. It is the
 * lollipop-tree error the meadow was corrected for, drawn twice and mirrored.
 *
 * Sorted by shape class, with a Fish as the unit:
 *
 *   | class                     | shape                        | rival? |
 *   | coral clump, rock, pebble | convex, closed, Fish-sized   | YES    |
 *   | frond, kelp stipe, ray    | elongated, open, linear      | no     |
 *   | bed, ridge, sun           | cropped, >= 2.5x a Fish      | no     |
 *   | polyp lobe, bubble        | <= 1/8 a Fish, in a mass     | no     |
 *
 * So a reef built from a cropped seabed, cropped ridges, kelp STIPES, sea-fan
 * BLADES and polyp masses — with no clumps and no boulders in it — is a place
 * containing no Fish-shaped object. That is the whole unlock, and it is enforced
 * here rather than trusted: `check()` returns the violations and `reef.test.ts`
 * asserts them at the sizes this Toy actually ships.
 *
 * IT ALSO PAYS OFF THE FLOATING FISH — in the literal sense as well as the
 * figurative one. The Fish used to hover at a hardcoded `top: 42%` of the
 * viewport while the seabed was drawn into a `--ocean-floor` CSS length beside
 * it, so the gap between the animal and the sand was whatever the aspect ratio
 * happened to make it: on a landscape desktop the `slice`-cropped water pushed
 * the floor down and the Fish sat halfway up an empty blue rectangle. The scene
 * now emits `bed` — the sampled seabed line — and `float`, the point the Fish
 * hovers at, derived from that line. Two hand-maintained positions cannot be
 * kept in agreement; one generator read by both cannot fall out of it.
 *
 * ONE FRAME, MATCHED TO THE VIEWPORT. The scene is composed into a `0 0 100 h`
 * box whose aspect MATCHES the viewport's, so nothing is ever stretched or
 * sliced: at 9:19.5 `h` is ~216, at 16:10 it is ~62.5, and the generator
 * composes for the box it is given. That replaces the old stack of three layers
 * at three different `preserveAspectRatio` settings.
 *
 * THE UNIT IS A FISH, NOT THE FRAME. Every SIZE here — ridge reach, blade
 * height, polyp lobe, the sun, the kelp — is a multiple of `fishW`, a Fish's
 * width in frame units. Only POSITIONS are frame fractions. A phone is ~2.3 Fish
 * across and a 16:10 desktop ~6.5, so the rival band (1/8 to 2.5 Fish) on a
 * phone runs from 5.7 frame units to WIDER THAN THE FRAME: there is no legal way
 * to put a separate closed mass in a phone frame at all. A wide viewport gets
 * MORE reef sideways, never the same reef enlarged.
 */

import {
  closedPath,
  lobedBand,
  polygonPath,
  quadPts,
  ribbon,
  taperedOutline,
  type Pt,
} from '../../shell/art/geometry';
import { line as houseLine } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';

/**
 * Scenery contour weight, as a fraction of the CAST's contour — not of the thing
 * being outlined.
 *
 * The contour belongs to the FIGURE. This is enough line to say the kelp is
 * DRAWN — which is most of the difference between an illustration and clip art —
 * and, at half the cast's weight, not enough to compete. Hardcoded rather than
 * exposed for the same reason it is in the meadow: it is a rule, not a taste
 * decision, and sizing it off the kelp's own thickness would let a fatter stipe
 * buy itself a heavier line than the Critter has.
 */
const SCENERY_CONTOUR_RATIO = 0.5;

/** The box the scene is composed into. `w` is always 100; `h` follows the aspect. */
export type Frame = { w: number; h: number };

/**
 * Every taste decision in the reef. The RULES (what makes it this idea) are
 * hardcoded below; these are the numbers nobody has settled yet.
 */
export type ReefConfig = {
  /** Where the seabed line sits, as a fraction of frame height. */
  bedY: number;
  /** How far the seabed undulates, in FISH widths. A sea floor is not flat, and
   *  a dead-level line is a rule drawn across the picture. */
  bedRelief: number;
  /** How high above the bed the Fish hovers, in FISH widths, measured to the
   *  BODY CENTRE. This is the number that replaces `top: 42%`. */
  hoverGap: number;
  /** How many far ridges a WIDE frame gets. Scaled by the frame's width in Fish,
   *  and zero on a phone, where no legal ridge fits — see the header. */
  ridgeCount: number;
  /** How far a ridge reaches in from its edge, in FISH. Must be >= 2.5, or the
   *  ridge lands in the cast's own size band and becomes a second character —
   *  which is exactly what the two coral clumps were. */
  ridgeSpread: number;
  /** How high a ridge crests above the seabed line, as a fraction of height. */
  ridgeRise: number;
  /** Sea-fan fronds per Fish-width of frame. A density, not a count: the number
   *  follows the frame while the SIZE follows the Fish. */
  frondDensity: number;
  /** Frond height, in FISH widths. */
  frondHeight: number;
  /** Frond width, in FISH widths. Held well under the height so a fan stays
   *  ELONGATED — a fan as wide as it is tall is a clump, which is a rival. */
  frondWidth: number;
  bladesPerFrond: number;
  /** Coral polyp clusters per Fish-width of frame. */
  polypDensity: number;
  /** A polyp lobe's RADIUS as a fraction of a Fish. The rule is on the diameter:
   *  <= 1/8, or a polyp becomes a countable object. */
  polypLobe: number;
  /** Foreground reef depth, as a fraction of frame height. Corner-weighted. */
  foreDepth: number;
  /** Foreground frond height, in FISH widths. */
  foreHeight: number;
  /** The sun through the surface, as a multiple of a FISH. 0 (off) or >= 2.5,
   *  never between. */
  sunScale: number;
  sunX: number;
  sunY: number;
  /** God-ray shafts. Translucent light, not mass — see the emitter. */
  rayCount: number;
  /** A shaft's width at depth, in FISH. */
  rayWidth: number;
  /** How far a shaft leans across the frame over its full height, in FISH. */
  rayTilt: number;
  /** Kelp stipes rooted on the bed and cropped by the TOP edge — what replaces
   *  the coral clumps. A multiple of a FISH; 0 turns them off. */
  kelpThickness: number;
  /** How many stipes a WIDE frame gets. Scaled by the frame's width in Fish. */
  kelpCount: number;
  /** How far a stipe sways off vertical over its length, in FISH. */
  kelpSway: number;
  /** Blade lobe radius as a fraction of a FISH. Diameter must stay <= 1/4. */
  lobeRatio: number;
  lobeVariance: number;
  /** How deep the kelp's blade fringe runs, as a multiple of the lobe radius. */
  leafDepth: number;
  /** Drifting bubbles — the only moving thing in the scene. */
  bubbleCount: number;
};

export const REEF_DEFAULTS: ReefConfig = {
  bedY: 0.82,
  bedRelief: 0.08,
  hoverGap: 1.15,
  ridgeCount: 2,
  ridgeSpread: 2.8,
  ridgeRise: 0.08,
  frondDensity: 2.2,
  frondHeight: 0.38,
  frondWidth: 0.2,
  bladesPerFrond: 5,
  polypDensity: 1.4,
  polypLobe: 0.04,
  foreDepth: 0.13,
  foreHeight: 0.55,
  sunScale: 3,
  sunX: 12,
  sunY: 0.02,
  rayCount: 3,
  rayWidth: 0.34,
  rayTilt: 0.5,
  kelpThickness: 0.1,
  kelpCount: 0.8,
  kelpSway: 0.5,
  lobeRatio: 0.075,
  lobeVariance: 0.55,
  leafDepth: 2.4,
  bubbleCount: 5,
};

/* ------------------------------------------------------------------ *
 * The generator
 * ------------------------------------------------------------------ */

export type Frond = { blades: string[]; x: number };
export type Polyp = { stem: string; lobes: { cx: number; cy: number; r: number }[]; heart: Pt };
export type Kelp = { body: string; ink: string; leaves: string };

export type ReefArt = {
  sun: { cx: number; cy: number; r: number } | null;
  /** Light shafts. Translucent overlays, cropped at both ends by the frame. */
  rays: string[];
  /** Far seabed planes, back to front. Empty on a narrow frame by design. */
  ridges: { fill: string; relief: string }[];
  /** The seabed and the trough it is bounded by — the ONE shape allowed to
   *  cross the frame horizontally. */
  floor: { fill: string; relief: string };
  kelps: Kelp[];
  fronds: Frond[];
  polyps: Polyp[];
  fore: { base: string; blades: string[] } | null;
  bubbles: { cx: number; cy: number; r: number; delay: number; rise: number }[];
  /**
   * The seabed line, sampled left to right across the full frame. The Fish's
   * hover height reads this instead of a hardcoded `top: 42%`, which is what
   * stops the two drifting apart across aspect ratios.
   */
  bed: Pt[];
  /** Where the Fish hovers: its BODY CENTRE, one `hoverGap` above the bed. */
  float: Pt;
};

/** The seabed's height at any x — a linear read of the sampled `bed`. */
export function bedYAt(bed: readonly Pt[], x: number): number {
  if (bed.length === 0) return 0;
  if (x <= bed[0][0]) return bed[0][1];
  const last = bed[bed.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < bed.length; i++) {
    if (bed[i][0] >= x) {
      const [x0, y0] = bed[i - 1];
      const [x1, y1] = bed[i];
      const f = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * f;
    }
  }
  return last[1];
}

/**
 * Build the whole reef. Pure: same `(cfg, frame, fishW, seed)` in, same paths
 * out, every random draw from a named seeded stream.
 *
 * `fishW` is a Fish's width IN FRAME UNITS, and it is a parameter rather than a
 * constant because every size rule is expressed against it — a blade is "a third
 * of a Fish", never "15 units".
 */
export function buildReef(cfg: ReefConfig, frame: Frame, fishW: number, seed: number): ReefArt {
  const { w, h } = frame;
  const rnd = stream(seed, 'reef');
  const bleed = w * 0.08;
  const lobeR = Math.max(0.5, fishW * cfg.lobeRatio);
  /** How wide the frame is, measured in Fish. ~2.3 on a phone, ~6.5 at 16:10. */
  const fishWide = w / fishW;
  /*
   * The cast's own contour, converted into frame units — a Fish is drawn in a
   * 100-wide box rendered `fishW` frame units across, so its line scales with
   * it. Everything the scene outlines is measured against this.
   */
  const castContour = houseLine.contour * (fishW / 100);
  const inkW = castContour * SCENERY_CONTOUR_RATIO;

  /* --- the seabed line -------------------------------------------------
   * The ONE shape allowed to cross the frame horizontally, and it is cropped by
   * both side edges so it reads as continuing past them.
   *
   * A SMOOTH curve, deliberately — and this is the one place in this scene where
   * a sine is the right tool rather than the wrong one. A smooth periodic curve
   * reads as water, sand or a dune, because that is what those things are; the
   * lobed-arc emitter the kelp uses would turn this floor into foliage. Two low
   * harmonics, never one: the beat between them is what stops it reading as a
   * single wave.
   */
  const bedY = h * cfg.bedY;
  const relief = fishW * cfg.bedRelief;
  const bPhase = rnd() * Math.PI * 2;
  const bedAt = (x: number) => {
    const t = (x + bleed) / (w + bleed * 2);
    return (
      bedY +
      relief * 0.62 * Math.sin(t * Math.PI * 1.7 + bPhase) +
      relief * 0.38 * Math.sin(t * Math.PI * 4.1 + bPhase * 1.7)
    );
  };
  const bed: Pt[] = [];
  for (let i = 0; i <= 72; i++) {
    const x = -bleed + ((w + bleed * 2) * i) / 72;
    bed.push([x, bedAt(x)]);
  }
  const floor = {
    fill: closedPath([...bed, [w + bleed, h + bleed], [-bleed, h + bleed]]),
    /*
     * The shaded trough, as a BAND following the seabed line rather than the
     * whole silhouette shifted down. A shifted copy shows through wherever the
     * two outlines diverge, which comes out as pale streaks.
     */
    relief: closedPath([
      ...bed,
      ...[...bed].reverse().map(([x, y]) => [x, y + relief * 1.1 + fishW * 0.02] as Pt),
    ]),
  };

  /* --- far ridges ------------------------------------------------------
   * Each ENTERS at a side edge, crests above the seabed line, and settles back
   * below it — so it is cropped by that edge and never a free-standing rock.
   *
   * They exist only where a LEGAL one fits. A ridge must be at least 2.5 Fish
   * wide to clear the cast's size band, and on a phone 2.5 Fish is ~110 frame
   * units against a 100-unit frame: there is no ridge a phone can hold that is
   * not a rival, so a phone gets none. This is the counts-follow-the-frame rule
   * doing something more interesting than scaling a number — the wide frame gets
   * an element the narrow frame cannot legally have at all.
   */
  const ridges: ReefArt['ridges'] = [];
  const ridgeW = fishW * cfg.ridgeSpread;
  const ridgeRoom = Math.floor((w * 0.86) / ridgeW);
  const ridgeN = Math.max(
    0,
    Math.min(3, Math.min(ridgeRoom, Math.round(cfg.ridgeCount * (fishWide - 2) * 0.5))),
  );
  for (let i = 0; i < ridgeN; i++) {
    const fromLeft = i % 2 === 0;
    const reach = Math.min(w * 0.86, ridgeW * (0.85 + rnd() * 0.4));
    const x0 = fromLeft ? -bleed : w + bleed;
    const x1 = fromLeft ? reach : w - reach;
    const rise = h * cfg.ridgeRise * (0.7 + rnd() * 0.6);
    // Crests are staggered in height as well as in x, so two ridges never read
    // as a matched pair of humps — which is a row, one octave up from a reef of
    // identical coral heads.
    const crestY = bedAt((x0 + x1) / 2) - rise * (1 + i * 0.35);
    const pts: Pt[] = [];
    const n = 40;
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = x0 + (x1 - x0) * t;
      // A single smooth shoulder: high at the frame edge, easing down to meet
      // the seabed at the far end. `t^1.7` keeps the crest broad near the edge
      // instead of peaking into a dome, which would be a closed rock.
      const fall = Math.pow(t, 1.7);
      pts.push([x, crestY + (bedAt(x) - crestY) * fall]);
    }
    const far = fromLeft ? w + bleed : -bleed;
    ridges.push({
      fill: closedPath([...pts, [far, h + bleed], [x0, h + bleed]]),
      relief: closedPath([...pts, ...[...pts].reverse().map(([x, y]) => [x, y + rise * 0.3] as Pt)]),
    });
  }

  /* --- sea-fan fronds --------------------------------------------------
   * BLADES, not clumps. A fan is a spray of separate tapered lines that never
   * closes at the top, which keeps it in the elongated-open class however tall
   * it gets. A round clump of the same size would be the coral this scene was
   * corrected for, replanted.
   *
   * Counts follow the frame (a density per Fish-width), sizes follow the Fish.
   */
  const fronds: Frond[] = [];
  const frondN = Math.max(3, Math.round(cfg.frondDensity * fishWide));
  const frondH = fishW * cfg.frondHeight;
  const frondW = fishW * cfg.frondWidth;
  for (let i = 0; i < frondN; i++) {
    // A jittered walk rather than uniform scatter: uniform random has energy at
    // very low spatial frequencies, which shows up as clumps and conspicuous
    // bare stretches along the bed.
    const x = ((i + 0.5 + (rnd() - 0.5) * 0.7) / frondN) * (w + bleed * 2) - bleed;
    const baseY = bedAt(x) + frondH * 0.08;
    const blades: string[] = [];
    const count = Math.max(2, Math.round(cfg.bladesPerFrond * (0.6 + rnd() * 0.8)));
    for (let k = 0; k < count; k++) {
      const u = count === 1 ? 0 : k / (count - 1) - 0.5;
      // The spray spans exactly `frondWidth`. A knob that does not mean what it
      // is named is worse than a hardcoded number, because the rule checked
      // against it then passes on a lie — the meadow's tuft width was drawn at
      // 2.7x its stated value for exactly this reason.
      const lean = u * frondW * (0.9 + rnd() * 0.2);
      const len = frondH * (0.85 + rnd() * 0.4);
      blades.push(
        taperedOutline(
          quadPts(
            [x + u * frondW * 0.15, baseY],
            [x + lean * 0.45, baseY - len * 0.62],
            [x + lean, baseY - len],
            10,
          ),
          Math.max(0.3, fishW * 0.022),
          // Front-loaded: a blade is thickest near the holdfast and lifts to a point.
          0.18,
        ),
      );
    }
    fronds.push({ blades, x });
  }

  /* --- coral polyps ----------------------------------------------------
   * A counted MASS of lobes under an eighth of a Fish, never a clump at cast
   * scale. The stalk carries them so they read as growing out of the bed rather
   * than as dots laid on it — which is the whole difference between coral and
   * confetti.
   */
  const polyps: Polyp[] = [];
  const polypN = Math.max(2, Math.round(cfg.polypDensity * fishWide));
  const petalR = Math.max(0.35, fishW * cfg.polypLobe);
  for (let i = 0; i < polypN; i++) {
    const x = ((i + 0.5 + (rnd() - 0.5) * 0.8) / polypN) * w;
    // Spread through the band BELOW the seabed line as well as along it, so the
    // floor reads as a surface receding rather than as a wall.
    const depth = rnd();
    const y = bedAt(x) + (h - bedAt(x)) * depth * 0.55;
    const stemLen = fishW * (0.05 + rnd() * 0.05);
    const lean = (rnd() - 0.5) * stemLen * 0.7;
    const lobes = Array.from({ length: 5 }, (_, k) => {
      const a = (k / 5) * Math.PI * 2 + rnd() * 0.3;
      return {
        cx: x + lean + Math.cos(a) * petalR * 0.95,
        cy: y - stemLen + Math.sin(a) * petalR * 0.95,
        r: petalR * (0.8 + rnd() * 0.4),
      };
    });
    polyps.push({
      stem: taperedOutline(
        quadPts([x, y], [x + lean * 0.4, y - stemLen * 0.6], [x + lean, y - stemLen], 6),
        Math.max(0.25, fishW * 0.014),
        0.2,
      ),
      lobes,
      heart: [x + lean, y - stemLen],
    });
  }

  /* --- the foreground reef: the repoussoir -----------------------------
   * CORNER-WEIGHTED, not a band. A full-width fringe along the bottom edge is
   * one more horizontal stripe, which is the thing being fixed — and worse, it
   * would sit across the middle of the bottom, which is where a hand rests on a
   * phone and where the Fish's own shadow-less hover reads against open water.
   */
  const fore =
    cfg.foreDepth > 0.001
      ? (() => {
          const depth = h * cfg.foreDepth;
          const weight = (t: number) => {
            /*
             * 0 across a FLAT middle, rising to 1 at both edges. Weighting
             * straight off the distance from centre gives a curve with a single
             * minimum, so the base band dives to a point at t = 0.5 and the
             * "corner reef" comes out as one hard chevron pointing down the
             * middle of the frame. A repoussoir is two masses at the edges, not
             * a V; the dead zone is what makes it two.
             */
            const d = Math.abs(t - 0.5);
            return Math.min(1, Math.max(0, (d - 0.1) / 0.24)) ** 1.5;
          };
          const base: Pt[] = [];
          const n = 48;
          for (let k = 0; k <= n; k++) {
            const t = k / n;
            base.push([-bleed + (w + bleed * 2) * t, h - depth * (0.06 + 0.94 * weight(t))]);
          }
          const blades: string[] = [];
          const bladeH = fishW * cfg.foreHeight;
          const bladeN = Math.max(8, Math.round(fishWide * 9));
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
                Math.max(0.4, fishW * 0.03),
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

  /* --- the kelp: what replaces the coral clumps ------------------------
   * A stipe is ROOTED in the seabed and cropped by the TOP edge, so it continues
   * past the frame and can never be counted as an object. `ribbon` (not
   * `taperedOutline`) keeps it full width where the frame cuts it — tapering
   * both ends turns a plant into a lens.
   *
   * The clumps it replaces were canopies without a trunk. A stipe with a blade
   * fringe running ALONG it is every shape class a plant has EXCEPT the closed
   * head, which is the one class a puffer could be confused with.
   *
   * Counts follow the frame: a phone gets one, a wide frame two or three, spaced
   * so no two ever stand at the same height.
   */
  const kelps: Kelp[] = [];
  const kelpW = fishW * cfg.kelpThickness;
  /*
   * At most TWO, one per side, and that cap is a correction rather than a taste
   * call. Three stipes on a wide frame came out as near-parallel verticals
   * running the whole height — a FENCE, which is "a line drawn across the
   * picture" turned ninety degrees, and no better for being turned. Two, rooted
   * at opposite edges and leaning outward, frame the stage instead of dividing
   * it.
   */
  const kelpN =
    cfg.kelpThickness > 0.01 ? Math.max(1, Math.min(2, Math.round(cfg.kelpCount * fishWide * 0.5))) : 0;
  for (let i = 0; i < kelpN; i++) {
    /*
     * The HOLDFAST is rooted off-centre, never in the middle third. Where the
     * stipe leans to further up is not a problem — passing behind the Fish is
     * occlusion, which is the only depth cue this style has — but a plant
     * sprouting from the sand directly under the cast puts a second vertical
     * where the Critter's own mass already is. Roots alternate left and right so
     * two stipes never stand side by side.
     */
    const side = i % 2 === 0 ? 0 : 1;
    const root = (side === 0 ? 0.03 + rnd() * 0.15 : 0.82 + rnd() * 0.15) * w;
    const rootY = bedAt(root) + fishW * 0.04;
    /*
     * The lean is OUTWARD — toward the nearer side edge — and it is large. A
     * stipe that rises straight is a post, and two posts are a fence; a stipe
     * that leans out of the frame is a plant the frame happens to cut, and the
     * pair of them reads as the near edge of a bed the scene continues into.
     * The magnitude is jittered per stipe as well, so no two ever lean alike:
     * matched leans are a ladder, one octave up from a row.
     */
    const sway = fishW * cfg.kelpSway * (0.6 + rnd() * 0.9) * (side === 0 ? -1 : 1);
    const spine = quadPts(
      [root, rootY],
      [root + sway, rootY - (rootY + bleed) * 0.55],
      [root + sway * 0.35, -bleed],
      24,
    );
    const phase = rnd() * Math.PI * 2;
    /*
     * Thins toward the holdfast and stays full where the frame cuts it. Kelp
     * grows the other way round from a branch: the stipe is narrowest at the
     * rock and widest in the water column, which is also what keeps the base
     * from reading as a post driven into the sand.
     */
    const half = (t: number) =>
      (kelpW / 2) * (0.45 + 0.55 * Math.min(1, t * 2.2)) * (0.9 + 0.1 * Math.sin(t * Math.PI * 3.1 + phase));
    const leafR = lobeR * cfg.leafDepth;
    // The fringe swells away from the holdfast and stays full at the top, where
    // the frame cuts it. `lobedBand` joins its two runs with a straight line, so
    // the closing edge is buried above the top bleed rather than shown.
    const grow = (t: number) => Math.min(1, Math.max(0, (t - 0.04) / 0.3));
    const leafHalf = (t: number) => half(t) + leafR * grow(t);
    kelps.push({
      body: polygonPath(ribbon(spine, half, (t) => half(t) * 0.92)),
      /*
       * Line on BOTH sides. A contour present on one side only reads as a flat
       * plank lit from above rather than as a drawn form; the house rule is that
       * a contour is HEAVIER underneath, not that it is absent on top.
       */
      ink: polygonPath(
        ribbon(
          spine,
          (t) => half(t) + inkW,
          (t) => half(t) * 0.92 + inkW * 0.8,
        ),
      ),
      leaves:
        cfg.leafDepth > 0.05
          ? // Markedly deeper on one side than the other. An even fringe down both
            // sides of a stipe is a machined scallop — a bottle brush, not a
            // plant — and it is what the first render came out as.
            lobedBand(spine, leafHalf, (t) => half(t) + (leafHalf(t) - half(t)) * 0.42, lobeR, cfg.lobeVariance, rnd)
          : '',
    });
  }

  /* --- the sun: one oversized cropped disc ------------------------------
   * Behind everything, so the kelp and the rays crop it. That occlusion is what
   * makes it sit in depth instead of being a sticker on the water — and it is
   * the reason a disc is admissible here at all: at 3 Fish across it is far
   * outside the cast's band, and the frame cuts it besides.
   */
  const sun =
    cfg.sunScale > 0.01 ? { cx: cfg.sunX, cy: h * cfg.sunY, r: (fishW * cfg.sunScale) / 2 } : null;

  /* --- god-rays: LIGHT, not mass ----------------------------------------
   * Near-parallel shafts, each entering above the top edge and leaving below the
   * bottom one, so both ends are cropped. They are the one element allowed to
   * cross the frame vertically: a shaft is elongated and open, it carries no
   * contour, and it is painted at low opacity, so it adds no dark area for the
   * squint test to find. A shaft that stopped inside the frame would be a
   * painted stripe.
   */
  const rays: string[] = [];
  const rayW = fishW * cfg.rayWidth;
  const rayN = Math.max(0, Math.round(cfg.rayCount));
  for (let i = 0; i < rayN; i++) {
    const x0 = ((i + 0.5 + (rnd() - 0.5) * 0.6) / rayN) * (w + bleed * 2) - bleed;
    const tilt = fishW * cfg.rayTilt * (0.7 + rnd() * 0.6);
    const spine: Pt[] = [
      [x0, -bleed],
      [x0 + tilt * 0.5, h * 0.5],
      [x0 + tilt, h + bleed],
    ];
    // Narrow at the surface, fanning with depth — the shaft widens as the water
    // scatters it, which is also what stops it reading as a ruled line.
    const half = (t: number) => (rayW / 2) * (0.28 + 0.72 * t);
    rays.push(polygonPath(ribbon(spine, half, half)));
  }

  /* --- bubbles: the only moving thing ------------------------------------
   * Tiny by rule, few, and slow — the cheapest literal "alive" available, and
   * the only animation the background gets. They are drawn in the PAPER, which
   * is what a highlight is in this style; the old scene minted a `bubble` token
   * at L 0.935 that sat 0.033 from the fish's own body.
   */
  const bubbles = Array.from({ length: Math.round(cfg.bubbleCount) }, () => ({
    cx: w * (0.08 + rnd() * 0.84),
    cy: h * (0.25 + rnd() * 0.5),
    r: Math.max(0.3, fishW * (0.012 + rnd() * 0.012)),
    delay: rnd() * 6,
    rise: h * (0.05 + rnd() * 0.06),
  }));

  return {
    sun,
    rays,
    ridges,
    floor,
    kelps,
    fronds,
    polyps,
    fore,
    bubbles,
    bed,
    /*
     * WHERE THE FISH HOVERS, derived from the bed rather than declared beside
     * it. `top: 42%` of the viewport was a number with no relationship to the
     * seabed at all: on a phone it put the Fish a comfortable distance above the
     * sand and on a 16:10 desktop it put it halfway up an empty blue rectangle.
     */
    float: [w / 2, bedAt(w / 2) - fishW * cfg.hoverGap],
  };
}

/* ------------------------------------------------------------------ *
 * The rules, as a check rather than as a comment
 * ------------------------------------------------------------------ */

export type ReefViolation = { rule: string; message: string };

/**
 * The shape-class rules that keep the background out of the cast's league,
 * evaluated for a given Fish size. These exist as a check rather than as prose
 * because the house rules were written down carefully and then broken in the
 * same session that wrote them — a rule you can read and still not apply is not
 * a rule; a rule that fails the build is.
 */
export function check(cfg: ReefConfig, fishW: number): ReefViolation[] {
  const v: ReefViolation[] = [];

  if (cfg.sunScale > 0.01 && cfg.sunScale < 2.5) {
    v.push({
      rule: 'PEER SIZE',
      message: `The sun is ${cfg.sunScale.toFixed(1)}x a Fish. A background shape must be >= 2.5x the cast or <= 1/8 of it — the band between is a second character, which is exactly what the two coral clumps were at 0.35x.`,
    });
  }

  if (cfg.ridgeSpread < 2.5) {
    v.push({
      rule: 'RIDGE',
      message: `A ridge reaching ${cfg.ridgeSpread.toFixed(1)} Fish is a free-standing rock in the cast's own size band. Grow it past 2.5 and let the frame crop it, or do not draw it — a narrow frame simply gets none.`,
    });
  }

  // The coral clump's shape class, checked one level down: a blade lobe big
  // enough to be counted is the clump readmitted as a mass of small clumps.
  const leaf = cfg.lobeRatio * 2;
  if (leaf > 0.25) {
    v.push({
      rule: 'LOBE',
      message: `A kelp blade lobe is ${leaf.toFixed(2)}x a Fish — above 1/4 it stops reading as a mass and becomes countable.`,
    });
  }

  // Polyps are DISCRETE objects rather than a continuous mass, so they are held
  // to the stricter half of the rule: a lobe of foliage may reach 1/4, a thing
  // sitting on its own stalk may not.
  const head = cfg.polypLobe * 2;
  if (head > 0.125) {
    v.push({
      rule: 'POLYP',
      message: `A polyp head is ${head.toFixed(3)}x a Fish. A discrete object must stay under 1/8 to read as part of a mass rather than as a thing to sort.`,
    });
  }

  // A frond has to stay ELONGATED to keep its licence. As soon as it is as wide
  // as it is tall it is a clump, and a clump is the coral this scene deleted.
  if (cfg.frondHeight < cfg.frondWidth * 1.5) {
    v.push({
      rule: 'FROND',
      message: `A frond is ${cfg.frondHeight.toFixed(2)} tall by ${cfg.frondWidth.toFixed(2)} wide in Fish. Below 1.5x it stops being a spray of blades and becomes a closed head — a coral clump, which is a rival.`,
    });
  }

  if (cfg.kelpThickness > 0.01 && cfg.kelpThickness < 0.05) {
    v.push({
      rule: 'KELP',
      message: 'The kelp is too thin to read as a stipe — at this width it is a line ruled up the frame rather than something growing past the top edge.',
    });
  }

  /*
   * A knob below the generator's own floor stops responding, and stops
   * responding SILENTLY. `polypLobe` is clamped to a minimum of 0.35 frame units
   * so a head never collapses to nothing, which means that below that floor the
   * slider moves and the picture does not — the same class of failure as a width
   * the generator drew at 2.7x its stated value.
   */
  if (cfg.polypLobe * fishW < 0.35) {
    v.push({
      rule: 'CLAMPED',
      message: `A polyp lobe of ${(cfg.polypLobe * fishW).toFixed(2)} frame units is under the generator's 0.35 floor — the knob has stopped changing the picture.`,
    });
  }

  /*
   * THE HOVER. The Fish's body is about 0.36 of its own width in radius, so a
   * gap under 0.5 Fish puts the animal's underside into the sand — and it has no
   * contact shadow, because it is swimming, so it would read as beached rather
   * than as landed. Too high is its own failure: past the bed's own height above
   * it the Fish is in empty water with the whole scene below its feet, which is
   * the desktop bug this generator exists to fix, reintroduced by hand.
   */
  if (cfg.hoverGap < 0.55) {
    v.push({
      rule: 'HOVER',
      message: `The Fish hovers ${cfg.hoverGap.toFixed(2)} Fish above the bed, which buries its underside in the sand. A swimming Critter has no contact shadow, so it cannot rest ON anything.`,
    });
  }

  // The foreground is the repoussoir, and the one place it must never reach is
  // the middle of the bottom band — that is where a child's hand rests on a
  // phone. Corner-weighting buys the depth cue without buying that problem.
  if (cfg.foreDepth > 0.3) {
    v.push({
      rule: 'STANDING ZONE',
      message: 'The foreground reef reaches into the band the Fish hovers over — the near mass may frame the stage, never cover it.',
    });
  }

  return v;
}
