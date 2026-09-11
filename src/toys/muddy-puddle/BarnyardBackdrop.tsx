import { memo } from 'react';
import { motion } from 'motion/react';
import { palette } from './palette';
import type { BarnyardScene } from './useBarnyardScene';

/**
 * The Muddy Puddle barnyard — the code-drawn world behind the cast (ADR-0002,
 * all SVG; ADR-0004, the Toy owns its scene assets locally). Every colour
 * sources the local `palette`, so there are no hardcoded colours here.
 *
 * WHAT THIS IS NOW, AND WHY. It used to be a flat sky rect, a gable-roofed barn
 * path, five `<rect>` fence posts, a grass band and two stacked `<ellipse>`s for
 * the pool. Nothing overlapped anything, nothing was cropped by the frame, every
 * edge was horizontal — the most inert composition available, and no amount of
 * texture rescues it. The barn and the puddle were worse than inert: both were
 * convex, closed and inside a Critter's own size band, so the background was
 * made of things a three-year-old has to sort from the thing they are meant to
 * touch. `barnyard.ts` carries that argument in full.
 *
 * ONE VIEWBOX, MATCHED TO THE VIEWPORT. The scene is composed into a
 * `0 0 100 h` box whose aspect equals the viewport's, so `preserveAspectRatio`
 * has nothing to correct and nothing is stretched or sliced. That replaces the
 * old stack of three separately-positioned layers — a square `slice` sky and two
 * `none`-stretched bands sharing a `--barnyard-floor` CSS length — which agreed
 * with each other on a phone and came apart at 16:10.
 *
 * THE PAINT ORDER IS THE DEPTH ORDER, and every adjacent pair overlaps rather
 * than abutting. Back to front: sky, the cropped barn, the far banks, the
 * trotting line, the fence standing on it, the straw, the pool, and the corner
 * clay in front of everything. Nothing in this stack meets its neighbour at a
 * shared edge — abutting is what made the old scene read as stripes.
 *
 * Layers keep their `data-barnyard-layer` hooks so tests address the composition
 * without coupling to which primitive draws each one. Decorative: `aria-hidden`
 * and `pointer-events: none`, so screen readers and the Wipe's own pointer
 * events fall straight through to the Critter above.
 */

/**
 * Everything that depends only on the scene geometry.
 *
 * Memoized on the scene object, which the shared hook only replaces when the
 * viewport crosses an aspect bucket — so the several hundred blade, post and
 * clod paths never re-run through the reconciler on the frames a Critter is
 * animating or a finger is dragging across the mud.
 */
const BarnyardPlates = memo(function BarnyardPlates({ scene }: { scene: BarnyardScene }) {
  const { art } = scene;
  return (
    <>
      {/* The barn — BEHIND everything, entering at the left edge and running off
          it, so the frame crops it. What is visible is one wall and one roof
          plane leaving the picture, which is what standing beside a barn looks
          like; the 20-unit gable icon it replaces was a building seen from far
          enough away to be an object you could pick up.

          The wall's top edge FOLLOWS the roofline. It was horizontal while the
          roof sloped, which left a widening wedge of sky between them — the roof
          hovering above the building rather than sitting on it. */}
      {art.barn && (
        <g data-barnyard-layer="barn">
          <path d={art.barn.ink} fill={palette.contour} />
          <path d={art.barn.wall} fill={palette.barn} />
          {/* The eave's own shadow, following the roofline it falls from. */}
          <path d={art.barn.shade} fill={palette.barnShade} opacity={0.45} />
          {/* Board seams — the evidence a hand drew the wall rather than filled
              a rectangle. Held well under the cast's contour weight. */}
          <g fill={palette.barnShade} opacity={0.55}>
            {art.barn.boards.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <path d={art.barn.roof} fill={palette.barnRoof} />
        </g>
      )}

      {/* Far banks. Each enters at a side edge and settles back to the trotting
          line, so it is cropped rather than free-standing — and there are none at
          all on a phone, where no bank that clears the cast's size band would fit
          inside the frame. A wide viewport gets more yard SIDEWAYS. */}
      {art.banks.map((b, i) => (
        <g key={i} data-barnyard-layer="bank">
          <path d={b.fill} fill={palette.fieldFar} />
          <path d={b.relief} fill={palette.fieldShade} opacity={0.4} />
        </g>
      ))}

      {/* The trotting line and the ground under it — the ONE shape allowed to
          cross the frame horizontally, and cropped by both side edges so it reads
          as continuing past them. The lit crest is a band FOLLOWING the line
          rather than the whole silhouette shifted up; a shifted copy shows
          through wherever the two outlines diverge and comes out as pale
          streaks. */}
      <g data-barnyard-layer="ground">
        <path d={art.ground.fill} fill={palette.field} />
        <path d={art.ground.relief} fill={palette.fieldShade} opacity={0.3} />
      </g>

      {/* The fence — posts and rails, both elongated and open, cropped by the
          right edge and ending at a post inside the frame. What it replaces was
          five identical uprights at fixed x: a row, which is the treeline's shape
          class however small its members are. Ink first, then fill, so a post
          sits inside its own outline. */}
      {art.fence && (
        <g data-barnyard-layer="fence">
          {art.fence.railInk.map((d, i) => (
            <path key={`rail-ink-${i}`} d={d} fill={palette.contour} />
          ))}
          {art.fence.rails.map((d, i) => (
            <path key={`rail-${i}`} d={d} fill={i === 0 ? palette.fence : palette.fenceShade} />
          ))}
          {art.fence.ink.map((d, i) => (
            <path key={`ink-${i}`} d={d} fill={palette.contour} />
          ))}
          {art.fence.posts.map((d, i) => (
            <path key={`post-${i}`} d={d} fill={i % 3 === 0 ? palette.fenceShade : palette.fence} />
          ))}
        </g>
      )}

      {/* Straw standing along the line. BLADES, never clumps: a fan of separate
          tapered lines never closes at the top, which keeps it in the
          elongated-open class however tall it grows. */}
      {art.straw.map((t, i) => (
        <g key={i} data-barnyard-layer="straw" fill={i % 2 === 0 ? palette.straw : palette.strawShade}>
          {t.blades.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </g>
      ))}

      {/* THE PUDDLE. At least 2.5 Critters wide and cut by the right edge, so it
          is never the tidy free-standing oval it used to be — which sat at 0.68
          of a Critter, squarely in the cast's own size band, while being the one
          thing on screen a Critter is meant to jump into.

          A PALE wet clay, which looks wrong written down and is forced: a dark
          pool under a dark-ink cast kills the contour exactly where the Toy most
          wants it seen, and the last Critter of every play lands in here. A thin
          wet film really is far lighter than the thick clod caked on the animal;
          they are the same substance at two thicknesses. */}
      {art.puddle && (
        <g data-barnyard-layer="puddle">
          <path d={art.puddle.fill} fill={palette.puddle} />
          <path d={art.puddle.rim} fill={palette.puddleShade} opacity={0.45} />
          <path d={art.puddle.sheen} fill={palette.puddleSheen} opacity={0.75} />
          {art.puddle.ripples.map((d, i) => (
            <path key={i} d={d} fill={palette.puddleShade} opacity={0.5} />
          ))}
        </g>
      )}
    </>
  );
});

export function BarnyardBackdrop({ scene }: { scene: BarnyardScene }) {
  const { frame, art } = scene;
  return (
    // Full-viewport shell — fixed so the scene reads as the world behind the
    // cast and bleeds under the safe-area insets; `overflow: hidden` clips the
    // bled edges, `zIndex: -1` parks it behind the Critter.
    <div
      className="barnyard-backdrop"
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
        {/* The open sky. Both stops are palette tokens and they are descendants
            of the layer hook, so the palette trace follows the gradient. */}
        <g data-barnyard-layer="sky">
          <linearGradient id="muddy-puddle-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette.skyHigh} />
            <stop offset="1" stopColor={palette.sky} />
          </linearGradient>
          <rect x="0" y="0" width={frame.w} height={frame.h} fill="url(#muddy-puddle-sky)" />
        </g>

        <BarnyardPlates scene={scene} />

        {/* Dust drifting over the yard. The only moving thing in the background,
            tiny by rule (a mote at Critter scale would be a sixth character) and
            slow — the cheapest literal "alive" the scene can buy. Opacity and
            transform only, so the app-root reduced-motion gate softens it. */}
        {art.motes.map((m, i) => (
          <motion.circle
            key={i}
            cx={m.cx}
            cy={m.cy}
            r={m.r}
            fill={palette.paper}
            opacity={0.7}
            animate={{ y: [0, m.amp, 0], x: [0, m.amp * 0.4, 0] }}
            transition={{ duration: 9 + m.delay, delay: m.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* The churned foreground clay — the repoussoir that turns two planes
            into three, and the strongest "you are standing in a yard" cue the
            scene has. CORNER-WEIGHTED rather than a band: a full-width fringe is
            one more horizontal stripe, and worse, it would sit across the middle
            of the bottom, which is exactly where a Critter is set down and where
            a child's hand rests for the whole length of a Wipe. A near mass may
            frame the stage; it may never cover it. */}
        {art.fore && (
          <g data-barnyard-layer="fore">
            <path d={art.fore.base} fill={palette.foreClay} />
            {art.fore.clods.map((c, i) => (
              <circle
                key={i}
                cx={c.cx}
                cy={c.cy}
                r={c.r}
                fill={i % 3 === 0 ? palette.foreClayShade : palette.foreClay}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
