import { palette } from './palette';

/**
 * Up & Away's tiny SVG preview-scene — the miniature sky vignette a Home Card
 * carries above its title. Drawn from inside the Toy so its composition stays
 * coherent with the live scene (`SkyBackdrop`) and cast (`BalloonDrawing`) —
 * visual coherence between the preview and the live Toy is on-device per this
 * slice's Notes, which is exactly why the preview lives next to the Toy that
 * owns its palette and silhouettes.
 *
 * The vignette teases the *activity* this Toy is about (a clearly different
 * activity from the tap toys and the wipe toy): a happy faced balloon floating
 * UP on its string, having lifted off the low peg — so the Card reads "fill me
 * up and let me go" at a glance. A tall open-sky world (sky, a soft cloud, the
 * grassy rise + peg at the bottom) so the Home reads as a varied collection next
 * to the meadow, the ocean and the barnyard.
 *
 * Scale is heavily reduced — primitives are simplified for a Card-sized vignette
 * so the preview reads as a believable miniature, not a full inspection of the
 * live Critter (same posture as the Sheep/Fish/Puddle previews). The exact
 * composition + colour tuples are on-device-tuned per this slice's Notes and
 * deliberately not unit-asserted; the contract the test pins is that it's a
 * decorative SVG sourcing every fill from this Toy's own palette.
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
      {/* Open tall sky — the field the whole scene sits in (also the Card's own
       * surface tint, so the preview blends into its cover). */}
      <rect x="0" y="0" width="100" height="60" fill={palette.sky} />
      {/* A soft cloud drifting in the sky. */}
      <ellipse cx={22} cy={16} rx={13} ry={5} fill={palette.cloud} />
      <ellipse cx={30} cy={13} rx={9} ry={5} fill={palette.cloud} />
      {/* Grassy rise across the bottom — the floor the peg stands on. */}
      <path d="M 0 50 Q 30 47 50 49 T 100 49 L 100 60 L 0 60 Z" fill={palette.grass} />
      {/* The low peg the bunch is tied to. */}
      <rect x={70} y={44} width={3} height={8} fill={palette.peg} />

      {/* The happy faced balloon floating up on its string. */}
      <FloatingBalloon />
    </svg>
  );
}

/**
 * One miniature balloon floating up on its string — plump and happy (the
 * lifted-off state the live Toy rewards). Its round body is tagged
 * `data-balloon-part="body"`, the same structural hook the live `BalloonDrawing`
 * uses, so the Home wiring test can find the Critter without coupling to the
 * tuned geometry.
 */
function FloatingBalloon() {
  const cx = 50;
  const cy = 30;
  return (
    <g>
      {/* string trailing down toward the peg */}
      <path
        d={`M ${cx} ${cy + 14} Q ${cx + 6} ${cy + 26} ${cx + 22} ${cy + 22}`}
        fill="none"
        stroke={palette.string}
        strokeWidth={1}
        strokeLinecap="round"
      />
      {/* plump body */}
      <ellipse data-balloon-part="body" cx={cx} cy={cy} rx={12} ry={14} fill={palette.balloon1} />
      {/* knot */}
      <path d={`M ${cx - 2} ${cy + 13} L ${cx + 2} ${cy + 13} L ${cx} ${cy + 16} Z`} fill={palette.balloon1} />
      {/* blushy cheeks + happy face */}
      <circle cx={cx - 6} cy={cy + 2} r={2} fill={palette.cheek} />
      <circle cx={cx + 6} cy={cy + 2} r={2} fill={palette.cheek} />
      <circle cx={cx - 3.5} cy={cy - 2} r={1.4} fill={palette.faceInk} />
      <circle cx={cx + 3.5} cy={cy - 2} r={1.4} fill={palette.faceInk} />
      <circle cx={cx - 3} cy={cy - 2.5} r={0.5} fill={palette.faceShine} />
      <circle cx={cx + 4} cy={cy - 2.5} r={0.5} fill={palette.faceShine} />
      <path
        d={`M ${cx - 4} ${cy + 3} Q ${cx} ${cy + 7} ${cx + 4} ${cy + 3}`}
        fill="none"
        stroke={palette.faceInk}
        strokeWidth={1}
        strokeLinecap="round"
      />
      {/* a little sky sparkle */}
      <path
        d={`M ${cx + 16} ${cy - 12} l 0.8 2 l 2 0.8 l -2 0.8 l -0.8 2 l -0.8 -2 l -2 -0.8 l 2 -0.8 Z`}
        fill={palette.sparkle}
      />
    </g>
  );
}
