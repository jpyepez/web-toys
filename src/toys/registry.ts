import type { ToyEntry } from '../shell/registry';
import { CountingSheep } from './counting-sheep/CountingSheep';

/**
 * The registered Toys. Adding a Toy is adding an entry here — the Shell renders
 * a Card per entry and routes to it; nothing else changes.
 */
export const registry: ToyEntry[] = [
  { id: 'counting-sheep', title: 'Counting Sheep', component: CountingSheep },
];
