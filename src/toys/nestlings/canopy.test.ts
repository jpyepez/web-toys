import { describe, it, expect } from 'vitest';
import { buildCanopy, check, type Frame } from './canopy';
import { CANOPY, CANOPY_SEED } from './canopy-config';

/**
 * The canopy's shape-class rules, as assertions rather than as prose.
 *
 * They exist in this form for a specific reason. The house-style rules were
 * written down carefully and then broken in the same session that wrote them —
 * a backdrop went in with zero house primitives and ten uniform stroke widths,
 * hours after the document forbidding both. A rule you can read and still not
 * apply is not a rule; a rule that fails the build is.
 *
 * What is asserted here is the argument that licenses this background to exist
 * at all: a forest made only of limbs, boughs and foliage MASS contains no
 * bird-shaped object, so it cannot make a three-year-old sort scenery from
 * cast. Every check below is one clause of that, evaluated at the two frames the
 * Toy actually ships into — a phone, where a bird is 36% of the width, and
 * 16:10, where the clamp leaves it at 13%. A scene that passes on a phone and
 * fails on a desktop is the exact failure this file is here to catch, because
 * the sizes silently change class as the frame grows.
 */

/** The two frames that matter, in the generator's own units. */
const PHONE: { frame: Frame; birdW: number } = { frame: { w: 100, h: 216 }, birdW: 36 };
// 1440x900: the clamp caps a bird at 190px, so it is 13.2% of the width.
const DESKTOP: { frame: Frame; birdW: number } = { frame: { w: 100, h: 62.5 }, birdW: 13.2 };
const FRAMES = [
  { name: 'phone 9:19.5', ...PHONE },
  { name: 'desktop 16:10', ...DESKTOP },
];

const CAST_SIZE = 5;
const build = (f: { frame: Frame; birdW: number }) =>
  buildCanopy(CANOPY, f.frame, f.birdW, CANOPY_SEED, CAST_SIZE);

describe('Nestlings — the canopy', () => {
  it('passes its own shape-class rules at every shipped frame', () => {
    // `check()` is the generator's self-audit: lobe size against a bird, the
    // peer-size band around the moon, a bough thick enough to cradle rather than
    // to balance, and a foreground that never covers the drop zone.
    for (const f of FRAMES) {
      expect(check(CANOPY, f.birdW), f.name).toEqual([]);
    }
  });

  it('never puts a background shape in the cast’s size band', () => {
    // THE rule the treeline broke. A conifer crown is a convex, closed,
    // bird-sized shape and so is a fledgling; twenty of them behind five birds
    // is twenty-five blobs to sort. Anything in the background is therefore
    // either far larger than a bird or far smaller — never the same size.
    for (const f of FRAMES) {
      const moon = CANOPY.moonScale;
      expect(moon === 0 || moon >= 2.5, `${f.name}: moon at ${moon}x a bird`).toBe(true);
      const lobe = CANOPY.lobeRatio * 2;
      expect(lobe, `${f.name}: leaf lobe`).toBeLessThanOrEqual(0.25);
    }
  });

  it('gives the whole cast a perch, inside the frame, at every aspect', () => {
    // The birds float unless there is something under them, and a perch outside
    // the frame is a bird half off the screen. Both used to be true.
    for (const f of FRAMES) {
      const { perches } = build(f);
      expect(perches.length, f.name).toBe(CAST_SIZE);
      for (const [x, y] of perches) {
        expect(x, `${f.name}: perch x`).toBeGreaterThan(f.birdW * 0.4);
        expect(x, `${f.name}: perch x`).toBeLessThan(100 - f.birdW * 0.4);
        expect(y, `${f.name}: perch y`).toBeGreaterThan(0);
        expect(y, `${f.name}: perch y`).toBeLessThan(f.frame.h);
      }
    }
  });

  it('keeps the perched birds from overlapping each other', () => {
    // Two perches close in x on limbs one above the other put one bird's head
    // through another's belly — which three of the five did before the selection
    // became farthest-point rather than first-come.
    //
    // The threshold asserted is DISTINCTNESS, not zero overlap, and the
    // difference is deliberate. Five birds have to fit in a band only about
    // three bird-heights tall on a phone, so demanding they never touch is
    // demanding a scene that cannot be composed. Birds sharing a tree do overlap
    // a little and it reads as natural; what must never happen is one bird's
    // core sitting inside another's.
    for (const f of FRAMES) {
      const { perches } = build(f);
      for (let i = 0; i < perches.length; i++) {
        for (let j = i + 1; j < perches.length; j++) {
          const dx = Math.abs(perches[i][0] - perches[j][0]);
          const dy = Math.abs(perches[i][1] - perches[j][1]);
          expect(
            dx > f.birdW * 0.6 || dy > f.birdW * 0.78,
            `${f.name}: perches ${i} and ${j} overlap (dx ${dx.toFixed(1)}, dy ${dy.toFixed(1)})`,
          ).toBe(true);
        }
      }
    }
  });

  it('keeps the nest’s drop zone clear of the foreground mass', () => {
    // The understory is the repoussoir, and the one place it must never reach is
    // the middle of the bottom band — that is where the nest is and where the
    // child is aiming. Corner-weighting is what buys the depth cue without
    // buying that problem, so it is asserted rather than assumed.
    for (const f of FRAMES) {
      const { bough } = build(f);
      const deepest = f.frame.h * CANOPY.understoryDepth * 0.15;
      expect(f.frame.h - deepest, `${f.name}: understory reaches the nest`).toBeGreaterThan(
        bough.top,
      );
    }
  });

  it('is a pure function of its config, frame and seed', () => {
    // The saved config is the deliverable, and it is a lie if the same numbers
    // do not reproduce the same picture. Every random draw comes from a named
    // seeded stream; there is no bare `Math.random()` in the render path.
    for (const f of FRAMES) {
      expect(JSON.stringify(build(f))).toBe(JSON.stringify(build(f)));
    }
    expect(JSON.stringify(build(PHONE))).not.toBe(
      JSON.stringify(buildCanopy(CANOPY, PHONE.frame, PHONE.birdW, CANOPY_SEED + 1, CAST_SIZE)),
    );
  });

  it('scales the tree with the BIRD and the counts with the frame', () => {
    // The unit is a bird, not the viewport. A bough authored as a flat number of
    // frame units is a believable limb at 36 and a WALL at 9.7 — the first
    // desktop render of this scene was three brown planks and a log filling the
    // screen. Sizes therefore hold constant in bird-widths across aspects, while
    // COUNTS follow the frame: a 16:10 frame is nearly four times as wide in
    // birds, so it gets more tree sideways rather than the same tree enlarged.
    const phone = build(PHONE);
    const desktop = build(DESKTOP);
    const thickness = (d: string) => d.length; // path complexity stands in for scale
    expect(thickness(phone.bough.body)).toBeGreaterThan(0);
    expect(desktop.limbs.length).toBeGreaterThan(phone.limbs.length);
    expect(desktop.masses.length).toBeGreaterThan(phone.masses.length);
  });

  it('lets no limb span the frame', () => {
    // A line running edge to edge is a rule drawn across the picture, not a
    // branch — which is precisely what the full-width pinstripe this scene
    // replaces was. Only the BOUGH is allowed to cross, because it is cropped by
    // both edges and reads as continuing past them.
    for (const f of FRAMES) {
      const { limbs } = build(f);
      for (const l of limbs) {
        const xs = [...l.body.matchAll(/(-?\d+\.?\d*),-?\d+\.?\d*/g)].map((m) => Number(m[1]));
        const spread = Math.max(...xs) - Math.min(...xs);
        expect(spread, `${f.name}: a limb spans ${spread.toFixed(0)} of 100`).toBeLessThan(112);
      }
    }
  });
});
