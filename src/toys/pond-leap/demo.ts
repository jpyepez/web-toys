/** Idle delay before the ghost-finger Pull demo appears (ms). Pond Leap's own copy. */
export const IDLE_DEMO_DELAY_MS = 2500;
/** One ghost Pull: press the frog, draw it back along the rail, let go (ms). */
export const DEMO_PULL_MS = 2000;
/** Pulls the ghost shows before it fades. */
export const DEMO_PULLS = 2;
/** Total time the demo stays on screen (ms). */
export const DEMO_DURATION_MS = DEMO_PULL_MS * DEMO_PULLS;
/** How far the ghost draws the frog back, as a share of the stretch cap. */
export const DEMO_PULL_SHARE = 0.7;
/** Keyframe times shared by the ghost and the frog: rest, press, drawn back, let go. */
export const DEMO_TIMES = [0, 0.2, 0.7, 0.78, 1];
