import { palette } from './palette';

/**
 * Puffer Fish's tiny SVG preview-scene — the miniature underwater vignette a
 * Home Card carries above its title. Drawn from inside the Toy so its
 * composition stays coherent with the live scene (`UnderwaterBackdrop`) and
 * Critter (`FishDrawing`) — visual coherence between the preview and the live
 * Toy is on-device per the PRD's Testing Decisions, which is exactly why the
 * preview lives next to the Toy that owns its palette and silhouettes.
 *
 * Same composition family as the live underwater scene at Card scale: a
 * top-lit water field, a soft god-ray, a couple of drifting bubbles, a sandy
 * seabed with a coral clump, and one centred round Critter — a *different
 * world* from the Sheep's meadow so the Home reads as a varied collection.
 *
 * Scale is heavily reduced — primitives are simplified for a Card-sized
 * vignette so the preview reads as a believable miniature, not a full
 * inspection of the Toy (same posture as the Sheep `Preview`'s `MiniSheep`).
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
      {/* Water field — the underwater body the whole scene sits in. A flat
       * `palette.water` fill at this Card-vignette scale: the live
       * `UnderwaterBackdrop` grades top-lit toward the surface, but a tiny
       * preview reads as water from the flat field alone (the Card tint already
       * carries the ocean register), so we keep the miniature simple. */}
      <rect x="0" y="0" width="100" height="60" fill={palette.water} />
      {/* One soft god-ray slanting down from the surface — miniature echo of
       * the live scene's ray scatter. Translucent `palette.lightRay`. */}
      <polygon points="30 0, 36 0, 44 60, 22 60" fill={palette.lightRay} opacity={0.3} />
      {/* A couple of drifting bubbles through the water column. */}
      <circle cx={18} cy={20} r={1.6} fill={palette.bubble} opacity={0.7} />
      <circle cx={80} cy={28} r={2.2} fill={palette.bubble} opacity={0.7} />
      {/* Sandy seabed — a gently undulating floor band across the bottom. */}
      <path
        d="M 0 52 Q 25 48 50 51 T 100 50 L 100 60 L 0 60 Z"
        fill={palette.sand}
      />
      {/* One coral clump standing on the seabed, framing the Critter. */}
      <path
        d="M 84 60 Q 82 50 86 45 Q 88 50 88 53 Q 91 47 94 49 Q 94 54 92 60 Z"
        fill={palette.coral}
      />
      {/* One centred miniature round Critter — the smooth round white body, pink
       * fins/tail, large dark eyes + smile the live `FishDrawing` carries,
       * previewed at Card scale. The body uses the same `data-fish-part` hook so
       * the Card art reads as the same Critter. */}
      <MiniFish cx={50} cy={32} />
    </svg>
  );
}

/**
 * One miniature Puffer Fish — the live Critter's grammar at Card scale: a
 * round white body, pink tail + pectoral fins held in, two large dark eyes and
 * a small smile. Structural recognition (it's the round puffer) wins over
 * anatomical detail at this scale, the same posture as the Sheep preview's
 * `MiniSheep`. Every fill sources the local ocean palette.
 */
function MiniFish({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      {/* tail — a soft rounded fan behind the body */}
      <ellipse cx={cx - 11} cy={cy} rx={5} ry={6} fill={palette.fishFin} />
      {/* pectoral fins — rounded, never pointed */}
      <ellipse cx={cx - 3} cy={cy + 8} rx={4} ry={3} fill={palette.fishFin} />
      <ellipse cx={cx - 3} cy={cy - 8} rx={4} ry={3} fill={palette.fishFin} />
      {/* smooth round white body */}
      <circle data-fish-part="body" cx={cx} cy={cy} r={11} fill={palette.fishBody} />
      {/* blushy cheeks */}
      <circle cx={cx - 4} cy={cy + 3} r={2.2} fill={palette.fishCheek} />
      <circle cx={cx + 5} cy={cy + 3} r={2.2} fill={palette.fishCheek} />
      {/* large round eyes, each with a white catchlight — same friendly spark
       * the live `FishDrawing` rest eyes now carry */}
      <circle cx={cx - 3} cy={cy - 2} r={1.8} fill={palette.fishEye} />
      <circle cx={cx + 4} cy={cy - 2} r={1.8} fill={palette.fishEye} />
      <circle cx={cx - 2.4} cy={cy - 2.7} r={0.6} fill={palette.fishEyeShine} />
      <circle cx={cx + 4.6} cy={cy - 2.7} r={0.6} fill={palette.fishEyeShine} />
      {/* small smile — centred on the same face axis (cx + 0.5) as the eyes and
       * cheeks so it sits squarely under the eyes, not pushed to one side */}
      <path
        d={`M ${cx - 2.5} ${cy + 4} Q ${cx + 0.5} ${cy + 6} ${cx + 3.5} ${cy + 4}`}
        fill="none"
        stroke={palette.fishEye}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </g>
  );
}
