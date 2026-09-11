/**
 * The barnyard — the scene generator for "standing in the yard".
 *
 * WHY THIS EXISTS, AND WHY IT HAS NO BARN SILHOUETTE IN IT. The scene it
 * replaces was a flat sky rect, a gable-roofed barn, a run of five identical
 * fence posts, a grass band and a flat elliptical puddle. Nothing overlapped
 * anything, nothing was cropped, every edge was horizontal — the most inert
 * composition available.
 *
 * The barn was the sharpest failure, and naming it precisely is what licenses
 * everything below. That barn was CONVEX, CLOSED, and 0.55 of a Critter wide on
 * a phone. So is a piglet. And the fence beside it was five identical uprights
 * in a row at 0.04 each — a treeline, one octave down, which is the shape class
 * this collection deleted rather than kept as an option.
 *
 * Sorted by shape class, with a Critter as the unit:
 *
 *   | class                  | shape                          | rival? |
 *   | barn, bush, hay bale   | convex, closed, Critter-sized  | YES    |
 *   | fence post, rail, straw| elongated, open, linear        | no     |
 *   | barn wall, puddle, bank| cropped, >= 2.5x a Critter     | no     |
 *   | clod, mote, ripple     | <= 1/8 a Critter, in a mass    | no     |
 *
 * So a yard built from a cropped barn WALL, a cropped puddle, a fence run that
 * the frame cuts, straw BLADES and clod masses is a barnyard containing no
 * Critter-shaped object. That is the whole unlock, and it is enforced here
 * rather than trusted: `check()` returns the violations and `barnyard.test.ts`
 * asserts them at the sizes this Toy actually ships.
 *
 * IT ALSO PAYS OFF THE SPLASH. The scene emits `walk` (the sampled trotting
 * line), `stand` (where a Critter rests on it) and `splash` (a point on the
 * puddle's own surface). Those used to be independent: the puddle was drawn into
 * a `--barnyard-floor` CSS band and the last Critter was animated `y: 90` past
 * it, a number tuned by eye against a pool it could not see. On a wide viewport
 * the puddle sits off to one side and the Critter dived into grass. Two
 * hand-maintained positions cannot be kept in agreement; one generator read by
 * both cannot fall out of it.
 *
 * WHAT A NARROW FRAME GETS. Counts follow the frame, sizes follow the Critter.
 * A phone is only ~2 Critters across, so a bank at the 2.5-Critter floor does
 * not fit inside it at all and the phone gets none — it gets its depth from the
 * cropped barn, the cropped puddle and the corner clay instead. A wide viewport
 * gets MORE yard sideways, never the same yard enlarged.
 */

import {
  blob,
  closedPath,
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
 * That distinction is the whole point and the canopy got it wrong first. Sizing
 * the line off the barn's own bulk means a bigger barn gets a heavier line, so
 * the scenery's weight is set by the scenery; greyscaled, the background ends up
 * drawn with more line than the figure. The contour belongs to the FIGURE. This
 * is enough line to say the barn is DRAWN — which is most of the difference
 * between an illustration and clip art — and, at half the cast's weight, not
 * enough to compete. Hardcoded rather than exposed: it is a rule, not a taste.
 */
const SCENERY_CONTOUR_RATIO = 0.5;

/** The box the scene is composed into. `w` is always 100; `h` follows the aspect. */
export type Frame = { w: number; h: number };

/**
 * Every taste decision in the barnyard. The RULES (what makes it this idea) are
 * hardcoded below; these are the numbers nobody has settled yet.
 */
export type BarnyardConfig = {
  /** Where the trotting line sits, as a fraction of frame height. */
  groundY: number;
  /** How far the trotting line undulates, in CRITTER widths. A yard is not flat,
   *  and a dead-level line is a rule drawn across the picture. */
  groundRelief: number;
  /** How many far banks a WIDE frame gets. Scaled by the frame's width in
   *  Critters, and zero on a phone, where no legal bank fits. */
  bankCount: number;
  /** How far a bank reaches in from its edge, in CRITTERS. Must be >= 2.5, or
   *  the bank lands in the cast's own size band and becomes a sixth character. */
  bankSpread: number;
  /** How high a bank crests above the trotting line, as a fraction of height. */
  bankRise: number;
  /** The barn, as a multiple of a CRITTER. 0 (off) or >= 2.5, never between —
   *  the band in the middle is where the old gable silhouette sat. */
  barnScale: number;
  /** How far the barn's near wall reaches into the frame, as a fraction of
   *  width. Everything to the left of it is off-frame; that is the crop. */
  barnReach: number;
  /** Where the barn's eave sits, as a fraction of frame height. */
  barnEave: number;
  /** Roof rise from eave to ridge, as a fraction of the barn's own width. The
   *  ridge leaves the frame at the LEFT edge rather than resolving into an apex
   *  inside it — an apex is the gable icon returning at four times the size. */
  barnPitch: number;
  /** How far the fence run reaches in from the right edge, in CRITTERS. */
  fenceReach: number;
  /** Fence post height, in CRITTER widths. */
  postHeight: number;
  /** Post width, in CRITTER widths. Held far under the height so a post stays
   *  ELONGATED — a post as wide as it is tall is a block, which is a rival. */
  postWidth: number;
  /** Posts per CRITTER-width of fence run. A density, not a count. */
  postDensity: number;
  /** Straw tufts per Critter-width of frame. */
  strawDensity: number;
  /** Straw height, in CRITTER widths. */
  strawHeight: number;
  /** Straw width, in CRITTER widths. Held under the height for the same reason
   *  as the posts. */
  strawWidth: number;
  bladesPerTuft: number;
  /** The puddle's width, as a multiple of a CRITTER. >= 2.5 or it is a rival —
   *  and the reason this Toy cannot simply have a tidy oval pool. */
  puddleSpread: number;
  /** Its depth as a fraction of its width — how flat the pool lies. */
  puddleFlat: number;
  /** How far below the trotting line the pool's near rim starts, as a fraction
   *  of frame height. */
  puddleDrop: number;
  /** How many ripple lines ride on the surface. Elongated-open, so they carry no
   *  size rule beyond not spanning. */
  rippleCount: number;
  /** Foreground clay depth, as a fraction of frame height. Corner-weighted. */
  foreDepth: number;
  /** Clod radius as a fraction of a CRITTER. The rule is on the diameter:
   *  <= 1/8, or a lump of earth becomes a countable object. */
  clodRadius: number;
  /** Drifting specks — the only moving thing in the scene. */
  moteCount: number;
};

export const BARNYARD_DEFAULTS: BarnyardConfig = {
  groundY: 0.7,
  groundRelief: 0.08,
  bankCount: 2,
  bankSpread: 2.8,
  bankRise: 0.09,
  barnScale: 2.9,
  barnReach: 0.42,
  barnEave: 0.34,
  barnPitch: 0.26,
  fenceReach: 2.1,
  postHeight: 0.3,
  postWidth: 0.05,
  postDensity: 1.6,
  strawDensity: 2.4,
  strawHeight: 0.22,
  strawWidth: 0.13,
  bladesPerTuft: 5,
  puddleSpread: 2.7,
  puddleFlat: 0.3,
  puddleDrop: 0.04,
  rippleCount: 4,
  foreDepth: 0.13,
  clodRadius: 0.04,
  moteCount: 3,
};

/* ------------------------------------------------------------------ *
 * The generator
 * ------------------------------------------------------------------ */

export type Tuft = { blades: string[]; x: number };

export type BarnyardArt = {
  /** The one oversized cropped mass — what replaces the gable silhouette.
   *  `boards` are its vertical seams: elongated, open, and what stops the wall
   *  reading as one flat plane of colour. */
  barn: { wall: string; roof: string; boards: string[]; ink: string; shade: string } | null;
  /** Far ground planes, back to front. Empty on a narrow frame by design. */
  banks: { fill: string; relief: string }[];
  /** The near ground plane and the crest it is bounded by — the ONE shape
   *  allowed to cross the frame horizontally. */
  ground: { fill: string; relief: string };
  /** Posts and rails, both elongated-open, cropped by the right edge. Each of
   *  the two carries its own ink, so nothing in the run is uncontoured. */
  fence: { posts: string[]; rails: string[]; ink: string[]; railInk: string[] } | null;
  straw: Tuft[];
  /** The pool. Cropped by the right edge always, and by the bottom on a tall
   *  frame — never a free-standing oval. */
  puddle: { fill: string; sheen: string; rim: string; ripples: string[] } | null;
  fore: { base: string; clods: { cx: number; cy: number; r: number }[] } | null;
  motes: { cx: number; cy: number; r: number; delay: number; amp: number }[];
  /**
   * The trotting line, sampled left to right across the full frame. A Critter's
   * feet read this instead of a hand-tuned CSS multiplier, which is what stops
   * the two drifting apart across aspect ratios.
   */
  walk: Pt[];
  /** Where a Critter rests: the trotting line at the frame's centre. */
  stand: Pt;
  /**
   * Where the LAST Critter of the play lands — a point on the puddle's own
   * surface, emitted rather than assumed. The splash used to be a fixed `y: 90`
   * nudge downward from centre, which lands in the pool on a phone and in the
   * grass beside it on a desktop, because the puddle moves with the frame and
   * the nudge did not.
   */
  splash: Pt;
};

/** The trotting line's height at any x — a linear read of the sampled `walk`. */
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
 * Build the whole barnyard. Pure: same `(cfg, frame, critterW, seed)` in, same
 * paths out, every random draw from a named seeded stream.
 *
 * `critterW` is a Critter's width IN FRAME UNITS, and it is a parameter rather
 * than a constant because every size rule is expressed against it — a post is "a
 * third of a Critter", never "15 units".
 */
export function buildBarnyard(
  cfg: BarnyardConfig,
  frame: Frame,
  critterW: number,
  seed: number,
): BarnyardArt {
  const { w, h } = frame;
  const rnd = stream(seed, 'barnyard');
  const bleed = w * 0.08;
  /** How wide the frame is, measured in Critters. ~2.0 on a phone, ~6.0 at 16:10. */
  const critterWide = w / critterW;
  /*
   * The cast's own contour, converted into frame units — a Critter is drawn in a
   * 100-wide box rendered `critterW` frame units across, so its line scales with
   * it. Everything the scene outlines is measured against this.
   */
  const castContour = houseLine.contour * (critterW / 100);
  const inkW = castContour * SCENERY_CONTOUR_RATIO;

  /* --- the trotting line -----------------------------------------------
   * The ONE shape allowed to cross the frame horizontally, and cropped by both
   * side edges so it reads as continuing past them.
   *
   * A SMOOTH curve, deliberately — the one place in the collection where a sine
   * is the right tool rather than the wrong one. A smooth periodic curve reads
   * as ground; the lobed-arc emitter used everywhere else would turn this yard
   * into foliage. Two low harmonics, never one: the beat between them is what
   * stops it reading as a single wave.
   */
  const groundY = h * cfg.groundY;
  const relief = critterW * cfg.groundRelief;
  const gPhase = rnd() * Math.PI * 2;
  const groundAt = (x: number) => {
    const t = (x + bleed) / (w + bleed * 2);
    return (
      groundY +
      relief * 0.62 * Math.sin(t * Math.PI * 1.7 + gPhase) +
      relief * 0.38 * Math.sin(t * Math.PI * 3.7 + gPhase * 1.6)
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
     * The lit crest, as a BAND following the trotting line rather than the whole
     * silhouette shifted up. A shifted copy shows through wherever the two
     * outlines diverge, which comes out as pale streaks.
     */
    relief: closedPath([
      ...walk,
      ...[...walk].reverse().map(([x, y]) => [x, y + relief * 1.1 + critterW * 0.02] as Pt),
    ]),
  };

  /* --- far banks -------------------------------------------------------
   * Each ENTERS at a side edge, crests above the trotting line, and settles back
   * below it — so it is cropped by that edge and never a free-standing hill.
   *
   * They exist only where a LEGAL one fits. A bank must be at least 2.5 Critters
   * wide to clear the cast's size band, and on a phone 2.5 Critters is ~125
   * frame units against a 100-unit frame: there is no bank a phone can hold that
   * is not a rival, so a phone gets none.
   */
  const banks: BarnyardArt['banks'] = [];
  const bankW = critterW * cfg.bankSpread;
  const bankRoom = Math.floor((w * 0.86) / bankW);
  const bankN = Math.max(
    0,
    Math.min(3, Math.min(bankRoom, Math.round(cfg.bankCount * (critterWide - 2) * 0.5))),
  );
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
      // A single smooth shoulder: high at the frame edge, easing down to meet the
      // trotting line at the far end. `t^1.7` keeps the crest broad near the edge
      // instead of peaking into a dome, which would be a closed hill.
      const fall = Math.pow(t, 1.7);
      pts.push([x, crestY + (groundAt(x) - crestY) * fall]);
    }
    const far = fromLeft ? w + bleed : -bleed;
    banks.push({
      fill: closedPath([...pts, [far, h + bleed], [x0, h + bleed]]),
      relief: closedPath([...pts, ...[...pts].reverse().map(([x, y]) => [x, y + rise * 0.3] as Pt)]),
    });
  }

  /* --- the barn: what replaces the gable silhouette --------------------
   * It enters at the LEFT edge and runs off it, so the frame crops it and it can
   * never be counted as an object. What is visible is one wall and one roof
   * plane — which is what standing beside a barn looks like, and which the
   * 20-unit gable icon on the horizon never was.
   *
   * ONE edge is the crop, not two. The ridge sits inside the frame at both
   * shipped aspects (y ~9 at 16:10, ~36 on a phone) and is meant to: pushing it
   * off the top as well needs either a much taller barn or a steeper pitch, and
   * both spend area this scene does not have to spare. The rule asks for a shape
   * past 2.5 Critters AND cut by an edge, which the left edge satisfies on its
   * own — worth stating because the comment here used to claim two edges and
   * nobody had checked whether the geometry agreed.
   */
  const barnW = critterW * cfg.barnScale;
  const barn =
    cfg.barnScale > 0.01
      ? (() => {
          const x1 = w * cfg.barnReach;
          const x0 = x1 - barnW;
          const eaveY = h * cfg.barnEave;
          // The ridge runs off the LEFT edge, never up to an apex inside the
          // frame: an apex would put a closed triangle back in the picture, which
          // is the gable icon returning at four times the size. What the viewer
          // sees is one slope leaving the frame, so the roof continues rather
          // than resolving.
          const ridgeY = eaveY - barnW * cfg.barnPitch;
          const baseY = groundAt(x1) + h * 0.01;
          const wobble = (i: number) => Math.sin(i * 2.3 + gPhase) * inkW * 0.6;
          /*
           * THE WALL'S TOP EDGE FOLLOWS THE ROOF, and getting that wrong is the
           * most visible mistake this scene has made.
           *
           * It was horizontal at the eave while the roof sloped up to the ridge,
           * so between the two there was a triangular wedge of SKY that widened
           * toward the left edge — the roof hovered above the building instead
           * of sitting on it. A wall meets its own roofline by definition; the
           * two cannot be authored independently, which is the same lesson as
           * the Critter that floated above its own ground.
           */
          const topAt = (x: number) => ridgeY + ((eaveY - ridgeY) * (x - x0)) / (x1 - x0);
          const wallTop: Pt[] = [];
          for (let i = 0; i <= 8; i++) {
            const x = x0 + ((x1 - x0) * i) / 8;
            wallTop.push([x, topAt(x) + wobble(i + 1)]);
          }
          const wall: Pt[] = [...wallTop, [x1 + wobble(3), baseY], [x0, baseY + wobble(4)]];
          /*
           * The roof is a slab STRADDLING that line and overhanging past the
           * wall's near end, which is what gives a barn its eave. Flush with the
           * wall it read as a stripe painted along the top rather than as a roof
           * with a thickness.
           */
          const roofThick = barnW * 0.055;
          const roof: Pt[] = [
            [x0, ridgeY - roofThick * 0.45],
            [x1 + roofThick * 0.95, eaveY - roofThick * 0.1],
            [x1 + roofThick * 0.95, eaveY + roofThick * 0.85],
            [x0, ridgeY + roofThick * 0.5],
          ];
          /*
           * Board seams — vertical, elongated and open, so they carry no size
           * rule. A barn wall in this style cannot be one flat plane of colour:
           * that is a coloured rectangle, and the thing separating an
           * illustration from clip art is mostly the evidence that a hand drew
           * it. Only across the VISIBLE span, since everything left of the frame
           * is not drawn at all.
           */
          const boardFrom = Math.max(x0, -bleed);
          const boards: string[] = [];
          const boardN = Math.max(3, Math.round((x1 - boardFrom) / (barnW * 0.085)));
          for (let i = 1; i < boardN; i++) {
            const bx = boardFrom + ((x1 - boardFrom) * i) / boardN;
            boards.push(
              taperedOutline(
                quadPts(
                  [bx, topAt(bx) + (baseY - eaveY) * 0.06],
                  [bx + wobble(i) * 1.6, (topAt(bx) + baseY) / 2],
                  [bx + wobble(i + 2), baseY],
                  10,
                ),
                Math.max(0.24, inkW * 0.5),
                0.5,
              ),
            );
          }
          return {
            wall: polygonPath(wall),
            roof: polygonPath(roof),
            boards,
            /*
             * Line on the near side only — the two edges the frame does not
             * already cut. Ringing the whole silhouette would put ink along the
             * cropped edges too, which reads as a border drawn around a sticker
             * rather than as a building continuing past the frame.
             */
            ink: polygonPath([
              [x1, eaveY],
              [x1 + inkW * 1.6, eaveY],
              [x1 + inkW * 1.6, baseY],
              [x1, baseY],
            ]),
            /*
             * The shadow the eave casts on its own wall, as a band following the
             * ROOFLINE rather than a horizontal stripe across the top. A copy of
             * the whole silhouette offset behind it shows through wherever the
             * two outlines diverge and reads as pale streaks — the most visible
             * artefact in the first canopy render — and a horizontal band under
             * a sloping roof is that same error with the divergence built in.
             */
            shade: polygonPath([
              ...wallTop,
              ...[...wallTop]
                .reverse()
                .map(([x, y]) => [x, y + (baseY - eaveY) * 0.2] as Pt),
            ]),
          };
        })()
      : null;

  /* --- the fence -------------------------------------------------------
   * POSTS AND RAILS, which are elongated and open, so the run carries no size
   * rule beyond not spanning the frame. What it replaces was five identical
   * uprights evenly spaced at a fixed x — a row, and a row of anything is the
   * treeline's shape class however small the members are.
   *
   * It enters at the right edge and ends at a post inside the frame: a fence
   * that stops is a fence with a gate in it, which is a thing yards have. A
   * fence that spans is a rule drawn across the picture.
   */
  const fenceReach = Math.min(w * 0.62, critterW * cfg.fenceReach);
  const postW = Math.max(0.35, critterW * cfg.postWidth);
  const postH = critterW * cfg.postHeight;
  const fence =
    cfg.fenceReach > 0.01
      ? (() => {
          const xEnd = w + bleed;
          const xStart = w - fenceReach;
          const n = Math.max(2, Math.round(cfg.postDensity * cfg.fenceReach));
          const posts: string[] = [];
          const ink: string[] = [];
          const xs: number[] = [];
          for (let i = 0; i <= n; i++) {
            // A jittered walk rather than an even division: evenly spaced
            // uprights are what made the old run read as one repeated stamp.
            const x = xStart + ((xEnd - xStart) * (i + (rnd() - 0.5) * 0.45)) / n;
            xs.push(x);
            const baseY = groundAt(x);
            const top = baseY - postH * (0.85 + rnd() * 0.3);
            const lean = (rnd() - 0.5) * postW * 1.4;
            const spine = quadPts([x, baseY], [x + lean * 0.4, (baseY + top) / 2], [x + lean, top], 8);
            /*
             * `ribbon`, not `taperedOutline`. A tapered outline narrows to a
             * point at BOTH ends, which is right for a blade of straw and wrong
             * for a post: it came out as an almond floating on the grass, with
             * no foot where it enters the ground and no square top. A post keeps
             * its width at the bottom and loses a little toward the top, which
             * is what weathered timber does.
             */
            const half = (t: number) => (postW / 2) * (1 - 0.18 * t);
            posts.push(polygonPath(ribbon(spine, half, half)));
            ink.push(
              polygonPath(ribbon(spine, (t) => half(t) + inkW * 0.7, (t) => half(t) + inkW * 0.7)),
            );
          }
          /*
           * Two rails, each a ribbon so it keeps full width where the frame cuts
           * it — `taperedOutline` would needle it to a point at the edge and read
           * as a painted stripe rather than as timber continuing past.
           *
           * THE NEAR END STOPS AT THE END POST. It used to stop a post-width
           * short of it, which put a blunt vertical cut in mid-air just clear of
           * the last upright: a rail ending at nothing. A fence run ends where a
           * post holds it, and the post then caps the cut — the same reason the
           * scene's masses are cropped by frame edges rather than stopping
           * neatly inside them.
           */
          const railFrom = Math.min(...xs);
          const rails: string[] = [];
          const railInk: string[] = [];
          [0.34, 0.68].forEach((frac, k) => {
            // The two rails are not a matched pair: they differ in sag and in
            // thickness, so the run reads as timber rather than as a repeated
            // stamp — the same failure the evenly-spaced posts had.
            const sag = postW * (0.3 + k * 0.4);
            const railY = (x: number) => groundAt(x) - postH * (1 - frac);
            const spine = quadPts(
              [railFrom, railY(railFrom)],
              [(railFrom + xEnd) / 2, railY((railFrom + xEnd) / 2) - sag],
              [xEnd, railY(xEnd)],
              14,
            );
            const half = () => postW * (0.44 - k * 0.07);
            rails.push(polygonPath(ribbon(spine, half, half)));
            // Ink, like the posts have. Without it the rails were the only
            // uncontoured thing in the scene and read as flat vector strips
            // crossing a drawn fence.
            railInk.push(
              polygonPath(
                ribbon(
                  spine,
                  () => half() + inkW * 0.6,
                  () => half() + inkW * 0.6,
                ),
              ),
            );
          });
          return { posts, rails, ink, railInk };
        })()
      : null;

  /* --- straw -----------------------------------------------------------
   * BLADES, not clumps. A tuft is a fan of separate tapered lines that never
   * closes at the top, which keeps it in the elongated-open class however tall
   * it gets. A round clump of the same size is a bush, and a bush at this scale
   * is the gable barn with the roof taken off.
   *
   * Counts follow the frame (a density per Critter-width), sizes follow the
   * Critter.
   */
  const straw: Tuft[] = [];
  const strawN = Math.max(3, Math.round(cfg.strawDensity * critterWide));
  const strawH = critterW * cfg.strawHeight;
  const strawW = critterW * cfg.strawWidth;
  for (let i = 0; i < strawN; i++) {
    const x = ((i + 0.5 + (rnd() - 0.5) * 0.7) / strawN) * (w + bleed * 2) - bleed;
    const baseY = groundAt(x) + strawH * 0.08;
    const blades: string[] = [];
    const count = Math.max(2, Math.round(cfg.bladesPerTuft * (0.6 + rnd() * 0.8)));
    for (let k = 0; k < count; k++) {
      const u = count === 1 ? 0 : k / (count - 1) - 0.5;
      /*
       * The fan spans exactly `strawWidth`. The meadow's version of this had a
       * 1.6-2.4x lean multiplier, so a tuft authored as 0.20 wide came out at
       * 0.54 — wider than it was tall, meaning the config said "elongated" while
       * the generator drew a clump. A knob that does not mean what it is named is
       * worse than a hardcoded number, because the rule checked against it then
       * passes on a lie.
       */
      const lean = u * strawW * (0.9 + rnd() * 0.2);
      const len = strawH * (0.85 + rnd() * 0.4);
      blades.push(
        taperedOutline(
          quadPts(
            [x + u * strawW * 0.15, baseY],
            [x + lean * 0.45, baseY - len * 0.62],
            [x + lean, baseY - len],
            10,
          ),
          Math.max(0.3, critterW * 0.02),
          // Front-loaded: a blade is thickest near the root and lifts to a point.
          0.18,
        ),
      );
    }
    straw.push({ blades, x });
  }

  /* --- the puddle: the Toy's subject, and the NEAR GROUND PLANE ---------
   * It is at least 2.5 Critters wide and the bottom edge always cuts it, so it
   * is never the tidy free-standing oval it used to be — which, at 0.68 of a
   * Critter, sat squarely in the cast's own size band while being the one thing
   * on screen a Critter is supposed to jump INTO.
   *
   * IT SITS UNDER THE STANDING POINT, and that is a composition fix rather than
   * a shape one. Placed off to one side — which is where a pool tucked into the
   * right-hand corner ends up — the Critter stands in a field and the pool is
   * scenery somewhere else in the picture. A Toy called Muddy Puddle whose
   * animal is nowhere near a puddle contradicts itself, which is the one thing
   * a scene may not do. Centring it makes the trotting line the pool's near
   * bank: the cast walks along the edge of the water it is about to jump into.
   *
   * THE DEPTH FLOOR IS WHAT GUARANTEES THE CROP. Sized on its width alone the
   * pool is 20 units deep on a phone and 7 at 16:10, and at 16:10 that stopped
   * three units short of the bottom edge and read as a beige plate laid on the
   * grass. Taking the larger of "its own proportion" and "most of the way to the
   * bottom edge" means the frame cuts it at every aspect rather than at the one
   * the numbers were tuned on.
   */
  const puddleRx = (critterW * cfg.puddleSpread) / 2;
  const puddleCx = w / 2;
  /** The pool's near rim — a clear strip of ground below the trotting line, so
   *  the cast has a bank to walk along rather than standing in the water. */
  const puddleTop = groundAt(puddleCx) + h * cfg.puddleDrop + critterW * 0.12;
  const puddleRy = Math.max(puddleRx * cfg.puddleFlat, (h - puddleTop) * 0.95);
  const puddleCy = puddleTop + puddleRy;
  const puddle =
    cfg.puddleSpread > 0.01
      ? (() => {
          const pool = blob(puddleCx, puddleCy, puddleRx, puddleRy, 0.03, rnd, 30);
          const sheen = blob(
            puddleCx - puddleRx * 0.1,
            puddleCy - puddleRy * 0.22,
            puddleRx * 0.72,
            puddleRy * 0.56,
            0.04,
            rnd,
            26,
          );
          /*
           * The near rim, as a band following the pool's OWN lower edge rather
           * than a second ellipse behind it — same construction as the ground's
           * crest, and for the same reason.
           */
          const lower = pool.pts.filter(([, y]) => y >= puddleCy);
          const rim = closedPath([
            ...lower,
            ...[...lower].reverse().map(([x, y]) => [x, y - puddleRy * 0.3] as Pt),
          ]);
          // Ripples are elongated and open, so they carry no size rule. They are
          // the only thing in the scene that says the pool is WET rather than a
          // patch of paint.
          const ripples: string[] = [];
          for (let i = 0; i < Math.round(cfg.rippleCount); i++) {
            const t = (i + 0.5) / Math.max(1, Math.round(cfg.rippleCount));
            const rx = puddleCx + (t - 0.55) * puddleRx * 1.4;
            const ry = puddleCy + (rnd() - 0.5) * puddleRy * 0.9;
            const len = puddleRx * (0.18 + rnd() * 0.16);
            ripples.push(
              taperedOutline(
                quadPts([rx - len, ry], [rx, ry - puddleRy * 0.14], [rx + len, ry], 10),
                Math.max(0.3, critterW * 0.016),
                0.5,
              ),
            );
          }
          return { fill: pool.d, sheen: sheen.d, rim, ripples };
        })()
      : null;

  /* --- the foreground clay: the repoussoir -----------------------------
   * CORNER-WEIGHTED, not a band. A full-width fringe along the bottom edge is
   * one more horizontal stripe, which is the thing being fixed — and worse, it
   * would sit across the middle of the bottom, which is where a Critter is set
   * down and where a child's hand rests while wiping.
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
             * "corner clay" comes out as one hard chevron pointing down the
             * middle of the frame. A repoussoir is two masses at the edges, not
             * a V; the dead zone is what makes it two.
             */
            const d = Math.abs(t - 0.5);
            // The ramp runs 0.1 -> 0.42 rather than 0.1 -> 0.34. Over the
            // shorter span the band climbed its full depth across a third of
            // the width, which is a 1:1 slope: the corners came out as two hard
            // wedges with a near-straight inner edge, reading as blocks laid on
            // the yard rather than as ground rising toward the viewer.
            return Math.min(1, Math.max(0, (d - 0.1) / 0.42)) ** 1.5;
          };
          const base: Pt[] = [];
          const n = 48;
          for (let k = 0; k <= n; k++) {
            const t = k / n;
            base.push([-bleed + (w + bleed * 2) * t, h - depth * (0.06 + 0.94 * weight(t))]);
          }
          // Clods, held under an eighth of a Critter so a lump of earth stays
          // part of a mass rather than becoming a thing to sort.
          const clodR = Math.max(0.3, critterW * cfg.clodRadius);
          const clods: { cx: number; cy: number; r: number }[] = [];
          const clodN = Math.max(6, Math.round(critterWide * 7));
          for (let k = 0; k < clodN; k++) {
            const t = (k + 0.5 + (rnd() - 0.5) * 0.8) / clodN;
            const wgt = weight(t);
            if (wgt < 0.12) continue;
            clods.push({
              cx: -bleed + (w + bleed * 2) * t,
              cy: h - depth * (0.06 + 0.94 * wgt) + depth * (0.1 + rnd() * 0.5),
              r: clodR * (0.7 + rnd() * 0.6),
            });
          }
          return {
            base: closedPath([...base, [w + bleed, h + bleed], [-bleed, h + bleed]]),
            clods,
          };
        })()
      : null;

  /* --- motes: the only moving thing -------------------------------------
   * Dust drifting over the yard. Tiny by rule, few, and slow — the cheapest
   * literal "alive" available, and the only animation the background gets.
   */
  const motes = Array.from({ length: Math.round(cfg.moteCount) }, () => ({
    cx: w * (0.1 + rnd() * 0.8),
    cy: h * (0.2 + rnd() * 0.45),
    r: Math.max(0.3, critterW * (0.012 + rnd() * 0.012)),
    delay: rnd() * 6,
    amp: h * (0.02 + rnd() * 0.03),
  }));

  return {
    barn,
    banks,
    ground,
    fence,
    straw,
    puddle,
    fore,
    motes,
    walk,
    stand: [w / 2, groundAt(w / 2)],
    /*
     * On the pool's own surface, a little in from its near rim so a Critter
     * lands IN the water rather than on the bank. Emitted rather than assumed —
     * see the header on the `y: 90` nudge that dived into grass at 16:10. Offset
     * sideways as well as down, so the last beat is a jump rather than a drop.
     */
    splash: [puddleCx + puddleRx * 0.16, puddleTop + puddleRy * 0.42],
  };
}

/* ------------------------------------------------------------------ *
 * The rules, as a check rather than as a comment
 * ------------------------------------------------------------------ */

export type BarnyardViolation = { rule: string; message: string };

/**
 * The shape-class rules that keep the background out of the cast's league,
 * evaluated for a given Critter size. These exist as a check rather than as
 * prose because the house rules were written down carefully and then broken in
 * the same session that wrote them — a rule you can read and still not apply is
 * not a rule; a rule that fails the build is.
 */
export function check(cfg: BarnyardConfig, critterW: number): BarnyardViolation[] {
  const v: BarnyardViolation[] = [];

  if (cfg.barnScale > 0.01 && cfg.barnScale < 2.5) {
    v.push({
      rule: 'PEER SIZE',
      message: `The barn is ${cfg.barnScale.toFixed(1)}x a Critter. A background shape must be >= 2.5x the cast or <= 1/8 of it — the band between is a second character, which is exactly what the gable silhouette was at 0.55x.`,
    });
  }

  if (cfg.puddleSpread > 0.01 && cfg.puddleSpread < 2.5) {
    v.push({
      rule: 'PUDDLE',
      message: `The puddle is ${cfg.puddleSpread.toFixed(1)}x a Critter — a closed convex shape in the cast's own size band, and the one a Critter is meant to jump into. Grow it past 2.5 and let the frame crop it.`,
    });
  }

  if (cfg.bankSpread < 2.5) {
    v.push({
      rule: 'BANK',
      message: `A bank reaching ${cfg.bankSpread.toFixed(1)} Critters is a free-standing hill in the cast's own size band. Grow it past 2.5 and let the frame crop it, or do not draw it — a narrow frame simply gets none.`,
    });
  }

  // A clod is a discrete object rather than a continuous mass, so it is held to
  // the strict half of the rule: a lobe of foliage may reach 1/4, a lump sitting
  // on its own in the dirt may not.
  const clod = cfg.clodRadius * 2;
  if (clod > 0.125) {
    v.push({
      rule: 'CLOD',
      message: `A clod is ${clod.toFixed(3)}x a Critter. A discrete object must stay under 1/8 to read as part of a mass rather than as a thing to sort.`,
    });
  }

  // A tuft has to stay ELONGATED to keep its licence. As soon as it is as wide
  // as it is tall it is a bush, and a bush is the gable barn on the ground.
  if (cfg.strawHeight < cfg.strawWidth * 1.5) {
    v.push({
      rule: 'STRAW',
      message: `A straw tuft is ${cfg.strawHeight.toFixed(2)} tall by ${cfg.strawWidth.toFixed(2)} wide in Critters. Below 1.5x it stops being a fan of blades and becomes a closed clump — a bush, which is a rival.`,
    });
  }

  // Same rule, one subject over: a post as wide as it is tall is a block.
  if (cfg.postHeight < cfg.postWidth * 1.5) {
    v.push({
      rule: 'POST',
      message: `A fence post is ${cfg.postHeight.toFixed(2)} tall by ${cfg.postWidth.toFixed(2)} wide in Critters. Below 1.5x it stops being a line and becomes a block standing in the field.`,
    });
  }

  /*
   * A knob below the generator's own floor stops responding, and stops
   * responding SILENTLY. `postWidth` is clamped to a minimum of 0.35 frame units
   * so a post never collapses to nothing, which means that below that floor the
   * slider moves and the picture does not — the same class of failure as a straw
   * width the generator drew at 2.7x its stated value.
   */
  if (cfg.postWidth * critterW < 0.35) {
    v.push({
      rule: 'CLAMPED',
      message: `A post of ${(cfg.postWidth * critterW).toFixed(2)} frame units is under the generator's 0.35 floor — the knob has stopped changing the picture.`,
    });
  }

  // Nothing here checks the fence's reach against a span: the generator CLAMPS
  // it to 62% of the frame, so no config can produce one that crosses, and the
  // emitted geometry is asserted directly in `barnyard.test.ts`. What a config
  // CAN still get wrong is the other end — a run too short to be a fence is a
  // mark at the edge rather than something the frame happens to cut.
  if (cfg.fenceReach > 0.01 && cfg.fenceReach < 0.8) {
    v.push({
      rule: 'STUB',
      message: `A fence reaching ${cfg.fenceReach.toFixed(1)} Critters is a mark in the corner rather than a run the frame happens to cut.`,
    });
  }

  // The foreground is the repoussoir, and the one place it must never reach is
  // the middle of the bottom band — that is where a Critter is set down and
  // where a hand rests through the whole Wipe.
  if (cfg.foreDepth > 0.3) {
    v.push({
      rule: 'STANDING ZONE',
      message: 'The foreground clay reaches into the band a Critter stands in — the near mass may frame the stage, never cover it.',
    });
  }

  return v;
}
