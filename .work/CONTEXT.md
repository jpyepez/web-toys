# CONTEXT

Shared domain glossary for **web-toys** — a small phone-first website that hosts a
collection of tiny, finite interactive experiences ("toys") to entertain young children (around 3–4).

## Language

**Toy**:
A single, self-contained mini-experience launched from a card on the home screen. Finite
and goal-driven: it has a clear beginning, a small **Goal**, and a satisfying **Completion**.
Tuned to last roughly 15–30 seconds. Each Toy is independent — its own component, assets,
and logic — so toys can differ wildly without affecting each other.
_Avoid_: game, level, activity, app

**Goal**:
The small finite objective inside a Toy whose achievement ends the experience (e.g. "tap
all 5 sheep"). Sized so reaching it naturally takes ~15–30s. The duration is a *consequence*
of the Goal, not a clock.
_Avoid_: objective, mission, score

**Completion**:
The satisfying end moment when a Toy's Goal is achieved — a celebration beat (animation,
sound) followed by an end state offering replay / back-to-home. It is never a failure or a
timeout cutoff: "we've achieved what we've achieved here."
_Avoid_: game over, win/lose, timeout, end screen (as a fail state)

**Card**:
The visual tile on the home screen representing one Toy. Tapping a Card launches its Toy.

**Shell**:
The thin shared frame around all toys. Owns the home screen + Cards, entry/exit
transitions, the Completion celebration, and the replay / back-to-home chrome, plus shared
utilities (confetti, sound, haptics). The Shell enforces the finite lifecycle (see
[[0001-finite-success-only-toy-lifecycle]]); individual toys never reimplement it.
_Avoid_: framework, wrapper, container

**onComplete (toy contract)**:
The single hook a Toy exposes to the Shell. A Toy renders its own world and calls
`onComplete()` when its Goal is met; the Shell takes over from there. This is the entire
contract between Shell and Toy.

**Critter**:
A character in a Toy (fish, sheep, piglet, or a faced balloon, etc.) the child interacts with — an
animal or an anthropomorphised object — drawn from code
SVG primitives — never an image. The interaction is interaction-agnostic: it may be a tap
(Counting Sheep, Puffer Fish), a sustained **Wipe** (Muddy Puddle), a sustained **Hold**
(Balloons), or some future gesture. Engaging the Critter is the core interaction; the
specific gesture is per-Toy.

**Wipe**:
The core gesture of the Muddy Puddle Toy: a sustained finger drag across a muddy **Critter**
that removes the mud it passes over. One cleaning stroke is "a Wipe"; the verb is "to Wipe".
Distinct from a tap — it is continuous and accumulative (mud removed by earlier strokes stays
removed when the finger lifts), so it is the first non-tap core interaction in the collection.
_Avoid_: scrub, wash, swipe (reserve "swipe" for a fast directional flick, which this is not)

**Hold**:
The core gesture of the Balloon Toy: a sustained, stationary finger-press that fills a
**Critter** over time (a balloon swelling 0→100%). Distinct from a **Wipe** (sustained but
*moving*, accumulating coverage) and from a tap (discrete) — a Hold accumulates *fill* by
duration, in place. It is **self-capping**: fill stops at full and the balloon auto-releases,
so holding past full does nothing and there is no over-inflate or pop. The fill is
**asymmetric** — it rises quickly while held and, on an early finger-lift, leaks back down
slowly (a soft "pfffft"), so lifting is forgiving rather than a reset. The second non-tap core
interaction in the collection.
_Avoid_: long-press, press-and-hold, charge; reserve "inflate" for the balloon-specific
effect, not the gesture name.

**Drag**:
The core gesture of the drag-to-place Toy: a sustained finger-press that *attaches* a
**Critter** to the finger and *transports* it across the scene to a target, completing on
release within a forgiving snap-radius of that target. Distinct from a **Wipe** (sustained
and moving, but accumulating coverage with no destination) and from a **Hold** (sustained
but stationary, accumulating fill by duration) — a Drag is about *carrying and positioning*,
not accumulating. Forgiving and never-fail: an early finger-lift mid-carry neither resets
nor penalizes — the Critter simply rests wherever it is left and can be picked up again, so
every Drag makes visible progress toward the Goal and nothing is ever undone. The third
non-tap core interaction in the collection.
_Avoid_: swipe, fling, throw (those are velocity gestures); reserve "drop" for the release
event, not the gesture name.

**Outro**:
A Toy's choreographed end-beat after its Goal is met — the Toy keeps rendering its
world during the Shell's celebration overlay (confetti, sound) and plays a brief
Toy-specific animation (e.g. Sheep lining up and jumping). Optional — a Toy that
doesn't react to goal-met just renders its final frame underneath the overlay.
See the ADR-0001 amendment for the layered-concurrent rule.
_Avoid_: end animation, finale, outro animation (redundant)

**Code-generated assets**:
Project-wide stance that all visuals are code-drawn SVG and all sound is synthesized at
runtime (Web Audio / Tone.js) — there are no binary assets. See
[[0002-no-binary-assets-everything-code-generated]].

## Relationships

- The **home screen** shows one **Card** per **Toy**
- A **Toy** contains exactly one **Goal**
- Achieving a **Goal** triggers the Toy's **Outro** and the Shell's **Completion**
  overlay simultaneously; the Toy stays mounted through both
- **Completion** is always a success state — there is no failure path
- The **Shell** wraps every **Toy**; a Toy signals the Shell only via **onComplete**
- A **Toy** is always exitable mid-play via an always-visible Home control — no gate, no
  confirmation; abandoning is non-destructive (re-entry is free)

## Example dialogue

> **Dev:** "What happens when the 15–30s is up but the kid hasn't finished?"
> **Parent:** "There's no 'up'. It ends when they've tapped all the sheep — that's the Goal.
> We size the Goal so that takes about half a minute. The timer never cuts them off."

## Flagged ambiguities

- "end screen" was used loosely — clarified that **Completion** is a *success* celebration,
  not a fail/timeout state. The word "timeout" is retired for this concept.
- **Critter** originally read "a *tappable* character… tapping is the core interaction" —
  broadened during the Muddy Puddle grill to be interaction-agnostic, since that Toy's core
  interaction is a **Wipe**, not a tap. The Critter is the character; the gesture is per-Toy.
