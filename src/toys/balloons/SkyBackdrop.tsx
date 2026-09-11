import { memo } from 'react';
import { motion } from 'motion/react';
import { palette } from './palette';
import type { SkyScene } from './useSkyScene';

/**
 * The Up & Away sky — the code-drawn world behind the bunch (ADR-0002, all SVG;
 * ADR-0004, the Toy owns its scene assets locally). Every colour sources the
 * local `palette`, so there are no hardcoded colours here.
 *
 * WHAT THIS IS NOW, AND WHY. It used to be a flat sky rect, five `<circle>`
 * cloud puffs, a full-width grass path and a `<rect>` peg with an `<ellipse>`
 * cap. Nothing overlapped anything, nothing was cropped, every edge was
 * horizontal. The clouds were worse than inert: convex, closed, rounded and in
 * the cast's own size band — and in this Toy of all of them, because a puff is
 * not merely balloon-SIZED, it is balloon-SHAPED. `sky.ts` carries that argument
 * in full.
 *
 * ONE VIEWBOX, MATCHED TO THE VIEWPORT. The scene is composed into a `0 0 100 h`
 * box whose aspect equals the viewport's, so `preserveAspectRatio` has nothing
 * to correct and nothing is stretched or sliced. That replaces the old pair of
 * separately-positioned layers — a square `slice` sky over a `none`-stretched
 * ground band whose height was a `dvh` clamp — which agreed with each other on a
 * phone and came apart everywhere else, taking the peg out from under the bunch
 * with them.
 *
 * THE PAINT ORDER IS THE DEPTH ORDER, and every adjacent pair overlaps rather
 * than abutting. Back to front: sky, the cloud banks cropped into the top
 * corners, the far banks (each cropped by a side edge), the ground line, the
 * peg driven into it, the grass standing in front of the peg's foot, the drifting
 * motes, and the corner grass in front of everything.
 *
 * Layers keep their `data-sky-layer` hooks so tests address the composition
 * without coupling to which primitive draws each one. Decorative: `aria-hidden`
 * and `pointer-events: none`, so screen readers and presses fall straight
 * through to the balloons above.
 */

/**
 * Everything that depends only on the scene geometry.
 *
 * Memoized on the scene object, which the shared hook only replaces when the
 * viewport crosses an aspect bucket — so the several hundred blade and lobe
 * paths never re-run through the reconciler on the frames a balloon is being
 * held, swelling and re-pathing at 60fps.
 */
const SkyPlates = memo(function SkyPlates({ scene }: { scene: SkyScene }) {
  const { art } = scene;
  return (
    <>
      {/* The cloud banks. Each is anchored to a top corner, deepest at the side
          edge it enters from, and its underside is built from circular lobes
          with NOTCHES between them — which is what a cloud is. A smooth
          periodic curve there would read as a hill in the sky, and five
          circles read as five more balloons. The rim band FOLLOWS the scalloped
          edge rather than being the silhouette shifted up; a shifted copy shows
          through wherever the two outlines diverge and comes out as pale
          vertical streaks. */}
      {art.clouds.map((c, i) => (
        <g key={i} data-sky-layer="cloud">
          <path d={c.fill} fill={palette.cloud} />
          <path d={c.relief} fill={palette.cloudShade} />
        </g>
      ))}

      {/* Far banks. Each enters at a side edge and settles back to the ground
          line, so it is cropped rather than free-standing — and there are none
          at all on a phone, where the frame cannot hold one that clears the
          cast's size band alongside everything else. A wide viewport gets more
          sky SIDEWAYS. */}
      {art.banks.map((b, i) => (
        <g key={i} data-sky-layer="bank">
          <path d={b.fill} fill={palette.groundFar} />
          <path d={b.relief} fill={palette.groundShade} opacity={0.4} />
        </g>
      ))}

      {/* The ground line — the ONE shape allowed to cross the frame
          horizontally, and cropped by both side edges so it reads as continuing
          past them. Deliberately low: the tall sky above is this Toy's
          load-bearing space. */}
      <g data-sky-layer="ground">
        <path d={art.ground.fill} fill={palette.ground} />
        <path d={art.ground.relief} fill={palette.groundShade} opacity={0.3} />
      </g>

      {/* The peg the whole bunch is tied to — the scene's `tether`, drawn where
          the strings actually converge rather than at a hand-picked x that
          stretched with the viewport. Ink on both sides, then the fill on top. */}
      <g data-sky-layer="peg">
        <path d={art.peg.ink} fill={palette.contour} />
        <path d={art.peg.body} fill={palette.peg} />
      </g>

      {/* Grass tufts standing along the line, in front of the peg's foot so the
          stake reads as driven INTO something. BLADES, never clumps: a fan of
          separate tapered lines never closes at the top, which keeps it in the
          elongated-open class however tall it grows. A round clump here is a
          cloud puff that fell out of the sky. */}
      {art.tufts.map((t, i) => (
        <g key={i} data-sky-layer="tuft" fill={i % 2 === 0 ? palette.tuft : palette.tuftShade}>
          {t.blades.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </g>
      ))}
    </>
  );
});

export function SkyBackdrop({ scene }: { scene: SkyScene }) {
  const { frame, art } = scene;
  return (
    // Full-viewport shell — fixed so the scene reads as the world behind the
    // balloons and bleeds under the safe-area insets; `overflow: hidden` clips
    // the bled edges, `zIndex: -1` parks it behind the Critters.
    <div
      className="sky-backdrop"
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
        {/* The open sky: warm and low at the horizon, cool at the top of the
            frame — a real late-afternoon sky, and the direction the balloons are
            headed. THREE stops, not two: a browser blends a gradient along the
            straight sRGB line between its stops, and the straight line between
            two near-opposite hues passes through grey, which left the middle
            third of the frame — the band the whole bunch hangs in — dead. The
            rose stop bends the path the short way round. All three are palette
            tokens and they are descendants of the layer hook, so the palette
            trace follows the gradient. */}
        <g data-sky-layer="sky">
          <linearGradient id="balloons-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette.skyHigh} />
            <stop offset="0.52" stopColor={palette.skyMid} />
            <stop offset="1" stopColor={palette.sky} />
          </linearGradient>
          <rect x="0" y="0" width={frame.w} height={frame.h} fill="url(#balloons-sky)" />
        </g>

        <SkyPlates scene={scene} />

        {/* Seed fluff drifting up through the sky. The only moving thing in the
            background, tiny by rule (a mote at balloon scale would be a sixth
            character) and slow — the cheapest literal "alive" the scene can buy.
            Opacity and transform only, so the app-root reduced-motion gate
            softens it. */}
        {art.motes.map((m, i) => (
          <motion.circle
            key={i}
            data-sky-layer="mote"
            cx={m.cx}
            cy={m.cy}
            r={m.r}
            fill={palette.paper}
            opacity={0.7}
            animate={{ y: [0, -m.amp, 0], x: [0, m.amp * 0.4, 0] }}
            transition={{ duration: 9 + m.delay, delay: m.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* The foreground grass — the repoussoir that turns two planes into
            three, and the strongest "this is a place" cue the scene has. It is
            CORNER-WEIGHTED rather than a band: a full-width fringe is one more
            horizontal stripe, and worse, it would sit across the middle of the
            bottom, which is exactly where the peg is driven in and where a hand
            rests. A near mass may frame the stage; it may never cover it. */}
        {art.fore && (
          <g data-sky-layer="fore">
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
