# Shared Toy-Loop Abstraction

This project will **not** extract the "one critter at a time" play-loop into a shared hook
or framework (e.g. a `useCritterLoop({count, beats})` in the Shell) that multiple Toys
consume. Each Toy writes its own loop, even when two Toys share the same shape.

The shape in question is the five-state machine Counting Sheep uses and Puffer Fish copies:
`arriving → waiting → dismissing → idle → completed`, where the only user-driven transition
is the tap (`waiting → dismissing`) and the rest are time-driven beats. The Puffer Fish is
the second Toy with this exact structure, which is the moment the DRY temptation appears.

## Why this is out of scope

It conflicts with the project's core independence stance: "each Toy is independent — its own
component, assets, and logic — so Toys can differ wildly without affecting each other"
(CONTEXT), reinforced by [[0004-shared-modules-expose-primitives-toys-own-assets]], which
pushed scene palettes and sound recipes *out* of the shared Shell modules. A shared loop hook
would pull mechanics back *into* the Shell — the opposite direction — and couple every
one-at-a-time Toy to a single shape. The whole point of the architecture is that a future Toy
can abandon the one-at-a-time loop entirely (several critters at once, an inflate-by-taps
single critter, something not yet imagined) without first un-picking a shared abstraction.

The duplication is real but small (~40 lines of state-machine logic) and cheap to maintain
independently — a price deliberately paid for the freedom to diverge. The Shell shares
*primitives* (timing eases, the sound voice primitive, confetti, Completion), not *mechanics*.

This is a rejected refactor of how Toys are shaped, recorded here rather than as an ADR
because it is most useful as a "don't re-pitch this" note the next time a third one-at-a-time
Toy lands and someone reaches for `Extract Function`.

## Considered

- 2026-06-04 — raised during the Puffer Fish grill-with-context session, when the fish loop
  came out structurally identical to Counting Sheep; rejected in favour of duplication.
