import { memo } from 'react';
import { motion } from 'motion/react';
import { palette } from './palette';
import type { ReefScene } from './useReefScene';

/**
 * The Puffer Fish reef — the code-drawn world behind the Fish (ADR-0002, all
 * SVG; ADR-0004, the Toy owns its scene assets locally). Every colour sources
 * the local `palette`, so there are no hardcoded colours here.
 *
 * WHAT THIS IS NOW, AND WHY. It used to be a water gradient, three god-rays,
 * five bubbles, a full-width sand band and two branchy coral clumps. Nothing
 * overlapped anything, nothing was cropped by the frame, and the coral was
 * worse than inert: both clumps were convex, closed and inside the Fish's own
 * size band, so the background was made of things a three-year-old has to sort
 * from the thing they are meant to tap. `reef.ts` carries that argument in full.
 *
 * ONE VIEWBOX, MATCHED TO THE VIEWPORT. The scene is composed into a
 * `0 0 100 h` box whose aspect equals the viewport's, so `preserveAspectRatio`
 * has nothing to correct and nothing is stretched or sliced. That replaces the
 * old stack of three separately-positioned layers — a square `slice` water
 * column, a `none`-stretched sand band anchored to a `--ocean-floor` CSS length,
 * and two aspect-locked coral SVGs floated over it — which agreed with each
 * other on a phone and came apart at 16:10.
 *
 * THE PAINT ORDER IS THE DEPTH ORDER, and every adjacent pair overlaps rather
 * than abutting. Back to front: water, the sun, the shafts falling through it,
 * the far ridges (each cropped by a side edge), the seabed, the kelp rooted in
 * it, the fans and polyps standing on it, and the corner reef in front of
 * everything. Nothing in this stack meets its neighbour at a shared edge.
 *
 * Layers keep their `data-ocean-layer` hooks so tests address the composition
 * without coupling to which primitive draws each one. Decorative: `aria-hidden`
 * and `pointer-events: none`, so screen readers and presses fall straight
 * through to the Fish above.
 */

/**
 * Everything that depends only on the scene geometry.
 *
 * Memoized on the scene object, which the shared hook only replaces when the
 * viewport crosses an aspect bucket — so the several hundred blade and lobe
 * paths never re-run through the reconciler on the frames a Fish is animating.
 */
const ReefPlates = memo(function ReefPlates({ scene }: { scene: ReefScene }) {
  const { art } = scene;
  return (
    <>
      {/* The sun through the surface — BEHIND everything, so the shafts and the
          kelp crop it. A disc laid on top of the water is a sticker; a disc the
          scene cuts into is a distance. It is the "one oversized cropped motif"
          direction, at 3x a Fish — the size band the coral clumps it replaces
          sat squarely inside. */}
      {art.sun && (
        <circle
          data-ocean-layer="sun"
          cx={art.sun.cx}
          cy={art.sun.cy}
          r={art.sun.r}
          fill={palette.sun}
        />
      )}

      {/* God-rays. The one element allowed to cross the frame vertically: each
          shaft enters above the top edge and leaves below the bottom one, so
          both ends are cropped, and it is painted at low opacity — it is LIGHT,
          not mass, and adds no dark area for the squint test to find. */}
      {art.rays.map((d, i) => (
        <path key={i} data-ocean-layer="light-ray" d={d} fill={palette.lightRay} opacity={0.32} />
      ))}

      {/* Far ridges. Each enters at a side edge and settles back to the seabed,
          so it is cropped rather than free-standing — and there are none at all
          on a phone, where no ridge that clears the cast's size band would fit
          inside the frame. A wide viewport gets more reef SIDEWAYS. */}
      {art.ridges.map((r, i) => (
        <g key={i} data-ocean-layer="ridge">
          <path d={r.fill} fill={palette.ridge} />
          <path d={r.relief} fill={palette.bedShade} opacity={0.4} />
        </g>
      ))}

      {/* The seabed — the ONE shape allowed to cross the frame horizontally, and
          cropped by both side edges so it reads as continuing past them. The
          shaded trough is a band FOLLOWING the line rather than the whole
          silhouette shifted down; a shifted copy shows through wherever the two
          outlines diverge and comes out as pale streaks. */}
      <g data-ocean-layer="bed">
        <path d={art.floor.fill} fill={palette.bed} />
        <path d={art.floor.relief} fill={palette.bedShade} opacity={0.3} />
      </g>

      {/* Kelp rooted in the bed and cropped by the top edge — what replaces the
          two coral clumps. Blades first so the stipe sits INSIDE its own fringe
          rather than on top of it, then ink, then fill: the same grow-and-cover
          order the body uses, so a contour can never self-intersect. */}
      {art.kelps.map((k, i) => (
        <g key={i} data-ocean-layer="kelp">
          {k.leaves && <path d={k.leaves} fill={palette.kelpLeaf} />}
          <path d={k.ink} fill={palette.contour} />
          <path d={k.body} fill={palette.kelpStipe} />
        </g>
      ))}

      {/* Sea fans standing on the bed. BLADES, never clumps: a spray of separate
          tapered lines never closes at the top, which keeps it in the
          elongated-open class however tall it grows. A round head here is the
          coral clump with its base taken off. */}
      {art.fronds.map((f, i) => (
        <g key={i} data-ocean-layer="frond" fill={i % 2 === 0 ? palette.frond : palette.frondShade}>
          {f.blades.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </g>
      ))}

      {/* Coral polyps — a counted MASS of lobes under an eighth of a Fish each,
          on their own stalks so they read as growing out of the bed rather than
          as dots laid on it. */}
      {art.polyps.map((p, i) => (
        <g key={i} data-ocean-layer="polyp">
          <path d={p.stem} fill={palette.frondShade} />
          {p.lobes.map((l, k) => (
            <circle key={k} cx={l.cx} cy={l.cy} r={l.r} fill={palette.polyp} />
          ))}
          <circle cx={p.heart[0]} cy={p.heart[1]} r={p.lobes[0].r * 0.5} fill={palette.polypHeart} />
        </g>
      ))}
    </>
  );
});

export function UnderwaterBackdrop({ scene }: { scene: ReefScene }) {
  const { frame, art } = scene;
  return (
    // Full-viewport shell — fixed so the scene reads as the world behind the
    // Fish and bleeds under the safe-area insets; `overflow: hidden` clips the
    // bled edges, `zIndex: -1` parks it behind the Critter.
    <div
      className="underwater-backdrop"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      <svg
        viewBox={`0 0 ${frame.w} ${frame.h}`}
        // The viewBox aspect IS the viewport aspect, so `none` has nothing to
        // distort — it only guarantees an exact fill with no letterboxing.
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* The open water. Both stops are palette tokens and they are
            descendants of the layer hook, so the palette trace follows the
            gradient. */}
        <g data-ocean-layer="water">
          <linearGradient id="puffer-fish-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette.waterSurface} />
            <stop offset="1" stopColor={palette.water} />
          </linearGradient>
          <rect x="0" y="0" width={frame.w} height={frame.h} fill="url(#puffer-fish-water)" />
        </g>

        <ReefPlates scene={scene} />

        {/* Bubbles. The only moving thing in the background, tiny by rule (a
            bubble at Fish scale would be a second character) and slow — the
            cheapest literal "alive" the scene can buy, and the one that says
            "underwater" without drawing anything. They are the PAPER showing
            through, which is what a highlight is in this style. Opacity and
            transform only, so the app-root reduced-motion gate softens them. */}
        {art.bubbles.map((b, i) => (
          <motion.circle
            key={i}
            data-ocean-layer="bubble"
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill={palette.paper}
            opacity={0.75}
            animate={{ y: [0, -b.rise, 0], x: [0, b.rise * 0.12, 0] }}
            transition={{ duration: 9 + b.delay, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* The foreground reef — the repoussoir that turns two planes into
            three, and the strongest "this is a place" cue the scene has. It is
            CORNER-WEIGHTED rather than a band: a full-width fringe is one more
            horizontal stripe, and worse, it would sit across the middle of the
            bottom, which is exactly where a hand rests on a phone. A near mass
            may frame the stage; it may never cover it. */}
        {art.fore && (
          <g data-ocean-layer="fore">
            <path d={art.fore.base} fill={palette.foreReef} />
            {art.fore.blades.map((d, i) => (
              <path key={i} d={d} fill={i % 3 === 0 ? palette.foreReefShade : palette.foreReef} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
