import { describe, it, expect } from 'vitest';
import { buildSky, check, groundYAt, type Frame } from './sky';
import { SKY, SKY_SEED } from './sky-config';
import { BALLOON_ASPECT, KNOT_OFFSET } from './balloon-metrics';
import { BALLOONS } from './palette';

/**
 * The sky's shape-class rules, as assertions rather than as prose.
 *
 * They exist in this form for a specific reason. The house rules were written
 * down carefully and then broken in the same session that wrote them — a rule
 * you can read and still not apply is not a rule; a rule that fails the build
 * is. This Toy is the sharpest proof in the collection: it shipped five convex,
 * closed, rounded, balloon-sized cloud puffs behind five convex, closed, rounded
 * balloons, and every review of it passed, because a screenshot of a sunny sky
 * with clouds in it looks like a sunny sky with clouds in it.
 *
 * What is asserted is the argument that licenses this background to exist at
 * all: a sky made only of cropped cloud banks, a cropped ground line, grass
 * BLADES and a stake contains no balloon-shaped object, so it cannot ask a
 * three-year-old to sort scenery from cast. Every check below is one clause of
 * that, evaluated at the two frames the Toy actually ships into.
 */

/** The two frames that matter, in the generator's own units. */
// 390x844 with a balloon at clamp(96px, 28vw, 190px) = 109px, i.e. 28% of the
// width. A phone is ~3.6 balloons across.
const PHONE: { frame: Frame; balloonW: number } = { frame: { w: 100, h: 216.4 }, balloonW: 28 };
// 1440x900: the clamp caps a balloon at 190px, so it is 13.2% of the width and
// the frame is ~7.6 balloons across.
const DESKTOP: { frame: Frame; balloonW: number } = { frame: { w: 100, h: 62.5 }, balloonW: 13.19 };
const FRAMES = [
  { name: 'phone 9:19.5', ...PHONE },
  { name: 'desktop 16:10', ...DESKTOP },
];

const build = (f: { frame: Frame; balloonW: number }) =>
  buildSky(SKY, f.frame, f.balloonW, SKY_SEED, BALLOONS.length);

/**
 * The ON-PATH points of an emitted path — the ones the curve actually passes
 * through.
 *
 * Sweeping every coordinate pair with a regex is the obvious way to do this and
 * it is wrong, which cost a real diagnosis here. `closedPath` emits cubic
 * Béziers, so two of every three pairs are CONTROL points, and Catmull-Rom's
 * controls overshoot hard at a corner: a cloud bank genuinely spanning 73 units
 * measured as 120, and the "this is a roof" assertion fired on a scene that was
 * two thirds open sky. A test that measures the control hull is not measuring
 * the picture.
 */
const coords = (d: string): Array<[number, number]> => {
  const out: Array<[number, number]> = [];
  for (const cmd of d.matchAll(/([MLC])([^MLCZz]*)/g)) {
    const nums = [...cmd[2].matchAll(/-?\d+\.?\d*/g)].map(Number);
    for (let i = 0; i + 1 < nums.length; i += 2) {
      // In a `C` run only every third pair is on the curve; the other two are
      // the handles.
      if (cmd[1] === 'C' && (i / 2) % 3 !== 2) continue;
      out.push([nums[i], nums[i + 1]]);
    }
  }
  return out;
};

describe('Up & Away — the sky', () => {
  it('passes its own shape-class rules at every shipped frame', () => {
    for (const f of FRAMES) {
      expect(check(SKY, f.balloonW), f.name).toEqual([]);
    }
  });

  it('never puts a background shape in the cast’s size band', () => {
    // THE rule the five cloud circles broke, checked on the emitted geometry
    // rather than on the config. Anything in this scene is either far wider than
    // a balloon and cropped by the frame, or far smaller than one and part of a
    // counted mass — never the same size, which in a Toy about round things is
    // the difference between a background and a decoy.
    for (const f of FRAMES) {
      const art = build(f);
      const band = { lo: f.balloonW / 8, hi: f.balloonW * 2.5 };

      expect(art.clouds.length, `${f.name}: the cloud banks`).toBeGreaterThan(0);
      for (const cloud of art.clouds) {
        const xs = coords(cloud.fill).map(([x]) => x);
        const span = Math.max(...xs) - Math.min(...xs);
        expect(
          span,
          `${f.name}: a cloud bank spans ${(span / f.balloonW).toFixed(2)} balloons`,
        ).toBeGreaterThanOrEqual(band.hi);
      }
      for (const mote of art.motes) {
        expect(mote.r * 2, `${f.name}: a mote`).toBeLessThanOrEqual(band.lo);
      }
    }
  });

  it('crops every cloud bank by the top edge AND a side edge', () => {
    // A mass that stops neatly inside the viewport reads as a sticker laid on the
    // picture — which is exactly what five circles floating in the middle of the
    // sky were. Anchoring each bank in a top corner is what makes it scenery the
    // frame happens to cut rather than an object placed in the shot.
    for (const f of FRAMES) {
      for (const cloud of build(f).clouds) {
        const pts = coords(cloud.fill);
        const xs = pts.map(([x]) => x);
        const ys = pts.map(([, y]) => y);
        expect(Math.min(...ys), `${f.name}: a cloud bank clears the top edge`).toBeLessThanOrEqual(0);
        const touchesSide = Math.min(...xs) <= 0 || Math.max(...xs) >= f.frame.w;
        expect(touchesSide, `${f.name}: a cloud bank floats clear of both side edges`).toBe(true);
      }
    }
  });

  it('leaves the sky open — the banks never close the top edge into a roof', () => {
    /*
     * The one thing this scene must not have, and the reason the rule here is
     * about OPENNESS rather than about width.
     *
     * On a phone a balloon is 28% of the frame, so a cloud bank wide enough to
     * clear the cast's size band (2.5 balloons, ~70 units) already covers most
     * of a 100-unit top edge. There is no narrower legal bank — anything that
     * leaves more sky at the top is a puff, which is the thing being fixed. So
     * width is not the constraint; what has to hold is that the sky stays open
     * where it matters.
     *
     * The Nestlings canopy hangs a continuous ceiling right across the top,
     * which is correct for a Toy that is UNDER a tree. Here the balloons have to
     * look like they can leave, so: one top corner stays clear of every bank,
     * and no bank hangs down into the bunch.
     */
    for (const f of FRAMES) {
      const art = build(f);
      const cloudPts = art.clouds.map((c) => coords(c.fill));

      // The UNION of what the banks cover along the top edge, clamped to the
      // frame. Measuring corners is not enough: a wide frame gets a bank in each
      // corner, and that is two cropped masses with open sky between them rather
      // than a ceiling. What matters is that a real stretch of the top edge has
      // nothing over it, wherever it happens to be.
      const spans = cloudPts
        .map((pts) => {
          const xs = pts.map(([x]) => x);
          return [Math.max(0, Math.min(...xs)), Math.min(f.frame.w, Math.max(...xs))] as const;
        })
        .sort((a, b) => a[0] - b[0]);
      let covered = 0;
      let reach = 0;
      for (const [lo, hi] of spans) {
        covered += Math.max(0, hi - Math.max(lo, reach));
        reach = Math.max(reach, hi);
      }
      const open = 1 - covered / f.frame.w;
      expect(open, `${f.name}: the banks cover ${(100 - open * 100).toFixed(0)}% of the top edge`).toBeGreaterThan(0.15);

      // And the banks stay UP in the sky rather than sinking into the bunch. A
      // cloud passing behind a raised balloon is fine and wanted — overlap is the
      // only depth cue this style has — but one hanging down to the tether would
      // put scenery in among the things a child is trying to pick out.
      const lowestCloud = Math.max(...cloudPts.flat().map(([, y]) => y));
      expect(lowestCloud, `${f.name}: a bank hangs down to the peg`).toBeLessThan(
        art.tether[1] - f.balloonW * KNOT_OFFSET,
      );
    }
  });

  it('gives a wide frame more sky SIDEWAYS, not the same sky enlarged', () => {
    // Counts follow the frame, sizes follow the balloon. The wide frame is more
    // balloons across, so it gets more tufts and a second cloud bank — never
    // bigger ones.
    const phone = build(PHONE);
    const desktop = build(DESKTOP);
    expect(desktop.tufts.length).toBeGreaterThan(phone.tufts.length);
    expect(desktop.clouds.length).toBeGreaterThanOrEqual(phone.clouds.length);
    expect(phone.banks.length, 'a phone has no room for a legal bank').toBe(0);
    expect(desktop.banks.length, 'a wide frame gets banks').toBeGreaterThan(0);
  });

  it('lets only the ground line cross the frame horizontally', () => {
    // Everything else is bounded, cropped or short of the far edge. A line
    // running edge to edge is a rule drawn across the picture, and the old scene
    // had two of them — the grass path and the horizon it sat on.
    for (const f of FRAMES) {
      const art = build(f);
      const ys = art.line.map(([, y]) => y);
      // And the line is genuinely a line, not a flat rule: a dead-level ground
      // is a stripe, which is the composition this replaces.
      expect(Math.max(...ys) - Math.min(...ys), `${f.name}: the ground is dead level`).toBeGreaterThan(0);
      const pegXs = coords(art.peg.body).map(([x]) => x);
      const pegSpan = Math.max(...pegXs) - Math.min(...pegXs);
      expect(pegSpan, `${f.name}: the peg`).toBeLessThan(f.balloonW * 0.5);
    }
  });

  it('ties every balloon in the bunch to the peg the backdrop draws', () => {
    /*
     * The whole reason the scene is a generator. These used to be two sets of
     * numbers maintained by hand — a peg drawn at x 50 of a
     * `preserveAspectRatio="none"` band that STRETCHED with the viewport, and
     * five balloons at hand-tuned `left`/`top` percentages of the Toy's
     * `<main>`, each with a fixed-length string that pointed at nothing in
     * particular. They agreed on a 390x844 phone and nowhere else. One generator
     * read by both cannot fall out of step.
     */
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.anchors, `${f.name}: one anchor per balloon`).toHaveLength(BALLOONS.length);

      // The tether is the top of the peg the backdrop actually paints.
      const pegYs = coords(art.peg.body).map(([, y]) => y);
      expect(art.tether[1]).toBeCloseTo(Math.min(...pegYs), 0);
      // And the peg is driven into the ground line, not floating above it.
      expect(art.tether[1]).toBeLessThan(groundYAt(art.line, art.tether[0]));
      expect(Math.max(...pegYs)).toBeGreaterThan(groundYAt(art.line, art.tether[0]));

      for (const [ax, ay] of art.anchors) {
        // Every knot hangs ABOVE the tether — a balloon below the peg it is tied
        // to is a balloon that has fallen over.
        expect(ay, `${f.name}: a knot at or below the tether`).toBeLessThan(art.tether[1]);
        // And the whole drawing fits: half a balloon clear of each side edge, and
        // its crown clear of the top.
        expect(ax).toBeGreaterThanOrEqual(f.balloonW * 0.5 - 0.001);
        expect(ax).toBeLessThanOrEqual(f.frame.w - f.balloonW * 0.5 + 0.001);
        expect(ay - f.balloonW * KNOT_OFFSET, `${f.name}: a crown off the top edge`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the bunch inside the reachable band and the sky above it open', () => {
    /*
     * The mobile-first constraint, as arithmetic. On a phone the bunch has to
     * clear the bottom palm-rest dead zone where a thumb rests and the top
     * safe-area, and it must not fill the tall sky it is supposed to rise into —
     * that sky IS the Toy's load-bearing space, and a bunch that occupies it
     * leaves the balloons nowhere to go.
     */
    const art = build(PHONE);
    const h = PHONE.frame.h;
    const top = Math.min(...art.anchors.map(([, y]) => y)) - PHONE.balloonW * KNOT_OFFSET;
    const bottom = Math.max(...art.anchors.map(([, y]) => y));
    expect(top / h, 'the bunch reaches too near the top safe-area').toBeGreaterThan(0.25);
    expect(bottom / h, 'the bunch sits in the palm-rest dead zone').toBeLessThan(0.88);
    expect(top / h, 'the open sky above the bunch has been squeezed out').toBeLessThan(0.6);
  });

  it('keeps the foreground grass out of the band the bunch is tied in', () => {
    /*
     * The repoussoir is corner-weighted precisely so it frames the stage instead
     * of covering it. The bottom-centre is where the peg is driven in and where a
     * child's hand rests on a phone, and a near mass there would swallow the one
     * point the whole scene converges on.
     */
    for (const f of FRAMES) {
      const art = build(f);
      expect(art.fore, `${f.name}: the foreground`).not.toBeNull();
      const nearPeg = art.fore!.blades.filter((d) =>
        coords(d).some(([x]) => Math.abs(x - art.tether[0]) < f.balloonW * 0.5),
      );
      for (const blade of nearPeg) {
        const top = Math.min(...coords(blade).map(([, y]) => y));
        expect(top, `${f.name}: a blade rises past the tether`).toBeGreaterThan(art.tether[1]);
      }
    }
  });

  it('keeps every blade a blade, and every tuft taller than it is wide', () => {
    // A fan of separate blades never closes at the top, which is what keeps it
    // out of the convex-closed class however tall it gets. A tuft as wide as it
    // is tall is a bush — a cloud puff that fell out of the sky.
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
        const hgt = Math.max(...pts.map(([, y]) => y)) - Math.min(...pts.map(([, y]) => y));
        expect(hgt, `${f.name}: a tuft is ${w.toFixed(1)} wide by ${hgt.toFixed(1)} tall`).toBeGreaterThan(w);
      }
    }
  });

  it('keeps the peg a stake rather than a block under the bunch', () => {
    // Its `<ellipse>` cap was the cloud puff's shape class one octave down,
    // sitting at the exact point the child's eye is drawn to. What replaces it is
    // a tapered post: elongated and open, which carries no licence problem at any
    // length that does not span the frame.
    for (const f of FRAMES) {
      const pts = coords(build(f).peg.body);
      const w = Math.max(...pts.map(([x]) => x)) - Math.min(...pts.map(([x]) => x));
      const hgt = Math.max(...pts.map(([, y]) => y)) - Math.min(...pts.map(([, y]) => y));
      expect(hgt / w, `${f.name}: the peg is ${w.toFixed(1)} x ${hgt.toFixed(1)}`).toBeGreaterThan(3);
    }
  });

  it('is a pure function of its config, frame, seed and bunch size', () => {
    // The saved config is the deliverable, and it is a lie if the same numbers do
    // not reproduce the same picture. Every random draw comes from a named seeded
    // stream; there is no bare `Math.random()` in the render path.
    for (const f of FRAMES) {
      expect(JSON.stringify(build(f))).toBe(JSON.stringify(build(f)));
    }
    expect(JSON.stringify(build(PHONE))).not.toBe(
      JSON.stringify(buildSky(SKY, PHONE.frame, PHONE.balloonW, SKY_SEED + 1, BALLOONS.length)),
    );
    // The fan follows the bunch size rather than assuming five, so the on-device
    // duration lever cannot silently leave a balloon without an anchor.
    expect(buildSky(SKY, PHONE.frame, PHONE.balloonW, SKY_SEED, 3).anchors).toHaveLength(3);
    expect(buildSky(SKY, PHONE.frame, PHONE.balloonW, SKY_SEED, 7).anchors).toHaveLength(7);
  });

  it('catches the rival shapes this Toy actually shipped', () => {
    /*
     * The check has to fire on the real historical failures, or it is decoration
     * that happens to be green. The cloud circles measured 0.25 to 0.31 of a
     * balloon on a phone and the peg's cap about 0.12 — the first squarely inside
     * the 1/8-to-2.5 band, the second right on its floor, and both drawn for the
     * life of the Toy without anyone's review catching them.
     */
    expect(check({ ...SKY, cloudSpan: 0.31 }, PHONE.balloonW).map((v) => v.rule)).toContain('CLOUD');
    expect(check({ ...SKY, lobeRatio: 0.2 }, PHONE.balloonW).map((v) => v.rule)).toContain('LOBE');
    expect(check({ ...SKY, bankSpread: 0.5 }, PHONE.balloonW).map((v) => v.rule)).toContain('BANK');
    expect(check({ ...SKY, tuftWidth: 0.34 }, PHONE.balloonW).map((v) => v.rule)).toContain('TUFT');
    expect(check({ ...SKY, pegHeight: 0.12 }, PHONE.balloonW).map((v) => v.rule)).toContain('PEG');
    expect(check({ ...SKY, bunchRise: 4 }, PHONE.balloonW).map((v) => v.rule)).toContain('HEADROOM');
  });

  it('measures the bunch against a balloon, not against the viewport', () => {
    /*
     * The unit rule, checked where it bites. A balloon is 28% of a phone's width
     * and 13% of a desktop's, so a fan authored in FRAME units would be a tight
     * cluster on one and a scatter across the other — which is exactly what the
     * hand-tuned `left: 22%` … `left: 78%` percentages were. Authored in
     * balloons, the fan is the same shape relative to the cast at both, which is
     * what makes it read as one bunch on a string rather than as five balloons
     * that happen to be near each other.
     *
     * The tolerance is a quarter of a balloon because each knot carries its own
     * small jitter (nothing in this collection is mirrored), and the two frames
     * draw different numbers out of the shared seeded stream on the way here.
     */
    const spread = (f: { frame: Frame; balloonW: number }) => {
      const xs = build(f).anchors.map(([x]) => x);
      return Math.max(...xs) - Math.min(...xs);
    };
    const inBalloons = (f: { frame: Frame; balloonW: number }) => spread(f) / f.balloonW;
    expect(Math.abs(inBalloons(DESKTOP) - inBalloons(PHONE))).toBeLessThan(0.25);
    // The same measurement in frame units is nearly half — which is the whole
    // point: had the fan been authored there, it would have changed class as the
    // frame grew.
    expect(spread(DESKTOP)).toBeLessThan(spread(PHONE) * 0.6);
    // And a balloon's own box is taller than it is wide, which is what the
    // anchor arithmetic assumes when it lifts the drawing off its knot.
    expect(BALLOON_ASPECT).toBeGreaterThan(1);
  });
});
