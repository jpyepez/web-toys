# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Edit an issue body**: write the whole new body to a file, then `gh issue edit <number> --body-file <file>`. Never pass `-` or an empty body.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: see "When a skill says close or resolve a ticket" below.

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage-issues` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## When a skill says "close" or "resolve" a ticket

A merged PR closes the ticket. Open a PR to `main` with `Closes #<n>` in the description for each ticket it finishes; the issue stays open until that PR merges, even when the work is finished on a branch.

Work that ships no code (wontfix, duplicates, pathfinder resolves, a parent spec whose sub-issues are all closed) closes directly: `gh issue close <number> --comment "..."`.

## Commit references

Reference the issue as `#<number>` in the commit message (e.g. `Closes #42` on the final commit).

`closes`, `fixes` or `resolves` followed by `#<n>` anywhere in a PR description closes that issue when the PR merges, even mid-sentence. To mention an issue without closing it, write the number without the `#` ("see issue 42").

## Repo conventions

- **Labels**: the triage roles use the strings in `triage-labels.md`. A closed issue is done; there is no `done` label.
- **A spec is a parent issue.** The issue body is the spec, labelled `ready`. Its tickets are GitHub sub-issues of it, added in dependency order (blockers first): `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`, where `<child-db-id>` is the child's numeric database id (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`). Blocking between tickets uses native issue dependencies, as described under Wayfinding below.
- **Promote, don't duplicate.** When a spec comes out of an existing issue (usually an inbox item after triage), replace that issue's body with the spec instead of opening a new issue. First post the original body as a comment headed `Original note:` so it stays readable. Retitle the issue if the scope changed.
- **PRs close tickets**: see "When a skill says close or resolve a ticket" above.
- **Claim before working**: before implementing an issue, assign it with `gh issue edit <n> --add-assignee @me` and set its board Status to In progress (below).
- **Board**: the [web-toys project](https://github.com/users/jpyepez/projects/2) is one board with a column per Status: Inbox, Ready, In progress, Done. GitHub's built-in workflows add new issues to Inbox and move closed issues to Done. Keep Status in step with the triage label whenever you change one:

  | Change | Status |
  | --- | --- |
  | `needs-triage` or `needs-info` applied | Inbox (`1a40952e`) |
  | `ready` or `ready-for-human` applied | Ready (`b8c60112`) |
  | Issue claimed | In progress (`21bb46b4`) |

  Set it with two commands. `item-add` returns the issue's card, adding it first if it isn't on the board yet:

  ```sh
  item=$(gh project item-add 2 --owner jpyepez --url https://github.com/jpyepez/web-toys/issues/<n> --format json --jq .id)
  gh project item-edit --project-id PVT_kwHOAJXAFM4BooN4 --id "$item" --field-id PVTSSF_lAHOAJXAFM4BooN4zhnHakM --single-select-option-id <option-id>
  ```
- **Not issues**: glossary, ADRs and out-of-scope records stay as files (see `domain.md`).

## Wayfinding operations

Used by `/pathfinder`. The **map** is a single issue with **child** issues as tickets. Issues labelled `pathfinder:*` are planning, not requests: `/triage-issues` skips them.

- **Map**: a single issue labelled `pathfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label pathfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `pathfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
