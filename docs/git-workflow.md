# Git workflow

Commits and PR titles use Conventional Commits: `<type>(<scope>): <imperative summary>`.
A squash merge uses the PR title as the commit, so the PR title follows the same rule.

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

**Scopes**, from the repo's real areas:

| Scope | Covers |
| --- | --- |
| `balloons`, `counting-sheep`, `muddy-puddle`, `nestlings`, `puffer-fish` | one Toy, named after its `src/toys/` folder |
| `shell` | `src/shell/` apart from the art: Home, Cards, Completion, sound, PWA |
| `art` | `src/shell/art/` and the critter-art skill |
| `lab` | the critter lab, `src/lab/` |
| `deps` | dependency changes |
| `ci` | `.github/` |
| `docs` | ADRs, glossary, out-of-scope, agent docs |

Leave the scope out for a change that spans several areas. Use `!` after the scope only
for a change that breaks the Toy contract.

Write issues as "issue 42" in commit messages and PR text, without the `#`. The one
exception is `Closes #<n>`, on a line of its own in the PR description (see
`docs/agents/issue-tracker.md`).
