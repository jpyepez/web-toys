/**
 * The scene mode — nest, branch, treeline and ground, on the same canvas as the
 * bird.
 *
 * WHY IT EXISTS. The cast got rebuilt out of the house primitives and the scene
 * did not, so the app ended up speaking two construction languages at once: the
 * bird had contours, jittered silhouettes, occlusion and derived colour, while
 * the nest was still uniform vector strokes and un-jittered arcs. Texture was
 * added to the backdrop later, which made it a third language rather than
 * resolving it into one.
 *
 * Cohesion is a COMPARATIVE judgement, and it cannot be made from separate
 * screens — so everything here renders into the bird's own viewBox, at true
 * relative size, and the knobs that matter are the RATIOS between scenery and
 * cast rather than the absolute values of either.
 *
 * THE RULES, hardcoded because they are what "cohesive" means here:
 *  - Scenery is built from the same primitives as the cast. There is no `stroke`
 *    in this file: a line is a tapered filled path, exactly as it is on a bird.
 *  - Occlusion at every junction — inside the nest bowl, under the branch, at
 *    the foot of the treeline. Same `shade()` formula, never black.
 *  - Atmospheric perspective is arithmetic, not taste: distance costs chroma and
 *    contrast and pulls hue toward the sky.
 *  - The figure outranks the ground. Scenery chroma and contour weight are
 *    expressed as FRACTIONS of the cast's, so the hierarchy cannot silently
 *    invert the way it did when the nest was the best-drawn object on screen.
 */

import {
  blob,
  contourRing,
  crescent,
  polygonPath,
  quadPts,
  ribbon,
  taperedOutline,
  type Pt,
} from '../shell/art/geometry';
import { hex, shade, tint, type Oklch } from '../shell/art/oklch';
import { stream } from '../shell/art/rng';
import type { Config } from './config';

/** Everything the scene paints with, derived from ONE field lightness. */
export function sceneColours(cfg: Config) {
  const { scene, scenery, shading } = cfg;
  const dark = cfg.mode.ground === 'dark';
  const L = scenery.fieldLightness;
  // Chroma is a fraction of the cast's, so the ground never bids for salience
  // against the thing the child is meant to grab.
  const c = (base: number) => base * scenery.chromaRatio;

  // Mood lives in HUE; separation lives in LIGHTNESS. A warm violet field at high
  // lightness reads as evening light rather than as night — which is how the dusk
  // survives a light ground.
  const field: Oklch = { l: L, c: c(scene.sky.c), h: scene.sky.h };
  // The ground band always steps AWAY from the cast, never toward it.
  const groundL = dark
    ? Math.max(0.06, L - scene.groundDl * 0.5)
    : Math.min(0.99, L - scene.groundDl * 0.35);
  const ground: Oklch = {
    l: groundL,
    c: c(scene.sky.c * 1.2),
    h: (scene.sky.h + scene.groundHueRotate + 360) % 360,
  };

  // The screen ink stays close to its own field: a bird's contrast is measured
  // against the DOTS it actually overlaps, not the field's average.
  const glow: Oklch = {
    l: dark ? L + scenery.halftone.inkDl : L - scenery.halftone.inkDl,
    c: c(scene.sky.c * 2.4),
    h: (scene.sky.h + 150) % 360,
  };

  const branch: Oklch = dark
    ? { l: Math.min(0.95, groundL + 0.2), c: c(0.09), h: 50 }
    : { l: Math.max(0.1, groundL - 0.2), c: c(0.09), h: 50 };
  const nest: Oklch = dark
    ? { l: Math.min(0.95, groundL + 0.28), c: c(0.135), h: 68 }
    : { l: Math.max(0.1, groundL - 0.13), c: c(0.135), h: 68 };

  const occ = (base: Oklch, extra = 0) =>
    shade(base, { dl: shading.occlusionDl + extra, hueRotate: shading.occlusionHueRotate, dc: shading.occlusionDc });

  return {
    fieldOklch: field,
    groundOklch: ground,
    glowOklch: glow,
    field: hex(field),
    ground: hex(ground),
    glow: hex(glow),
    branch: hex(branch),
    branchShade: hex(occ(branch, 0.04)),
    nest: hex(nest),
    nestRim: hex(tint(nest, { dl: dark ? 0.14 : -0.14, hueRotate: 6 })),
    nestShade: hex(occ(nest, 0.07)),
    motif: hex({
      l: dark ? Math.min(0.97, L + 0.2) : Math.max(0.05, L - 0.07),
      c: c(scene.sky.c * 1.6),
      h: (scene.sky.h + 60) % 360,
    }),
    contour: hex(cfg.ink),
  };
}

export function SceneLayers({ cfg, uid, viewW, viewH }: { cfg: Config; uid: string; viewW: number; viewH: number }) {
  const col = sceneColours(cfg);
  const { scenery, line, disorder, mode } = cfg;
  const rnd = stream(cfg.seed, 'scene');

  // THE hierarchy knob. A contour is how much a thing asserts itself; give the
  // nest the bird's weight and the nest becomes the subject.
  const sceneContour = line.width * scenery.contourRatio;
  const contoured = mode.sceneryLine === 'contour' && sceneContour > 0.05;
  const ring = (pts: readonly Pt[], w: number, name: string) =>
    contourRing(pts, w, line.taper, line.wobble, stream(cfg.seed, name));

  const horizon = scenery.horizon;
  const bg = mode.background;

  /*
   * Ten bands is enough that the banding itself is invisible. Cell size is the
   * knob that matters: below ~3 units the screen fuses into flat tone and you
   * have paid for a halftone and got a solid; above ~10 the dots become
   * countable objects, which is the failure this whole background replaces.
   */
  const cell = scenery.halftone.cell;
  const bands = Math.max(1, Math.round(scenery.halftone.bands));
  const glowTop = horizon - horizon * scenery.halftone.extent;
  const glowBands = Array.from({ length: bands }, (_, i) => {
    const t = (i + 0.5) / bands;
    return {
      id: `glow-${uid}-${i}`,
      y0: glowTop + (horizon - glowTop) * (i / bands),
      y1: glowTop + (horizon - glowTop) * ((i + 1) / bands),
      r: 0.12 + t * t * (cell * 0.42 - 0.12),
    };
  });

  const groundBlob = blob(viewW / 2, horizon + (viewH - horizon) + 6, viewW * 0.85, viewH - horizon + 10, 0.02, rnd, 20);

  /* --- the branch: a limb, not a lens ---------------------------------- */
  const branchY = horizon + scenery.branch.drop;
  const branchPts = quadPts(
    [-8, branchY - scenery.branch.sag],
    [viewW / 2, branchY + scenery.branch.sag],
    [viewW + 8, branchY - scenery.branch.sag * 0.6],
    22,
  );
  const bPhase = rnd() * Math.PI * 2;
  /*
   * Width stays FULL at both frame edges — the limb continues past them. It was
   * built with `taperedOutline`, which narrows to a point at each end, so it
   * came to a needle at both edges and read as a painted stripe. The slow
   * undulation is what separates a limb from a machined bar.
   */
  const half = (t: number) =>
    (scenery.branch.thickness / 2) * (0.84 + 0.16 * Math.sin(t * Math.PI * 3.2 + bPhase));
  const branchOutline = ribbon(branchPts, half, (t) => half(t) * 0.88);
  const branchPath = polygonPath(branchOutline);
  // The contour is the SAME ribbon, grown — heavier underneath, exactly as
  // `contourRing` weights a critter's. Growing the real outline can't
  // self-intersect the way ringing a doubled-back centreline does.
  const branchContourPath = polygonPath(
    ribbon(
      branchPts,
      (t) => half(t) + sceneContour * 0.95,
      (t) => half(t) * 0.88 + sceneContour * 0.42,
    ),
  );
  // A small offshoot, because a limb that is one smooth sweep edge to edge reads
  // as a rule drawn across the picture.
  const twigStart: Pt = branchPts[Math.round(branchPts.length * 0.22)];
  const twigPts = quadPts(
    twigStart,
    [twigStart[0] - viewW * 0.05, twigStart[1] - 5],
    [twigStart[0] - viewW * 0.1, twigStart[1] - 8.5],
    10,
  );
  // Ink first at a larger width, fill on top — the same "grow it and cover the
  // inside" trick the treeline uses, instead of the `scale` transform hack that
  // was here, which shifted the outline off the shape it was outlining.
  const offshoot = taperedOutline(twigPts, scenery.branch.thickness * 0.5, 0.15);
  const offshootInk = taperedOutline(
    twigPts,
    scenery.branch.thickness * 0.5 + sceneContour * 1.5,
    0.15,
  );

  /* --- the nest: a bowl, a rim, a counted weave, differentiated twigs --- */
  const nestCx = scenery.nest.x;
  const nestCy = branchY - scenery.nest.height * 0.34;
  const bowl = blob(nestCx, nestCy, scenery.nest.width / 2, scenery.nest.height / 2, disorder.blobAmp * 0.8, rnd, 22);
  const rim = blob(nestCx, nestCy - scenery.nest.height * 0.32, scenery.nest.width / 2.08, scenery.nest.height * 0.2, disorder.blobAmp, rnd, 18);

  // Counted, on a jittered grid — texture in this tradition is countable, never
  // a random scatter. Each weave is a tapered fill so it swells and thins.
  const weaves: string[] = [];
  for (let i = 0; i < scenery.nest.weaveCount; i++) {
    const t = (i + 0.5) / scenery.nest.weaveCount;
    const y = nestCy - scenery.nest.height * 0.22 + t * scenery.nest.height * 0.62;
    // Each strand spans the bowl's width AT ITS OWN HEIGHT, so the weave
    // follows the form instead of lying across it. Parallel full-width strands
    // read as a stack of discs, which is what the first pass produced.
    const norm = (y - nestCy) / (scenery.nest.height * 0.62);
    const halfW = scenery.nest.width * 0.46 * Math.sqrt(Math.max(0.06, 1 - norm * norm));
    const jx = (rnd() - 0.5) * scenery.nest.width * 0.06;
    const sag = scenery.nest.height * (0.05 + rnd() * 0.05);
    weaves.push(
      taperedOutline(
        quadPts(
          [nestCx - halfW + jx, y],
          [nestCx + jx * 0.5, y + sag],
          [nestCx + halfW + jx, y - (rnd() - 0.5) * 1.2],
          12,
        ),
        scenery.nest.weaveWeight,
        0.5,
      ),
    );
  }

  // Twigs: every one a different length and angle. A fan of identical spokes is
  // the manufactured look this whole exercise exists to leave.
  const twigs: string[] = [];
  for (let i = 0; i < scenery.nest.twigCount; i++) {
    const t = i / (scenery.nest.twigCount - 1 || 1);
    const ang = -Math.PI * (0.08 + t * 0.84) + (rnd() - 0.5) * 0.22;
    const len = scenery.nest.twigLength * (0.55 + rnd() * 0.9);
    const ox = nestCx + Math.cos(ang) * scenery.nest.width * 0.44;
    const oy = nestCy - scenery.nest.height * 0.1 + Math.sin(ang) * scenery.nest.height * 0.3;
    twigs.push(
      taperedOutline(
        quadPts([ox, oy], [ox + Math.cos(ang) * len * 0.5, oy + Math.sin(ang) * len * 0.5 - 1], [ox + Math.cos(ang) * len, oy + Math.sin(ang) * len], 8),
        line.detailWidth * scenery.nest.twigWeight,
        0.28,
      ),
    );
  }

  const cutId = `scene-cut-${uid}`;

  return (
    <>
      <defs>
        {bg === 'glow' &&
          glowBands.map((b) => (
            <pattern
              key={b.id}
              id={b.id}
              width={cell}
              height={cell}
              patternUnits="userSpaceOnUse"
              patternTransform={`rotate(${scenery.halftone.angle})`}
            >
              <circle cx={cell / 2} cy={cell / 2} r={b.r} fill={col.glow} />
            </pattern>
          ))}
        {/*
          `baseFrequency` is in user-space units of THIS viewBox, not pixels —
          the same number in a wider viewBox looks half as coarse. And `scale`
          must stay well under the thinnest thing it touches, or it shreds the
          twigs rather than roughening them.
        */}
        <filter id={cutId} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={scenery.handCutFrequency}
            numOctaves={3}
            seed={12}
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={scenery.handCutScale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* the field — one flat plate, drawn oversized so the hand-cut edges
          above it cannot pull a sliver of nothing in at the viewport border */}
      {bg !== 'paper' && <rect x={-8} y={-8} width={viewW + 16} height={viewH + 16} fill={col.field} />}

      {/* One oversized motif, cropped by the frame. OFF by default: these
          Critters are large relative to a phone frame, so a disc big enough to
          clear peer-size barely fits — and a peer-sized disc is a sixth
          character, which is the exact failure the treeline was. */}
      {scenery.motif.show && (
        <circle cx={scenery.motif.x} cy={scenery.motif.y} r={scenery.motif.size} fill={col.motif} />
      )}

      {/*
        THE GLOW — bands of a dot screen whose dot AREA ramps toward the horizon.
        This is what fills the middle of the frame instead of scenery: it is made
        of the printing process, so it gives the eye something to rest on and a
        three-year-old nothing to count. Dot RADIUS ramps, never dot opacity —
        fading a dot's alpha reads as a digital wash; growing its area is what a
        real screen does. Each band is one <pattern> tile the compositor repeats,
        so the whole glow is ~20 nodes and no filters.
      */}
      {bg === 'glow' &&
        glowBands.map((b) => (
          <rect key={b.id} x={-8} y={b.y0} width={viewW + 16} height={b.y1 - b.y0 + 0.4} fill={`url(#${b.id})`} />
        ))}

      {/* ground */}
      <g filter={`url(#${cutId})`}>
        <path d={groundBlob.d} fill={col.ground} />
      </g>

      {/* branch — behind the nest, so the bowl reads as cradled on it */}
      {contoured && <path d={branchContourPath} fill={col.contour} />}
      <path d={branchPath} fill={col.branch} />
      {contoured && <path d={offshootInk} fill={col.contour} />}
      <path d={offshoot} fill={col.branch} />

      {/* Where the bowl rests on the limb. Without it the two shapes merely
          overlap, which reads as a band drawn across the nest rather than a
          nest sitting on a branch. */}
      <path
        d={crescent(nestCx, branchY - scenery.branch.thickness * 0.35, scenery.nest.width * 0.42, 0.75, 0.3)}
        fill={col.branchShade}
        opacity={0.75}
      />

      {/* nest bowl */}
      {contoured && <path d={ring(bowl.pts, sceneContour, 'bowl-ring')} fill={col.contour} fillRule="evenodd" />}
      <path d={bowl.d} fill={col.nest} />

      {/* the weave, clipped to the bowl so each strand terminates on the bowl's
          OWN contour — subdivision, not strands laid on top of a shape */}
      <clipPath id={`bowl-${uid}`}>
        <path d={bowl.d} />
      </clipPath>
      <g clipPath={`url(#bowl-${uid})`}>
        {/* occlusion inside the bowl, where the weave curves away from the light */}
        <path d={crescent(nestCx, nestCy - scenery.nest.height * 0.18, scenery.nest.width * 0.5, 0.62, 0.5)} fill={col.nestShade} opacity={0.55} />
        {weaves.map((d, i) => (
          <path key={i} d={d} fill={col.nestRim} opacity={0.85} />
        ))}
      </g>

      {/* twigs radiate from behind the rim */}
      <g fill={col.branchShade}>
        {twigs.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* The opening, over the twig roots so they emerge from the weave.
          Filled with the SHADOW colour, not the rim colour: a bowl seen from
          slightly above shows a dark interior, and filling this ellipse light
          turned the nest into a covered dish. The lit rim is the crescent on
          its upper edge — a highlight on the near lip, not a lid. */}
      {contoured && <path d={ring(rim.pts, sceneContour * 0.8, 'rim-ring')} fill={col.contour} fillRule="evenodd" />}
      <path d={rim.d} fill={col.nestShade} />
      <path
        d={crescent(nestCx, nestCy - scenery.nest.height * 0.44, scenery.nest.width * 0.47, 0.78, 0.3)}
        fill={col.nestRim}
        opacity={0.9}
      />
    </>
  );
}
