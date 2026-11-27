/**
 * The harvested pond config — the deliverable the lab exists to produce.
 *
 * To change the scene, open the lab (`bun run dev`, then `/lab.html`), pick the
 * `pond` background, tune it in the frame view at BOTH aspects, hit Save, and
 * copy the `scenery.pond` block out of `src/lab/saved/*.json` back here. The
 * generator lives in `pond-scene.ts` and is shared by the lab and the Toy, so
 * only these numbers move between them.
 */

import { POND_DEFAULTS, type PondConfig } from './pond-scene';

export const POND: PondConfig = { ...POND_DEFAULTS };

/** The scene seed. Fixed, so the pond is the one that was judged, every load. */
export const POND_SEED = 4271;
