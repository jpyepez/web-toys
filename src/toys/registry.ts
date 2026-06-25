import type { ToyEntry } from '../shell/registry';
import { CountingSheep, TIMING_DISMISS_MS as SHEEP_EXIT_MS } from './counting-sheep/CountingSheep';
import { palette } from './counting-sheep/palette';
import { Preview as CountingSheepPreview } from './counting-sheep/Preview';
import { PufferFish, TIMING_DISMISS_MS as FISH_EXIT_MS } from './puffer-fish/PufferFish';
import { palette as oceanPalette } from './puffer-fish/palette';
import { Preview as PufferFishPreview } from './puffer-fish/Preview';
import { MuddyPuddle, TIMING_DISMISS_MS as PUDDLE_EXIT_MS } from './muddy-puddle/MuddyPuddle';
import { palette as barnyardPalette } from './muddy-puddle/palette';
import { Preview as MuddyPuddlePreview } from './muddy-puddle/Preview';
import { Balloons } from './balloons/Balloons';
import { palette as skyPalette } from './balloons/palette';
import { Preview as BalloonsPreview } from './balloons/Preview';
import { FLOAT_AWAY_MS } from './balloons/HoldableBalloon';
import { Nestlings } from './nestlings/Nestlings';
import { palette as duskPalette } from './nestlings/palette';
import { Preview as NestlingsPreview } from './nestlings/Preview';
import { SETTLE_MS } from './nestlings/DuskBackdrop';

/**
 * The registered Toys. Adding a Toy is adding an entry here — the Shell renders
 * a Card per entry and routes to it; nothing else changes. An entry also
 * declares its `tint` (the Card's solid surface colour, a concrete CSS color
 * string the Toy supplies from its own world — ADR-0004) and its `preview`
 * (the tiny SVG preview-scene the Card hosts above the title) — both
 * registry-driven so a future Toy declares its atmosphere here, not in the
 * Shell. Counting Sheep's tint sources `palette.sheepWool` from the Toy's own
 * Sheep-local palette (`./counting-sheep/palette`) — the Card carries no
 * dependency on a shared palette grab-bag (ADR-0004, completed in slice #04).
 */
export const registry: ToyEntry[] = [
  {
    id: 'counting-sheep',
    title: 'Counting Sheep',
    component: CountingSheep,
    tint: palette.sheepWool,
    preview: CountingSheepPreview,
    // Hold the Completion until the last Sheep finishes its dismiss exit —
    // `onComplete` fires on the 5th tap, at the START of that exit.
    winDelayMs: SHEEP_EXIT_MS,
  },
  // Puffer Fish — the second Toy. Its `tint` is a concrete ocean-palette color
  // string (`oceanPalette.water`) the Toy supplies from its own world, not a
  // key into a shared palette (ADR-0004 / slice #03). The `preview` is the
  // fish's own miniature underwater scene, drawn from inside the Toy so the
  // Card art coheres with the live scene. The exact ocean tone is
  // on-device-tunable per the slice DoD; the contract is that both come from
  // the fish's own world (its local palette + preview), adding nothing shared.
  {
    id: 'puffer-fish',
    title: 'Puffer Fish',
    component: PufferFish,
    tint: oceanPalette.water,
    preview: PufferFishPreview,
    // Hold the Completion until the last Fish finishes its puff-then-float exit.
    winDelayMs: FISH_EXIT_MS,
  },
  // Muddy Puddle — the third Toy, a clearly different *activity* (wipe-clean)
  // from the two tap toys. Like the fish, its `tint` is a concrete color string
  // the Toy supplies from its own world — the barnyard `palette.sky`, the open
  // sky the live scene sits in (ADR-0004 / the tint→color-string contract), not
  // a key into a shared palette. The `preview` is its own miniature barnyard
  // vignette — a muddy critter mid-wipe — drawn from inside the Toy so the Card
  // art coheres with the live scene. Additive only: nothing else in the Shell
  // changes, per the registry contract.
  {
    id: 'muddy-puddle',
    title: 'Muddy Puddle',
    component: MuddyPuddle,
    tint: barnyardPalette.sky,
    preview: MuddyPuddlePreview,
    // Hold the Completion until the last critter finishes its clean-snap exit.
    winDelayMs: PUDDLE_EXIT_MS,
  },
  // Up & Away — the fourth Toy (slug `balloons`), and the first to break the
  // sequential conveyor: a free-order bunch the child fills and floats. A
  // clearly different *activity* (hold-to-inflate) from the tap toys and the
  // wipe toy. Display title chosen at slice #08 (HITL); the slug stays
  // `balloons`. Like the others its `tint` is a concrete color string the Toy
  // supplies from its OWN world — the sky `palette.sky`, the tall open sky the
  // live scene rises into (ADR-0004 / the tint→color-string contract) — and its
  // `preview` is its own miniature sky vignette (a happy balloon floating up),
  // drawn from inside the Toy so the Card art coheres with the live scene.
  // Additive only: nothing else in the Shell changes.
  {
    id: 'balloons',
    title: 'Up & Away',
    component: Balloons,
    tint: skyPalette.sky,
    preview: BalloonsPreview,
    // Hold the Completion until the last balloon has floated up and off-screen
    // (`FLOAT_AWAY_MS`) — `onComplete` fires on the final detach, at the START
    // of that rise, so without this the dialogue lands on a balloon mid-flight.
    winDelayMs: FLOAT_AWAY_MS,
  },
  // Tuck-In — the fifth Toy (slug `nestlings`), a dusk bedtime scene: the child
  // carries fledglings home to the nest one by one until the whole cast is
  // asleep. A free-order activity like Balloons (no sequential conveyor), but a
  // distinct *gesture* — drag-to-carry, settle-to-rest. Display title chosen at
  // slice #08 (HITL: "Tuck-In"); the slug stays `nestlings`. Like the others its
  // `tint` is a concrete color string the Toy supplies from its OWN world — the
  // dusk `palette.sky`, the representative dusk-sky tone the live scene sits in
  // (ADR-0004 / the tint→color-string contract) — and its `preview` is its own
  // miniature dusk vignette (a songbird nestled asleep), drawn from inside the
  // Toy so the Card art coheres with the live scene. Additive only: nothing else
  // in the Shell changes.
  {
    id: 'nestlings',
    title: 'Tuck-In',
    component: Nestlings,
    tint: duskPalette.sky,
    preview: NestlingsPreview,
    // Hold the Completion until the last bird finishes settling into the nest —
    // `onComplete` fires at the START of that settle, so without this the
    // dialogue would land on a mid-settle frame (the analog of Balloons'
    // `FLOAT_AWAY_MS`).
    winDelayMs: SETTLE_MS,
  },
];
