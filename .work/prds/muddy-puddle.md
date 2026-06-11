# Muddy Puddle

## Problem Statement
The collection has two Toys (Counting Sheep, Puffer Fish) and both are *tap* the Critter.
A 3–4 year old who has learned "tap → delight" has met the whole gestural vocabulary of the
site; a third tap-toy would read as a reskin, not a new thing to do. The launcher needs a Toy
built on a genuinely different gesture — one a 3-year-old can still reliably perform — so the
collection grows in *kind*, not just in *theme*. Touch-development research is blunt about which
gestures work at this age (tap, short drag, swipe) and which fail (double-tap, pinch, anything
two-handed), so the new gesture must come from the reliable set and be taught wordlessly.

## Solution
A new farmyard Toy, **Muddy Puddle**. A muddy critter trots onto a barnyard scene, caked in mud
so you can't tell who it is — just an ear, a tail, or a beak poking out as a tease. The child
**Wipes** the mud off with a finger; the mud lifts away under their touch with a wet squelch, and
once it's mostly gone the critter **snaps clean and sparkling**, you finally see *who it was*
(piglet! duckling! lamb!), it gives a happy little sound, and trots off. The next muddy critter
arrives — a different animal each time. After all five are clean the Goal is met and the Shell's
Completion plays over the last critter splashing for joy in the now-clean puddle. The child gets a
third Toy that is unmistakably a *new thing to do* — wiping instead of tapping, a surprise reveal
instead of a fixed critter, five different animals instead of one — using a gesture their hands can
actually manage, taught to them without a single word.

## User Stories
1. As a child, I want a muddy critter to trot onto the screen, so that I have an inviting, mucky
   thing to clean up.
2. As a child, I want the mud to wipe away under my finger, so that my wiping produces an immediate,
   satisfying cause-and-effect.
3. As a child, I want to find out *who* was hiding under the mud when it's clean, so that each
   critter is a little surprise.
4. As a child, I want the critter to come fully clean and trot off happily once I've wiped most of
   the mud, so that I'm never stuck chasing the last muddy bit.
5. As a child, I want a new, different muddy animal to arrive after the last one leaves, so that the
   play continues and I want to see who's next.
6. As a child who doesn't know what to do, I want the toy to *show* me how to wipe, so that I can
   start playing without anyone telling me.
7. As a child, I want wiping to feel and sound good — a wet squelch as the mud lifts, a happy animal
   sound when it's clean, a little buzz — so that the toy feels alive and responsive.
8. As a child, I want a celebration when every critter is clean, so that I know "we did it!"
9. As a parent, I want a third toy that's clearly a different *activity* from the two tap toys, so
   that the collection feels varied and worth opening again.

## Implementation Decisions
- Module: new Toy `muddy-puddle` under the toys area (deep — owns its own scene, the five
  Critters, loop state machine, palette, sound recipes, and the wipe-coverage logic; the Shell and
  other Toys are untouched). Adding it is one additive registry entry, per the existing registry
  contract. Unlike Puffer Fish, this Toy lands on the already-migrated shared primitives (the
  ADR-0004 palette/`play(voice)`/ink/`tint` migrations are done) — there are **no shared-module
  migrations** in this work.
- Interface: the standard Shell↔Toy contract only — the component takes `{ onComplete, sound?,
  haptics? }` and calls `onComplete()` once when the Goal is met. **No new Shell↔Toy surface**; in
  particular the wipe audio is built from the existing one-shot `play(voice)` primitive and does
  **not** add a sustained start/stop sound API to the Shell.
- Core interaction — the **Wipe** (new): a sustained finger drag across a muddy Critter removes the
  mud it passes over. This is the first non-tap core interaction in the collection; `Critter` was
  broadened in CONTEXT to be interaction-agnostic to accommodate it.
- Wipe-coverage model — **discrete SVG smudge blobs**, per
  [[0006-wipe-coverage-as-discrete-svg-blobs]]: mud is a set of individual SVG blobs (~12–20,
  on-device-tuned) layered over the clean Critter. A blob is removed when a touch point crosses it.
  "Clean enough" is a fraction of blobs removed. No `<canvas>`; coverage is observable by counting
  remaining blob nodes, not by reading pixels.
- Clean-snap — when blobs-remaining crosses the clean threshold (~80% wiped, on-device-tuned), the
  Critter **auto-snaps clean**: any leftover blobs vanish at once, a sparkle plays, and it
  transitions to `dismissing` on its own. The child never has to wipe the final bit — partial
  completion is by design (the touch-development research: 3-year-olds abandon the last fraction).
  There is no fail/stuck state; the only path is success (ADR-0001).
- Loop: the Toy owns its **own copy** of the five-state machine, duplicated from the tap toys
  rather than shared — `arriving → wiping → dismissing → idle → completed` (the user-driven beat is
  renamed `waiting → wiping` in this Toy's private copy for readability). The only user-driven
  transition is the wipe crossing the threshold (`wiping → dismissing`); the rest are time-driven
  beats. `onComplete` fires once (ref-guarded) at the clean-snap of the **fifth** Critter so the
  Shell's Completion overlay runs concurrently with the last critter's exit (layered-concurrent
  rule, ADR-0001 amendment). The fifth dismiss lands in terminal `completed` — no further critters
  arrive. Duplication is the deliberate cost of Toy independence
  ([[shared-toy-loop-abstraction]]).
- Goal: clean all **five** Critters. The cast is fixed at five animals, **one each, no repeats**
  (piglet, duckling, lamb, chick, calf), so — diverging from the tap toys where the *critter count*
  was the duration lever — the ~15–30s length here is tuned via **blobs-per-critter and the
  threshold**, not by adding/removing critters. The five-animal cast and the count are the same
  number by construction.
- Cast & reveal: each round is a **different** animal, **order shuffled per play** so "Play again"
  feels fresh. Identity is **hidden under the mud with a small tease** — the mud fully obscures who
  it is except for one extremity (an ear, a tail, a beak) poking out to spark "who's that?"
  anticipation; the reveal lands at the clean-snap. Each Critter is its own SVG drawing from
  primitives only (ADR-0002), structural pieces tagged with `data-*` part hooks (mirrors
  `data-sheep-part` / `data-fish-part`).
- Discoverability — **idle-triggered demo**: if no wipe happens within ~2–3s of a Critter settling,
  a translucent "ghost finger" sweeps across the mud and one or two blobs lift-and-reform to
  demonstrate the cause-and-effect wordlessly. It loops until the child wipes and re-prompts on any
  Critter where they stall. The demo's blobs **reform** (they do not give real progress) — it
  teaches the mechanic honestly without playing the toy for the child.
- Touch handling — **accept all touch points**: any finger or palm crossing a blob clears it, so
  multi-finger or whole-hand mashing simply cleans faster (forgiving, not broken — multi-touch is
  harmless here, unlike pinch which the project avoids for this age). The wipe surface sets
  `touch-action: none` so the browser does not hijack the drag for scroll/zoom.
- Placement — the Critter (the wipe target) sits **upper-center**, reachable but clear of the
  bottom palm-rest dead zone where 3-year-olds accidentally trigger touches; the mud puddle and
  barnyard ground anchor the lower third per the layered, bottom-anchored backdrop pattern
  ([[0005-toy-backdrops-bottom-anchored-layered-scenes]]). The target is large (≥ ~2cm).
- Signature beat: on each contributing wipe, blobs under the touch lift away (a quick fade/shrink)
  with a wet squelch; at the threshold the Critter snaps clean with a sparkle and a happy
  per-animal sound, then trots off. Arrival is a muddy trot-in from the side. Motion choreography
  consumes shared `timing` eases; exact tuples/offsets are on-device-tuned (the project's testing
  posture). Reduced-motion is honoured for the demo sweep, the snap, and the splash (as Sheep/Fish
  honour it).
- Critter art: five smooth, round, kawaii farm animals drawn from SVG primitives — piglet,
  duckling, lamb, chick, calf — each warm and legible at the clean reveal. Mud blobs are a separate
  earthy-brown layer painted over each.
- Scene: own barnyard backdrop component (analog to the meadow/underwater backdrops), code-drawn
  SVG, layered and bottom-anchored (ADR-0005) — sky, a distant barn/fence silhouette, and a mud
  puddle in the lower third the critters emerge from and the last one splashes in. Backdrop layers
  tagged with `data-*` layer hooks.
- Palette: the Toy ships its **own** local palette (barnyard tokens — sky, barn, fence, grass, mud,
  puddle, sparkle, plus per-animal body/feature colors), per ADR-0004. It does not add keys to the
  shared tokens palette. Concrete tuples are on-device-tuned; token *names* are load-bearing.
- Sound: per ADR-0004 the Toy defines its own local recipes consumed via the Shell's `play(voice)`:
  a short wet **squelch** voice played per blob cleared but **throttled** (min ~60–80ms apart, with
  pitch jitter so it reads as playful, not a machine-gun), a **sparkle** on the clean-snap, and a
  distinct **happy per-animal voice** on each reveal (oink / quack / baa / peep / moo). The Toy
  receives `sound` through the contract and never imports Web Audio directly (ADR-0003).
  `haptics?.tick()` fires on contributing wipes (throttled with the squelch) and/or the snap,
  matching the tactile feel of the tap toys.
- Registry: add the `muddy-puddle` entry (id, title "Muddy Puddle", component, `tint` color string
  from its own palette, `preview`). The Toy ships its own tiny inline SVG preview-scene (a muddy
  critter with a wiped streak revealing a sliver of clean animal) the Home Card hosts, mirroring how
  the existing Toys ship their previews.

## Testing Decisions
- Test the **loop's observable contract**, not the choreography: a `data-toy-state` attribute on
  the Toy root exposes the current state; wipe-progress is exposed via a `data-*` hook (remaining
  blob count or equivalent) so tests can drive progress to the threshold without reading pixels
  (per ADR-0006). The on-stage Critter is reachable as an accessible element. Assert: at most one
  Critter on stage; simulating wipes that cross the threshold during `wiping` advances to
  `dismissing` and increments the cleaned count; the clean-snap removes remaining blobs; wipes
  during `arriving`/`dismissing` are non-destructive no-ops; after the fifth clean the state is
  terminal `completed` and no further Critters mount; `onComplete` fires exactly once (ref-guarded
  against the Shell re-rendering a new `onComplete` at Completion).
- Test the **wipe-coverage contract** at the blob boundary (the assertable half of ADR-0006):
  crossing a blob removes it; *that* crossing the threshold triggers the clean-snap and dismiss.
  Do **not** unit-assert the exact blob count or the exact threshold percentage — those are
  on-device-tuned constants, like the sheep/fish counts.
- Test the **idle demo** by its observable effect, not its visuals: after the idle delay with no
  wipe, the demo is active; a real wipe cancels/suppresses it; the demo's blobs reform (it does not
  advance the cleaned count or the threshold). Keep this at the state/flag level — the ghost-finger
  animation itself is on-device-tuned.
- Test the **sound recipes** at the Web Audio boundary the way the tap toys test `baa`/`puff` —
  inject a fake `AudioContext` via the engine's `contextFactory` and assert an oscillator started;
  assert `play` no-ops when muted and when no context exists (jsdom). Assert the Toy calls
  `sound.play(...)` for a contributing wipe and for the clean-snap, that rapid wipes are
  **throttled** (sounds are rate-limited, not one-per-blob unbounded), and that `haptics.tick()`
  fires, injecting fakes through the contract.
- Do **not** unit-assert blob counts, wipe-snap scale, trot-in/splash paths, sound frequencies,
  colors, the demo animation, or anything `dvh`/`env()`/backdrop-geometry — those are on-device-tuned
  per the slice DoD (the project's standing posture). Mocking policy: shim only the Web Audio
  boundary and inject fakes through the contract; never mock our own components.

## Out of Scope
- A shared/extracted Toy-loop hook or framework — explicitly rejected
  ([[shared-toy-loop-abstraction]]); this Toy duplicates the state machine.
- A continuous `<canvas>` mud-erase mask measured by pixel coverage — rejected in favour of
  discrete SVG blobs ([[0006-wipe-coverage-as-discrete-svg-blobs]]).
- A sustained start/stop "rubbing" sound that would expand the Shell's Sound API — the wipe audio is
  one-shot throttled squelches via the existing `play(voice)` (ADR-0003/0004).
- Any progress/score/reward meta-layer ([[progress-and-gamification]]) — the Completion celebration
  is the entire reward; the surprise cast is not a "collection" to track.
- A requirement to wipe the Critter 100% clean, any "missed a spot" nag, or any fail/stuck/timeout
  beat — the clean-snap is forgiving and the Critter always comes clean and happy (ADR-0001).
- An all-five reunion Outro — the Outro is the last on-stage Critter's splash, matching the
  on-stage-only Outro pattern of the tap toys.
- Pinch, double-tap, or any two-handed gesture — outside the reliable gesture set for this age.
- Real music or a Tone.js dependency; binary art or audio assets of any kind (ADR-0002/0003).
- Reworking the Shell, the Completion overlay, or the existing Toys.

## Further Notes
- Open (on-device-tunable, not blocking): exact blobs-per-critter (~12–20) and the clean threshold
  (~80%); the squelch throttle interval and pitch-jitter range; the trot-in side and whether it
  alternates; the snap/sparkle/splash timing; the per-animal voice recipes; the barnyard palette
  tuples; the size/shape of the tease extremity per animal; the idle delay (~2–3s) before the demo.
  Resolve these in the kid-handoff DoD as the prior Toys' were.
- The idle "ghost-finger demo" is, for now, local to this Toy. If a future gesture Toy needs the
  same wordless-teaching pattern, consider whether it warrants a shared primitive or a CONTEXT term
  then — do not pre-abstract it now ([[shared-toy-loop-abstraction]] is the cautionary precedent).
- Sequencing suggestion for slicing: the barnyard backdrop + palette and the wipe-coverage
  mechanic (blobs + threshold + clean-snap) are the load-bearing unknowns; land a single-animal
  vertical slice (one Critter, wipe-to-clean-to-dismiss) before adding the variety cast, the idle
  demo, the sounds, and the registry/preview.
</content>
</invoke>
