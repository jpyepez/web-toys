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

## Non-negotiable rules
- **No binary assets.** Critters are code-drawn SVG; sound is synthesized.
  No image/sprite/audio files.
- **Toys are finite, goal-driven, success-only.** No timer cutoff, no fail/lose
  state. Reaching the Goal triggers a celebratory Completion.
- **Toys plug into the Shell via a single `onComplete()` contract.** The Shell
  owns home/cards, transitions, Completion, replay/back — toys never reimplement it.
- **Home is a pure launcher.** No scores, stars, profiles, or progress meta-layer.

## Critter art

**Before drawing or changing any Toy's art, invoke the `critter-art` skill**
(`.claude/skills/critter-art/`). What follows is the map — where things live. The
skill is the procedure: which shapes may exist behind the cast, which colour class
a thing belongs to, and the four checks that have to pass. A section you can read
and still not apply is how these rules got broken last time.

The house style (paper, contour ink, the `shade()` shadow formula, disorder) lives in
`src/shell/art/` — cross-Toy primitives per ADR-0004; each Toy still owns its scene and
cast hues. Colours are authored in **OKLCH, never `hsl()`**: `hsl()`'s L is a channel
midpoint, not a lightness, so "these are siblings" is unassertable in it.

Tune the art in the critter lab — `bun run dev`, then `/lab.html` (`src/lab/`, its own Vite
entry, never in the production build). Saved configs land in `src/lab/saved/`; the shipped
house style is harvested from `bluebird-contour-4271.json`.

The lab has two canvases and they answer different questions. **Critter view** is one bird
in a 100×120 box — the instrument for proportion, line and colour. **Frame view** is the
whole scene at a real viewport aspect (phone / square / 16:10) with the cast standing on
the limbs. Composition is only visible there: the scene it replaced read as acceptable on
a phone and fell apart at 16:10, which is precisely what a single-aspect preview hides.
Judge any scene change at **both** aspects before saving.

Scenery is generated, not hand-placed. `toys/nestlings/canopy.ts` builds the tree; its
rules (which shape classes may appear behind the cast, and why a crown may not) run as
tests in `canopy.test.ts`. **The scene's unit is a bird, not the viewport** — a bird is 36%
of a phone's width and under 10% of a desktop's, so any size authored in frame units
silently changes class as the frame grows.

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
