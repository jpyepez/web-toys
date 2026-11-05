# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready`              | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Issues labelled `notes` are running notes, not requests: `/triage-issues` skips them.

## Categories

Every triaged issue carries exactly one category label. This repo uses three:

| Label           | Meaning                                         |
| --------------- | ----------------------------------------------- |
| `bug`           | Something is broken                             |
| `enhancement`   | New feature or improvement                      |
| `documentation` | Docs-only change (no Toy or Shell code changes) |

Edit the right-hand column to match whatever vocabulary you actually use.

## The `ready` bar

An issue is `ready` only when every point holds:

1. **One outcome, named in the glossary's words.** It says what changes for a Toy, the
   Shell or the tooling, using Toy / Goal / Completion / Card / Critter.
2. **Every acceptance criterion is checkable by a Vitest test**, such as a state
   transition, `onComplete()` firing once, a DOM structure, or a colour or geometry rule
   asserted like `canopy.test.ts`. For a docs- or config-only change, reading the diff
   is enough.
3. **No judgement of look or feel.** "Cuter", "reads better on a phone", tuning a palette
   or timing on-device, or drawing new art needs the critter lab and a real device, so
   it's `ready-for-human`.
4. **It fits the rules.** No binary assets, success-only with no fail state, the single
   `onComplete()` contract, and Home as a pure launcher. Nothing in `docs/out-of-scope/`.
5. **It fits one PR and touches nothing on the hand-back list** (in `issue-tracker.md`).
