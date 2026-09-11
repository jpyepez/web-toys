import { describe, it, expect } from 'vitest';
import { buildReef, check, bedYAt, type Frame } from './reef';
import { REEF, REEF_SEED } from './reef-config';

/**
 * The reef's shape-class rules, as assertions rather than as prose.
 *
 * They exist in this form for a specific reason. The house rules were written
 * down carefully and then broken in the same session that wrote them — a rule
 * you can read and still not apply is not a rule; a rule that fails the build
 * is. This Toy is the proof: it shipped two convex, closed, Fish-sized coral
 * clumps flanking a convex, closed, Fish-sized Fish, and every review of it
 * passed, because a screenshot of a sunlit reef looks like a sunlit reef.
 *
 * What is asserted is the argument that licenses this background to exist at
 * all: a reef made only of a cropped seabed, cropped ridges, kelp STIPES,
 * sea-fan BLADES and polyp masses contains no Fish-shaped object, so it cannot
 * ask a three-year-old to sort scenery from cast. Every check below is one
 * clause of that, evaluated at the two frames the Toy actually ships into.
 */

/** The two frames that matter, in the generator's own units. */
// 390x844 with the Fish at clamp(140px, 44vw, 220px) = 172px, i.e. 44% of the
// width. A phone is only ~2.3 Fish across.
const PHONE: { frame: Frame; fishW: number } = { frame: { w: 100, h: 216.4 }, fishW: 44.0 };
// 1440x900: the clamp caps the Fish at 220px, so it is 15.3% of the width and
// the frame is ~6.5 Fish across.
const DESKTOP: { frame: Frame; fishW: number } = { frame: { w: 100, h: 62.5 }, fishW: 15.28 };
const FRAMES = [
  { name: 'phone 9:19.5', ...PHONE },
  { name: 'desktop 16:10', ...DESKTOP },
];

const build = (f: { frame: Frame; fishW: number }) => buildReef(REEF, f.frame, f.fishW, REEF_SEED);

/** Every coordinate pair in an emitted path, for measuring what was drawn. */
const coords = (d: string): Array<[number, number]> =>
  [...d.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((m) => [Number(m[1]), Number(m[2])]);

describe('Puffer Fish — the reef', () => {
  it('passes its own shape-class rules at every shipped frame', () => {
    for (const f of FRAMES) {
      expect(check(REEF, f.fishW), f.name).toEqual([]);
    }
  });

  it('never puts a background shape in the cast’s size band', () => {
    // THE rule the coral clumps broke, checked on the emitted geometry rather
    // than on the config. Anything round in this scene is either far larger than
    // a Fish and cropped, or far smaller than one and part of a counted mass —
    // never the same size.
    for (const f of FRAMES) {
      const art = build(f);
      const band = { lo: f.fishW / 8, hi: f.fishW * 2.5 };

      expect(art.sun, `${f.name}: the sun`).not.toBeNull();
      const sunD = art.sun!.r * 2;
      expect(sunD, `${f.name}: the sun is ${(sunD / f.fishW).toFixed(2)}x a Fish`).toBeGreaterThanOrEqual(
        band.hi,
      );

      for (const polyp of art.polyps) {
        for (const lobe of polyp.lobes) {
          expect(lobe.r * 2, `${f.name}: a polyp head`).toBeLessThanOrEqual(band.lo);
        }
      }
      for (const bubble of art.bubbles) {
        expect(bubble.r * 2, `${f.name}: a bubble`).toBeLessThanOrEqual(band.lo);
      }
    }
  });

  it('gives a wide frame more reef SIDEWAYS, and a narrow one no ridges at all', () => {
    /*
     * The counts-follow-the-frame rule, doing something more interesting here
     * than scaling a number.
     *
     * A ridge must be at least 2.5 Fish wide to clear the cast's size band. On a
     * phone the Fish is 44% of the width, so 2.5 Fish is ~110 frame units
     * against a 100-unit frame: there is NO ridge a phone can hold that is not a
     * rival. So the phone gets none, and gets its depth from the cropped sun,
     * the cropped kelp and the corner reef instead.
     */
    const phone = build(PHONE);
    const desktop = build(DESKTOP);
    expect(phone.ridges.length, 'a phone cannot hold a legal ridge').toBe(0);
    expect(desktop.ridges.length, 'a wide frame gets ridges').toBeGreaterThan(0);
    // Sizes follow the Fish, counts follow the frame: the wide frame is more
    // Fish across, so it gets more fans and more polyps — not bigger ones.
    expect(desktop.fronds.length).toBeGreaterThan(phone.fronds.length);
    expect(desktop.polyps.length).toBeGreaterThan(phone.polyps.length);
    expect(desktop.kelps.length).toBeGreaterThan(phone.kelps.length);
  });

  it('crops every ridge by a side edge, and lets none of them span', () => {
    // A ridge that stops neatly inside the viewport reads as a sticker laid on
    // the picture; one that runs edge to edge is a rule drawn across it.
    for (const f of FRAMES) {
      for (const ridge of build(f).ridges) {
        const xs = coords(ridge.fill).map(([x]) => x);
        const touchesEdge = Math.min(...xs) <= 0 || Math.max(...xs) >= f.frame.w;
        expect(touchesEdge, `${f.name}: a ridge floats clear of both edges`).toBe(true);
      }
    }
  });

  it('roots every kelp in the bed and crops it by the top edge', () => {
    /*
     * The clumps this replaces were closed heads sitting on the sand. A stipe is
     * only admissible because it is ELONGATED and OPEN and the frame cuts it —
     * a plant that stopped inside the viewport would be a lollipop tree again,
     * with kelp for a crown. Both ends are checked: rooted at or below the bed,
     * and past the top edge.
     */
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.kelps.length, `${f.name}: the kelp`).toBeGreaterThan(0);
      for (const kelp of art.kelps) {
        const pts = coords(kelp.body);
        const top = Math.min(...pts.map(([, y]) => y));
        const bottom = Math.max(...pts.map(([, y]) => y));
        expect(top, `${f.name}: a stipe stops inside the frame`).toBeLessThanOrEqual(0);
        const rootX = pts.reduce((best, p) => (p[1] > best[1] ? p : best))[0];
        expect(bottom, `${f.name}: a stipe floats clear of the bed`).toBeGreaterThanOrEqual(
          bedYAt(art.bed, rootX) - f.fishW * 0.1,
        );
      }
    }
  });

  it('lets only the seabed cross the frame horizontally', () => {
    // Everything else is bounded, cropped or short of the far edge. The kelp is
    // the one that could get this wrong, because a plant long enough to read as
    // kelp leans a good way across a narrow frame already. The rays cross
    // vertically, which is a different rule — they are light, not mass.
    for (const f of FRAMES) {
      for (const kelp of build(f).kelps) {
        const xs = coords(kelp.body).map(([x]) => x);
        const spread = Math.max(...xs) - Math.min(...xs);
        expect(spread, `${f.name}: a stipe spans ${spread.toFixed(0)} of 100`).toBeLessThan(
          f.frame.w * 0.9,
        );
      }
    }
  });

  it('hovers the Fish over the bed the backdrop draws, clear of the sand', () => {
    /*
     * The whole reason the scene is a generator. These used to be two numbers
     * maintained by hand — sand drawn into a `--ocean-floor` CSS length, and the
     * Fish placed at `top: 42%` of the viewport — which agreed on a phone and
     * drifted apart as the viewport widened, leaving the Fish halfway up an
     * empty blue rectangle. One generator read by both cannot fall out of step.
     *
     * The clearance is asserted with it, because a swimming Critter carries NO
     * contact shadow: it cannot rest on anything, so an underside in the sand
     * reads as beached rather than as landed.
     */
    for (const f of FRAMES) {
      const { bed, float } = build(f);
      expect(float[0]).toBe(f.frame.w / 2);
      const bedHere = bedYAt(bed, f.frame.w / 2);
      expect(bedHere - float[1]).toBeCloseTo(f.fishW * REEF.hoverGap, 4);
      // The Fish's body is ~0.28 of its own width in vertical radius, so the gap
      // below its underside is what actually has to clear.
      expect(bedHere - (float[1] + f.fishW * 0.28)).toBeGreaterThan(0);
      // And the bed is genuinely a line, not a flat rule: a dead-level floor is
      // a stripe, which is the composition this replaces.
      const ys = bed.map(([, y]) => y);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0);
    }
  });

  it('keeps the foreground reef below the Fish it frames', () => {
    /*
     * The repoussoir is corner-weighted precisely so it frames the stage instead
     * of covering it. The bottom-centre is where a child's hand rests on a phone,
     * and a near mass rising into the hover band would eat the cast.
     */
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.fore, `${f.name}: the foreground`).not.toBeNull();
      const underside = art.float[1] + f.fishW * 0.34;
      for (const blade of art.fore!.blades) {
        const top = Math.min(...coords(blade).map(([, y]) => y));
        expect(top, `${f.name}: a foreground blade rises into the Fish`).toBeGreaterThan(underside);
      }
    }
  });

  it('keeps every blade a blade, and every fan taller than it is wide', () => {
    /*
     * A spray of separate blades never closes at the top, which is what keeps it
     * out of the convex-closed class however tall it gets. A fan as wide as it is
     * tall is a coral clump, sitting on the sand.
     *
     * Both halves are asserted, because the same check caught a real bug in the
     * meadow: the config named a tuft 0.20 units wide and the generator's lean
     * multiplier drew it at 0.54, wider than tall. The config-level rule was
     * passing on a number the emitted geometry did not honour.
     */
    for (const f of FRAMES) {
      for (const frond of build(f).fronds) {
        for (const blade of frond.blades) {
          const pts = coords(blade);
          const bw = Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
          const bh = Math.max(...pts.map(([, y]) => y)) - Math.min(...pts.map(([, y]) => y));
          expect(bh, `${f.name}: a blade is ${bw.toFixed(1)} x ${bh.toFixed(1)}`).toBeGreaterThan(bw);
        }
        const pts = frond.blades.flatMap(coords);
        const w = Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
        const h = Math.max(...pts.map(([, y]) => y)) - Math.min(...pts.map(([, y]) => y));
        expect(h, `${f.name}: a fan is ${w.toFixed(1)} wide by ${h.toFixed(1)} tall`).toBeGreaterThan(w);
      }
    }
  });

  it('crops every light shaft at both ends', () => {
    // A shaft is the one element allowed to cross the frame vertically, and it
    // earns that only by being cut at both ends: one that stopped inside the
    // viewport would be a painted stripe rather than light falling through.
    for (const f of FRAMES) {
      for (const ray of build(f).rays) {
        const ys = coords(ray).map(([, y]) => y);
        expect(Math.min(...ys), `${f.name}: a shaft starts inside the frame`).toBeLessThan(0);
        expect(Math.max(...ys), `${f.name}: a shaft ends inside the frame`).toBeGreaterThan(f.frame.h);
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
      JSON.stringify(buildReef(REEF, PHONE.frame, PHONE.fishW, REEF_SEED + 1)),
    );
  });

  it('catches the rival shapes this Toy actually shipped', () => {
    /*
     * The check has to fire on the real historical failure, or it is decoration
     * that happens to be blue. The coral clumps measured 0.35 of a Fish on a
     * phone — squarely inside the 1/8-to-2.5 band — and were drawn for months
     * without anyone's review catching them.
     */
    const rules = (cfg: Parameters<typeof check>[0]) => check(cfg, PHONE.fishW).map((v) => v.rule);
    expect(rules({ ...REEF, sunScale: 0.35 })).toContain('PEER SIZE');
    expect(rules({ ...REEF, ridgeSpread: 0.35 })).toContain('RIDGE');
    expect(rules({ ...REEF, polypLobe: 0.15 })).toContain('POLYP');
    expect(rules({ ...REEF, frondWidth: 0.34 })).toContain('FROND');
    // And the failure specific to a Critter that swims: parked on the sand with
    // no contact shadow to explain it.
    expect(rules({ ...REEF, hoverGap: 0.2 })).toContain('HOVER');
  });
});
