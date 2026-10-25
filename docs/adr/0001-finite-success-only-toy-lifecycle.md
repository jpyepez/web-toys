# Toys are finite, goal-driven, and success-only

Every Toy ends by achieving its Goal, which triggers a celebratory **Completion** — there
is no timer cutoff and no failure/lose state. The ~15–30s duration is a design target we
hit by sizing each Toy's Goal, not a clock that interrupts the child. We chose this over
(a) an infinite/open-ended sandbox and (b) a hard countdown timer, because for a 3–4 year
old a clear, satisfying "we did it!" ending is the whole point — "we've achieved what
we've achieved here."

## Consequences

- The shared shell owns and enforces the lifecycle: entry → play → Goal met → Completion →
  replay/back. Individual toys must not implement their own timeouts or fail states.
- Toy design starts from "what is the Goal, and how do we size it to ~15–30s?" — not from
  open-ended mechanics.

## Amendment — the Outro layer (PRD: Counting Sheep polish)

The original sentence *"Shell owns Completion"* was being read by a future reader (and
acted on by the first slice of ToyHost) as *"the moment the Toy fires `onComplete`, the
Shell unmounts it and renders the celebration alone."* That reading underdelivered the
PRD spec for Counting Sheep, which wants *"the Sheep line up and jump together **with**
a confetti-style burst"* — simultaneous, not sequential. Sharpened rule:

- **The Toy keeps rendering after it fires `onComplete`.** It is not unmounted by the
  Shell during the celebration; it stays mounted and plays its **Outro** (the Toy's
  choreographed end-beat — see CONTEXT).
- **The Shell layers the celebration on top.** Confetti, the celebratory sound, and the
  end state (Play again / Home) are the Shell's; they render as a sibling overlay above
  the still-mounted Toy. The Shell still owns *what* happens at Completion; it now
  cooperates with the Toy on *what is visible*.
- **`onComplete` remains a one-shot signal**, called once when the Goal is met. The Toy
  does not signal again to mark "outro done" — the celebration runs for the Shell's
  beat (`CELEBRATION_MS`), then the end state appears. If a Toy wants its Outro shorter
  than the celebration, that's fine; the overlay still pins the timing.
- **Toys that don't need an Outro do nothing extra.** A bare Toy that doesn't react to
  its own goal-met state will just render its final frame underneath the celebration.
  The contract change is one-directional permission, not new required behaviour.

This stays inside the spirit of the original decision: no fail states, no timer cutoff,
the Shell still gates entry/exit and owns the end state. What's added is a clarified
*who renders what* during the celebration window.
