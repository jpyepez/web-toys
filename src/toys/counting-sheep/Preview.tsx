import { palette } from './palette';

/**
 * Counting Sheep's tiny SVG preview-scene — the miniature meadow a Home Card
 * carries above its title. Drawn from inside the Toy so its composition stays
 * coherent with the live meadow (`MeadowBackdrop`) — visual coherence between
 * the preview and the live Toy is on-device per the PRD's Testing Decisions,
 * which is exactly why the preview lives next to the Toy that owns its
 * palette and silhouettes.
 *
 * Same composition family as the post-pivot live meadow: bright cyan sky,
 * a couple of cloud clusters in the upper sky, two layered hills, one
 * stylised tree, one centred miniature Sheep on the foreground hill.
 * Mirrors the live scene's "sunny daytime meadow" register at Card scale.
 * No moon, no stars, no cottage, no fir cluster — those retired with the
 * dusk → day pivot recorded in polish PRD slice #03/#07 Notes + mobile-
 * rethink PRD slice #02 Notes.
 *
 * Scale is heavily reduced — primitives (cloud clusters, the tree, the
 * `MiniSheep`) are simplified for a Card-sized vignette so the preview
 * reads as a believable miniature, not a full inspection of the Toy.
 *
 * Decorative for accessibility — the Card's title and `<Link>` carry the
 * semantic load; the SVG is `aria-hidden` so screen readers skim past it.
 */
export function Preview() {
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {/* Sky band — bright cyan-blue daytime fill, same `palette.skyUpper`
       * as the live meadow. */}
      <rect x="0" y="0" width="100" height="60" fill={palette.skyUpper} />
      {/* Two small cloud clusters in the upper sky — miniature echo of the
       * live meadow's four-cloud scatter. Same palette.clouds cool white. */}
      <MiniCloud cx={22} cy={12} />
      <MiniCloud cx={64} cy={8} />
      {/* Distant hill silhouette — teal-green from `palette.hillDistant`. */}
      <path
        d="M 0 36 Q 25 30 50 34 T 100 32 L 100 60 L 0 60 Z"
        fill={palette.hillDistant}
      />
      {/* Foreground hill silhouette — vibrant lime from `palette.hillNear`. */}
      <path
        d="M 0 46 Q 30 40 60 44 T 100 43 L 100 60 L 0 60 Z"
        fill={palette.hillNear}
      />
      {/* Single stylised tree on the right side, mirroring the live
       * meadow's tree composition at preview scale. Canopy circle in
       * `palette.hillNear`, trunk rect in `palette.scenery` warm-brown. */}
      <rect x="80" y="40" width="1.5" height="4" fill={palette.scenery} />
      <circle cx="80.5" cy="37" r="3.5" fill={palette.hillNear} />
      {/* One centred miniature Sheep on the foreground hill line — the
       * mobile-rethink mechanic's one-Sheep-at-a-time grammar, previewed. */}
      <MiniSheep cx={46} cy={41} />
    </svg>
  );
}

/**
 * One miniature cloud — three overlapping circles + a flat-bottom ellipse,
 * scaled for Card vignette. Same `<Cloud>` primitive as the live meadow
 * but with the radii inlined at preview scale rather than parameterised.
 */
function MiniCloud({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + 0.8} rx={3} ry={0.9} fill={palette.clouds} />
      <circle cx={cx - 1.8} cy={cy} r={1.5} fill={palette.clouds} />
      <circle cx={cx + 1.8} cy={cy} r={1.5} fill={palette.clouds} />
      <circle cx={cx} cy={cy - 1} r={1.8} fill={palette.clouds} />
    </g>
  );
}

/**
 * One miniature Sheep — a fluffy wool body and a silhouette head wearing the
 * same cute face the live Critter now carries (big bright eyes with a catchlight,
 * a cream muzzle, rosy cheeks, a gentle smile), scaled down for a Card-sized
 * vignette. Structural recognition (it's a friendly Sheep) wins over anatomical
 * detail at this scale, but the face is the recognisable hook — a faceless dark
 * blob no longer matches the live meadow. Every fill sources a palette token.
 */
function MiniSheep({ cx, cy }: { cx: number; cy: number }) {
  // Head centre, off to the right of the wool body — same facing as the live
  // Sheep (head right, fleece left).
  const hx = cx + 8;
  const hy = cy - 1.5;
  return (
    <g>
      {/* tiny legs — drawn behind the fleece and extended low enough that the
       * stub feet poke out below the wool (the bottom wool circle reaches
       * cy + 6.6, so the legs must run past that to be seen) */}
      <rect x={cx - 4} y={cy + 4} width="1.6" height="5.5" rx="0.6" fill={palette.sheepSilhouette} />
      <rect x={cx + 1.5} y={cy + 4} width="1.6" height="5.5" rx="0.6" fill={palette.sheepSilhouette} />
      {/* ears flanking the top of the head */}
      <ellipse cx={hx - 2.8} cy={hy - 3.2} rx="1.5" ry="0.95" fill={palette.sheepSilhouette} />
      <ellipse cx={hx + 2.8} cy={hy - 3.2} rx="1.5" ry="0.95" fill={palette.sheepSilhouette} />
      {/* fluffy wool body — four overlapping circles */}
      <circle cx={cx - 5} cy={cy} r="5" fill={palette.sheepWool} />
      <circle cx={cx + 3} cy={cy} r="5" fill={palette.sheepWool} />
      <circle cx={cx - 1} cy={cy - 4} r="5.4" fill={palette.sheepWool} />
      <circle cx={cx - 1} cy={cy + 1} r="5.6" fill={palette.sheepWool} />
      {/* head */}
      <ellipse cx={hx} cy={hy} rx="4" ry="4.2" fill={palette.sheepSilhouette} />
      {/* cream muzzle snout */}
      <ellipse cx={hx} cy={hy + 1.8} rx="2.3" ry="1.8" fill={palette.muzzle} />
      {/* big bright eyes, pupils converged inward, both catchlights same side */}
      <ellipse cx={hx - 1.5} cy={hy - 0.5} rx="1.05" ry="1.25" fill={palette.eyeWhite} />
      <ellipse cx={hx + 1.5} cy={hy - 0.5} rx="1.05" ry="1.25" fill={palette.eyeWhite} />
      <circle cx={hx - 1.2} cy={hy - 0.2} r="0.7" fill={palette.eyePupil} />
      <circle cx={hx + 1.2} cy={hy - 0.2} r="0.7" fill={palette.eyePupil} />
      <circle cx={hx - 0.95} cy={hy - 0.55} r="0.28" fill={palette.eyeShine} />
      <circle cx={hx + 1.45} cy={hy - 0.55} r="0.28" fill={palette.eyeShine} />
      {/* gentle smile under the muzzle */}
      <path
        d={`M ${hx - 1.2} ${hy + 1.6} Q ${hx} ${hy + 2.7} ${hx + 1.2} ${hy + 1.6}`}
        fill="none"
        stroke={palette.eyePupil}
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </g>
  );
}
