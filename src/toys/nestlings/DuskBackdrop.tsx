import { memo, useId } from 'react';
import { motion } from 'motion/react';
import { blob, contourRing, crescent, quadPts, taperedOutline } from '../../shell/art/geometry';
import { disorder, line as houseLine } from '../../shell/art/house';
import { stream } from '../../shell/art/rng';
import { palette } from './palette';
import type { CanopyScene } from './useCanopyScene';

/**
 * The nest, built from the same primitives as the Critters.
 *
 * It used to be uniform `stroke`s and un-jittered arcs — the original
 * construction, left untouched while the cast was rebuilt around it. That is
 * what made the scene read as two different styles: the birds had a
 * variable-width contour, jittered silhouettes and derived occlusion, and the
 * nest three feet away had none of it.
 *
 * Its own branch is GONE. The nest used to carry a limb of its own, drawn inside
 * its aspect-locked layer, while the scene drew another one across the full
 * width — two branches at two scales in the same picture. The nest is now
 * cradled in the canopy's bough, which is a real limb crossing the frame, so it
 * needs no branch of its own.
 *
 * Computed once at module scope. Nothing here may recompute while a bird is
 * being dragged.
 */
const NEST = (() => {
  const rnd = stream(4271, 'nestlings-scene');
  const branchY = 96;
  const cx = 100;
  const cy = 68;
  const w = 92;
  const h = 46;
  const contour = houseLine.contour * 1.05;

  const bowl = blob(cx, cy, w / 2, h / 2, disorder.blobAmp * 0.8, rnd, 24);
  const rim = blob(cx, cy - h * 0.42, w / 2.45, h * 0.17, disorder.blobAmp, rnd, 18);

  /*
   * The weave CROSSES. Parallel strands spanning the bowl at even heights read
   * as a stack of discs no matter how they are coloured — which is exactly what
   * the first two attempts produced. Real woven twigs lie at opposing angles and
   * do not each span the full width, so each strand here is shorter than the
   * bowl, offset along it, and tilted against its neighbour.
   */
  const weaves: Array<{ d: string; light: boolean }> = [];
  for (let i = 0; i < 7; i++) {
    const t = (i + 0.5) / 7;
    const y = cy - h * 0.2 + t * h * 0.6;
    const norm = (y - cy) / (h * 0.6);
    const span = w * 0.44 * Math.sqrt(Math.max(0.06, 1 - norm * norm));
    const dir = i % 2 === 0 ? 1 : -1;
    const tilt = dir * (2.5 + rnd() * 3.5);
    // Each strand covers 55-80% of the available span, placed off-centre, so no
    // two terminate on the same vertical.
    const frac = 0.55 + rnd() * 0.25;
    const mid = cx + (rnd() - 0.5) * span * 0.5;
    const x0 = mid - span * frac;
    const x1 = mid + span * frac;
    weaves.push({
      d: taperedOutline(
        quadPts([x0, y + tilt], [mid, y + tilt * 0.2 + h * 0.05], [x1, y - tilt], 12),
        3.4,
        0.5,
      ),
      light: i % 2 === 0,
    });
  }

  const twigs: string[] = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const ang = -Math.PI * (0.08 + t * 0.84) + (rnd() - 0.5) * 0.22;
    const len = 15 * (0.55 + rnd() * 0.9);
    const ox = cx + Math.cos(ang) * w * 0.44;
    const oy = cy - h * 0.1 + Math.sin(ang) * h * 0.3;
    twigs.push(
      taperedOutline(
        quadPts([ox, oy], [ox + Math.cos(ang) * len * 0.5, oy + Math.sin(ang) * len * 0.5 - 2], [ox + Math.cos(ang) * len, oy + Math.sin(ang) * len], 8),
        2.4,
        0.28,
      ),
    );
  }

  return {
    bowl,
    bowlInk: contourRing(bowl.pts, contour, houseLine.taper, houseLine.wobble, stream(4271, 'bowl')),
    rim,
    rimInk: contourRing(rim.pts, contour * 0.8, houseLine.taper, houseLine.wobble, stream(4271, 'rim')),
    weaves,
    twigs,
    seat: crescent(cx, branchY - 7, w * 0.36, 0.8, 0.2),
    /** Where the bowl's underside sits in this viewBox, so the layer can be
     *  placed with its nest ON the bough rather than near it. */
    bottom: cy + h / 2 + contour,
    /** The opening's centre height, so a bird can be sat IN the bowl. */
    rimCy: cy - h * 0.42,
    inner: crescent(cx, cy - h * 0.18, w * 0.5, 0.62, 0.5),
    lip: crescent(cx, cy - h * 0.44, w * 0.47, 0.78, 0.3),
  };
})();

/**
 * The first stars of the settle Outro (slice #5) — a scatter of glints twinkled
 * into the upper dusk sky (viewBox 0..100) once `night` falls. `delay` staggers
 * the twinkle so they don't blink in unison; `r` varies the glint size. Kept in
 * the upper-mid band so the deepening sky reads as filling with stars above the
 * sleeping nest, never down in the reachable lower zone. Positions/sizes are
 * on-device-tuned per the slice DoD, not a unit-asserted contract.
 */
const STARS = [
  { cx: 18, cy: 14, r: 0.9, delay: 0 },
  { cx: 34, cy: 9, r: 0.7, delay: 0.5 },
  { cx: 52, cy: 16, r: 1.0, delay: 0.2 },
  { cx: 69, cy: 11, r: 0.7, delay: 0.7 },
  { cx: 83, cy: 19, r: 0.9, delay: 0.35 },
  { cx: 26, cy: 26, r: 0.6, delay: 0.9 },
  { cx: 61, cy: 28, r: 0.7, delay: 0.6 },
  { cx: 90, cy: 33, r: 0.6, delay: 1.1 },
] as const;

/**
 * The settle & sleep Outro's duration (ms) — how long the whole nestful takes to
 * deepen to night, twinkle the first stars in, and bob to sleep on the terminal
 * placement (slice #5). The registry wires this to its `winDelayMs` field (slice
 * #8) so the Shell HOLDS the Completion dialogue for this beat rather than
 * landing it on a mid-settle frame — the analog of Balloons' `FLOAT_AWAY_MS` /
 * Counting Sheep's exit. The exact value is on-device-tuned per the slice DoD
 * (the kid-handoff "lands WITH the confetti, dialogue arrives after the beat"
 * check); the contract is only that it exists and holds the beat, never the ms.
 */
export const SETTLE_MS = 2400;



/**
 * The nest's width in bird-widths. The scene's unit is a bird, not the viewport
 * — a nest sized in `vw` is two and a half fledglings wide on a phone and a
 * saucer on a desktop.
 */
const NEST_BIRDS = 2.6;

/**
 * The canopy plates — everything that depends only on the scene geometry.
 *
 * Memoized on the scene object, which the shared hook only replaces when the
 * viewport crosses an aspect bucket. `hovered` and `placedCount` change on the
 * exact frames a child is moving a bird, and re-running several hundred lobe
 * arcs through the reconciler on those frames is the one thing this backdrop
 * must never do.
 */
const CanopyPlates = memo(function CanopyPlates({ scene }: { scene: CanopyScene }) {
  const { art } = scene;
  return (
    <>
      {/* The moon — BEHIND the foliage, so the canopy crops it. A disc laid on
          top of the sky is a sticker; a disc the leaves cut into is a distance.
          It is the "single oversized cropped motif" direction, absorbed into the
          canopy rather than competing with it. */}
      {art.moon && (
        <circle cx={art.moon.cx} cy={art.moon.cy} r={art.moon.r} fill={palette.moon} />
      )}

      {/* The ceiling, then its shaded rim ON TOP — the rim is a band following
          the scalloped underside, so it only reads if it is painted after the
          mass it sits on. Light comes from the moon and every element obeys
          that one direction; the scene this replaces had no occlusion at all. */}
      <path d={art.ceiling.fill} fill={palette.foliage} />
      <path d={art.ceiling.relief} fill={palette.foliageShade} opacity={0.55} />

      {/* Hanging masses — the nearer plane, overlapping the ceiling and each
          other. That overlap IS the depth; there is no horizon anywhere in this
          scene, which is what stops it reading as stripes. */}
      {art.masses.map((m, i) => (
        <g key={i}>
          <path d={m.fill} fill={palette.foliageNear} />
          <path d={m.relief} fill={palette.foliageShade} opacity={0.5} />
        </g>
      ))}

      {/* Perch limbs. Foliage first so the limb sits INSIDE its own leaves
          rather than on top of them, then ink, then fill — the same
          grow-and-cover order the nest uses, so a contour can never
          self-intersect. */}
      {art.limbs.map((l, i) => (
        <g key={i}>
          {l.leaves && <path d={l.leaves} fill={palette.foliageNear} />}
          <path d={l.ink} fill={palette.contour} />
          {l.twigs.map((d, k) => (
            <path key={k} d={d} fill={palette.branch} />
          ))}
          <path d={l.body} fill={palette.limb} />
        </g>
      ))}

      {/* The bough the nest is cradled in — cropped by both side edges, so it
          continues past the frame and is never an object to count. It carries
          the `branch` hook: it IS the branch, and the pinstripe that used to
          span the frame at a fixed height is gone. */}
      {art.bough.leaves && <path d={art.bough.leaves} fill={palette.foliageNear} />}
      <path d={art.bough.ink} fill={palette.contour} />
      <path data-dusk-layer="branch" d={art.bough.body} fill={palette.branch} />

      {/* The understory: the cropped near foliage in the two bottom corners, and
          the bottom-anchored band this scene stands on (ADR-0005). It is the
          third plane — the single strongest "this is a place" cue — and it is
          corner-weighted precisely so it frames the nest's drop zone and never
          covers it. */}
      {art.understory && (
        <path data-dusk-layer="ground" d={art.understory.fill} fill={palette.understory} />
      )}
    </>
  );
});

/**
 * The nest, as bare SVG content in its own 200x120 box — no `<svg>` wrapper, no
 * sizing — so it can be dropped into any viewBox at any scale.
 *
 * Extracted so the Home Card can draw the REAL nest. The Card used to carry a
 * hand-simplified stand-in built from `<ellipse>`s and a dozen `stroke`d arcs,
 * which is both constructions this file was rebuilt away from, sitting on a Card
 * whose scene is now generated and contoured. Two hand-maintained drawings of one
 * object cannot be kept in agreement; one figure rendered at two sizes cannot
 * fall out of step.
 */
export function NestFigure() {
  // Per-instance, so a Card and a live scene on one page never share a clip.
  const uid = useId().replace(/:/g, '');
  return (
    <>
      <path d={NEST.seat} fill={palette.nestShadow} opacity={0.6} />

      <path d={NEST.bowlInk} fill={palette.contour} fillRule="evenodd" />
      <path d={NEST.bowl.d} fill={palette.nest} />

      <clipPath id={`nestlings-bowl-clip-${uid}`}>
        <path d={NEST.bowl.d} />
      </clipPath>
      <g clipPath={`url(#nestlings-bowl-clip-${uid})`}>
        <path d={NEST.inner} fill={palette.nestShadow} opacity={0.55} />
        {/* Alternating light and shadow strands, so the crossing reads as depth
            rather than as a pattern of stripes. */}
        {NEST.weaves.map((strand, i) => (
          <path
            key={i}
            d={strand.d}
            fill={strand.light ? palette.nestRim : palette.nestShadow}
            opacity={strand.light ? 0.9 : 0.5}
          />
        ))}
      </g>

      <g fill={palette.branch}>
        {NEST.twigs.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      <path d={NEST.rimInk} fill={palette.contour} fillRule="evenodd" />
      {/* The opening carries the `data-dusk-layer="nest"` hook — slice #3 reads
          its rect for the measured drop zone. Filled with the SHADOW colour: a
          bowl seen from slightly above shows a dark interior, and filling it
          light turns the nest into a covered dish. */}
      <path data-dusk-layer="nest" d={NEST.rim.d} fill={palette.nestShadow} />
      <path d={NEST.lip} fill={palette.nestRim} opacity={0.9} />
    </>
  );
}

/** Where the bowl's underside and its opening sit in the 200x120 nest box, so a
 *  consumer can place the nest on a bough and a bird inside the bowl without
 *  re-deriving either. */
export const NEST_BOX = { w: 200, h: 120, bottom: NEST.bottom, rimCx: 100, rimCy: NEST.rimCy };

/**
 * The Nestlings dusk backdrop — the code-drawn world behind the fledgling
 * Critters (ADR-0002, all SVG; ADR-0004, the Toy owns its scene assets
 * locally). Every colour sources the local dusk `palette`, so there are no
 * hardcoded HSLs here.
 *
 * WHAT THIS IS NOW, AND WHY. It used to be three horizontal stripes — a flat
 * sky, a halftone dome, a grass band — plus a full-width pinstripe branch.
 * Nothing overlapped anything, nothing was cropped by the frame, every edge was
 * horizontal; that is the most inert composition available and no amount of
 * texture rescues it. Worse, it contradicted itself: a nest on a branch directly
 * above a flat field, both at the same depth, so the picture could not say
 * whether you were up a tree or standing in a meadow.
 *
 * The camera is now INSIDE the canopy, and the scene is built only from shape
 * classes that cannot be mistaken for a fledgling — limbs, boughs and foliage
 * mass, with no crowns anywhere. `canopy.ts` carries that argument in full.
 *
 * ONE VIEWBOX, MATCHED TO THE VIEWPORT. The scene is composed into a
 * `0 0 100 h` box whose aspect equals the viewport's, so `preserveAspectRatio`
 * has nothing to correct and nothing is stretched or sliced. That replaces the
 * old stack of separately-positioned layers (a `none`-stretched ground band, a
 * screen-space halftone, an aspect-locked nest floated over a CSS length), which
 * agreed with each other on a phone and came apart at 16:10.
 *
 * Layers keep their `data-dusk-layer` hooks so tests address the composition
 * without coupling to which primitive draws each one. Decorative: every SVG is
 * `aria-hidden` and `pointer-events: none` so screen readers and presses fall
 * straight through to the Critters above.
 */
export function DuskBackdrop({
  scene,
  night = false,
  hovered = false,
  placedCount = 0,
}: {
  /** The shared canopy geometry — the same object the cast reads its perches
   *  from, so the birds stand on the limbs that are actually drawn. */
  scene: CanopyScene;
  /**
   * The settle & sleep Outro flag (slice #5). Off during play; flipped true on
   * the terminal placement so the whole nestful goes to sleep — the dusk deepens
   * toward night and the first stars twinkle in. Reflected to `data-dusk-night`
   * so the Outro state is observable at the value boundary.
   */
  night?: boolean;
  /**
   * Whether a carried bird is currently hovering over the nest's drop zone. While
   * true the nest swells a touch — a "yes, drop it here" nudge for the child. A
   * transform cue, so the root `reducedMotion="user"` gate softens it.
   */
  hovered?: boolean;
  /**
   * How many birds have been tucked in so far. Each increment plays a subtle
   * one-shot glow pulse around the rim — the nest's own quiet "caught it" beat.
   */
  placedCount?: number;
}) {
  const { frame, art, birdW } = scene;
  // The nest is drawn in its own 200x120 box; `NEST.bottom` is where the bowl's
  // underside sits in it. Sizing the layer as a multiple of a BIRD (rather than
  // as a `vw` clamp) is what keeps "a nest is about two and a half fledglings
  // wide" true at every aspect, and placing it from the bough's own top edge is
  // what makes it read as cradled rather than as balanced on a line.
  const nestW = birdW * NEST_BIRDS;
  const nestH = nestW * (120 / 200);
  const nestTop = art.bough.top - nestH * (NEST.bottom / 120);

  return (
    // Full-viewport shell — fixed so the scene reads as the world behind the
    // birds and bleeds under the safe-area insets; `overflow: hidden` clips the
    // bled edges, `zIndex: -1` parks it behind the Critters.
    <div
      className="dusk-backdrop"
      data-dusk-night={night}
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
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {/* The dusk sky — what is LEFT OVER between the foliage, not a field
            with things standing on it. That inversion is why the frame stops
            reading as empty: the sky is now glimpsed through sky-holes. Both
            stops are palette tokens, and they are descendants of the layer hook
            so the palette trace follows the gradient. */}
        <g data-dusk-layer="sky">
          <linearGradient id="nestlings-dusk-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette.skyDeep} />
            <stop offset="1" stopColor={palette.sky} />
          </linearGradient>
          <rect x="0" y="0" width={frame.w} height={frame.h} fill="url(#nestlings-dusk-sky)" />
        </g>

        <CanopyPlates scene={scene} />

        {/* Seed fluff. The only moving thing in the background, tiny by rule (a
            mote at bird scale would be a sixth character) and slow — the
            cheapest literal "alive" the scene can buy. Opacity and transform
            only, so the app-root reduced-motion gate softens it. */}
        {art.motes.map((m, i) => (
          <motion.circle
            key={i}
            cx={m.cx}
            cy={m.cy}
            r={m.r}
            fill={palette.moon}
            opacity={0.7}
            animate={{ y: [0, m.amp, 0], x: [0, m.amp * 0.4, 0] }}
            transition={{
              duration: 9 + m.delay,
              delay: m.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* The settle Outro's night deepen (slice #5) — a wash over the whole
            scene once `night` falls. Opacity-only, so it SURVIVES the app-root
            `reducedMotion="user"` gate: under reduced motion the sky still
            arrives deepened and the scene reads as finished, not broken. */}
        {night && (
          <motion.rect
            x="0"
            y="0"
            width={frame.w}
            height={frame.h}
            fill={palette.night}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.82 }}
            transition={{ duration: SETTLE_MS / 1000, ease: 'easeInOut' }}
          />
        )}

        {/* The first stars — drawn AFTER the wash so they glint on top of it.
            Authored in the old 0..100 square, so they are scaled onto the
            current frame's upper band rather than assuming its height. */}
        {night &&
          STARS.map(({ cx, cy, r, delay }, i) => (
            <motion.circle
              key={i}
              cx={cx}
              cy={(cy / 100) * frame.h}
              r={r}
              fill={palette.sparkle}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.55, 1] }}
              transition={{
                duration: 2.4,
                delay,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            />
          ))}
      </svg>

      {/* The nest — aspect-LOCKED in its own SVG so it never stretches, and
          placed from the bough's measured top edge. Percentages of the frame, so
          it tracks the same geometry everything else is built from. */}
      <svg
        viewBox="0 0 200 120"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: `${50 - nestW / 2}%`,
          top: `${(nestTop / frame.h) * 100}%`,
          width: `${nestW}%`,
          height: 'auto',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        {/* Every line here is a filled tapered path. There is no `stroke` in
            this layer — a uniform vector stroke is the loudest clip-art tell,
            and it was the thing that made the nest read as a different style
            from the birds standing next to it. */}
        <motion.g
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
        >
          <NestFigure />
          {/* One-shot rim pulse, keyed on the tally so each placement replays it. */}
          <motion.path
            key={placedCount}
            d={NEST.rimInk}
            fill={palette.sparkle}
            initial={{ opacity: placedCount > 0 ? 0.85 : 0 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </motion.g>
      </svg>
    </div>
  );
}
