import { buildCanopy, type Frame } from './canopy';
import { CANOPY, CANOPY_SEED } from './canopy-config';
import { BirdFigure } from './BirdDrawing';
import { NestFigure, NEST_BOX } from './DuskBackdrop';
import { palette } from './palette';

/**
 * Tuck-In's Card preview — the miniature dusk vignette the Home Card carries
 * above its title.
 *
 * IT IS THE REAL SCENE, DRAWN BY THE REAL COMPONENTS. The canopy comes from
 * `buildCanopy` — the same generator, config and seed the live Toy runs —
 * evaluated into a Card-shaped frame; the nest is `NestFigure` and the fledgling
 * is `BirdFigure`, the very components the Toy mounts. Nothing here is a
 * miniature *of* the Toy; it is the Toy's own art at a smaller size.
 *
 * The first pass got this half-right and it showed. The scene was derived but the
 * Critter was still a hand-simplified stand-in — a stacked `<ellipse>` body, a
 * concentric belly, a `<circle>` head, no contour — which is exactly the
 * construction `BirdDrawing` was rebuilt away from. A clip-art bird sitting in a
 * generated, contoured canopy reads as two different apps in one 100x60 box, and
 * that seam is the whole thing the house style exists to close. Simplifying the
 * cast for a thumbnail is not a saving; it is the defect, shrunk.
 *
 * WHAT THIS REPLACES, AND WHY IT MATTERED. The previous vignette was hand-drawn,
 * and it had gone stale in the most embarrassing way available: three full-width
 * horizontal `<rect>`s — a foliage ceiling, a bough, a ground band — which is
 * EXACTLY the three-stripe composition the canopy migration deleted from the
 * Toy. The Card was still advertising the scene the Toy no longer has, and
 * breaking two of the rules its own `canopy.test.ts` now enforces (nothing spans
 * the frame but one cropped bough; nothing abuts). It also carried a dozen
 * `stroke`s, the one line language the house style forbids outright.
 *
 * None of that was caught by review, because a small green vignette with a bird
 * in it looks like a small green vignette with a bird in it. Deriving the scene
 * from the generator is what makes it impossible: a Card cannot contradict a
 * scene it is computed from, and a lab harvest now updates it for free.
 *
 * THE BIRD SIZE IS THE ONE DIAL, and it is not cosmetic — it decides how much
 * tree the generator draws. `buildCanopy` sets its limb count from how many
 * birds wide the frame is (one rank per bird of vertical band, one limb per ~4.5
 * birds of width), so a SMALLER bird asks for more tree. At 14 units the Card is
 * seven birds across and got four limbs inside a 28-unit band — which at Card
 * size stops reading as branches and reads as telephone wires. At 17 it is six
 * birds across, the generator offers two limbs, and the tree has room to be a
 * tree. It now sits at 24 — four birds across — which keeps the two limbs and
 * makes the nest and its fledgling big enough to be the Card's subject rather
 * than a detail in it. The nest stays 2.6 birds wide throughout, the shipped
 * relation, so scaling the pair up does not distort it.
 *
 * This is the counts-follow-the-frame rule working, not being worked around: a
 * Card is a small window on the scene, so it gets a nearer view with fewer,
 * larger elements. The config and the seed are still the shipped ones — nothing
 * here is a second set of numbers to keep in sync.
 *
 * Decorative for accessibility — the Card's title and `<Link>` carry the
 * semantic load; the SVG is `aria-hidden` so screen readers skim past it.
 */

const CARD: Frame = { w: 100, h: 60 };
/** A bird's width in Card units — the live 16:10 proportion, see the header. */
const CARD_BIRD = 24;
/** The nest is 2.6 birds wide, the same multiple `DuskBackdrop` uses for the
 *  live one. Sizing it in BIRDS rather than in Card units is what keeps the
 *  "a nest is about two and a half fledglings across" relation true here too. */
const CARD_NEST = CARD_BIRD * 2.6;
/** The nest figure is authored in a 200x120 box; this scales it to `CARD_NEST`. */
const NEST_K = CARD_NEST / NEST_BOX.w;
/** The bird figure is authored in a 100x100 box. */
const BIRD_K = CARD_BIRD / 100;
/**
 * How deep the bird sits in the bowl, as a y in its own 100x100 box: the point on
 * the bird that lines up with the nest's rim.
 *
 * Sitting it by the body's LOWEST edge (`BODY_CY + BODY_RY` = 85.3) buries it —
 * the bowl swallows the whole chest and the Card shows a big nest with a head
 * peeping over it. A nestled bird is settled INTO the cup, not dropped down a
 * well: lining the rim up with the body's lower third leaves the breast, the
 * wing and the tucked head all reading, which is what the Card is for.
 */
const BIRD_SIT_Y = 74;
/** Computed once at module scope: the generator is pure, so this never changes.
 *  One perch is asked for, because the Card shows one sleeping bird. */
const ART = buildCanopy(CANOPY, CARD, CARD_BIRD, CANOPY_SEED, 1);

export function Preview() {
  return (
    <svg
      viewBox={`0 0 ${CARD.w} ${CARD.h}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Paint order IS depth order, exactly as in `DuskBackdrop`: the dusk sky
          is what is LEFT OVER between the foliage rather than a field with things
          standing on it, then the moon behind the leaves that crop it, the
          ceiling, the hanging masses, the limbs, the bough, and the near
          understory in front of everything. */}
      <linearGradient id="nestlings-preview-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={palette.skyDeep} />
        <stop offset="1" stopColor={palette.sky} />
      </linearGradient>
      <rect x="0" y="0" width={CARD.w} height={CARD.h} fill="url(#nestlings-preview-sky)" />

      {/* The moon — BEHIND the foliage, so the canopy crops it. A disc laid on
          top of the sky is a sticker; a disc the leaves cut into is a distance. */}
      {ART.moon && <circle cx={ART.moon.cx} cy={ART.moon.cy} r={ART.moon.r} fill={palette.moon} />}

      <path d={ART.ceiling.fill} fill={palette.foliage} />
      <path d={ART.ceiling.relief} fill={palette.foliageShade} opacity={0.55} />

      {ART.masses.map((m, i) => (
        <g key={`mass-${i}`}>
          <path d={m.fill} fill={palette.foliageNear} />
          <path d={m.relief} fill={palette.foliageShade} opacity={0.5} />
        </g>
      ))}

      {ART.limbs.map((l, i) => (
        <g key={`limb-${i}`}>
          {l.leaves && <path d={l.leaves} fill={palette.foliageNear} />}
          <path d={l.ink} fill={palette.contour} />
          {l.twigs.map((d, k) => (
            <path key={k} d={d} fill={palette.branch} />
          ))}
          <path d={l.body} fill={palette.limb} />
        </g>
      ))}

      {ART.bough.leaves && <path d={ART.bough.leaves} fill={palette.foliageNear} />}
      <path d={ART.bough.ink} fill={palette.contour} />
      <path d={ART.bough.body} fill={palette.branch} />

      {/* The nest cradled in the bough, with the fledgling already tucked in —
          the at-rest state the live Toy rewards, so the Card reads "carry them
          home to bed" at a glance.

          Both are placed from measured geometry rather than from tuned offsets:
          the nest sits on the bough's own `top`, and the bird sits on the nest's
          own `rimCy`. Nothing here is a number chosen by looking. */}
      <g transform={`translate(${CARD.w * 0.5 - (CARD_NEST / 2)} ${ART.bough.top - NEST_BOX.bottom * NEST_K}) scale(${NEST_K})`}>
        <NestFigure />
      </g>
      <g transform={`translate(${CARD.w * 0.5 - CARD_BIRD / 2} ${ART.bough.top - NEST_BOX.bottom * NEST_K + NEST_BOX.rimCy * NEST_K - BIRD_SIT_Y * BIRD_K}) scale(${BIRD_K})`}>
        <BirdFigure species="robin" asleep />
      </g>

      {ART.understory && <path d={ART.understory.fill} fill={palette.understory} />}

      {/* A first star twinkling into the dusk — the settle Outro's motif. */}
      <path
        d="M 12 9 l 0.6 1.5 l 1.5 0.6 l -1.5 0.6 l -0.6 1.5 l -0.6 -1.5 l -1.5 -0.6 l 1.5 -0.6 Z"
        fill={palette.sparkle}
      />
    </svg>
  );
}
