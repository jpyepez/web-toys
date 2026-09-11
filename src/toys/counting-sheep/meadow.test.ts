import { describe, it, expect } from 'vitest';
import { buildMeadow, check, walkYAt, type Frame } from './meadow';
import { MEADOW, MEADOW_SEED } from './meadow-config';

/**
 * The meadow's shape-class rules, as assertions rather than as prose.
 *
 * They exist in this form for a specific reason. The house rules were written
 * down carefully and then broken in the same session that wrote them — a rule
 * you can read and still not apply is not a rule; a rule that fails the build
 * is. This Toy is the proof: it shipped four convex, closed, white, Sheep-sized
 * cloud clusters and a lollipop tree behind a convex, closed, white, Sheep-sized
 * Sheep, and every review of it passed, because a screenshot of a sunny meadow
 * looks like a sunny meadow.
 *
 * What is asserted is the argument that licenses this background to exist at
 * all: a field made only of a cropped ground line, cropped banks, grass BLADES
 * and flower masses contains no Sheep-shaped object, so it cannot ask a
 * three-year-old to sort scenery from cast. Every check below is one clause of
 * that, evaluated at the two frames the Toy actually ships into.
 */

/** The two frames that matter, in the generator's own units. */
// 390x844 with the Sheep at clamp(150px, 46vw, 240px) = 179px, i.e. 46% of the
// width. A phone is only ~2.2 Sheep across.
const PHONE: { frame: Frame; sheepW: number } = { frame: { w: 100, h: 216.4 }, sheepW: 46.0 };
// 1440x900: the clamp caps the Sheep at 240px, so it is 16.7% of the width and
// the frame is ~6.0 Sheep across.
const DESKTOP: { frame: Frame; sheepW: number } = { frame: { w: 100, h: 62.5 }, sheepW: 16.67 };
const FRAMES = [
  { name: 'phone 9:19.5', ...PHONE },
  { name: 'desktop 16:10', ...DESKTOP },
];

const build = (f: { frame: Frame; sheepW: number }) =>
  buildMeadow(MEADOW, f.frame, f.sheepW, MEADOW_SEED);

/** Every coordinate pair in an emitted path, for measuring what was drawn. */
const coords = (d: string): Array<[number, number]> =>
  [...d.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((m) => [Number(m[1]), Number(m[2])]);

describe('Counting Sheep — the meadow', () => {
  it('passes its own shape-class rules at every shipped frame', () => {
    for (const f of FRAMES) {
      expect(check(MEADOW, f.sheepW), f.name).toEqual([]);
    }
  });

  it('never puts a background shape in the cast’s size band', () => {
    // THE rule the clouds and the tree broke, checked on the emitted geometry
    // rather than on the config. Anything round in this scene is either far
    // larger than a Sheep and cropped, or far smaller than one and part of a
    // counted mass — never the same size.
    for (const f of FRAMES) {
      const art = build(f);
      const band = { lo: f.sheepW / 8, hi: f.sheepW * 2.5 };

      expect(art.sun, `${f.name}: the sun`).not.toBeNull();
      const sunD = art.sun!.r * 2;
      expect(sunD, `${f.name}: the sun is ${(sunD / f.sheepW).toFixed(2)}x a Sheep`).toBeGreaterThanOrEqual(band.hi);

      for (const flower of art.flowers) {
        for (const lobe of flower.lobes) {
          expect(lobe.r * 2, `${f.name}: a bloom`).toBeLessThanOrEqual(band.lo);
        }
      }
      for (const mote of art.motes) {
        expect(mote.r * 2, `${f.name}: a mote`).toBeLessThanOrEqual(band.lo);
      }
    }
  });

  it('gives a wide frame more meadow SIDEWAYS, and a narrow one no banks at all', () => {
    /*
     * The counts-follow-the-frame rule, doing something more interesting here
     * than scaling a number.
     *
     * A bank must be at least 2.5 Sheep wide to clear the cast's size band. On a
     * phone the Sheep is 46% of the width, so 2.5 Sheep is ~115 frame units
     * against a 100-unit frame: there is NO bank a phone can hold that is not a
     * rival. So the phone gets none, and gets its depth from the cropped sun,
     * the cropped bough and the corner grass instead. A wide frame is ~6 Sheep
     * across and can hold one legally.
     */
    const phone = build(PHONE);
    const desktop = build(DESKTOP);
    expect(phone.banks.length, 'a phone cannot hold a legal bank').toBe(0);
    expect(desktop.banks.length, 'a wide frame gets banks').toBeGreaterThan(0);
    // Sizes follow the Sheep, counts follow the frame: the wide frame is more
    // Sheep across, so it gets more tufts and more blooms — not bigger ones.
    expect(desktop.tufts.length).toBeGreaterThan(phone.tufts.length);
    expect(desktop.flowers.length).toBeGreaterThan(phone.flowers.length);
  });

  it('crops every bank by a side edge, and lets none of them span', () => {
    // A bank that stops neatly inside the viewport reads as a sticker laid on
    // the picture; one that runs edge to edge is a rule drawn across it. Both
    // are what the two full-width hill paths this replaces were.
    for (const f of FRAMES) {
      for (const bank of build(f).banks) {
        const xs = coords(bank.fill).map(([x]) => x);
        const touchesEdge = Math.min(...xs) <= 0 || Math.max(...xs) >= f.frame.w;
        expect(touchesEdge, `${f.name}: a bank floats clear of both edges`).toBe(true);
      }
    }
  });

  it('lets only the walking line cross the frame horizontally', () => {
    // Everything else is bounded, cropped or short of the far edge. The bough is
    // the one that could get this wrong, because a limb long enough to read as a
    // limb is most of the way across a narrow frame already.
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.bough, `${f.name}: the bough`).not.toBeNull();
      const xs = coords(art.bough!.body).map(([x]) => x);
      const spread = Math.max(...xs) - Math.min(...xs);
      expect(spread, `${f.name}: the bough spans ${spread.toFixed(0)} of 100`).toBeLessThan(
        f.frame.w * 0.9,
      );
    }
  });

  it('stands the Sheep ON the line the backdrop draws', () => {
    /*
     * The whole reason the scene is a generator. These used to be two numbers
     * maintained by hand — hills drawn into a `--meadow-ground` CSS band, and
     * the Sheep placed at `calc(var(--meadow-ground) * 0.62)` — which agreed on
     * a phone and drifted apart as the viewport widened, floating the Sheep
     * above its own hill. One generator read by both cannot fall out of step.
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

  it('keeps the foreground grass out of the band the Sheep stands in', () => {
    /*
     * The repoussoir is corner-weighted precisely so it frames the stage instead
     * of covering it. The bottom-centre is where the Sheep's hooves land and
     * where a child's hand rests on a phone, and a near mass there would eat the
     * cast's own feet — the one genuinely unforgivable version of this element.
     */
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.fore, `${f.name}: the foreground`).not.toBeNull();
      const nearStand = art.fore!.blades.filter((d) =>
        coords(d).some(([x]) => Math.abs(x - art.stand[0]) < f.sheepW * 0.5),
      );
      for (const blade of nearStand) {
        const top = Math.min(...coords(blade).map(([, y]) => y));
        expect(top, `${f.name}: a blade rises past the Sheep's feet`).toBeGreaterThan(art.stand[1]);
      }
    }
  });

  it('keeps every blade a blade, and every tuft taller than it is wide', () => {
    /*
     * A fan of separate blades never closes at the top, which is what keeps it
     * out of the convex-closed class however tall it gets. A tuft as wide as it
     * is tall is a bush — the lollipop tree's crown, sitting on the ground.
     *
     * Both halves are asserted, because the first one caught a real bug: the
     * config named a tuft 0.20 Sheep wide and the generator's lean multiplier
     * drew it at 0.54, wider than tall. The config-level TUFT rule was passing
     * on a number the emitted geometry did not honour.
     */
    for (const f of FRAMES) {
      for (const tuft of build(f).tufts) {
        for (const blade of tuft.blades) {
          const pts = coords(blade);
          const bw = Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
          const bh = Math.max(...pts.map(([, y]) => y)) - Math.min(...pts.map(([, y]) => y));
          expect(bh, `${f.name}: a blade is ${bw.toFixed(1)} x ${bh.toFixed(1)}`).toBeGreaterThan(bw);
        }
        const pts = tuft.blades.flatMap(coords);
        const w = Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
        const h = Math.max(...pts.map(([, y]) => y)) - Math.min(...pts.map(([, y]) => y));
        expect(h, `${f.name}: a tuft is ${w.toFixed(1)} wide by ${h.toFixed(1)} tall`).toBeGreaterThan(w);
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
      JSON.stringify(buildMeadow(MEADOW, PHONE.frame, PHONE.sheepW, MEADOW_SEED + 1)),
    );
  });

  it('catches the rival shapes this Toy actually shipped', () => {
    /*
     * The check has to fire on the real historical failures, or it is decoration
     * that happens to be green. The cloud cluster measured 0.29 of a Sheep on a
     * phone and the tree canopy 0.17 — both squarely inside the 1/8-to-2.5 band,
     * and both drawn for years without anyone's review catching them.
     */
    expect(check({ ...MEADOW, sunScale: 0.29 }, PHONE.sheepW).map((v) => v.rule)).toContain('PEER SIZE');
    expect(check({ ...MEADOW, bankSpread: 0.17 }, PHONE.sheepW).map((v) => v.rule)).toContain('BANK');
    expect(check({ ...MEADOW, flowerLobe: 0.15 }, PHONE.sheepW).map((v) => v.rule)).toContain('BLOOM');
    expect(check({ ...MEADOW, tuftWidth: 0.34 }, PHONE.sheepW).map((v) => v.rule)).toContain('TUFT');
  });
});
