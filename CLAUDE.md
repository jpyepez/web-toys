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

## Reference docs (`.work/`, load on demand)
IMPORTANT: before writing or changing Shell or Toy code, read `.work/CONTEXT.md` for the
domain vocabulary (use Toy / Goal / Completion / Card / Critter — not game / score / level)
and skim `.work/adr/` for the architectural decisions and gotchas behind the rules above
(e.g. the audio + test-harness constraints in ADR-0003). Rejected features: `.work/out-of-scope/`.
