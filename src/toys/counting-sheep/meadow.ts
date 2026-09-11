/**
 * The meadow — the scene generator for "standing in the field".
 *
 * WHY THIS EXISTS, AND WHY IT HAS NO CLOUDS IN IT. The scene it replaces was
 * three horizontal stripes (sky / far hill / near hill), a lollipop tree, and
 * four white cloud clusters. Nothing overlapped anything, nothing was cropped,
 * every edge was horizontal — the most inert composition available.
 *
 * The clouds were the sharpest failure, and naming it precisely is what licenses
 * everything below. A cloud cluster there was CONVEX, CLOSED, WHITE and ROUNDED,
 * at 0.29 of a Sheep on a phone and 0.49 on a desktop. So is a Sheep. Four of
 * them behind one Sheep asks a three-year-old to sort five white rounded blobs
 * into tappable and not — figure-class rivalry, from a background object in the
 * cast's own size band AND its own colour class. The lollipop tree was the same
 * error at 0.17 and 0.34 of a Sheep: the canonical instance, drawn literally.
 *
 * Sorted by shape class, with a Sheep as the unit:
 *
 *   | class                | shape                        | rival? |
 *   | cloud, bush, crown   | convex, closed, Sheep-sized  | YES    |
 *   | grass blade, twig    | elongated, open, linear      | no     |
 *   | bank, sun, bough     | cropped, >= 2.5x a Sheep     | no     |
 *   | flower head, mote    | <= 1/8 a Sheep, in a mass    | no     |
 *
 * So a meadow built from a cropped ground line, cropped banks, grass BLADES and
 * flower masses — with no clouds and no bushes in it — is a field containing no
 * Sheep-shaped object. That is the whole unlock, and it is enforced here rather
 * than trusted: `check()` returns the violations and `meadow.test.ts` asserts
 * them at the sizes this Toy actually ships.
 *
 * IT ALSO PAYS OFF THE FLOATING SHEEP. The scene emits `walk` — the sampled
 * walking line — and `stand`, the point on it the Sheep rests at. Those used to
 * be two independently-maintained numbers: the hills were drawn into a
 * `--meadow-ground` band and the Sheep was placed at `calc(var(--meadow-ground)
 * * 0.62)`, a multiplier tuned by eye against a curve it could not see. Two
 * hand-maintained positions cannot be kept in agreement; one generator read by
 * both cannot fall out of it.
 *
 * FRAME SPACE. Everything is authored in a `0..100` x `0..h` box whose aspect
 * MATCHES the viewport's, so nothing is ever stretched or sliced: at 9:19.5 `h`
 * is ~216, at 16:10 it is ~62.5, and the generator composes for the box it is
 * given.
 *
 * THE UNIT IS A SHEEP, NOT THE FRAME. Every SIZE here — bank reach, blade
 * height, flower lobe, the sun, the bough — is a multiple of `sheepW`, a Sheep's
 * width in frame units. Only POSITIONS are frame fractions.
 *
 * That split has a consequence specific to this Toy, and it is the reason the
 * phone and the desktop scenes differ in KIND rather than in scale. The Sheep is
 * a single centred tap target and therefore huge: `clamp(150px, 46vw, 240px)` is
 * 46% of a phone's width and 17% of a 1440px desktop's, so a phone frame is only
 * ~2.2 Sheep across and a 16:10 desktop ~6.0. The rival band (1/8 to 2.5 Sheep)
 * on a phone is therefore 5.8 to 115 frame units — WIDER THAN THE FRAME at the
 * top end. There is no legal way to put a separate closed mass in a phone frame
 * at all: anything big enough to clear the band does not fit, and anything that
 * fits is a rival.
 *
 * So the phone gets ONE ground line, the cropped sun, the cropped bough and the
 * corner grass — four planes, no free-standing masses — and the banks appear
 * only once the frame is wide enough in Sheep to hold one legally. A wide
 * viewport gets MORE meadow sideways, never the same meadow enlarged.
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
 * That distinction is the whole point and it was got wrong first. Sizing the
 * line off the bough's own thickness means a thicker bough gets a heavier line,
 * so the scenery's weight is set by the scenery: at 0.2 of a bough 0.3 Sheep
 * thick, the bough's outline came out 2.3x the Sheep's own contour. Greyscaled
 * and blurred it was the second-darkest thing in the frame, behind only the
 * cast — a background drawn with more line than the figure.
 *
 * The contour belongs to the FIGURE. This is enough line to say the bough is
 * DRAWN — which is most of the difference between an illustration and clip art —
 * and, at half the cast's weight, not enough to compete. Hardcoded rather than
 * exposed for the same reason: it is a rule, not a taste decision.
 */
const SCENERY_CONTOUR_RATIO = 0.5;

/** The box the scene is composed into. `w` is always 100; `h` follows the aspect. */
export type Frame = { w: number; h: number };

/**
 * Every taste decision in the meadow. The RULES (what makes it this idea) are
 * hardcoded below; these are the numbers nobody has settled yet.
 */
export type MeadowConfig = {
  /** Where the walking line sits, as a fraction of frame height. */
  groundY: number;
  /** How far the walking line undulates, in SHEEP widths. A field is not flat,
   *  and a dead-level line is a rule drawn across the picture. */
  groundRelief: number;
  /** How many far banks a WIDE frame gets. Scaled by the frame's width in
   *  Sheep, and zero on a phone, where no legal bank fits — see the header. */
  bankCount: number;
  /** How far a bank reaches in from its edge, in SHEEP. Must be >= 2.5, or the
   *  bank lands in the cast's own size band and becomes a second character. */
  bankSpread: number;
  /** How high a bank crests above the walking line, as a fraction of height. */
  bankRise: number;
  /** Grass tufts per Sheep-width of frame. A density, not a count: the number
   *  follows the frame while the SIZE follows the Sheep. */
  tuftDensity: number;
  /** Tuft height, in SHEEP widths. */
  tuftHeight: number;
  /** Tuft width, in SHEEP widths. Held well under the height so a tuft stays
   *  ELONGATED — a tuft as wide as it is tall is a bush, which is a rival. */
  tuftWidth: number;
  bladesPerTuft: number;
  /** Wildflower clusters per Sheep-width of frame. */
  flowerDensity: number;
  /** A flower lobe's RADIUS as a fraction of a Sheep. The rule is on the
   *  diameter: <= 1/8, or a bloom becomes a countable object. */
  flowerLobe: number;
  /** Foreground grass depth, as a fraction of frame height. Corner-weighted. */
  foreDepth: number;
  /** Foreground blade height, in SHEEP widths. */
  foreHeight: number;
  /** The sun, as a multiple of a SHEEP. 0 (off) or >= 2.5, never between. */
  sunScale: number;
  sunX: number;
  sunY: number;
  /** The bough cropping into a top corner — what replaces the lollipop tree.
   *  A multiple of a SHEEP; 0 turns it off. */
  boughThickness: number;
  /** How far the bough reaches across, in SHEEP. Clamped so it never spans. */
  boughReach: number;
  /** How far the bough hangs below the top edge, as a fraction of height. */
  boughDrop: number;
  /** Leaf lobe radius as a fraction of a SHEEP. Diameter must stay <= 1/4. */
  lobeRatio: number;
  lobeVariance: number;
  /** How deep the bough's leaf fringe runs, as a multiple of the lobe radius. */
  leafDepth: number;
  /** Drifting seed fluff — the only moving thing in the scene. */
  moteCount: number;
};

export const MEADOW_DEFAULTS: MeadowConfig = {
  groundY: 0.72,
  groundRelief: 0.09,
  bankCount: 2,
  bankSpread: 2.8,
  bankRise: 0.1,
  tuftDensity: 2.6,
  tuftHeight: 0.34,
  tuftWidth: 0.2,
  bladesPerTuft: 5,
  flowerDensity: 1.4,
  flowerLobe: 0.045,
  foreDepth: 0.14,
  foreHeight: 0.5,
  sunScale: 2.6,
  sunX: 88,
  sunY: 0.05,
  boughThickness: 0.3,
  boughReach: 2.2,
  boughDrop: 0.1,
  lobeRatio: 0.09,
  lobeVariance: 0.55,
  leafDepth: 3.4,
  moteCount: 3,
};

/* ------------------------------------------------------------------ *
 * The generator
 * ------------------------------------------------------------------ */

export type Tuft = { blades: string[]; x: number };
export type Flower = { stem: string; lobes: { cx: number; cy: number; r: number }[]; heart: Pt };

export type MeadowArt = {
  sun: { cx: number; cy: number; r: number } | null;
  /** Far ground planes, back to front. Empty on a narrow frame by design. */
  banks: { fill: string; relief: string }[];
  /** The near ground plane and the crest it is bounded by — the ONE shape
   *  allowed to cross the frame horizontally. */
  ground: { fill: string; relief: string };
  tufts: Tuft[];
  flowers: Flower[];
  fore: { base: string; blades: string[] } | null;
  bough: { body: string; ink: string; leaves: string } | null;
  motes: { cx: number; cy: number; r: number; delay: number; amp: number }[];
  /**
   * The walking line, sampled left to right across the full frame. The Sheep's
   * feet read this instead of a hand-tuned CSS multiplier, which is what stops
   * the two drifting apart across aspect ratios.
   */
  walk: Pt[];
  /** Where the Sheep rests: the walking line at the frame's centre. */
  stand: Pt;
};

/** The walking line's height at any x — a linear read of the sampled `walk`. */
export function walkYAt(walk: readonly Pt[], x: number): number {
  if (walk.length === 0) return 0;
  if (x <= walk[0][0]) return walk[0][1];
  const last = walk[walk.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < walk.length; i++) {
    if (walk[i][0] >= x) {
      const [x0, y0] = walk[i - 1];
      const [x1, y1] = walk[i];
      const f = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * f;
    }
  }
  return last[1];
}

/**
 * Build the whole meadow. Pure: same `(cfg, frame, sheepW, seed)` in, same paths
 * out, every random draw from a named seeded stream.
 *
 * `sheepW` is a Sheep's width IN FRAME UNITS, and it is a parameter rather than
 * a constant because every size rule is expressed against it — a blade is "a
 * third of a Sheep", never "15 units".
 */
export function buildMeadow(
  cfg: MeadowConfig,
  frame: Frame,
  sheepW: number,
  seed: number,
): MeadowArt {
  const { w, h } = frame;
  const rnd = stream(seed, 'meadow');
  const bleed = w * 0.08;
  const lobeR = Math.max(0.5, sheepW * cfg.lobeRatio);
  /** How wide the frame is, measured in Sheep. ~2.2 on a phone, ~6.0 at 16:10. */
  const sheepWide = w / sheepW;
  /*
   * The cast's own contour, converted into frame units — a Sheep is drawn in a
   * 100-wide box rendered `sheepW` frame units across, so its line scales with
   * it. Everything the scene outlines is measured against this.
   */
  const castContour = houseLine.contour * (sheepW / 100);
  const inkW = castContour * SCENERY_CONTOUR_RATIO;

  /* --- the walking line ------------------------------------------------
   * The ONE shape allowed to cross the frame horizontally, and it is cropped by
   * both side edges so it reads as continuing past them.
   *
   * A SMOOTH curve, deliberately — and this is the one place in the collection
   * where a sine is the right tool rather than the wrong one. A smooth periodic
   * curve reads as water or a HILL, because that is what those things are; the
   * lobed-arc emitter the canopy uses everywhere would turn this ground into
   * foliage. Two low harmonics, never one: the beat between them is what stops
   * it reading as a single wave.
   */
  const groundY = h * cfg.groundY;
  const relief = sheepW * cfg.groundRelief;
  const gPhase = rnd() * Math.PI * 2;
  const groundAt = (x: number) => {
    const t = (x + bleed) / (w + bleed * 2);
    return (
      groundY +
      relief * 0.62 * Math.sin(t * Math.PI * 1.6 + gPhase) +
      relief * 0.38 * Math.sin(t * Math.PI * 3.9 + gPhase * 1.7)
    );
  };
  const walk: Pt[] = [];
  for (let i = 0; i <= 72; i++) {
    const x = -bleed + ((w + bleed * 2) * i) / 72;
    walk.push([x, groundAt(x)]);
  }
  const ground = {
    fill: closedPath([...walk, [w + bleed, h + bleed], [-bleed, h + bleed]]),
    /*
     * The lit crest, as a BAND following the walking line rather than the whole
     * silhouette shifted up. A shifted copy shows through wherever the two
     * outlines diverge, which comes out as pale streaks — the most visible
     * artefact in the first Nestlings canopy render, and the same construction
     * would reproduce it here.
     */
    relief: closedPath([
      ...walk,
      ...[...walk].reverse().map(([x, y]) => [x, y + relief * 1.1 + sheepW * 0.02] as Pt),
    ]),
  };

  /* --- far banks -------------------------------------------------------
   * Each ENTERS at a side edge, crests above the walking line, and settles back
   * below it — so it is cropped by that edge and never a free-standing hill.
   *
   * They exist only where a LEGAL one fits. A bank must be at least 2.5 Sheep
   * wide to clear the cast's size band, and on a phone 2.5 Sheep is ~115 frame
   * units against a 100-unit frame: there is no bank a phone can hold that is
   * not a rival, so a phone gets none. This is the counts-follow-the-frame rule
   * doing something more interesting than scaling a number — the wide frame gets
   * an element the narrow frame cannot legally have at all.
   */
  const banks: MeadowArt['banks'] = [];
  const bankW = sheepW * cfg.bankSpread;
  const bankRoom = Math.floor((w * 0.86) / bankW);
  const bankN = Math.max(0, Math.min(3, Math.min(bankRoom, Math.round(cfg.bankCount * (sheepWide - 2) * 0.5))));
  for (let i = 0; i < bankN; i++) {
    const fromLeft = i % 2 === 0;
    const reach = Math.min(w * 0.86, bankW * (0.85 + rnd() * 0.4));
    const x0 = fromLeft ? -bleed : w + bleed;
    const x1 = fromLeft ? reach : w - reach;
    const rise = h * cfg.bankRise * (0.7 + rnd() * 0.6);
    // Crests are staggered in height as well as in x, so two banks never read as
    // a matched pair of humps — which is a row, one octave up from a treeline.
    const crestY = groundAt((x0 + x1) / 2) - rise * (1 + i * 0.35);
    const pts: Pt[] = [];
    const n = 40;
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = x0 + (x1 - x0) * t;
      // A single smooth shoulder: high at the frame edge, easing down to meet
      // the walking line at the far end. `t^1.7` keeps the crest broad near the
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
   * it gets. A round clump of the same size would be a bush, and a bush at this
   * scale is exactly the lollipop tree with the trunk removed.
   *
   * Counts follow the frame (a density per Sheep-width), sizes follow the Sheep.
   */
  const tufts: Tuft[] = [];
  const tuftN = Math.max(3, Math.round(cfg.tuftDensity * sheepWide));
  const tuftH = sheepW * cfg.tuftHeight;
  const tuftW = sheepW * cfg.tuftWidth;
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
      /*
       * The fan spans exactly `tuftWidth`, and that is a correction rather than
       * a tidy-up. The lean multiplier used to be 1.6-2.4x, which meant a tuft
       * authored as 0.20 Sheep wide came out at 0.54 — wider than it was tall,
       * so the config said "elongated" while the generator drew a clump. A knob
       * that does not mean what it is named is worse than a hardcoded number,
       * because the rule checked against it passes on a lie.
       */
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
          Math.max(0.3, sheepW * 0.022),
          // Front-loaded: a blade is thickest near the root and lifts to a point.
          0.18,
        ),
      );
    }
    tufts.push({ blades, x });
  }

  /* --- wildflowers -----------------------------------------------------
   * A counted MASS of lobes under an eighth of a Sheep, never a single bloom at
   * cast scale. The stem carries them so they read as growing out of the field
   * rather than as dots laid on it.
   */
  const flowers: Flower[] = [];
  const flowerN = Math.max(2, Math.round(cfg.flowerDensity * sheepWide));
  const petalR = Math.max(0.35, sheepW * cfg.flowerLobe);
  for (let i = 0; i < flowerN; i++) {
    const x = ((i + 0.5 + (rnd() - 0.5) * 0.8) / flowerN) * w;
    // Spread through the near band BELOW the walking line as well as along it,
    // so the ground reads as a surface receding rather than as a wall.
    const depth = rnd();
    const y = groundAt(x) + (h - groundAt(x)) * depth * 0.55;
    const stemLen = sheepW * (0.05 + rnd() * 0.05);
    const lean = (rnd() - 0.5) * stemLen * 0.7;
    const lobes = Array.from({ length: 5 }, (_, k) => {
      const a = (k / 5) * Math.PI * 2 + rnd() * 0.3;
      return {
        cx: x + lean + Math.cos(a) * petalR * 0.95,
        cy: y - stemLen + Math.sin(a) * petalR * 0.95,
        r: petalR * (0.8 + rnd() * 0.4),
      };
    });
    flowers.push({
      stem: taperedOutline(
        quadPts([x, y], [x + lean * 0.4, y - stemLen * 0.6], [x + lean, y - stemLen], 6),
        Math.max(0.25, sheepW * 0.014),
        0.2,
      ),
      lobes,
      heart: [x + lean, y - stemLen],
    });
  }

  /* --- the foreground grass: the repoussoir ----------------------------
   * CORNER-WEIGHTED, not a band. A full-width fringe along the bottom edge is
   * one more horizontal stripe, which is the thing being fixed — and worse, it
   * would sit across the middle of the bottom, which is where the Sheep stands,
   * where a hand rests, and where a dark mass would eat the cast's own feet.
   */
  const fore =
    cfg.foreDepth > 0.001
      ? (() => {
          const depth = h * cfg.foreDepth;
          const weight = (t: number) => {
            /*
             * 0 across a FLAT middle, rising to 1 at both edges — and the flat
             * middle is the correction. Weighting straight off the distance from
             * centre gives a curve with a single minimum, so the base band dives
             * to a point at t = 0.5 and the "corner grass" comes out as one hard
             * chevron pointing down the middle of the frame. A repoussoir is two
             * masses at the edges, not a V; the dead zone is what makes it two.
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
          const bladeH = sheepW * cfg.foreHeight;
          const bladeN = Math.max(8, Math.round(sheepWide * 9));
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
                quadPts([x, baseY + len * 0.1], [x + lean * 0.4, baseY - len * 0.6], [x + lean, baseY - len], 10),
                Math.max(0.4, sheepW * 0.03),
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

  /* --- the bough: what replaces the lollipop tree ----------------------
   * It enters a TOP corner and is cropped by two edges, so it continues past the
   * frame and can never be counted as an object. `ribbon` (not `taperedOutline`)
   * keeps it full width where the frame cuts it — tapering both ends turns a
   * limb into a lens.
   *
   * The tree it replaces was a canopy circle on a stick. A bough with a leafy
   * fringe running ALONG it is every shape class a tree has EXCEPT the crown,
   * which is the one class a Sheep could be confused with.
   */
  const boughW = sheepW * cfg.boughThickness;
  const bough =
    cfg.boughThickness > 0.01
      ? (() => {
          const dropY = h * cfg.boughDrop;
          const reach = Math.min(w * 0.72, sheepW * cfg.boughReach);
          const spine = quadPts(
            [-bleed, -bleed],
            [reach * 0.36, dropY * 0.72],
            [reach, dropY + boughW * 0.4],
            22,
          );
          const phase = rnd() * Math.PI * 2;
          /*
           * Tapers to near nothing at the tip. At `1 - 0.55t` the limb was still
           * 45% of full width where it stopped, so it ended on a blunt vertical
           * cut in mid-air and read as a PLANK rather than as a branch — a limb
           * has to either leave the frame or thin out to a twig, and this one
           * does neither if it keeps its width.
           */
          const half = (t: number) =>
            (boughW / 2) * (1 - 0.86 * t) * (0.9 + 0.1 * Math.sin(t * Math.PI * 3.1 + phase));
          const leafR = lobeR * cfg.leafDepth;
          // Foliage swells away from the frame edge and CLOSES BACK DOWN at the
          // tip. The falling half is not decoration: `lobedBand` joins its two
          // runs with a straight line, so a fringe still at full depth when the
          // bough ends shuts with a hard vertical cut.
          const grow = (t: number) =>
            Math.min(1, Math.max(0, (t - 0.06) / 0.36)) * Math.min(1, Math.max(0, (1 - t) / 0.18));
          const leafHalf = (t: number) => half(t) + leafR * grow(t);
          return {
            body: polygonPath(ribbon(spine, half, (t) => half(t) * 0.92)),
            /*
             * Line on BOTH sides. The upper offset was half the lower one, which
             * put ~0.3 frame units of ink above the limb and none of it visible
             * — so the bough had a dark edge underneath and nothing on top, and
             * read as a flat plank lit from above rather than as a drawn form.
             * The house rule is that a contour is HEAVIER underneath, not that it
             * is absent on top.
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
                ? lobedBand(spine, leafHalf, (t) => leafHalf(t) * 0.78, lobeR, cfg.lobeVariance, rnd)
                : '',
          };
        })()
      : null;

  /* --- the sun: one oversized cropped disc ------------------------------
   * Behind everything, so the banks and the bough crop it. That occlusion is
   * what makes it sit in depth instead of being a sticker on the sky — and it is
   * the reason a disc is admissible here at all: at 3 Sheep across it is far
   * outside the cast's band, and the frame cuts it besides.
   */
  const sun =
    cfg.sunScale > 0.01
      ? { cx: cfg.sunX, cy: h * cfg.sunY, r: (sheepW * cfg.sunScale) / 2 }
      : null;

  /* --- motes: the only moving thing -------------------------------------
   * Seed fluff drifting over the field. Tiny by rule, few, and slow — the
   * cheapest literal "alive" available, and the only animation the background
   * gets.
   */
  const motes = Array.from({ length: Math.round(cfg.moteCount) }, () => ({
    cx: w * (0.1 + rnd() * 0.8),
    cy: h * (0.2 + rnd() * 0.45),
    r: Math.max(0.3, sheepW * (0.012 + rnd() * 0.012)),
    delay: rnd() * 6,
    amp: h * (0.02 + rnd() * 0.03),
  }));

  return {
    sun,
    banks,
    ground,
    tufts,
    flowers,
    fore,
    bough,
    motes,
    walk,
    stand: [w / 2, groundAt(w / 2)],
  };
}

/* ------------------------------------------------------------------ *
 * The rules, as a check rather than as a comment
 * ------------------------------------------------------------------ */

export type MeadowViolation = { rule: string; message: string };

/**
 * The shape-class rules that keep the background out of the cast's league,
 * evaluated for a given Sheep size. These exist as a check rather than as prose
 * because the house rules were written down carefully and then broken in the
 * same session that wrote them — a rule you can read and still not apply is not
 * a rule; a rule that fails the build is.
 */
export function check(cfg: MeadowConfig, sheepW: number): MeadowViolation[] {
  const v: MeadowViolation[] = [];

  if (cfg.sunScale > 0.01 && cfg.sunScale < 2.5) {
    v.push({
      rule: 'PEER SIZE',
      message: `The sun is ${cfg.sunScale.toFixed(1)}x a Sheep. A background shape must be >= 2.5x the cast or <= 1/8 of it — the band between is a second character, which is exactly what the four cloud clusters were at 0.29x.`,
    });
  }

  if (cfg.bankSpread < 2.5) {
    v.push({
      rule: 'BANK',
      message: `A bank reaching ${cfg.bankSpread.toFixed(1)} Sheep is a free-standing hill in the cast's own size band. Grow it past 2.5 and let the frame crop it, or do not draw it — a narrow frame simply gets none.`,
    });
  }

  // The lollipop tree's shape class, checked one level down: a leaf lobe big
  // enough to be counted is the crown readmitted as a mass of small crowns.
  const leaf = cfg.lobeRatio * 2;
  if (leaf > 0.25) {
    v.push({
      rule: 'LOBE',
      message: `A leaf lobe is ${leaf.toFixed(2)}x a Sheep — above 1/4 it stops reading as a mass and becomes countable.`,
    });
  }

  // Flowers are DISCRETE objects rather than a continuous mass, so they are held
  // to the stricter half of the rule: a lobe of foliage may reach 1/4, a thing
  // sitting on its own stem may not.
  const bloom = cfg.flowerLobe * 2;
  if (bloom > 0.125) {
    v.push({
      rule: 'BLOOM',
      message: `A flower head is ${bloom.toFixed(3)}x a Sheep. A discrete object must stay under 1/8 to read as part of a mass rather than as a thing to sort.`,
    });
  }

  // A tuft has to stay ELONGATED to keep its licence. As soon as it is as wide
  // as it is tall it is a bush, and a bush is the lollipop tree's crown sitting
  // on the ground.
  if (cfg.tuftHeight < cfg.tuftWidth * 1.5) {
    v.push({
      rule: 'TUFT',
      message: `A tuft is ${cfg.tuftHeight.toFixed(2)} tall by ${cfg.tuftWidth.toFixed(2)} wide in Sheep. Below 1.5x it stops being a fan of blades and becomes a closed clump — a bush, which is a rival.`,
    });
  }

  if (cfg.boughThickness > 0.01 && cfg.boughThickness < 0.12) {
    v.push({
      rule: 'BOUGH',
      message: 'The bough is too thin to read as a limb — at this width it is a line drawn across the corner rather than something growing past the frame.',
    });
  }

  // Nothing here checks the bough's reach against a span: the generator CLAMPS
  // it to 72% of the frame, so no config can produce one that crosses, and the
  // emitted geometry is asserted directly in `meadow.test.ts`. A config-level
  // check on the unclamped number fires on a phone for every value long enough
  // to be a limb, which is a rule failing on the correct answer.
  //
  // What a config CAN still get wrong is the other end: a bough too short to be
  // a bough is a mark entering the corner, not something growing past the frame.
  /*
   * A knob below the generator's own floor stops responding, and stops
   * responding SILENTLY. `flowerLobe` is clamped to a minimum of 0.35 frame
   * units so a bloom never collapses to nothing, which means that below that
   * floor the slider moves and the picture does not — the same class of failure
   * as a `tuftWidth` the generator drew at 2.7x its stated value. A knob that
   * does not mean what it is named is worse than a hardcoded number, because
   * every rule checked against it then passes on a lie.
   */
  if (cfg.flowerLobe * sheepW < 0.35) {
    v.push({
      rule: 'CLAMPED',
      message: `A flower lobe of ${(cfg.flowerLobe * sheepW).toFixed(2)} frame units is under the generator's 0.35 floor — the knob has stopped changing the picture.`,
    });
  }

  if (cfg.boughThickness > 0.01 && cfg.boughReach < 0.8) {
    v.push({
      rule: 'STUB',
      message: `A bough reaching ${cfg.boughReach.toFixed(1)} Sheep is a mark in the corner rather than a limb the frame happens to cut.`,
    });
  }

  // The foreground is the repoussoir, and the one place it must never reach is
  // the middle of the bottom band — that is where the Sheep stands and where a
  // hand rests. Corner-weighting buys the depth cue without buying that problem.
  if (cfg.foreDepth > 0.3) {
    v.push({
      rule: 'STANDING ZONE',
      message: 'The foreground grass reaches into the band the Sheep stands in — the near mass may frame the stage, never cover it.',
    });
  }

  return v;
}
