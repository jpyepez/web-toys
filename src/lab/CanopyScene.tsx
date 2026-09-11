/**
 * The canopy renderer, and the frame view that makes composition judgeable.
 *
 * WHY A SECOND CANVAS. The lab's existing canvas is one bird in a 100x120 box,
 * which is the right instrument for the cast and the wrong one for a SCENE: it
 * has no aspect ratio to speak of and only one bird in it, so it cannot show
 * either of the two things that were actually broken — that the frame is empty
 * at 16:10, and that five birds float in it. This renders the whole composition
 * into a frame whose aspect matches a real viewport, with the whole cast placed
 * ON the limbs the generator produced.
 *
 * The colour derivation is the other half. Every foliage plane sits in the
 * corridor (L 0.80-0.90) because the cast is dragged across all of it, which
 * leaves lightness with nothing to spend on separating the planes from each
 * other — so depth is bought with CHROMA and hue, and the planes are told apart
 * by occlusion at the overlaps. Reaching for lightness here is what produced the
 * washed-out scene the corridor rule was corrected for once already.
 */

import { useId, useMemo } from 'react';
import { hex, shade, tint, type Oklch } from '../shell/art/oklch';
import { buildCanopy, type CanopyArt } from '../toys/nestlings/canopy';
import { BIRD_MAX_PX, BIRD_MIN_PX, BIRD_VW } from '../toys/nestlings/BirdDrawing';
import { ASPECTS, SPECIES, type Config } from './config';
import { Critter, VIEW } from './Critter';

/**
 * A bird's width as a fraction of the viewport width, mirroring the shipped
 * `BIRD_WIDTH` clamp. The canopy's whole size discipline is expressed against
 * this number, so the lab has to compute it exactly as the Toy does — a lab that
 * composes against a different bird size is a lab that lies.
 */
export function birdWidthInFrame(px: { w: number; h: number }): number {
  const birdPx = Math.min(BIRD_MAX_PX, Math.max(BIRD_MIN_PX, px.w * BIRD_VW));
  return (birdPx / px.w) * 100;
}

/** The frame in canopy units: 100 wide, height following the viewport aspect. */
export function frameFor(px: { w: number; h: number }) {
  return { w: 100, h: (px.h / px.w) * 100 };
}

/* ------------------------------------------------------------------ */

export function canopyColours(cfg: Config) {
  const { scenery, shading } = cfg;
  const L = scenery.fieldLightness;
  const f = scenery.foliage;
  const c = (base: number) => base * scenery.chromaRatio;

  // Sky is what is LEFT OVER between the foliage, not a field with things on it.
  const sky: Oklch = { l: L, c: c(cfg.scene.sky.c), h: cfg.scene.sky.h };

  /*
   * Two foliage planes. The far one is closer to the sky in hue and lower in
   * chroma — atmospheric perspective as arithmetic, not taste. Both stay in the
   * corridor; the near one is allowed a touch below because the cast still
   * clears it by the floor, and a canopy with no value structure at all is a
   * flat green wall.
   */
  const far: Oklch = { l: L - f.depthDl, c: c(f.chroma), h: f.hue };
  const near: Oklch = { l: L - f.depthDl * 2, c: c(f.chroma) + f.depthDc, h: f.hue - 8 };

  const occ = (base: Oklch, extra = 0) =>
    shade(base, {
      dl: shading.occlusionDl + extra,
      hueRotate: shading.occlusionHueRotate,
      dc: shading.occlusionDc,
    });

  // Objects, governed by the INK clearing them rather than by the corridor —
  // a limb is something a bird crosses briefly, not a region it lives in.
  const limb: Oklch = { l: 0.55, c: c(0.075), h: 52 };
  const bough: Oklch = { l: 0.48, c: c(0.08), h: 46 };
  // The repoussoir is the darkest thing in the scene after the ink. That is what
  // makes it read as being in FRONT rather than as another layer of the same wall.
  const under: Oklch = { l: 0.42, c: c(f.chroma * 1.5), h: f.hue - 16 };
  // The moon sits just above the sky it is seen through. Corridor-class: the
  // cast gets dragged straight over it.
  // Warm and a touch saturated. At near-zero chroma it stopped reading as a
  // moon and became a pale wall behind the scene competing with the sky.
  const moon: Oklch = { l: Math.min(0.94, L + 0.04), c: c(0.085), h: 88 };

  return {
    sky: hex(sky),
    skyOklch: sky,
    far: hex(far),
    farOklch: far,
    farRelief: hex(tint(far, { dl: 0.03, hueRotate: 6 })),
    near: hex(near),
    nearOklch: near,
    nearRelief: hex(occ(near, 0.02)),
    limb: hex(limb),
    limbOklch: limb,
    bough: hex(bough),
    boughOklch: bough,
    under: hex(under),
    moon: hex(moon),
    moonOklch: moon,
    contour: hex(cfg.ink),
  };
}

/* ------------------------------------------------------------------ */

/**
 * The canopy's paint order IS its depth order, and every adjacent pair overlaps
 * rather than abutting. Back to front: sky, moon, far ceiling, hanging masses,
 * perch limbs, the bough, then the understory in front of everything. Nothing in
 * this stack meets its neighbour at a shared edge — that was the old scene's
 * whole problem, and abutting is what made it read as stripes.
 */
export function CanopyLayers({
  cfg,
  art,
  frame,
  uid,
  birdW,
}: {
  cfg: Config;
  art: CanopyArt;
  frame: { w: number; h: number };
  uid: string;
  birdW: number;
}) {
  const col = canopyColours(cfg);
  const sceneContour = cfg.line.width * cfg.scenery.contourRatio;
  const inked = cfg.mode.sceneryLine === 'contour' && sceneContour > 0.05;

  return (
    <>
      {/* Sky — drawn oversized; it is the ground everything else is cut out of. */}
      <rect x={-8} y={-8} width={frame.w + 16} height={frame.h + 16} fill={col.sky} />

      {/* The moon, BEHIND the foliage so the canopy crops it. A disc laid on top
          of the sky is a sticker; a disc the leaves cut into is a distance. */}
      {art.moon && <circle cx={art.moon.cx} cy={art.moon.cy} r={art.moon.r} fill={col.moon} />}

      {/* The ceiling, then its shaded rim ON TOP of it — the rim is a band that
          follows the scalloped underside, so it only reads if it is painted
          after the mass it sits on. The light comes from the moon and every
          element in the scene obeys that one direction. */}
      <path d={art.ceiling.fill} fill={col.far} />
      <path d={art.ceiling.relief} fill={col.farRelief} opacity={0.85} />

      {/* Hanging masses — nearer plane, so they overlap the ceiling and each
          other. The overlap is the depth cue; there is no horizon anywhere. */}
      {art.masses.map((m, i) => (
        <g key={i}>
          <path d={m.fill} fill={col.near} />
          <path d={m.relief} fill={col.nearRelief} opacity={0.55} />
        </g>
      ))}

      {/* Perch limbs. The leafy fringe goes down FIRST so the limb sits inside
          its own foliage rather than on top of it — leaves grow off a branch,
          they are not laid over one. Then ink, then fill: the same
          grow-and-cover order the bough and the nest use, so the contour can
          never self-intersect. */}
      {art.limbs.map((l, i) => (
        <g key={i}>
          {l.leaves && <path d={l.leaves} fill={col.near} />}
          {inked && <path d={l.ink} fill={col.contour} />}
          {l.twigs.map((d, k) => (
            <path key={k} d={d} fill={col.bough} />
          ))}
          <path d={l.body} fill={col.limb} />
        </g>
      ))}

      {/* The bough — cropped by both edges, so it continues past the frame.
          Its foliage goes down first, for the same reason the limbs' does. */}
      {art.bough.leaves && <path d={art.bough.leaves} fill={col.near} />}
      {inked && <path d={art.bough.ink} fill={col.contour} />}
      <path d={art.bough.body} fill={col.bough} />

      {/* The nest, as a stand-in silhouette at true size. The shipped nest art
          is already settled and is NOT redrawn here — what is being judged is
          whether the bough CRADLES it, which needs only the right shape in the
          right place, and it goes in for real at harvest. */}
      <g transform={`translate(${frame.w * 0.5} ${art.bough.top})`}>
        <ellipse cx={0} cy={-2} rx={birdW * 0.62} ry={birdW * 0.3} fill={col.contour} />
        <ellipse cx={0} cy={-2.6} rx={birdW * 0.58} ry={birdW * 0.27} fill={col.bough} />
        <ellipse cx={0} cy={-birdW * 0.13} rx={birdW * 0.44} ry={birdW * 0.11} fill={col.contour} opacity={0.55} />
      </g>

      {/* The repoussoir. In FRONT of the cast's plane, which is what turns two
          planes into three and is the single strongest "this is a place" cue. */}
      {art.understory && <path d={art.understory.fill} fill={col.under} />}

      {/* Seed fluff — the only moving thing in the scene, and small by rule. */}
      {art.motes.map((m, i) => (
        <circle key={`${uid}-${i}`} cx={m.cx} cy={m.cy} r={m.r} fill={col.moon} opacity={0.75} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The frame view: the whole scene at a real viewport aspect, with the cast
 * standing ON the generated limbs.
 *
 * The birds are placed from `art.perches` rather than from a hand-written
 * scatter, which is the point — a contact shadow on a bird floating in open sky
 * is a shadow cast by nothing, and no amount of retouching the shadow fixes
 * that. Derive the position from the thing being stood on and the problem
 * cannot come back.
 */
export function FrameView({ config }: { config: Config }) {
  const uid = useId().replace(/:/g, '');
  const px = ASPECTS[config.mode.aspect];
  const frame = frameFor(px);
  const birdW = birdWidthInFrame(px);

  const art = useMemo(
    () => buildCanopy(config.scenery.canopy, frame, birdW, config.seed, SPECIES.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.scenery.canopy, config.seed, frame.h, birdW],
  );

  /*
   * A perch is "where the feet land", so placing the bird means walking back UP
   * from it to the bird's top edge. The lab Critter's box is 100x120 with its
   * feet at y 110, and the box is rendered `birdW` wide — so the feet sit
   * `birdW * (110/120) * (120/100)` below the top. Derived, not measured off a
   * screenshot, because the shipped BirdDrawing has a different box (100x100,
   * feet at 94.3) and the same arithmetic has to survive that swap.
   */
  const footDrop = birdW * (110 / 100);

  return (
    <div
      className="frameView"
      style={{ aspectRatio: `${px.w} / ${px.h}`, background: canopyColours(config).sky }}
    >
      <svg
        viewBox={`0 0 ${frame.w} ${frame.h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <CanopyLayers cfg={config} art={art} frame={frame} uid={uid} birdW={birdW} />
      </svg>

      {config.mode.showCritter &&
        art.perches.map(([x, y], i) => {
          const sp = SPECIES[i % SPECIES.length];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${((y - footDrop) / frame.h) * 100}%`,
                width: `${birdW}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <Critter
                bare
                config={{ ...config, mode: { ...config.mode, species: sp, showBackdrop: false } }}
              />
            </div>
          );
        })}

      {/* The notan check, as a switch rather than as an intention: collapse the
          whole frame to two values and see whether the background still competes
          with the cast for attention. */}
      {config.mode.silhouetteTest && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'grayscale(1) contrast(6)',
            pointerEvents: 'none',
          }}
        />
      )}
      <span className="frameTag">
        {px.label} · {px.w}x{px.h} · bird {birdW.toFixed(0)}u · frame 100x{frame.h.toFixed(0)}
      </span>
    </div>
  );
}

export { VIEW };
