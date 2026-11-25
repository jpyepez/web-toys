# web-toys

A phone-first, installable PWA hosting a small collection of tiny, finite,
code-generated interactive "toys" — tap a cute critter, something fun happens,
it ends in ~15–30s — to keep young children (around 3–4) entertained.

## Stack
Vite + React + TypeScript · TanStack Router · Motion (Framer Motion) ·
Tone.js / Web Audio. Static SPA, no backend. Installable PWA (vite-plugin-pwa).

## Commands
Package manager is **Bun** (use `bun install`, not npm/pnpm/yarn).
- `bun run dev` — Vite dev server
- `bun run build` — typecheck (`tsc -b`) + production build
- `bun run test` — Vitest (one-shot); `bun run test:watch` to watch
- `bun run typecheck` — `tsc -b` only
- `bun run test:e2e` — Playwright smoke test of the production build (Home and every Toy
  load with no console errors). Visual checks before a PR: `docs/browser-verification.md`

## Non-negotiable rules
- **No binary assets.** Critters are code-drawn SVG; sound is synthesized.
  No image/sprite/audio files.
- **Toys are finite, goal-driven, success-only.** No timer cutoff, no fail/lose
  state. Reaching the Goal triggers a celebratory Completion.
- **Toys plug into the Shell via a single `onComplete()` contract.** The Shell
  owns home/cards, transitions, Completion, replay/back — toys never reimplement it.
- **Home is a pure launcher.** No scores, stars, profiles, or progress meta-layer.

## Critter art

**Before drawing or changing any Toy's art (a Critter, scene, palette, Preview card
or any colour), invoke the `critter-art` skill.** It holds the house rules, the
critter lab and the checks. `src/toys/house-rules.test.ts` enforces the mechanical
rules for every Toy.

## Reference docs (load on demand)
IMPORTANT: before writing or changing Shell or Toy code, read `GLOSSARY.md` for the
domain vocabulary (use Toy / Goal / Completion / Card / Critter — not game / score / level)
and skim `docs/adr/` for the architectural decisions and gotchas behind the rules above
(e.g. the audio + test-harness constraints in ADR-0003). Rejected features: `docs/out-of-scope/`.

Active specs are GitHub issues labelled `ready` that have sub-issues — read the relevant one
(`gh issue view <n> --json number,title,body,labels,comments`) before implementing a feature.
Finished PRDs and slices from before the move to GitHub: `docs/archive.md`.

## Agent skills

Triage and implement run on [github-agents](https://github.com/jpyepez/github-agents), configured in
`.github/agents.yml`. Commit and PR title style: `docs/git-workflow.md`.

### Issue tracker

Issues and specs are GitHub issues, managed with `gh`. A spec is a parent issue with its
tickets as sub-issues. A merged PR with `Closes #<n>` closes a code ticket; `gh issue close`
is only for work that ships no code. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five triage roles; `ready-for-agent` is written as `ready`. See `docs/agents/triage-labels.md`.

### Domain docs

Glossary `GLOSSARY.md`, ADRs `docs/adr/`, out-of-scope `docs/out-of-scope/`, all writable.
See `docs/agents/domain.md`.

### Notes

Running notes and rough ideas are GitHub issues: label `notes` for running notes,
`needs-triage` for an idea to sort later. There is no `.work/` folder.
