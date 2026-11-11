/**
 * The harvested floe config — the deliverable the lab exists to produce.
 *
 * To change the scene, open the lab (`bun run dev`, then `/lab.html`), pick the
 * `floe` background, tune it in the frame view at BOTH aspects, hit Save, and
 * copy the `scenery.floe` block out of `src/lab/saved/*.json` back here. The
 * generator lives in `floe.ts` and is shared by the lab and the Toy, so only
 * these numbers move between them.
 */

import { FLOE_DEFAULTS, type FloeConfig } from './floe';

export const FLOE: FloeConfig = { ...FLOE_DEFAULTS };

/**
 * The scene seed. Fixed, not random: the floe's cut edge and the landing slots
 * were judged at this value, and a fresh seed each load would reroll the picture.
 */
export const FLOE_SEED = 4271;
