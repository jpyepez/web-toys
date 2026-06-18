import type { ToyEntry } from '../shell/registry';
import { CountingSheep } from './counting-sheep/CountingSheep';
import { palette } from './counting-sheep/palette';
import { Preview as CountingSheepPreview } from './counting-sheep/Preview';
import { PufferFish } from './puffer-fish/PufferFish';
import { palette as oceanPalette } from './puffer-fish/palette';
import { Preview as PufferFishPreview } from './puffer-fish/Preview';
import { MuddyPuddle } from './muddy-puddle/MuddyPuddle';
import { palette as barnyardPalette } from './muddy-puddle/palette';
import { Preview as MuddyPuddlePreview } from './muddy-puddle/Preview';
import { Balloons } from './balloons/Balloons';
import { palette as skyPalette } from './balloons/palette';
import { Preview as BalloonsPreview } from './balloons/Preview';

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
  },
];
