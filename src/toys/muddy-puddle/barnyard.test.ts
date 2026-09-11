import { describe, it, expect } from 'vitest';
import { buildBarnyard, check, walkYAt, type Frame } from './barnyard';
import { BARNYARD, BARNYARD_SEED } from './barnyard-config';

/**
 * The barnyard's shape-class rules, as assertions rather than as prose.
 *
 * They exist in this form for a specific reason. The house rules were written
 * down carefully and then broken in the same session that wrote them — a rule
 * you can read and still not apply is not a rule; a rule that fails the build
 * is. This Toy is the proof: it shipped a convex, closed, Critter-sized barn and
 * a row of five identical fence posts behind five convex, closed, Critter-sized
 * animals, and every review of it passed, because a screenshot of a sunny
 * barnyard looks like a sunny barnyard.
 *
 * What is asserted is the argument that licenses this background to exist at
 * all: a yard made only of a cropped barn wall, a cropped pool, a fence the
 * frame cuts, straw BLADES and clod masses contains no Critter-shaped object, so
 * it cannot ask a three-year-old to sort scenery from cast. Every check below is
 * one clause of that, evaluated at the two frames the Toy actually ships into.
 */

/** The two frames that matter, in the generator's own units. */
// 390x844 with a Critter at clamp(150px, 50vw, 240px) = 195px, i.e. 50% of the
// width. A phone is only ~2.0 Critters across.
const PHONE: { frame: Frame; critterW: number } = { frame: { w: 100, h: 216.4 }, critterW: 50.0 };
// 1440x900: the clamp caps a Critter at 240px, so it is 16.7% of the width and
// the frame is ~6.0 Critters across.
const DESKTOP: { frame: Frame; critterW: number } = { frame: { w: 100, h: 62.5 }, critterW: 16.67 };
const FRAMES = [
  { name: 'phone 9:19.5', ...PHONE },
  { name: 'desktop 16:10', ...DESKTOP },
];

const build = (f: { frame: Frame; critterW: number }) =>
  buildBarnyard(BARNYARD, f.frame, f.critterW, BARNYARD_SEED);

/** Every coordinate pair in an emitted path, for measuring what was drawn. */
const coords = (d: string): Array<[number, number]> =>
  [...d.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((m) => [Number(m[1]), Number(m[2])]);

const spanOf = (d: string) => {
  const xs = coords(d).map(([x]) => x);
  return Math.max(...xs) - Math.min(...xs);
};

describe('Muddy Puddle — the barnyard', () => {
  it('passes its own shape-class rules at every shipped frame', () => {
    for (const f of FRAMES) {
      expect(check(BARNYARD, f.critterW), f.name).toEqual([]);
    }
  });

  it('never puts a background shape in the cast’s size band', () => {
    // THE rule the barn and the puddle broke, checked on the emitted geometry
    // rather than on the config. Anything closed in this scene is either far
    // larger than a Critter and cropped, or far smaller than one and part of a
    // counted mass — never the same size.
    for (const f of FRAMES) {
      const art = build(f);
      const band = { lo: f.critterW / 8, hi: f.critterW * 2.5 };

      expect(art.barn, `${f.name}: the barn`).not.toBeNull();
      expect(
        spanOf(art.barn!.wall),
        `${f.name}: the barn wall is ${(spanOf(art.barn!.wall) / f.critterW).toFixed(2)}x a Critter`,
      ).toBeGreaterThanOrEqual(band.hi);

      expect(art.puddle, `${f.name}: the puddle`).not.toBeNull();
      expect(
        spanOf(art.puddle!.fill),
        `${f.name}: the puddle is ${(spanOf(art.puddle!.fill) / f.critterW).toFixed(2)}x a Critter`,
      ).toBeGreaterThanOrEqual(band.hi);

      for (const clod of art.fore!.clods) {
        expect(clod.r * 2, `${f.name}: a clod`).toBeLessThanOrEqual(band.lo);
      }
      for (const mote of art.motes) {
        expect(mote.r * 2, `${f.name}: a mote`).toBeLessThanOrEqual(band.lo);
      }
    }
  });

  it('crops the barn and the puddle by frame edges, so neither is an object', () => {
    /*
     * Size alone is not the licence — a shape larger than the cast that stops
     * neatly inside the viewport still reads as a sticker laid on the picture.
     * What makes a big shape scenery is that the frame cuts it, so the eye reads
     * it as continuing past the edge rather than as a thing that ends.
     */
    for (const f of FRAMES) {
      const art = build(f);
      const barnXs = coords(art.barn!.wall).map(([x]) => x);
      expect(Math.min(...barnXs), `${f.name}: the barn is cut by the left edge`).toBeLessThan(0);

      /*
       * The pool is cut by the BOTTOM edge, not a side one. It sits under the
       * standing point — the cast walks along its near bank — so what makes it
       * ground rather than a lozenge laid on the grass is that it runs off the
       * bottom of the frame. Sized on its width alone it stopped three units
       * short of that edge at 16:10 and read as a beige plate; the generator's
       * depth floor is what this assertion guards.
       */
      const poolYs = coords(art.puddle!.fill).map(([, y]) => y);
      expect(Math.max(...poolYs), `${f.name}: the puddle is cut by the bottom edge`).toBeGreaterThan(
        f.frame.h,
      );
    }
  });

  it('gives a wide frame more yard SIDEWAYS, and a narrow one no banks at all', () => {
    /*
     * The counts-follow-the-frame rule, doing something more interesting here
     * than scaling a number.
     *
     * A bank must be at least 2.5 Critters wide to clear the cast's size band.
     * On a phone a Critter is 50% of the width, so 2.5 Critters is ~125 frame
     * units against a 100-unit frame: there is NO bank a phone can hold that is
     * not a rival. So the phone gets none, and gets its depth from the cropped
     * barn, the cropped pool and the corner clay instead.
     */
    const phone = build(PHONE);
    const desktop = build(DESKTOP);
    expect(phone.banks.length, 'a phone cannot hold a legal bank').toBe(0);
    expect(desktop.banks.length, 'a wide frame gets banks').toBeGreaterThan(0);
    // Sizes follow the Critter, counts follow the frame: the wide frame is more
    // Critters across, so it gets more straw — not bigger straw.
    expect(desktop.straw.length).toBeGreaterThan(phone.straw.length);
  });

  it('lets only the trotting line cross the frame horizontally', () => {
    // Everything else is bounded, cropped or short of the far edge. The fence is
    // the one that could get this wrong, because a run long enough to read as a
    // fence is most of the way across a narrow frame already.
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.fence, `${f.name}: the fence`).not.toBeNull();
      const xs = art.fence!.posts.flatMap((d) => coords(d).map(([x]) => x));
      const spread = Math.max(...xs) - Math.min(...xs);
      expect(spread, `${f.name}: the fence spans ${spread.toFixed(0)} of 100`).toBeLessThan(
        f.frame.w * 0.9,
      );
    }
  });

  it('stands a Critter ON the line the backdrop draws', () => {
    /*
     * The whole reason the scene is a generator. These used to be two numbers
     * maintained by hand — the ground drawn into a `--barnyard-floor` CSS band,
     * and a Critter placed at `top: 34%` — which agreed on a phone and drifted
     * apart as the viewport widened.
     */
    for (const f of FRAMES) {
      const { walk, stand } = build(f);
      expect(stand[0]).toBe(f.frame.w / 2);
      expect(stand[1]).toBeCloseTo(walkYAt(walk, f.frame.w / 2), 4);
      // And the line is genuinely a line, not a flat rule: a dead-level ground
      // is a stripe, which is the composition this replaces.
      const ys = walk.map(([, y]) => y);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0);
    }
  });

  it('puts the splash point inside the puddle at every aspect', () => {
    /*
     * The Toy's final beat, and the bug this generator exists to make
     * impossible. The last Critter used to dive by a hardcoded `y: 90` from a
     * centred rest position — a number tuned against a pool it could not see. On
     * a phone that landed in the water; at 16:10 the pool sits off to the right
     * and the Critter belly-flopped onto grass, with the splash sound playing
     * over it.
     *
     * Asserted against the pool's own emitted outline rather than against the
     * numbers that produced it, so the check still holds if the pool's shape
     * changes.
     */
    for (const f of FRAMES) {
      const art = build(f);
      const pts = coords(art.puddle!.fill);
      const xs = pts.map(([x]) => x);
      const ys = pts.map(([, y]) => y);
      const [sx, sy] = art.splash;
      expect(sx, `${f.name}: splash x`).toBeGreaterThan(Math.min(...xs));
      expect(sx, `${f.name}: splash x`).toBeLessThan(Math.max(...xs));
      expect(sy, `${f.name}: splash y`).toBeGreaterThan(Math.min(...ys));
      expect(sy, `${f.name}: splash y`).toBeLessThan(Math.max(...ys));
      // And it is somewhere a Critter can actually get to: below the line it
      // trots in on, never above it.
      expect(sy, `${f.name}: splash below the trotting line`).toBeGreaterThan(art.stand[1]);
    }
  });

  it('keeps the foreground clay out of the band a Critter stands in', () => {
    /*
     * The repoussoir is corner-weighted precisely so it frames the stage instead
     * of covering it. The bottom-centre is where a Critter is set down and where
     * a child's hand rests for the entire length of a Wipe — a near mass there
     * would eat the cast's own feet, which is the one genuinely unforgivable
     * version of this element.
     */
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.fore, `${f.name}: the foreground`).not.toBeNull();
      const nearStand = art.fore!.clods.filter(
        (c) => Math.abs(c.cx - art.stand[0]) < f.critterW * 0.5,
      );
      for (const clod of nearStand) {
        expect(clod.cy - clod.r, `${f.name}: a clod rises past the Critter's feet`).toBeGreaterThan(
          art.stand[1],
        );
      }
    }
  });

  it('keeps every straw blade a blade, and every tuft taller than it is wide', () => {
    /*
     * A fan of separate blades never closes at the top, which is what keeps it
     * out of the convex-closed class however tall it gets. A tuft as wide as it
     * is tall is a bush — the gable barn, sitting on the ground.
     *
     * Both halves are asserted, because the first one caught a real bug in the
     * meadow: the config named a tuft 0.20 Critters wide and the generator's lean
     * multiplier drew it at 0.54, wider than tall. The config-level rule was
     * passing on a number the emitted geometry did not honour.
     */
    for (const f of FRAMES) {
      for (const tuft of build(f).straw) {
        for (const blade of tuft.blades) {
          const pts = coords(blade);
          const bw = Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
          const bh = Math.max(...pts.map(([, y]) => y)) - Math.min(...pts.map(([, y]) => y));
          expect(bh, `${f.name}: a blade is ${bw.toFixed(1)} x ${bh.toFixed(1)}`).toBeGreaterThan(bw);
        }
        const pts = tuft.blades.flatMap(coords);
        const tw = Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
        const th = Math.max(...pts.map(([, y]) => y)) - Math.min(...pts.map(([, y]) => y));
        expect(th, `${f.name}: a tuft is ${tw.toFixed(1)} wide by ${th.toFixed(1)} tall`).toBeGreaterThan(tw);
      }
    }
  });

  it('keeps every fence post a line rather than a block', () => {
    // The old run was five `<rect>`s 2 wide by 9 tall at fixed x — evenly spaced,
    // identical, and a row. These are tapered fills, jittered in position, lean
    // and height, and each is far taller than it is wide.
    for (const f of FRAMES) {
      for (const post of build(f).fence!.posts) {
        const pts = coords(post);
        const pw = Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
        const ph = Math.max(...pts.map(([, y]) => y)) - Math.min(...pts.map(([, y]) => y));
        expect(ph, `${f.name}: a post is ${pw.toFixed(1)} x ${ph.toFixed(1)}`).toBeGreaterThan(pw * 1.5);
      }
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
      JSON.stringify(buildBarnyard(BARNYARD, PHONE.frame, PHONE.critterW, BARNYARD_SEED + 1)),
    );
  });

  it('catches the rival shapes this Toy actually shipped', () => {
    /*
     * The check has to fire on the real historical failures, or it is decoration
     * that happens to be brown. The barn silhouette measured 0.55 of a Critter
     * on a phone and the puddle 0.68 — both squarely inside the 1/8-to-2.5 band,
     * and both drawn for the Toy's whole life without a review catching them.
     */
    expect(check({ ...BARNYARD, barnScale: 0.55 }, PHONE.critterW).map((v) => v.rule)).toContain('PEER SIZE');
    expect(check({ ...BARNYARD, puddleSpread: 0.68 }, PHONE.critterW).map((v) => v.rule)).toContain('PUDDLE');
    expect(check({ ...BARNYARD, bankSpread: 0.17 }, PHONE.critterW).map((v) => v.rule)).toContain('BANK');
    expect(check({ ...BARNYARD, clodRadius: 0.15 }, PHONE.critterW).map((v) => v.rule)).toContain('CLOD');
    expect(check({ ...BARNYARD, strawWidth: 0.34 }, PHONE.critterW).map((v) => v.rule)).toContain('STRAW');
    // The five 2x9 uprights, restated as a ratio: a post that wide is a block.
    expect(check({ ...BARNYARD, postWidth: 0.25 }, PHONE.critterW).map((v) => v.rule)).toContain('POST');
  });
});
