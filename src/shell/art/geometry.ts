/**
 * Path construction. This module is where RULE 5 ("no unmodified primitives")
 * and RULE 9 ("line is a tapered filled path, not a stroke") actually live.
 *
 * Everything here is pure geometry — no filters, no blend modes, nothing that
 * costs a raster. That matters: a shape built here can animate by transform all
 * day without ever re-running anything.
 */

export type Pt = [number, number];

/* ------------------------------------------------------------------ *
 * Closed smooth paths
 * ------------------------------------------------------------------ */

/**
 * Closed Catmull-Rom through every point, emitted as cubic Béziers.
 *
 * Sampling a shape as points and smoothing them is what lets a silhouette carry
 * jitter and still read as one continuous form. Drawing the same shape as
 * `<ellipse>` cannot: a primitive has no vertices to perturb, which is exactly
 * why unmodified primitives read as software rather than as drawing.
 */
export function closedPath(pts: readonly Pt[]): string {
  const n = pts.length;
  if (n < 3) return '';
  const at = (i: number) => pts[((i % n) + n) % n];
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d +=
      `C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ` +
      `${c2[0].toFixed(2)},${c2[1].toFixed(2)} ` +
      `${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + 'Z';
}

/**
 * A blob: an ellipse whose radius is modulated by a smooth periodic function, so
 * it stays a closed loop with no seam. This is Vera Molnár's "1% disorder" made
 * concrete — a perfectly regular system with a small controlled perturbation,
 * where the tension between the rule and its violation is the thing that reads
 * as alive.
 *
 * `amp` is a fraction of the radius. 0 gives you back a clean ellipse; 0.02–0.06
 * is the useful band. Harmonics are low-order on purpose: high-frequency wobble
 * reads as a rendering fault, not as a hand.
 */
export function blob(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  amp: number,
  rnd: () => number,
  segments = 22,
): { d: string; pts: Pt[] } {
  // 2–4 cycles around the shape: enough to be felt, too few to look noisy.
  const harmonics = [2, 3, 5].map((k) => ({
    k,
    a: (amp / k) * (0.6 + rnd() * 0.8),
    phase: rnd() * Math.PI * 2,
  }));
  const pts: Pt[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    let m = 1;
    for (const h of harmonics) m += h.a * Math.sin(h.k * t + h.phase);
    pts.push([cx + Math.cos(t) * rx * m, cy + Math.sin(t) * ry * m]);
  }
  return { d: closedPath(pts), pts };
}

/* ------------------------------------------------------------------ *
 * Variable-width contour — the Bruna "heartbeat" line
 * ------------------------------------------------------------------ */

/** Per-vertex outward normals, averaged from the two adjacent edges. */
function normals(pts: readonly Pt[]): Pt[] {
  const n = pts.length;
  const at = (i: number) => pts[((i % n) + n) % n];
  return pts.map((_, i) => {
    const [px, py] = at(i - 1);
    const [nx, ny] = at(i + 1);
    const dx = nx - px;
    const dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    // Rotate the tangent 90°. With SVG's y-down axes this points outward for a
    // counter-clockwise-in-screen-terms loop, which is what `blob` emits.
    return [dy / len, -dx / len] as Pt;
  });
}

/** Offsets a closed loop by a per-vertex distance. Negative moves inward. */
function offsetLoop(pts: readonly Pt[], dist: (i: number, t: number) => number): Pt[] {
  const ns = normals(pts);
  return pts.map((p, i) => {
    const d = dist(i, i / pts.length);
    return [p[0] + ns[i][0] * d, p[1] + ns[i][1] * d] as Pt;
  });
}

/**
 * RULE 9. SVG has no variable-width stroke — `stroke-width` is a single value in
 * both SVG 1.1 and SVG 2, and the proposed variable-width stroking never shipped
 * anywhere. So a contour that swells and thins has to be a FILLED RING: an outer
 * loop and a reversed inner loop in one path.
 *
 * The width profile is not decoration. A drawn contour is heaviest where light
 * is occluded — the underside of a form — and lightest on top. `taper` is how
 * much that varies; `wobble` is the hand.
 */
export function contourRing(
  pts: readonly Pt[],
  width: number,
  taper: number,
  wobble: number,
  rnd: () => number,
): string {
  const phase = rnd() * Math.PI * 2;
  const w = (_i: number, t: number) => {
    const theta = t * Math.PI * 2;
    // sin(theta) peaks at the bottom of the loop in SVG's y-down space.
    const heavy = 1 + taper * Math.sin(theta);
    const hand = 1 + wobble * Math.sin(theta * 7 + phase);
    return Math.max(0.05, (width / 2) * heavy * hand);
  };
  const outer = offsetLoop(pts, w);
  const inner = offsetLoop(pts, (i, t) => -w(i, t));
  return `${closedPath(outer)} ${closedPath([...inner].reverse())}`;
}

/**
 * The open-path counterpart: a centreline plus a pressure profile, emitted as a
 * closed filled outline that tapers to points at both ends. For legs, strings,
 * twigs, whiskers — every line that is its own object rather than a border.
 *
 * `bias` shifts the fattest part along the stroke (0.5 = centred). Real strokes
 * are front-loaded, because a hand puts pressure on early and lifts off.
 */
export function taperedOutline(
  pts: readonly Pt[],
  maxWidth: number,
  bias = 0.45,
): string {
  const n = pts.length - 1;
  if (n < 1) return '';
  const half = (t: number) => {
    // A skewed sine: thin at both ends, fat near `bias`.
    const s = t < bias ? t / bias : 1 - (t - bias) / (1 - bias);
    return (maxWidth / 2) * (0.08 + 0.92 * Math.pow(Math.max(0, s), 0.6));
  };
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = pts[i];
    const [px, py] = pts[Math.max(0, i - 1)];
    const [nx, ny] = pts[Math.min(n, i + 1)];
    const dx = nx - px;
    const dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * half(t);
    const oy = (dx / len) * half(t);
    left.push(`${(x + ox).toFixed(2)},${(y + oy).toFixed(2)}`);
    right.unshift(`${(x - ox).toFixed(2)},${(y - oy).toFixed(2)}`);
  }
  return `M${left.join('L')}L${right.join('L')}Z`;
}

/** Samples a quadratic curve into points, for feeding `taperedOutline`. */
export function quadPts(a: Pt, ctrl: Pt, b: Pt, n = 12): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * a[0] + 2 * u * t * ctrl[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * ctrl[1] + t * t * b[1],
    ]);
  }
  return out;
}

/**
 * A crescent following the contact contour between two forms — RULE 8's
 * occlusion shape. Clipped to the lower form by the caller, so its far edge is
 * literally the parent's own outline (RULE 4: subdivision, not stacking).
 */
export function crescent(cx: number, cy: number, r: number, depth: number, squash = 1): string {
  const outer = `M${cx - r},${cy} A${r},${r * squash} 0 0 0 ${cx + r},${cy}`;
  const back = `A${r},${r * squash * (1 - depth)} 0 0 1 ${cx - r},${cy}`;
  return `${outer} ${back} Z`;
}

/**
 * Flattens the top of a closed loop into a plateau, leaving the sides alone.
 *
 * A species cue has to survive the silhouette gate, which rules out anything
 * drawn ON the face — the front-facing chibi head has no room for it, and a mark
 * placed there collides with the eyes and cheeks instead of reading. Changing
 * the skull's profile does work: a flat-crowned bird and a domed one stay
 * distinguishable as solid shapes.
 *
 * `power` < 1 pushes upper points toward the top of their travel, widening the
 * crown into a plateau. 1 leaves the shape untouched.
 */
export function flattenCrown(pts: readonly Pt[], cy: number, ry: number, power: number): Pt[] {
  if (power >= 1) return [...pts];
  return pts.map(([x, y]) => {
    if (y >= cy) return [x, y] as Pt;
    const h = Math.min(1, (cy - y) / ry);
    return [x, cy - ry * Math.pow(h, power)] as Pt;
  });
}

/**
 * A ribbon: a centreline swept to a closed outline, with independent half-widths
 * on each side.
 *
 * `taperedOutline` always narrows to points at both ends, which is right for a
 * leg or a twig and wrong for anything that CONTINUES past the frame — a limb
 * crossing a scene tapered to needles at both edges reads as a lens, not a
 * branch. This lets the width stay full at the ends.
 *
 * Returning points rather than a path string is the other half of the fix: a
 * long thin shape needs a real outline before it can be given a contour. Ringing
 * the CENTRELINE instead produces a contour that describes a different shape
 * from the fill it is supposed to outline.
 *
 * With SVG's y-down axes and a left-to-right centreline, `lower` is the side
 * below the line and `upper` the side above it.
 */
export function ribbon(
  pts: readonly Pt[],
  lower: (t: number) => number,
  upper: (t: number) => number = lower,
): Pt[] {
  const n = pts.length - 1;
  if (n < 1) return [];
  const a: Pt[] = [];
  const b: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = pts[i];
    const [px, py] = pts[Math.max(0, i - 1)];
    const [nx, ny] = pts[Math.min(n, i + 1)];
    const dx = nx - px;
    const dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    const ux = -dy / len;
    const uy = dx / len;
    a.push([x + ux * lower(t), y + uy * lower(t)]);
    b.unshift([x - ux * upper(t), y - uy * upper(t)]);
  }
  return [...a, ...b];
}

/** Straight-segment closed path. For outlines that already carry their own detail. */
export function polygonPath(pts: readonly Pt[]): string {
  if (pts.length < 3) return '';
  return `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join('L')}Z`;
}

/**
 * A contour for shapes with sharp or deeply concave vertices — a treeline, a
 * row of crowns, anything `contourRing` tears itself on.
 *
 * `contourRing` builds an outer loop AND a reversed inner loop and fills between
 * them with `evenodd`. At a sharp convex tip the inner loop crosses itself, and
 * `evenodd` reads that crossing as a hole — which shows up as a white notch at
 * the point of every crown.
 *
 * This grows the silhouette OUTWARD only and fills it solid; the real fill is
 * then painted on top, hiding everything inside. Same visual result — an outline
 * whose outer half shows — with no inner loop to self-intersect. Width still
 * varies, so it stays the same line language as a critter's contour rather than
 * reverting to a uniform stroke.
 */
export function grownContour(
  pts: readonly Pt[],
  width: number,
  taper: number,
  wobble: number,
  rnd: () => number,
): string {
  const phase = rnd() * Math.PI * 2;
  const ns = normals(pts);
  const grown = pts.map((p, i) => {
    const t = i / pts.length;
    const theta = t * Math.PI * 2;
    const heavy = 1 + taper * Math.sin(theta);
    const hand = 1 + wobble * Math.sin(theta * 7 + phase);
    const d = Math.max(0.05, width * heavy * hand);
    return [p[0] + ns[i][0] * d, p[1] + ns[i][1] * d] as Pt;
  });
  return closedPath(grown);
}

/* ------------------------------------------------------------------ *
 * Lobed boundaries — foliage, froth, wool
 * ------------------------------------------------------------------ */

/**
 * A run of overlapping circular lobes along a horizontal span.
 *
 * A SINE is the obvious way to make a wobbly edge and it is the wrong one — a
 * smooth periodic curve reads as water, cloud or hill, because that is what
 * those things are. Foliage in this tradition is drawn as circular lobes with
 * NOTCHES between them, and the notch is the whole tell. Lobes are sampled as
 * arcs rather than emitted as circles so the boundary stays one continuous
 * polyline that can be closed against a frame edge.
 *
 * `dir` is +1 for an edge hanging down from the top, -1 for one rising from the
 * bottom. Steps are 1.55x the lobe radius, and each arc is sampled over 165deg
 * to 15deg, so consecutive lobes just touch: any more overlap and x stops being
 * monotonic, which folds the boundary back on itself.
 *
 * Promoted here from the Nestlings canopy when the Counting Sheep meadow needed
 * the same emitter for a FLEECE — which is the same shape problem as foliage,
 * one subject over. A notch between two round lobes is wool; a smooth wave is
 * not.
 */
export function lobedEdge(
  x0: number,
  x1: number,
  baseline: (t: number) => number,
  lobeR: number,
  variance: number,
  rnd: () => number,
  dir: 1 | -1,
): Pt[] {
  const pts: Pt[] = [];
  const step = lobeR * 1.55;
  const span = x1 - x0;
  let x = x0;
  let guard = 0;
  while (x <= x1 && guard++ < 400) {
    const r = lobeR * (1 - variance / 2 + rnd() * variance);
    const t = span === 0 ? 0 : (x - x0) / span;
    const y = baseline(Math.min(1, Math.max(0, t)));
    for (let a = 165; a >= 15; a -= 25) {
      const rad = (a * Math.PI) / 180;
      pts.push([x + r * Math.cos(rad), y + dir * r * Math.sin(rad)]);
    }
    x += step * (0.85 + rnd() * 0.3);
  }
  return pts;
}

/** Linear resample of a polyline to `n` evenly indexed points. */
export function resample(pts: readonly Pt[], n: number): Pt[] {
  const out: Pt[] = [];
  const last = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * last;
    const a = Math.floor(u);
    const b = Math.min(last, a + 1);
    const f = u - a;
    out.push([pts[a][0] + (pts[b][0] - pts[a][0]) * f, pts[a][1] + (pts[b][1] - pts[a][1]) * f]);
  }
  return out;
}

/**
 * The same circular lobes as `lobedEdge`, carried in a spine's own moving frame
 * instead of along a horizontal — so foliage grows ALONG a limb, and wool runs
 * around a body, rather than sitting on the end of either as a pom-pom.
 *
 * Two emitters were wrong before this one. `polygonPath` joins sampled points
 * with straight segments, so lobes finer than the sampling came out as a SAW
 * BLADE. Smoothing that with `closedPath` did not help, because the underlying
 * profile was `|sin|`, which has a CUSP at every zero — Catmull-Rom faithfully
 * reproduces a cusp. Round lobes have to be built from arcs, not from a
 * waveform: a notch between two round lobes is foliage, a notch between two
 * straight edges is a tear, and a smooth wave is water.
 *
 * Lobes are spaced by cumulative ARC LENGTH, not by index — spacing them by
 * index bunches them wherever the spine's own sampling happens to be dense.
 */
export function lobedAlong(
  spine: readonly Pt[],
  offset: (t: number) => number,
  lobeR: number,
  variance: number,
  rnd: () => number,
  side: 1 | -1,
): Pt[] {
  const dense = resample(spine, Math.max(spine.length, 160));
  const n = dense.length - 1;
  const len: number[] = [0];
  for (let i = 1; i <= n; i++) {
    len.push(len[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  }
  const total = len[n];
  if (total <= 0) return [];
  const pts: Pt[] = [];
  let at = 0;
  let cursor = 0;
  let guard = 0;
  while (at <= total && guard++ < 500) {
    while (cursor < n && len[cursor + 1] < at) cursor++;
    const t = cursor / n;
    const [x, y] = dense[cursor];
    const [px, py] = dense[Math.max(0, cursor - 1)];
    const [nx, ny] = dense[Math.min(n, cursor + 1)];
    const dx = nx - px;
    const dy = ny - py;
    const m = Math.hypot(dx, dy) || 1;
    const tx = dx / m;
    const ty = dy / m;
    // SVG y-down: rotating the tangent gives the normal on the `lower` side,
    // matching `ribbon`'s convention so the two agree about which side is which.
    const ux = -ty;
    const uy = tx;
    const r = lobeR * (1 - variance / 2 + rnd() * variance);
    const cx = x + ux * side * offset(t);
    const cy = y + uy * side * offset(t);
    for (let a = 165; a >= 15; a -= 25) {
      const rad = (a * Math.PI) / 180;
      const ax = Math.cos(rad);
      const ay = Math.sin(rad);
      pts.push([cx + (tx * ax + ux * side * ay) * r, cy + (ty * ax + uy * side * ay) * r]);
    }
    at += lobeR * 1.55 * (0.85 + rnd() * 0.3);
  }
  return pts;
}

/**
 * A band of lobes down one side of a spine and back along the other. Closed with
 * straight joins between the two runs, which are buried under whatever the spine
 * itself draws on top.
 */
export function lobedBand(
  spine: readonly Pt[],
  lower: (t: number) => number,
  upper: (t: number) => number,
  lobeR: number,
  variance: number,
  rnd: () => number,
): string {
  const a = lobedAlong(spine, lower, lobeR, variance, rnd, 1);
  const b = lobedAlong(spine, upper, lobeR, variance, rnd, -1);
  if (a.length < 3 || b.length < 3) return '';
  return `M${[...a, ...b.reverse()].map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join('L')}Z`;
}

/**
 * A closed ring of lobes around an ellipse — a fleece, a froth, a cloud bank.
 *
 * Built by running `lobedAlong` around a closed elliptical spine rather than by
 * emitting circles, so the result is one continuous outline that can take a
 * contour. Traversed with theta increasing, which in SVG's y-down space winds
 * clockwise on screen, so `side = -1` is the OUTWARD normal.
 */
export function lobedLoop(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  lobeR: number,
  variance: number,
  rnd: () => number,
  segments = 64,
): { d: string; pts: Pt[] } {
  const spine: Pt[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    spine.push([cx + Math.cos(t) * (rx - lobeR * 0.55), cy + Math.sin(t) * (ry - lobeR * 0.55)]);
  }
  const pts = lobedAlong(spine, () => 0, lobeR, variance, rnd, -1);
  return { d: pts.length < 3 ? '' : polygonPath(pts), pts };
}

/**
 * Close a lobed edge against the frame border it hangs from, with bleed. The
 * anchor corners sit OUTSIDE the frame on purpose: a mass that stops neatly at
 * the viewport edge reads as a sticker laid on the picture, and `closedPath`'s
 * Catmull-Rom would round those corners into visible lobes if they were inside
 * it.
 */
export function closeAgainst(edge: number, pts: Pt[], bleed: number): string {
  if (pts.length < 3) return '';
  const x0 = pts[0][0];
  const x1 = pts[pts.length - 1][0];
  return closedPath([...pts, [x1 + bleed, edge], [x0 - bleed, edge]]);
}
