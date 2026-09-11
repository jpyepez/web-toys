import { memo } from 'react';
import { motion } from 'motion/react';
import { palette } from './palette';
import type { MeadowScene } from './useMeadowScene';

/**
 * The Counting Sheep meadow — the code-drawn world behind the Sheep (ADR-0002,
 * all SVG; ADR-0004, the Toy owns its scene assets locally). Every colour
 * sources the local `palette`, so there are no hardcoded colours here.
 *
 * WHAT THIS IS NOW, AND WHY. It used to be a flat sky rect, four white cloud
 * clusters, two full-width hill paths and a lollipop tree. Nothing overlapped
 * anything, nothing was cropped by the frame, every edge was horizontal — the
 * most inert composition available, and no amount of texture rescues it. The
 * clouds and the tree were worse than inert: both were convex, closed and inside
 * the Sheep's own size band, and the clouds shared its colour class as well, so
 * the background was made of things a three-year-old has to sort from the thing
 * they are meant to tap. `meadow.ts` carries that argument in full.
 *
 * ONE VIEWBOX, MATCHED TO THE VIEWPORT. The scene is composed into a
 * `0 0 100 h` box whose aspect equals the viewport's, so `preserveAspectRatio`
 * has nothing to correct and nothing is stretched or sliced. That replaces the
 * old stack of three separately-positioned layers — a square `slice` sky, a
 * `none`-stretched ground band, an aspect-locked tree floated over a CSS length
 * — which agreed with each other on a phone and came apart at 16:10.
 *
 * THE PAINT ORDER IS THE DEPTH ORDER, and every adjacent pair overlaps rather
 * than abutting. Back to front: sky, sun, the bough that crops it, the far banks
 * (each cropped by a side edge), the walking line, the grass standing on it, and
 * the corner grass in front of everything. Nothing in this stack meets its
 * neighbour at a shared edge — abutting is what made the old scene read as
 * stripes.
 *
 * Layers keep their `data-meadow-layer` hooks so tests address the composition
 * without coupling to which primitive draws each one. Decorative: `aria-hidden`
 * and `pointer-events: none`, so screen readers and presses fall straight
 * through to the Sheep above.
 */

/**
 * Everything that depends only on the scene geometry.
 *
 * Memoized on the scene object, which the shared hook only replaces when the
 * viewport crosses an aspect bucket — so the several hundred blade and lobe
 * paths never re-run through the reconciler on the frames a Sheep is animating.
 */
const MeadowPlates = memo(function MeadowPlates({ scene }: { scene: MeadowScene }) {
  const { art } = scene;
  return (
    <>
      {/* The sun — BEHIND everything, so the bough and the banks crop it. A disc
          laid on top of the sky is a sticker; a disc the scene cuts into is a
          distance. It is the "one oversized cropped motif" direction, at 3x a
          Sheep — the size band the clouds it replaces sat squarely inside. */}
      {art.sun && (
        <circle
          data-meadow-layer="sun"
          cx={art.sun.cx}
          cy={art.sun.cy}
          r={art.sun.r}
          fill={palette.sun}
        />
      )}

      {/* The bough cropping into a top corner — what replaces the lollipop tree.
          Leaves first so the limb sits INSIDE its own foliage rather than on top
          of it, then ink, then fill: the same grow-and-cover order the fleece
          uses, so a contour can never self-intersect. */}
      {art.bough && (
        <g data-meadow-layer="bough">
          {art.bough.leaves && <path d={art.bough.leaves} fill={palette.boughLeaf} />}
          <path d={art.bough.ink} fill={palette.contour} />
          <path d={art.bough.body} fill={palette.bough} />
        </g>
      )}

      {/* Far banks. Each enters at a side edge and settles back to the walking
          line, so it is cropped rather than free-standing — and there are none
          at all on a phone, where no bank that clears the cast's size band would
          fit inside the frame. A wide viewport gets more meadow SIDEWAYS. */}
      {art.banks.map((b, i) => (
        <g key={i} data-meadow-layer="bank">
          <path d={b.fill} fill={palette.bankFar} />
          <path d={b.relief} fill={palette.bankShade} opacity={0.4} />
        </g>
      ))}

      {/* The walking line and the ground under it — the ONE shape allowed to
          cross the frame horizontally, and cropped by both side edges so it
          reads as continuing past them. The lit crest is a band FOLLOWING the
          line rather than the whole silhouette shifted up; a shifted copy shows
          through wherever the two outlines diverge and comes out as pale
          streaks. */}
      <g data-meadow-layer="ground">
        <path d={art.ground.fill} fill={palette.bankNear} />
        <path d={art.ground.relief} fill={palette.bankShade} opacity={0.3} />
      </g>

      {/* Grass tufts standing along the line. BLADES, never clumps: a fan of
          separate tapered lines never closes at the top, which keeps it in the
          elongated-open class however tall it grows. A round clump here is the
          lollipop tree's crown with the trunk taken off. */}
      {art.tufts.map((t, i) => (
        <g key={i} data-meadow-layer="tuft" fill={i % 2 === 0 ? palette.tuft : palette.tuftShade}>
          {t.blades.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </g>
      ))}

      {/* Wildflowers — a counted MASS of lobes under an eighth of a Sheep each,
          on their own stems so they read as growing out of the field rather than
          as dots laid on it. */}
      {art.flowers.map((f, i) => (
        <g key={i} data-meadow-layer="flower">
          <path d={f.stem} fill={palette.tuftShade} />
          {f.lobes.map((l, k) => (
            <circle key={k} cx={l.cx} cy={l.cy} r={l.r} fill={palette.flower} />
          ))}
          <circle cx={f.heart[0]} cy={f.heart[1]} r={f.lobes[0].r * 0.5} fill={palette.flowerHeart} />
        </g>
      ))}
    </>
  );
});

export function MeadowBackdrop({ scene }: { scene: MeadowScene }) {
  const { frame, art } = scene;
  return (
    // Full-viewport shell — fixed so the scene reads as the world behind the
    // Sheep and bleeds under the safe-area insets; `overflow: hidden` clips the
    // bled edges, `zIndex: -1` parks it behind the Critter.
    <div
      className="meadow-backdrop"
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
        <g data-meadow-layer="sky">
          <linearGradient id="counting-sheep-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette.skyHigh} />
            <stop offset="1" stopColor={palette.sky} />
          </linearGradient>
          <rect x="0" y="0" width={frame.w} height={frame.h} fill="url(#counting-sheep-sky)" />
        </g>

        <MeadowPlates scene={scene} />

        {/* Seed fluff. The only moving thing in the background, tiny by rule (a
            mote at Sheep scale would be a second character) and slow — the
            cheapest literal "alive" the scene can buy. Opacity and transform
            only, so the app-root reduced-motion gate softens it. */}
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

        {/* The foreground grass — the repoussoir that turns two planes into
            three, and the strongest "this is a place" cue the scene has. It is
            CORNER-WEIGHTED rather than a band: a full-width fringe is one more
            horizontal stripe, and worse, it would sit across the middle of the
            bottom, which is exactly where the Sheep stands and where a hand
            rests. A near mass may frame the stage; it may never cover it. */}
        {art.fore && (
          <g data-meadow-layer="fore">
            <path d={art.fore.base} fill={palette.foreGrass} />
            {art.fore.blades.map((d, i) => (
              <path key={i} d={d} fill={i % 3 === 0 ? palette.foreGrassShade : palette.foreGrass} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
