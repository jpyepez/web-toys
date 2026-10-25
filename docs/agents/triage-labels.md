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
