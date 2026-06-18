# Balloons

## Problem Statement
The collection now has three Toys built on two gestures: *tap* (Counting Sheep, Puffer Fish) and
the sustained *Wipe* (Muddy Puddle). A 3–4 year old who has met tap and wipe still hasn't met the
next reliable gesture in the touch-development set: the **sustained press-and-hold**, where the
*duration* of the touch — not its position or a discrete strike — is what drives the outcome. A
fourth Toy should grow the collection in *kind* again: a new gesture from the reliable-for-this-age
set, a new spatial direction (everything so far happens at or near the ground; nothing rises), and
a loop shape that isn't the one-critter-at-a-time conveyor the tap toys share. As always the new
gesture has to be teachable wordlessly and must never produce a fail/lose state.

## Solution
A new Toy, **Balloons**. A bunch of ~5 limp, sad-faced deflated balloons is tied to a low peg on a
grassy rise, with open sky above. The child presses and **Holds** a balloon: it swells under the
finger, its face brightens from sad to happy, and a soft tone rises in pitch as it fills. At full it
**self-caps** — it can't be over-inflated — detaches from the peg, and **floats up**, lingering and
gathering with its friends near the top of the sky. If the child lifts too early the balloon
**slowly leaks** back down with a soft raspberry (fills fast, leaks slow) so an early lift is
forgiving, not a reset — they just hold again. Balloons can be filled in **any order**: the bunch is
all present from the start, not a conveyor. When the last balloon joins the cluster at the top, all
five do a happy bob together and the Shell's Completion confetti falls. The child gets a fourth Toy
that is unmistakably a *new thing to do* — holding instead of tapping or wiping, sending things *up*
instead of acting at the ground, a free-choice bunch instead of a queue — built on a gesture their
hands can manage, taught without a single word, and incapable of going wrong.

## User Stories
1. As a child, I want a bunch of sad, limp balloons waiting for me, so that I have an inviting set
   of things to fix up.
2. As a child, I want a balloon to swell while I hold my finger on it, so that my holding produces an
   immediate, satisfying cause-and-effect.
3. As a child, I want the balloon to get happy and float up into the sky when it's full, so that my
   effort has a delightful, visible payoff.
4. As a child, I want to be able to lift my finger without losing everything — the balloon just
   sags slowly — so that I'm never punished for letting go and can simply try again.
5. As a child, I want to pick any balloon I like in any order, so that I'm in charge of what I do
   next.
6. As a child, I want the floated balloons to gather up in the sky so I can see them all, so that I
   feel the bunch growing and know I'm getting somewhere.
7. As a child who doesn't know what to do, I want the toy to *show* me to press and hold, so that I
   can start playing without anyone telling me.
8. As a child, I want holding to feel and sound good — a rising tone and little buzzes as it fills,
   a pop when it floats, a funny raspberry if it sags — so that the toy feels alive and responsive.
9. As a child, I want a celebration when every balloon is up in the sky, so that I know "we did it!"
10. As a parent, I want a fourth toy that's clearly a different *activity* from the tap and wipe
    toys, so that the collection feels varied and worth opening again.

## Implementation Decisions
- Module: new Toy `balloons` under the toys area (deep — owns its own scene, the faced balloon
  Critters, its loop logic, palette, and sound recipes; the Shell and other Toys are untouched).
  Adding it is one additive registry entry, per the existing registry contract. Like Muddy Puddle it
  lands on the already-migrated shared primitives (ADR-0004 palette / `play(voice)` / ink / `tint`)
  — there are **no shared-module migrations** in this work.
- Interface: the standard Shell↔Toy contract only — the component takes `{ onComplete, sound?,
  haptics? }` and calls `onComplete()` once when the Goal is met. **No new Shell↔Toy surface.** In
  particular, the rising-pitch fill audio is built from the existing one-shot `play(voice)` and does
  **not** add a sustained start/stop/set-pitch sound API to the Shell (see Out of Scope) — same
  stance Muddy Puddle took for the squelch.
- Core interaction — the **Hold** (new): a sustained, stationary press fills a balloon over time.
  This is the **second** non-tap core interaction in the collection; the `Hold` term and the
  `Critter` generalisation (to anthropomorphised objects) are already recorded in CONTEXT. The Hold
  is distinct from the Wipe (which is sustained but *moving*, accumulating coverage) — the Hold is
  stationary and accumulates *fill by duration*.
- Fill model — a per-balloon **fill value 0→1** driven by hold state, no `<canvas>`: while a pointer
  is held over a balloon its fill rises at a fill-rate; while released its fill leaks back at a
  **slower** rate (fills fast, leaks slow). The fill **self-caps** at 1 — holding past full is a
  no-op — and at the cap the balloon auto-detaches and floats. Fill is observable via a `data-*` hook
  (per balloon) so tests can drive it to the cap without leaning on wall-clock timing.
- Self-capping / no-fail (ADR-0001): there is **no over-inflate, no pop, no sweet-spot, no timer**.
  Holding past full does nothing; an early lift leaks slowly. The only outcome is success. (This
  directly rejects the timing-skill/overshoot-pop variant — see Out of Scope.)
- Loop shape — **bunch present, free order** (the first Toy to break the sequential conveyor): all
  ~5 balloons are present from the start, each owning its **own independent lifecycle** (`limp →
  filling/leaking → floating → gathered`). There is **no** `arriving → waiting → dismissing` queue.
  The Toy owns its own loop logic — **not** a shared hook ([[shared-toy-loop-abstraction]]); note
  this Toy's loop is a *different shape* from the tap toys', which is exactly why pre-abstracting the
  conveyor would have been wrong. `onComplete` fires once (ref-guarded) when the **fifth** balloon
  detaches, so the Shell's Completion overlay runs concurrently with the last balloon's float-up
  (layered-concurrent rule, ADR-0001 amendment). Once all five are floating the state is terminal.
- Goal: float all **five** balloons. Here the **balloon count is the duration lever** (5 × ~2.5s
  fill ≈ 20–25s with float/gather beats), like the sheep/fish counts and unlike Muddy Puddle (which
  tuned via blobs/threshold at a fixed cast).
- Balloons-as-Critters: each balloon is its own faced SVG drawn from primitives only (ADR-0002),
  with structural pieces tagged `data-*` part hooks (mirrors `data-sheep-part` / `data-fish-part`).
  The face transitions with fill — **sad/limp at 0, brightening to happy at full** — and reverts as
  it leaks. Five balloons in distinct colours for variety. Unlike Muddy Puddle there is **no hidden
  identity / reveal** — the surprise is the inflation and the float-away, not "who is it".
- Outro — **linger, gather, final bob**: a detached balloon rises but **slows and bobs near the top
  of the sky**, accumulating into a growing cluster. When the last balloon joins, all five do a happy
  bob/wiggle together under the Shell's confetti. This **intentionally diverges** from Muddy Puddle's
  on-stage-only Outro (an all-five reunion was rejected *there*); it is natural here because floated
  balloons physically accumulate. The growing cluster also reads as **wordless, diegetic progress**
  — it is *not* a tracked score/count ([[progress-and-gamification]]).
- Discoverability — **idle-triggered HOLD demo**: if no hold happens within ~2–3s, a translucent
  "ghost finger" presses a balloon and **dwells** while it visibly fills partway, then lifts —
  demonstrating that the gesture is a *sustained hold*, not a tap. This is **load-bearing, not
  decorative**: with the slow-leak rule a child who only *taps* gets a sip of fill that leaks
  straight back and never completes a balloon, so the demo must teach *duration*. The demo's fill
  **reforms** (it gives no real progress); a real hold cancels and suppresses it.
- Touch handling — each balloon tracks its **own** held-state, so resting fingers on two balloons
  simply fills both (forgiving multi-touch, harmless — never *required*, unlike pinch which the
  project avoids for this age). The balloon surfaces set `touch-action: none` so the browser does not
  hijack the press for scroll/zoom.
- Placement — the balloons sit in the reachable mid-zone, clear of the bottom palm-rest dead zone;
  the peg/fence and grassy rise anchor the lower third per the layered, bottom-anchored backdrop
  pattern ([[0005-toy-backdrops-bottom-anchored-layered-scenes]]), with the **open sky above** as the
  new vertical play space the balloons rise into. Targets are large (≥ ~2cm).
- Signature beat: on hold, the balloon swells (scale on its SVG body), its face brightens, the fill
  tone rises in pitch, and ticks fire; at full it gives a pop/"boing", detaches, and floats up; on an
  early lift it sags with a descending raspberry and its face droops. Motion choreography consumes
  shared `timing` eases; exact tuples/offsets are on-device-tuned. Reduced-motion is honoured for the
  swell, the float/gather, the demo, and the final bob (as the existing Toys honour it).
- Scene: own backdrop component (analog to meadow/underwater/barnyard), code-drawn SVG, layered and
  bottom-anchored (ADR-0005) — sky with a cloud or two, a grassy rise, and a low peg/fence the
  balloons are tied to. Backdrop layers tagged with `data-*` layer hooks. The sky is deliberately
  tall to give the balloons somewhere to rise and gather.
- Palette: the Toy ships its **own** local palette (sky, cloud, grass, peg/fence, string, sparkle,
  plus per-balloon body/face colours), per ADR-0004. It adds no keys to the shared tokens palette.
  Concrete tuples are on-device-tuned; token *names* are load-bearing.
- Sound: per ADR-0004 the Toy defines its own local recipes consumed via the Shell's `play(voice)`:
  a short **fill "pip"** voice whose **pitch is a function of current fill %** (so rapid pips read as
  a rising tone), **throttled** (min interval, with slight jitter) so it is not an unbounded stream;
  a **pop/"boing"** on detach; and a descending **raspberry** on early-lift leak. The Toy receives
  `sound` through the contract and never imports Web Audio directly (ADR-0003). `haptics?.tick()`
  fires while filling (denser as it nears full, throttled with the pips) and a pulse on detach.
- Registry: add the `balloons` entry (id, title, component, `tint` color string from its own palette
  — e.g. the sky tone the live scene sits in, matching the fish/puddle tint→color-string contract,
  ADR-0004 — and `preview`). The Toy ships its own tiny inline SVG preview-scene (e.g. a faced
  balloon mid-inflate, or one floating up on its string) the Home Card hosts, mirroring the existing
  Toys' previews. Additive only — nothing else in the Shell changes.

## Testing Decisions
- Test the **loop's observable contract**, not the choreography: per-balloon state is exposed via a
  `data-*` hook (e.g. `limp` / `floating` / `gathered`) and per-balloon fill via a `data-*` value, so
  tests drive fill to the cap without wall-clock timing. Assert: holding a balloon raises *its* fill;
  reaching the cap detaches it (transitions to floating) and increments the floated count; releasing
  before the cap **leaks** (fill decreases) and does **not** detach; holds on already-floating
  balloons are non-destructive no-ops; after the fifth detach the state is terminal and no balloon
  re-arrives; `onComplete` fires **exactly once** (ref-guarded against the Shell re-rendering a new
  `onComplete` at Completion).
- Test the **fill contract** at the value boundary: fill rises while held, leaks while released, and
  caps at 1 with detach at the cap. Do **not** unit-assert the exact fill-rate, leak-rate, or
  per-balloon duration — those are on-device-tuned constants, like the sheep/fish counts.
- Test the **idle demo** by its observable effect, not its visuals: after the idle delay with no
  hold, the demo is active; a real hold cancels/suppresses it; the demo's fill reforms and does
  **not** advance the floated count. Keep this at the state/flag level — the ghost-finger animation
  is on-device-tuned.
- Test the **sound recipes** at the Web Audio boundary the way the tap toys test `baa`/`puff` —
  inject a fake `AudioContext` via the engine's `contextFactory` and assert an oscillator started;
  assert `play` no-ops when muted and when no context exists (jsdom). Assert the Toy calls
  `sound.play(...)` for fill pips, the detach pop, and the leak raspberry; that the fill pips are
  **throttled** (rate-limited, not one-per-frame unbounded); and that `haptics.tick()` fires —
  injecting fakes through the contract.
- Do **not** unit-assert balloon-count magic numbers, fill/leak rates, float/gather paths, the final
  bob, sound frequencies, colours, the demo animation, or anything `dvh`/`env()`/backdrop-geometry —
  those are on-device-tuned per the slice DoD (the project's standing posture). Mocking policy: shim
  only the Web Audio boundary and inject fakes through the contract; never mock our own components.

## Out of Scope
- A shared/extracted Toy-loop hook or framework — explicitly rejected
  ([[shared-toy-loop-abstraction]]); this Toy owns its loop, which is moreover a *different*
  (free-order, multi-active) shape than the conveyor — reinforcing why the conveyor was never worth
  extracting.
- A sustained start/stop/set-pitch "inflation tone" that would expand the Shell's Sound API — the
  rising-pitch feedback is throttled one-shot pips at fill-mapped pitch via the existing `play(voice)`
  (ADR-0003/0004), the same stance taken for Muddy Puddle's squelch.
- Any overshoot / pop / "too full" / sweet-spot / timing-skill **fail** state — the Hold is
  self-capping and forgiving; there is no lose state and no timer (ADR-0001).
- **Instant deflate** on an early lift — rejected in favour of the slow leak (forgiving, and it
  reinforces the "keep holding" skill).
- The sequential one-at-a-time conveyor — deliberately *not* used here in favour of a free-order
  bunch. (This is this Toy's mechanic choice, not a project-wide rejection of the conveyor.)
- A host animal blowing the balloons, or a party/bunting scene — considered and not chosen for this
  Toy; free for a future Toy, not rejected project-wide. The balloons themselves are the Critters.
- Any progress/score/reward meta-layer ([[progress-and-gamification]]) — the gathered sky-cluster is
  diegetic scenery, not a tracked collection or count.
- Pinch, double-tap, or any *required* two-handed gesture — outside the reliable gesture set for this
  age. (Incidental multi-touch filling several balloons at once is allowed and harmless, never
  required.)
- Real music or a Tone.js dependency; binary art or audio assets of any kind (ADR-0002/0003).
- Reworking the Shell, the Completion overlay, or the existing Toys.

## Further Notes
- The Toy's **final name is open** — working title "Balloons"; candidates "Up & Away", "Balloon Sky",
  "Up-Up Balloons". Pick before the registry slice; the slug `balloons` is stable regardless of the
  display title.
- Open (on-device-tunable, not blocking): the fill-rate (~2.5s to full) and the slower leak-rate; the
  5-balloon count; the fill-pip throttle interval, jitter, and the fill%→pitch mapping; the
  detach/float/gather timing and the gather position near the top; the final-bob choreography; the
  per-balloon colours and face shapes; the sky/grass/peg palette tuples; the idle delay (~2–3s) before
  the demo. Resolve these in the kid-handoff DoD as the prior Toys' were.
- Audio watch-item: the fill-pip-at-rising-pitch is the one genuinely new *sound shape*. If throttled
  one-shots read too "steppy" on-device, revisit whether a single parametrized voice is worth a small,
  carefully-scoped Sound API addition — but **default** to the throttled-one-shot stance the project
  already took for the squelch; don't expand the Shell audio surface speculatively.
- The all-five **gather/bob Outro intentionally diverges** from Muddy Puddle's on-stage-only Outro.
  It is justified by the balloon physics (floated things accumulate) and is **not** a precedent the
  tap/wipe toys must follow.
- Ghost-finger HOLD demo: a hold/dwell demo likely shares the *idea* of Muddy Puddle's `GhostFinger`
  but must show **dwell/duration**, not a sweep. Decide at slice time whether to copy or lift into a
  shared primitive — **default to copy** per the cautionary [[shared-toy-loop-abstraction]] precedent
  (don't pre-abstract a wordless-teaching helper on its second appearance).
- Sequencing suggestion for slicing: the load-bearing unknowns are the **Hold fill/leak/self-cap
  mechanic** and the **multi-active free-order loop**. Land a single-balloon vertical slice (one
  balloon: hold → fill → self-cap → detach → float; early lift → leak) before adding the bunch, the
  gather/bob Outro, the idle HOLD demo, the sounds, and the registry/preview.
