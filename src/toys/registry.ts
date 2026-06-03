import type { ToyEntry } from '../shell/registry';
import { CountingSheep } from './counting-sheep/CountingSheep';
import { Preview as CountingSheepPreview } from './counting-sheep/Preview';

/**
 * The registered Toys. Adding a Toy is adding an entry here — the Shell renders
 * a Card per entry and routes to it; nothing else changes. Per slice #07, an
 * entry also declares its `gradient` (the Card's palette wash, a key into
 * the design-tokens module's named gradients) and its `preview` (the tiny
 * SVG preview-scene the Card hosts above the title) — both registry-driven
 * so a future Toy declares its atmosphere here, not in the Shell.
 */
export const registry: ToyEntry[] = [
  {
    id: 'counting-sheep',
    title: 'Counting Sheep',
    component: CountingSheep,
    tint: 'sheepWool',
    preview: CountingSheepPreview,
  },
];
