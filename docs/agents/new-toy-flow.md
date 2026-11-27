# New Toy flow: build first, play, then tune

For a **new Toy**, the owner's input is a **pitch**: a few lines naming the Critters, the
gesture and what happens at the end. The agent writes the spec and builds from it. The owner
plays the result on a phone and gives feedback; that feedback steers the next tickets.

**Why:** grilling a new Toy before it existed mostly ended in "go with your recommendations".
Questions about fun and feel can only be answered by playing the Toy. A Toy is a
self-contained folder behind the `onComplete()` contract, so a wrong default costs a small edit,
and CLAUDE.md, the ADRs, `docs/out-of-scope/`, the `critter-art` skill and the test suites
already hold the rules a grill used to enforce.

**Scope:** a new Toy only. Shell, Home, registry-shape and cross-Toy art work (`src/shell/`)
keep the usual grill: rework there reaches every Toy.

This flow is an experiment in this repo. After the first Toy built this way, the owner
decides whether to keep it.

## Steps

1. **Read the guardrails.** `GLOSSARY.md`, `docs/adr/`, `docs/out-of-scope/`, and the
   `critter-art` skill. Done when you can name which ADRs the pitch touches.
2. **Decide every open question yourself.** Gesture, Goal size, Cast, feedback under the
   finger, progress beats, Outro, sound and haptics, idle demo, palette. Choose the option
   you'd recommend in a grill and record it under **Decisions taken**, one line each with
   its reason, so the owner can overrule any one of them in a single comment. Done when the
   spec has no question left open for the owner.
3. **Check the stop list.** Ask the owner only when a decision would:
   - change the Toy contract, `ToyHost.tsx`, Home, or anything else under `src/shell/`;
   - bend a non-negotiable in CLAUDE.md;
   - contradict an ADR or reopen something in `docs/out-of-scope/`;
   - need a new ADR.

   Ask these together in one message, with your recommendation for each. Nothing on the list
   means no questions: go straight to step 4.
4. **Publish the spec.** A parent issue in the shape of issue 36 (pitch paragraph,
   **Decisions taken**, Tickets, Out of scope), labelled `ready`. Done when the issue exists
   and its board Status is Ready.
5. **Ticket the playable Toy first.** One `ready` sub-issue: the whole loop, from first touch
   to `onComplete()`, with code-drawn placeholder Critters and scene. The owner plays it from
   the PR's Vercel Preview link before merging, so the ticket registers it as a Draft Toy
   (`draft: true` in `src/toys/registry.ts`), which has a Card only in a Preview Deployment
   and in `bun run dev`. The ticket that ships the Toy removes `draft`. Add only the tickets
   that clearly follow (art, sound, idle demo, on-device tuning) and leave the rest
   unwritten: the owner's feedback on the playable Toy decides them.

## Feedback

The owner's feedback arrives as PR review comments (fix in that PR) or as new issues
(`needs-triage`, later tickets). When feedback overrules a decision, update that line of
**Decisions taken** in the spec so the spec stays the record of what the Toy is.
