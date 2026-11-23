import { describe, expect, it } from 'vitest';
import { DEAD_ZONE_PX, GOAL_ANGLE, MAX_SAMPLE_ANGLE, sampleAngle, stageFor } from './stir';

const C = { x: 0, y: 0 };
const at = (deg: number, r = 100) => ({ x: r * Math.cos((deg * Math.PI) / 180), y: r * Math.sin((deg * Math.PI) / 180) });

describe('sampleAngle', () => {
  it('returns the swept angle', () => {
    expect(sampleAngle(at(0), at(20), C)).toBeCloseTo((20 * Math.PI) / 180);
  });
  it('ignores direction', () => {
    expect(sampleAngle(at(20), at(0), C)).toBeCloseTo(sampleAngle(at(0), at(20), C));
  });
  it('adds nothing for a still sample', () => {
    expect(sampleAngle(at(30), at(30), C)).toBe(0);
  });
  it('adds nothing inside the dead zone', () => {
    expect(sampleAngle(at(0, DEAD_ZONE_PX), at(30, DEAD_ZONE_PX), C)).toBe(0);
    expect(sampleAngle(at(0), at(30, DEAD_ZONE_PX - 1), C)).toBe(0);
  });
  it('caps a jump across the centre', () => {
    expect(sampleAngle(at(0), at(180), C)).toBe(MAX_SAMPLE_ANGLE);
  });
  it('takes the short way round across the ±π seam', () => {
    expect(sampleAngle(at(175), at(-175), C)).toBeCloseTo((10 * Math.PI) / 180);
  });
});

describe('stageFor', () => {
  it('moves forward at ¼, ½ and ¾ of the Goal', () => {
    expect([0, 0.24, 0.25, 0.5, 0.75, 1].map((f) => stageFor(f * GOAL_ANGLE))).toEqual([0, 0, 1, 2, 3, 3]);
  });
});
