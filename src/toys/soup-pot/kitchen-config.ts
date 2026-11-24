/**
 * The harvested kitchen config — the deliverable the lab exists to produce.
 *
 * To change the scene, open the lab (`bun run dev`, then `/lab.html`), pick the
 * `kitchen` background, tune it in the frame view at BOTH aspects, hit Save, and
 * copy the `scenery.kitchen` block out of `src/lab/saved/*.json` back here. The
 * generator lives in `kitchen.ts` and is shared by the lab and the Toy, so only
 * these numbers move between them.
 */

import { KITCHEN_DEFAULTS, type KitchenConfig } from './kitchen';

export const KITCHEN: KitchenConfig = { ...KITCHEN_DEFAULTS };

/** The scene seed. Fixed, so the grain, towel and bubbles are the ones judged. */
export const KITCHEN_SEED = 4271;
