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
A tappable character in a Toy (fish, sheep, etc.), drawn from code SVG primitives — never
an image. Tapping a Critter is the core interaction.

**Code-generated assets**:
Project-wide stance that all visuals are code-drawn SVG and all sound is synthesized at
runtime (Web Audio / Tone.js) — there are no binary assets. See
[[0002-no-binary-assets-everything-code-generated]].

## Relationships

- The **home screen** shows one **Card** per **Toy**
- A **Toy** contains exactly one **Goal**
- Achieving a **Goal** triggers **Completion**
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
