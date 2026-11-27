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

**Who runs it:** triage, for a pitch the owner files as an issue. It runs steps 1–4 and
labels the issue `ready` (the pitch bar in `docs/agents/triage-labels.md`). A session handed
a pitch in chat files it as a `needs-triage` issue and lets triage take it from there.

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

   Ask these together in one message (for triage, a `needs-info` comment), with your
   recommendation for each. Nothing on the list means no questions: go straight to step 4.
4. **Write the spec.** One issue, labelled `ready`, holding:
   - the pitch, as a short paragraph;
   - **Decisions taken**, from step 2;
   - **Acceptance**: each point checkable by a Vitest test or a screenshot, ending with the
     Toy played from first touch to `onComplete()`;
   - **Out of scope**.

   Its scope is the **playable Draft Toy**: the whole loop with code-drawn placeholder
   Critters and scene, registered with `draft: true` in `src/toys/registry.ts`, plus a
   `GLOSSARY.md` entry when the gesture is new. Done when the issue body is the spec and
   its board Status is Ready.
5. **Build the playable Draft Toy** in one PR. The implement bot picks up the `ready` issue.
   The owner plays it from the PR's Vercel Preview link, where Draft Toys have a Card, and
   merges when it plays well.
6. **Ticket what clearly follows**, from the owner's feedback on the playable Toy: art,
   sound, idle demo, on-device tuning, and the ticket that ships the Toy by removing
   `draft`. Leave the rest unwritten. With more than one ticket, open a parent issue in the
   shape of issue 36 and add them as its sub-issues.

## Feedback

The owner's feedback arrives as PR review comments (fix in that PR) or as new issues
(`needs-triage`, later tickets). When feedback overrules a decision, update that line of
**Decisions taken** in the spec so the spec stays the record of what the Toy is.
