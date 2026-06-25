import { palette } from './palette';

/**
 * Tuck-In's tiny SVG preview-scene — the miniature dusk vignette a Home Card
 * carries above its title. Drawn from inside the Toy so its composition stays
 * coherent with the live scene (`DuskBackdrop`) and cast (`BirdDrawing`) —
 * visual coherence between the preview and the live Toy is on-device per this
 * slice's Notes, which is exactly why the preview lives next to the Toy that
 * owns its palette and silhouettes.
 *
 * The vignette teases the *activity* this Toy is about (a clearly different
 * activity from the tap toys, the wipe toy and the hold-to-inflate toy): a
 * sleepy songbird already nestled into the woven nest on its branch, under a
 * dusk sky — so the Card reads "carry the birds home to bed" at a glance. It
 * mirrors the live cast's chibi-cute look (big head, blush cheek, closed sleepy
 * eye) and the woven-bowl nest, so the Card and the live scene read as one world.
 *
 * Scale is heavily reduced — primitives are simplified for a Card-sized vignette
 * so the preview reads as a believable miniature, not a full inspection of the
 * live Critter (same posture as the Sheep/Fish/Puddle/Balloons previews). The
 * exact composition + colour tuples are on-device-tuned per this slice's Notes
 * and deliberately not unit-asserted; the contract the test pins is that it's a
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
      {/* Dusk sky — the field the whole scene sits in (also the Card's own
       * surface tint, so the preview blends into its cover). A deeper band at the
       * top echoes the live `DuskBackdrop` gradient. */}
      <rect x="0" y="0" width="100" height="60" fill={palette.sky} />
      <rect x="0" y="0" width="100" height="16" fill={palette.skyDeep} />
      {/* A first star twinkling into the dusk (the slice #5 Outro motif). */}
      <path
        d="M 80 12 l 0.7 1.8 l 1.8 0.7 l -1.8 0.7 l -0.7 1.8 l -0.7 -1.8 l -1.8 -0.7 l 1.8 -0.7 Z"
        fill={palette.sparkle}
      />
      {/* Low dusk ground band across the bottom. */}
      <rect x="0" y="50" width="100" height="10" fill={palette.ground} />
      {/* The branch the nest rests on. */}
      <rect x="0" y="46" width="100" height="4" fill={palette.branch} />

      {/* The sleepy songbird tucked into its woven nest. */}
      <NestledBird />
    </svg>
  );
}

/**
 * One miniature robin nestled asleep in a woven nest — the cozy at-rest state the
 * live Toy rewards. The bird is drawn first, then the nest's front rim laps over
 * its lower body so it reads as sitting *in* the bowl. Its round breast is tagged
 * `data-bird-part="body"`, the same structural hook the live `BirdDrawing` uses,
 * so the Home wiring test can find the Critter without coupling to the tuned
 * geometry. Chibi-cute to match the live cast: big head, blush cheeks, a small
 * beak and closed sleepy lids.
 */
function NestledBird() {
  return (
    <g>
      {/* twig-ends radiating out past the rim — the clearest "this is a nest" cue
       * (drawn first, behind the bowl), mirroring the live scene */}
      <g fill="none" strokeLinecap="round" strokeWidth={1}>
        <path d="M28 44 L21 42" stroke={palette.branch} />
        <path d="M30 48 L23 50" stroke={palette.nestRim} />
        <path d="M72 44 L79 42" stroke={palette.branch} />
        <path d="M70 48 L77 50" stroke={palette.nestRim} />
        <path d="M38 40 L35 35" stroke={palette.nestRim} />
        <path d="M62 40 L65 35" stroke={palette.branch} />
      </g>
      {/* nest back wall + dark opening — the cup the bird sits down into */}
      <path d="M 28 45 Q 28 40 50 40 Q 72 40 72 45 Q 72 38 50 37 Q 28 38 28 45 Z" fill={palette.nest} />
      <ellipse cx={50} cy={44} rx={17} ry={4} fill={palette.nestShadow} />

      {/* the nestled robin */}
      <ellipse data-bird-part="body" cx={50} cy={42} rx={13} ry={11} fill={palette.robinBody} />
      <ellipse cx={50} cy={45} rx={7} ry={6} fill={palette.birdBelly} />
      <ellipse cx={62} cy={40} rx={5} ry={7} fill={palette.robinWing} />
      <circle cx={50} cy={32} r={10} fill={palette.robinBody} />
      {/* blush cheeks */}
      <circle cx={43} cy={34} r={2.6} fill={palette.birdCheek} />
      <circle cx={57} cy={34} r={2.6} fill={palette.birdCheek} />
      {/* small beak */}
      <path d="M 47 35 L 53 35 L 50 39 Z" fill={palette.robinBeak} />
      {/* closed, curved sleepy lids — head tucked, gone to sleep */}
      <path d="M 43 31 Q 46 33 49 31" fill="none" stroke={palette.birdEye} strokeWidth={1} strokeLinecap="round" />
      <path d="M 51 31 Q 54 33 57 31" fill="none" stroke={palette.birdEye} strokeWidth={1} strokeLinecap="round" />

      {/* woven front wall lapping over the bird's lower body — twig rows + lip
       * loops + a couple of stray twigs, mirroring the live cup's weave */}
      <path d="M 27 45 Q 50 57 73 45 Q 50 51 27 45 Z" fill={palette.nest} />
      <g fill="none" strokeLinecap="round">
        <path d="M 33 47 Q 50 53 67 47" stroke={palette.branch} strokeWidth={1.1} />
        <path d="M 36 49 Q 50 54 64 49" stroke={palette.nestRim} strokeWidth={1} />
      </g>
      <g fill="none" stroke={palette.nestRim} strokeWidth={1} strokeLinecap="round">
        <path d="M 36 45 Q 39 43 42 45" />
        <path d="M 46 46 Q 50 44 54 46" />
        <path d="M 58 45 Q 61 43 64 45" />
      </g>
      <g fill="none" strokeWidth={1} strokeLinecap="round">
        <path d="M 27 45 Q 22 43 19 44" stroke={palette.nestRim} />
        <path d="M 73 45 Q 78 43 81 44" stroke={palette.branch} />
      </g>
    </g>
  );
}
