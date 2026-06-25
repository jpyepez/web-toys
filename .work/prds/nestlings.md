# Nestlings

## Problem Statement
The collection now has four Toys across three gestures: *tap* (Counting Sheep, Puffer Fish), the
sustained *Wipe* (Muddy Puddle), and the sustained *Hold* (Balloons). A 3–4 year old who has met
tap, wipe, and hold still hasn't met the next reliable gesture in the touch-development set: the
**drag** — pick a thing up, *carry* it across the screen, and *place* it somewhere. Where Wipe is
sustained-but-accumulating (no destination) and Hold is sustained-but-stationary (fills by
duration), drag is about **transporting and positioning** — a distinct skill their hands are ready
for. A fifth Toy should grow the collection in *kind* again: a new gesture from the reliable-for-
this-age set, taught wordlessly, with no fail/lose state of any kind.

## Solution
A new Toy, **Nestlings**. At dusk, five little fledgling songbirds are scattered around a cozy
scene with a single empty nest. The child presses a bird, it lifts to the finger with a soft chirp,
and they **carry** it across the scene and **drop** it on the nest, where it snaps in, curls up,
and falls asleep. Birds can be tucked in **any order** — all five are present from the start, not a
queue. The drag is **forgiving and never-fail**: if the finger lifts mid-carry, the bird simply
rests wherever it was left (with a soft, neutral plip) and can be picked up again — nothing resets,
nothing is ever undone, so every drag makes visible progress. A bird dropped *into the nest*
settles asleep and **locks** (it won't be lifted out again), so the growing sleepy pile is the
child's wordless progress meter. When the last bird is nestled, the whole nestful tucks heads under
wings, the sky deepens, the first stars twinkle, and the Shell's Completion confetti falls. The
child gets a fifth Toy that is unmistakably a *new thing to do* — carrying and placing instead of
tapping, wiping, or holding — built on a gesture their hands can manage, taught without a word, and
incapable of going wrong.

## User Stories
1. As a child, I want several little birds scattered around an empty nest, so that I have an
   inviting set of things to gather up.
2. As a child, I want a bird to lift up and follow my finger when I press it, so that I feel I've
   really picked it up.
3. As a child, I want to carry a bird across the scene and drop it on the nest, so that my carrying
   produces a satisfying place-it-home payoff.
4. As a child, I want the bird to snap into the nest and curl up asleep when I drop it close enough,
   so that I don't have to be precise to succeed.
5. As a child, I want to lift my finger by accident without losing anything — the bird just rests
   where I left it — so that I'm never punished for fumbling and can simply pick it up again.
6. As a child, I want to tuck the birds in any order I like, so that I'm in charge of what I do next.
7. As a child, I want the nest to fill up with sleepy birds as I go, so that I can see the pile
   growing and know I'm getting somewhere.
8. As a child who doesn't know what to do, I want the toy to *show* me to pick a bird up and carry
   it, so that I can start playing without anyone telling me.
9. As a child, I want carrying to feel and sound good — a chirp when I pick a bird up, a little
   wing-flutter while I carry it, a cozy coo when it nestles in — so that the toy feels alive.
10. As a child, I want a celebration when every bird is asleep in the nest, so that I know "we did
    it!"
11. As a parent, I want a fifth toy that's clearly a different *activity* from the tap, wipe, and
    hold toys, so that the collection feels varied and worth opening again.

## Implementation Decisions
- Module: new Toy `nestlings` under the toys area (deep — owns its own dusk scene, the fledgling
  songbird Critters, the nest target, its loop logic, palette, and sound recipes; the Shell and
  other Toys are untouched). Adding it is one additive registry entry per the existing registry
  contract. Like the recent Toys it lands on the already-migrated shared primitives (ADR-0004
  palette / `play(voice)` / ink / `tint`) — there are **no shared-module migrations** in this work.
- Interface: the standard Shell↔Toy contract only — the component takes `{ onComplete, sound?,
  haptics? }` and calls `onComplete()` once when the Goal is met. **No new Shell↔Toy surface.**
- Core interaction — the **Drag** (new): a sustained press *attaches* a Critter to the finger and
  *transports* it to the nest, completing on release within a forgiving snap-radius. This is the
  **third** non-tap core interaction; the `Drag` term is already recorded in CONTEXT. Drag is
  distinct from Wipe (moving but accumulating coverage, no destination) and Hold (stationary,
  accumulating fill) — Drag is about *carrying and positioning*.
- Drag is **hand-rolled pointer tracking**, not Motion's `drag` prop (recorded as ADR-0007):
  `onPointerDown/Move/Up` follow `clientX/clientY` in DOM-pixel space, drive the carried bird's
  offset via a Motion value, and on release compare the bird's bounding rect to the nest's to decide
  the snap. Chosen for testability (assertable at the boundary in jsdom, unlike Motion's
  measurement-dependent drag — ADR-0003), a custom snap-to-nest landing (not snap-to-origin), and
  consistency with the hand-rolled Wipe/Hold. Pointer-capture/cancel/loss are handled explicitly so
  a bird can never get stuck attached to a finger that is gone.
- Forgiveness / no-fail (ADR-0001): there is **no drop-and-break, no wrong-place penalty, no timer**.
  An early lift mid-carry leaves the bird resting where dropped, still pickup-able; the only outcome
  is success. The forgiving snap-radius means a drop merely *near* the nest still lands.
- Placed-lock model — a bird dropped **loose** (outside the snap-radius) stays pickup-able; a bird
  dropped **into the nest** snaps in, curls up asleep, and **locks** (further pointers are no-ops on
  it). So progress toward the Goal only ever counts up and the sleepy pile can't be accidentally
  undone. Per-bird state is observable via a `data-*` hook so tests can assert the loose→placed
  transition without leaning on pixels.
- Loop shape — **all present, free order** (the concurrent shape, like Balloons, not the conveyor):
  all five birds exist from the start, each owning its own lifecycle (`loose ↔ carried → placed`),
  tuck-able in any order. There is **no** `arriving → waiting → dismissing` queue. The Toy owns its
  own loop logic — **not** a shared hook ([[shared-toy-loop-abstraction]]). `onComplete` fires once
  (ref-guarded) when the **fifth** bird is placed, so the Shell's Completion overlay runs
  concurrently with the settle-and-sleep Outro (layered-concurrent rule, ADR-0001 amendment). Once
  all five are placed the state is terminal.
- Goal: tuck all **five** birds into the nest. Here the **bird count is the duration lever** (five
  carries + the settle beats ≈ 15–30s), like the sheep/fish/balloon counts and unlike Muddy Puddle
  (which tuned via blobs/threshold). The count is on-device-tuned, not a unit-asserted magic number.
- Birds-as-Critters: each is a distinct faced fledgling songbird drawn from SVG primitives only
  (ADR-0002), with structural pieces tagged `data-*` part hooks (mirrors `data-sheep-part` /
  `data-fish-part`). Five **visually distinct** species (e.g. robin, bluebird, sparrow, wren,
  goldfinch) for variety — deliberately unlike Muddy Puddle's round yellow barnyard chick (ADR-0004
  per-Toy assets). There is **no hidden identity / reveal** — the play is the carrying and the
  nestling-in, not "who is it".
- Carried-bird cue: while carried, the active bird lifts/scales slightly and reads as "the one in my
  hand" (mirrors Balloons' which-one lift cue) and stacks above its neighbours. The exact lift/scale
  is on-device-tuned and not asserted.
- Target — a single shared **nest**, no matching: any bird snaps into the one nest and nestles
  beside the others. A single large drop zone is the most forgiving snap radius for a toddler, and
  the growing cuddle-pile is the diegetic progress meter — *not* a tracked score/count
  ([[progress-and-gamification]]). Placed birds settle into nestle positions within the nest.
- Outro — **settle & sleep**: when the last bird is placed, the nestful tucks heads under wings,
  eyes close with a soft "zzz", the nest does a cozy bob, the dusk sky deepens, and the first stars
  twinkle — under the Shell's confetti. Optional-Outro shape (ADR-0001 amendment): the Toy keeps
  rendering through the overlay. A per-Toy `winDelayMs` holds the Completion for this settle beat
  before the dialogue lands (as Balloons' `FLOAT_AWAY_MS` does).
- Discoverability — **idle-triggered DRAG demo**: if no pickup happens within ~2–3s, a translucent
  ghost-hand presses a bird, **carries** it along a path to the nest, and releases — demonstrating
  that the gesture is a *pick-up-and-carry*, not a tap. This is load-bearing, not decorative: a
  child who only *taps* a bird never carries it anywhere, so the demo must teach the *carry*. The
  demo acts on its own faint demo bird and gives no real progress; a real pickup cancels and
  suppresses it. Default to **copy** the existing ghost-finger pattern rather than abstracting it
  ([[shared-toy-loop-abstraction]]).
- Touch handling — each bird tracks its **own** carried-state; the bird surfaces set
  `touch-action: none` so the browser does not hijack the press for scroll/zoom. As in Balloons, the
  absolute positioning wrappers are `pointer-events: none` over their large rectangles so overlapping
  birds don't steal each other's presses — only the painted bird shape is the hit target. Transform-
  ownership split is mandatory (ADR-0007): the static wrapper owns layout (`left/top/translateX
  (-50%)`), the inner `motion` element owns the carry `x/y`; never both writing `transform`.
- Placement & scene: birds sit in the reachable mid-zone clear of the bottom palm-rest dead zone;
  the nest and ground anchor the lower band per the layered, bottom-anchored backdrop pattern
  ([[0005-toy-backdrops-bottom-anchored-layered-scenes]]), with the deepening **dusk sky** above.
  Targets are large (≥ ~2cm); the nest is a generously large drop zone.
- Signature beat: on pickup the bird lifts, chirps, and ticks; while carried it gives a gentle,
  throttled wing-flutter; on a nest drop it gives a cozy coo + tick, snaps in, and curls asleep; on
  a loose drop it gives a soft neutral plip and rests. Motion choreography consumes shared `timing`
  eases; exact tuples/offsets are on-device-tuned. Reduced-motion is honoured (carry, snap, the
  demo, the settle Outro) via the app-root MotionConfig as the existing Toys are.
- Palette: the Toy ships its **own** local palette (dusk sky gradient, ground, tree/branch, nest,
  star/sparkle, plus per-bird body/wing/beak colours), per ADR-0004. It adds no keys to the shared
  tokens palette. Concrete tuples are on-device-tuned; token *names* are load-bearing.
- Sound: per ADR-0004 the Toy defines its own local recipes consumed via the Shell's `play(voice)`:
  a rising **pickup chirp**; a soft **wing-flutter** voice while carrying, **throttled** (min
  interval) so a fast drag isn't a machine-gun stream (mirrors Balloons' pips / Muddy Puddle's
  squelch); a cozy descending **nestle coo** on a nest drop; and a soft neutral **plip** on a loose
  drop (never a failure/error tone). The Toy never imports Web Audio directly (ADR-0003).
  `haptics?.tick()` fires on pickup and on nestle.
- Registry: add the `nestlings` entry (id, title, component, `tint` color string from its own
  palette — e.g. the dusk sky tone, matching the tint→color-string contract, ADR-0004 — and
  `preview`, plus `winDelayMs` for the settle Outro). The Toy ships its own tiny inline SVG
  preview-scene (e.g. a bird being carried toward a nest, or a sleepy bird in the nest) the Home Card
  hosts, mirroring the existing Toys' previews. Additive only — nothing else in the Shell changes.

## Testing Decisions
- Test the **loop's observable contract**, not the choreography: per-bird state is exposed via a
  `data-*` hook (e.g. `loose` / `carried` / `placed`), so tests drive a pickup → release without
  pixels or wall-clock. Assert: a pointer-down on a loose bird sets it `carried`; a release within
  the snap-radius of the nest sets it `placed` and increments the placed count; a release *outside*
  the snap-radius leaves it `loose` (not placed) and pickup-able again; pointers on an
  already-`placed` bird are non-destructive no-ops (it stays locked); after the fifth placement the
  state is terminal and no bird re-arrives; `onComplete` fires **exactly once** (ref-guarded against
  the Shell re-rendering a new `onComplete` at Completion).
- Test the **snap decision** at the boundary, not by physics: assert that the placed/loose outcome
  is driven by whether the release point is within the snap-radius of the nest (the rect-distance
  test), feeding synthetic pointer coordinates. Do **not** unit-assert the exact snap-radius, carry
  feel, or settle animation — those are on-device-tuned constants, like the sheep/fish/balloon
  counts.
- Test the **idle demo** by its observable effect, not its visuals: after the idle delay with no
  pickup, the demo is active; a real pickup cancels/suppresses it; the demo gives no real progress
  (does not advance the placed count). Keep this at the state/flag level — the ghost-hand animation
  is on-device-tuned.
- Test the **sound recipes** at the Web Audio boundary the way the existing Toys test their voices —
  inject a fake `AudioContext` via the engine's `contextFactory` and assert an oscillator started;
  assert `play` no-ops when muted and when no context exists (jsdom). Assert the Toy calls
  `sound.play(...)` for the pickup chirp, the nestle coo, and the loose-drop plip; that the carry
  wing-flutter is **throttled** (rate-limited, not one-per-move unbounded); and that `haptics.tick()`
  fires on pickup and nestle — injecting fakes through the contract.
- Do **not** unit-assert bird-count magic numbers, snap-radius, carry/settle paths, the Outro
  choreography, sound frequencies, colours, the demo animation, or anything `dvh`/`env()`/backdrop-
  geometry — those are on-device-tuned per the slice DoD (the project's standing posture).
  Pointer-capture/cancel/loss paths aren't observable in jsdom (ADR-0007) — on-device-validated, not
  unit-asserted. Mocking policy: shim only the Web Audio boundary and inject fakes through the
  contract; never mock our own components.

## Out of Scope
- A shared/extracted Toy-loop hook or framework — explicitly rejected
  ([[shared-toy-loop-abstraction]]); this Toy owns its loop (a concurrent, free-order shape).
- Motion's built-in `drag` prop / any drag implementation relying on layout measurement — rejected
  in favour of hand-rolled pointer tracking for testability and snap control (ADR-0007).
- Throw / fling / velocity-based release momentum — outside the Drag definition (a velocity gesture,
  CONTEXT `_Avoid_`); free for a future Toy, not used here.
- **Matching / per-bird slots** — a single shared nest with no matching was chosen so there is no
  wrong-slot soft-fail. A shaped-slot matching variant is not part of this PRD.
- A bird **easing back to its pickup spot** on an early lift — rejected in favour of resting where
  dropped (so a fumbled carry never reads as lost progress).
- Re-lifting a bird **after** it's asleep in the nest — placed birds lock, so the Goal count only
  rises and the pile can't be undone.
- Any timer, fail/lose, "wrong place", or drop-and-break state — the Drag is forgiving and the only
  outcome is success (ADR-0001).
- The sequential one-at-a-time conveyor — deliberately *not* used here in favour of a free-order set.
  (This Toy's mechanic choice, not a project-wide rejection of the conveyor.)
- Any progress/score/reward meta-layer ([[progress-and-gamification]]) — the filling nest is
  diegetic scenery, not a tracked collection or count.
- Pinch, double-tap, or any *required* two-handed gesture — outside the reliable gesture set for this
  age.
- Real music or a Tone.js dependency; binary art or audio assets of any kind (ADR-0002/0003).
- Reworking the Shell, the Completion overlay, or the existing Toys.

## Further Notes
- The Toy's **final name is open** — working title "Nestlings"; candidates "Off to Nest", "Tuck-In",
  "Time for Bed", "Nest at Dusk". Pick before the registry slice; the slug `nestlings` is stable
  regardless of the display title.
- Open (on-device-tunable, not blocking): the snap-radius; the five-bird count; the carry lift/scale
  cue; the wing-flutter throttle interval; the pickup-chirp / nestle-coo / loose-plip pitches; the
  scatter positions of the loose birds and the nestle positions inside the nest; the settle-Outro
  timing and `winDelayMs`; the dusk palette tuples and star-twinkle; the idle delay (~2–3s) before
  the demo. Resolve these in the kid-handoff DoD as the prior Toys' were.
- The **settle & sleep Outro** is on-stage (the nestful sleeps under the overlay) — it fits the
  layered-concurrent rule and needs no new mechanism beyond a `winDelayMs`, as Balloons established.
- Ghost-hand DRAG demo: shares the *idea* of the existing ghost-finger demos but must show a
  **pick-up-and-carry**, not a sweep (Wipe) or a dwell (Hold). Default to **copy** per the
  cautionary [[shared-toy-loop-abstraction]] precedent — don't pre-abstract a wordless-teaching
  helper on its third appearance.
- Sequencing suggestion for slicing: the load-bearing unknowns are the **hand-rolled drag mechanic**
  (pickup → carry → snap-or-rest, with pointer-capture/loss) and the **concurrent free-order loop
  with placed-lock**. Land a single-bird vertical slice (one bird: pickup → carry → snap into nest;
  early lift → rests loose) before adding the full cast, the settle Outro, the idle DRAG demo, the
  sounds, and the registry/preview.
