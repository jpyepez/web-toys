import { palette } from './palette';

/**
 * Muddy Puddle's tiny SVG preview-scene — the miniature barnyard vignette a
 * Home Card carries above its title. Drawn from inside the Toy so its
 * composition stays coherent with the live scene (`BarnyardBackdrop`) and cast
 * (`WipeableCritter`) — visual coherence between the preview and the live Toy
 * is on-device per this slice's Notes, which is exactly why the preview lives
 * next to the Toy that owns its palette and silhouettes.
 *
 * The vignette teases the *activity* this Toy is about (a clearly different
 * activity from the two tap toys): a muddy critter caked in mud, with a single
 * diagonal **wiped streak** swept clear to reveal a sliver of the clean pink
 * animal underneath plus a sparkle — so the Card reads "wipe me clean" at a
 * glance. A barnyard world (sky, distant barn + fence, grass, a mud puddle) so
 * the Home reads as a varied collection next to the meadow and the ocean.
 *
 * Scale is heavily reduced — primitives are simplified for a Card-sized
 * vignette so the preview reads as a believable miniature, not a full
 * inspection of the live Critter (same posture as the Sheep/Fish previews).
 * The exact composition + colour tuples are on-device-tuned per this slice's
 * Notes and deliberately not unit-asserted; the contract the test pins is that
 * it's a decorative SVG sourcing every fill from this Toy's own palette.
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
      {/* Open barnyard sky — the field the whole scene sits in (also the Card's
       * own surface tint, so the preview blends into its cover). */}
      <rect x="0" y="0" width="100" height="60" fill={palette.sky} />
      {/* Distant barn on the horizon — a little gable-roofed silhouette. */}
      <path d="M 10 44 L 10 32 L 18 26 L 26 32 L 26 44 Z" fill={palette.barn} />
      {/* A short run of fence flanking the barn. */}
      <rect x="30" y="36" width="2" height="8" fill={palette.fence} />
      <rect x="36" y="36" width="2" height="8" fill={palette.fence} />
      <rect x="29" y="38" width="10" height="1.6" fill={palette.fence} />
      {/* Grass ground band across the bottom — the floor the critters trot on. */}
      <path d="M 0 46 Q 30 43 50 45 T 100 45 L 100 60 L 0 60 Z" fill={palette.grass} />
      {/* The mud puddle pooled at the critter's feet, with a lighter wet sheen. */}
      <ellipse cx={50} cy={55} rx={30} ry={5} fill={palette.mud} />
      <ellipse cx={50} cy={54} rx={19} ry={2.6} fill={palette.puddle} />

      {/* The muddy critter, mid-wipe. The clean pink piglet is drawn first; the
       * mud layer cakes over it, all but a diagonal wiped streak. */}
      <MuddyCritter />
    </svg>
  );
}

/**
 * One miniature piglet, mostly caked in mud with a single wiped streak swept
 * clear. The clean piglet is drawn first (its round body tagged
 * `data-piglet-part="body"`, the same structural hook the live `PigletDrawing`
 * uses, so the Home wiring test can find the Critter without coupling to the
 * tuned geometry). Mud blobs sit on top everywhere EXCEPT a diagonal band, so
 * the clean pink shows through that streak — the "wipe me clean" tease — with a
 * sparkle glint on the freshly cleared sliver.
 */
function MuddyCritter() {
  const cx = 50;
  const cy = 32;
  return (
    <g>
      {/* clean piglet underneath — ears, round body, snout, eye, blush */}
      <path d={`M ${cx - 12} ${cy - 7} L ${cx - 15} ${cy - 17} L ${cx - 5} ${cy - 12} Z`} fill={palette.pigletBody} />
      <path d={`M ${cx + 12} ${cy - 7} L ${cx + 15} ${cy - 17} L ${cx + 5} ${cy - 12} Z`} fill={palette.pigletBody} />
      <circle data-piglet-part="body" cx={cx} cy={cy} r={13} fill={palette.pigletBody} />
      <circle cx={cx - 6} cy={cy + 2} r={3} fill={palette.pigletCheek} />
      <circle cx={cx + 6} cy={cy + 2} r={3} fill={palette.pigletCheek} />
      <ellipse cx={cx} cy={cy + 4} rx={6} ry={4} fill={palette.pigletSnout} />
      <circle cx={cx - 2} cy={cy + 4} r={0.9} fill={palette.pigletEye} />
      <circle cx={cx + 2} cy={cy + 4} r={0.9} fill={palette.pigletEye} />
      <circle cx={cx - 4} cy={cy - 3} r={2} fill={palette.pigletEye} />
      <circle cx={cx + 4} cy={cy - 3} r={2} fill={palette.pigletEye} />
      <circle cx={cx - 3.2} cy={cy - 3.8} r={0.7} fill={palette.pigletEyeShine} />
      <circle cx={cx + 4.8} cy={cy - 3.8} r={0.7} fill={palette.pigletEyeShine} />

      {/* mud layer — discrete smudges caked over the piglet, placed to leave a
       * diagonal streak (lower-left → upper-right) swept clear so the clean pink
       * sliver shows through it. */}
      <circle cx={cx - 8} cy={cy - 6} r={6} fill={palette.mud} />
      <circle cx={cx - 9} cy={cy + 3} r={6} fill={palette.mud} />
      <circle cx={cx - 3} cy={cy + 8} r={5} fill={palette.mud} />
      <circle cx={cx + 9} cy={cy - 2} r={6} fill={palette.mud} />
      <circle cx={cx + 8} cy={cy + 6} r={5} fill={palette.mud} />
      <circle cx={cx + 2} cy={cy - 9} r={5} fill={palette.mud} />

      {/* the wiped streak's sparkle — a little four-point glint sitting on the
       * freshly cleared sliver, signalling the wipe just happened. */}
      <path
        d={`M ${cx + 3} ${cy - 4} l 1.3 3 l 3 1.3 l -3 1.3 l -1.3 3 l -1.3 -3 l -3 -1.3 l 3 -1.3 Z`}
        fill={palette.sparkle}
      />
    </g>
  );
}
