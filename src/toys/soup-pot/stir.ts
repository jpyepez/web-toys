export type Pt = { x: number; y: number };

/** Turns of the pot that fill it. Tuned later on a device. */
export const GOAL_TURNS = 12;
/** The Goal as a total swept angle, in radians. */
export const GOAL_ANGLE = GOAL_TURNS * 2 * Math.PI;
/** Samples this close (DOM px) to the pot's centre add nothing: the angle there is noise. */
export const DEAD_ZONE_PX = 24;
/** One pointer sample adds at most this much angle (radians), so a jump can't skip ahead. */
export const MAX_SAMPLE_ANGLE = Math.PI / 4;

/**
 * The absolute angle (radians, ≥ 0) one pointer sample sweeps around a fixed
 * centre. Direction is ignored, so a reversal still adds. A sample that starts
 * or ends inside the dead zone adds 0; the result is capped at `cap`.
 */
export function sampleAngle(
  prev: Pt,
  next: Pt,
  centre: Pt,
  deadZone: number = DEAD_ZONE_PX,
  cap: number = MAX_SAMPLE_ANGLE,
): number {
  const ax = prev.x - centre.x;
  const ay = prev.y - centre.y;
  const bx = next.x - centre.x;
  const by = next.y - centre.y;
  if (Math.hypot(ax, ay) <= deadZone || Math.hypot(bx, by) <= deadZone) return 0;
  const swept = Math.abs(Math.atan2(ax * by - ay * bx, ax * bx + ay * by));
  return Math.min(swept, cap);
}

/** Stage 0–3: forward once at ¼, ½ and ¾ of the Goal. */
export function stageFor(progress: number, goal: number = GOAL_ANGLE): number {
  return Math.min(3, Math.floor((progress / goal) * 4));
}
