import type { ToyEntry } from '../shell/registry';
import { CountingSheep } from './counting-sheep/CountingSheep';
import { palette } from './counting-sheep/palette';
import { Preview as CountingSheepPreview } from './counting-sheep/Preview';
import { PufferFish } from './puffer-fish/PufferFish';
import { palette as oceanPalette } from './puffer-fish/palette';
import { Preview as PufferFishPreview } from './puffer-fish/Preview';

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
];
