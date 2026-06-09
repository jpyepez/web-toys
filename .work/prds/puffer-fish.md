# Puffer Fish

## Problem Statement
The toy collection has exactly one Toy (Counting Sheep). A 3–4 year old exhausts a single
tap-the-critter loop quickly; the launcher needs a second, visually distinct Toy so the Home
screen reads as a small collection rather than a single experience. It must feel like a
*different world* — not a reskinned meadow — while staying inside the finite, success-only,
tap-the-Critter contract the child already understands.

## Solution
A new underwater Toy. A smooth, round, kawaii puffer fish swims onto a soft underwater scene;
the child taps it and it **balloons** — puffs up bigger and rounder, cheeks out, eyes squinting
into a happy `^w^`, fins splaying — then drifts gently **up and off the top of the screen** like
a buoyant balloon. The next fish swims in from the side. After ~5 fish the Goal is met and the
Shell's Completion celebration plays over the last fish floating away. The child gets a second,
unmistakably different toy (water instead of meadow, float-up instead of hop-away, a delightful
puff instead of a bounce) using the same tap → delight → done loop they already know.

## User Stories
1. As a child, I want a round fish to swim onto the screen, so that I have an inviting critter
   to tap.
2. As a child, I want the fish to balloon up and float away happily when I tap it, so that my tap
   produces an immediate, funny, satisfying reaction.
3. As a child, I want a new fish to arrive after the last one leaves, so that the play continues
   without me having to do anything.
4. As a child, I want a celebration when I've sent all the fish off, so that I know "we did it!"
5. As a child, I want tapping a fish to feel good — a soft puff sound and a little buzz — so that
   the toy feels alive and responsive.
6. As a parent, I want a second toy on the Home screen that looks clearly different from the
   sheep, so that the collection feels varied and worth opening again.

## Implementation Decisions
- Module: new Toy `puffer-fish` under the toys area (deep — owns its own scene, Critter, loop
  state machine, palette, and sound recipes; the Shell and other Toys are untouched). Adding it
  is one additive registry entry, per the existing registry contract.
- Interface: the standard Shell↔Toy contract only — the component takes `{ onComplete, sound?,
  haptics? }` and calls `onComplete()` once when the Goal is met. No new Shell↔Toy surface.
- Loop: the fish owns its **own copy** of the five-state machine, duplicated from Counting Sheep
  rather than shared — `arriving → waiting → dismissing → idle → completed`. The only user-driven
  transition is the tap (`waiting → dismissing`); the rest are time-driven beats. `onComplete`
  fires once (ref-guarded) at the start of the Nth `waiting → dismissing` so the Shell's
  Completion overlay runs concurrently with the last fish's exit (the layered-concurrent rule,
  ADR-0001 amendment). The Nth dismiss lands in terminal `completed` — no further fish arrive.
  Duplication is the deliberate cost of Toy independence (out-of-scope: shared-toy-loop-abstraction).
- Goal: pop ~5 fish. Exact count is on-device-tuned to the ~15–30s target, as the Sheep count was.
- Signature beat: on tap the fish scales up in place (a balloon ~1.6×, on-device-tuned), with a
  wobble and a rest→puffed art swap (cheeks puff, eyes squint to `^w^`, fins splay), then
  translates **upward** off the top of the screen with a fade — buoyant, not a sideways slide and
  not a pop/destroy. Arrival is a swim-in from the side. Motion choreography consumes shared
  `timing` eases; exact tuples/offsets are on-device-tuned (Sheep's testing posture).
- Critter: smooth round kawaii fish drawn from SVG primitives only (ADR-0002) — white body, pink
  fins/tail/cheeks, large eyes, small smile. No spikes, including when puffed. Structural pieces
  tagged with `data-*` part hooks so tests can address them without coupling to which primitive
  draws each (mirrors `data-sheep-part`).
- Scene: own underwater backdrop component (analog to the meadow backdrop), code-drawn SVG.
  Starting atmospheric register (to avoid repeating the Sheep palette churn): top-lit light-blue
  water, lighter toward the surface, soft light rays, a few drifting bubbles, pale-cream coral
  silhouettes, a soft sandy floor. Backdrop layers tagged with `data-*` layer hooks.
- Palette: the Toy ships its **own** local palette (ocean tokens — water, light-ray, coral,
  sand, bubble, fish body/fin/cheek/eye), per ADR-0004. It does not add keys to the shared
  tokens palette. Concrete tuples are on-device-tuned; token *names* are load-bearing.
- Sound: per ADR-0004 the Shell's Sound engine gains a generic `play(voice)` primitive (the
  oscillator+envelope `Voice` shape becomes public Sound API); the fish defines a local `puff`
  recipe (a rising pitch-bend "inflate") in its own folder and calls `sound.play(puff)`. The Toy
  still receives `sound` through the contract and never imports Web Audio directly, so ADR-0003
  holds. `haptics?.tick()` fires on tap alongside the puff, matching Sheep.
- Shared-module migrations forced by ADR-0004 (do them as part of this work, not optional cleanup):
  - Move the meadow palette out of the shared tokens module into the Counting Sheep folder; the
    shared tokens module retains only cross-Toy primitives (`font`, `timing`, `chrome`, `card`).
  - Move `baa()` off the shared Sound engine into a Counting Sheep local recipe consumed via the
    new `play(voice)`. `celebrate()`, `unlock()`, and the mute concerns stay shared (Completion is
    the Shell's, per ADR-0001).
  - Add a Shell-owned neutral **ink** token for the Home Card title (it currently borrows the
    meadow `sheepSilhouette`); after migration that meadow token is no longer in the shared module.
  - Change `ToyEntry.tint` from a shared-palette key to a concrete CSS color string; each registry
    entry supplies its tint from its own Toy palette. Update the existing Counting Sheep entry and
    the Card consumer accordingly.
- Registry: add the `puffer-fish` entry (id, title, component, `tint` color string, `preview`).
  The Toy ships its own tiny inline SVG preview-scene (a miniature underwater scene with the round
  fish) the Home Card hosts, mirroring how Counting Sheep ships its meadow preview.

## Testing Decisions
- Test the **loop's observable contract**, not the choreography: a `data-toy-state` attribute on
  the Toy root exposes the current state; the on-stage fish is reachable as an accessible button
  (label "Fish"). Assert: at most one fish on stage; tapping in `waiting` advances to `dismissing`
  and increments the popped count; taps during `arriving`/`dismissing` are non-destructive no-ops;
  after N pops the state is terminal `completed` and no further fish mount; `onComplete` fires
  exactly once (ref-guarded against the Shell re-rendering a new `onComplete` at Completion).
- Test the **`play(voice)` primitive** at the Web Audio boundary the way Sheep tests `baa()` —
  inject a fake `AudioContext` via the engine's `contextFactory` and assert an oscillator started;
  assert `play` no-ops when muted and when no context exists (jsdom). Assert the fish calls
  `sound.play(...)` and `haptics.tick()` on a counting tap (inject fakes via the contract).
- Test the **migrations don't regress**: Counting Sheep's tests still pass after the meadow
  palette and `baa()` move into its folder; the Card renders its tint from a color string and its
  title from the new Shell ink token; `celebrate()`/`unlock()`/mute still live on the shared engine.
- Do **not** unit-assert the puff scale, float-up path, swim-in offsets, sound frequencies, colors,
  or anything `dvh`/`env()` — those are on-device-tuned per the slice DoD (the project's standing
  posture). Mocking policy: shim only the Web Audio boundary and inject fakes through the contract;
  never mock our own components.

## Out of Scope
- A shared/extracted Toy-loop hook or framework — explicitly rejected
  (out-of-scope: shared-toy-loop-abstraction); the fish duplicates the state machine.
- Any progress/score/reward meta-layer (out-of-scope: progress-and-gamification) — the Completion
  celebration is the entire reward.
- Spikes on the puffed fish, a pop/destroy or any fail/lose beat, and a timer cutoff — the fish
  always floats away happy (ADR-0001).
- Real music or a Tone.js dependency — the puff is a one-shot synthesized voice (ADR-0003).
- Binary art or audio assets of any kind (ADR-0002).
- Reworking the Shell, the Completion overlay, or the Sheep mechanic beyond the ADR-0004
  migrations named above.

## Further Notes
- Open (on-device-tunable, not blocking): exact fish count (~5); whether fish swim in from a fixed
  side or alternate; exact puff scale, wobble, and float-up timing; exact ocean palette tuples;
  the `puff` voice's frequency/bend/decay. Resolve these in the kid-handoff DoD as Sheep's were.
- Sequencing suggestion for slicing: land the ADR-0004 shared-module migrations (palette move,
  `play(voice)` + `baa()` move, Card ink token, `tint` → color string) before or alongside the
  fish so the fish is built on the new primitives rather than retrofitted onto the old shared
  modules.
- Visual reference: a smooth round white/pink kawaii puffer fish in a soft, top-lit underwater
  scene (coral, bubbles, sandy floor) — the image shared in the grill session.
