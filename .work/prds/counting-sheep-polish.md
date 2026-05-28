# Counting Sheep — Polish + Outro Choreography

## Problem Statement
The parent PRD (`shell-counting-sheep`) shipped end-to-end — 7 slices done, tests green,
PWA installed on-device — but the result feels lifeless. Cards on the home launcher are
plain text links; the meadow is a white page with Sheep flowing inline-block; chrome
buttons are unstyled, default-positioned `<button>` elements; the Completion is a
generic Shell-level confetti burst + heading. Worse, the parent PRD originally specified
a Counting Sheep Completion where *"the Sheep line up and jump together with a
confetti-style burst"* — but slice #03 implemented Completion at the Shell level only,
and the Toy is unmounted the moment `onComplete` fires, so the Sheep never get to
celebrate. The first Toy needs to actually feel like a finished, delightful experience
for a 3–4 year old, not a TanStack Router demo with a sheep on it.

## Solution
A coherent, atmospheric, Gris-leaning visual polish pass over Counting Sheep — soft
cool-dawn palette, mostly negative space, a Toy that reads as a *place* (dawn meadow with
a horizon, a half-moon, gentle silhouettes) rather than a page with controls. Sheep get
the new palette and a soft warm-gold glow as their done state. The choreography the
parent PRD originally specified gets built: when the Goal is met, the Sheep play a soft
staggered wave-jump in place while the Shell layers warm-light particles + a bloomed
celebratory sound on top — both visible simultaneously, the Toy stays mounted (see the
amendment to ADR-0001). The Shell's celebration overlay is restyled globally so every
future Toy inherits the same aesthetic family. The Home launcher becomes a vertical
scroll of generously-sized Cards, each carrying a tiny preview scene of the Toy it
launches.

## User Stories
Actors: the **Child** (3–4 yo player) and the **Parent** (sets it up, hands over the phone).

1. As a Child, I want the meadow to feel like a real place at dawn, so that opening the
   Toy feels like arriving somewhere instead of loading a page.
2. As a Child, I want each Sheep to softly catch warm light when I tap it, so that I can
   see I made it happen without a hard graphic change.
3. As a Child, I want all the Sheep to celebrate together when I finish, so that the
   ending feels like a shared moment instead of a sudden screen swap.
4. As a Child, I want the home screen to show me beautiful big Cards I can choose between,
   so that picking a Toy feels like opening a book of small worlds.
5. As a Parent, I want the in-Toy controls (mute, home) to live unobtrusively in the
   corners, so that nothing distracts the child from the play space.

## Implementation Decisions
- Module: **design tokens** — a deep module hiding the project's palette, type stack, and
  animation primitives behind a small set of named exports. Single source of truth for the
  cool-leaning dawn palette (six concrete HSL values: sky upper, horizon glow, grass
  silhouette, sheep wool, sheep silhouette, done-state glow), the system serif font stack,
  and the timing/easing constants the Outro and Card animations consume. Every visual
  decision in this PRD references these tokens; no scene hardcodes a colour.
- Module: **Shell celebration overlay** — the existing post-Goal confetti burst +
  celebratory flourish, restyled in place. Visual: 16-piece primary-colour radial burst
  becomes ~8 soft warm-light particles drifting upward over ~2.5–3s with a soft blur glow.
  Sound: ascending arpeggio kept, per-note decay extended (~0.6s), one low sustained pad
  note added underneath for warmth. The restyle is global — every future Toy inherits this
  family. Sits inside ADR-0003's "Shell owns the sound utility" boundary.
- Module: **Shell lifecycle** — extended per the ADR-0001 amendment to layered-concurrent.
  Before: the Toy is unmounted the instant `onComplete` fires. After: the Toy remains
  mounted; the Shell's celebration overlay renders as a sibling above it, layered
  concurrently. `onComplete` stays a one-shot signal. Toys without an Outro just render
  their final frame underneath the overlay — the contract change is one-directional
  permission, not new required behaviour.
- Module: **Counting Sheep meadow** — the existing Toy, substantially rewritten as scene.
  Sky as a vertical linear gradient (sky-upper → horizon glow), one low-contrast pale
  half-moon in the upper sky, two layered grass silhouettes (distant + foreground) on the
  lower ~40% of the viewport, Sheep scattered along the foreground grass line with
  x-variation and small scale jitter for depth. Sheep retain their existing structural
  primitives (six-circle wool body, head ellipse, ears, eye dots, leg rects) — only the
  fills change to the dawn palette. The done state is a warm-gold radial gradient blooming
  inside the wool circles (not a colour swap on the existing amber fleece).
- Module: **Counting Sheep Outro** — new behaviour inside the same Toy. When the Goal is
  met, the Toy enters an outro phase: each Sheep performs a soft rise-fall jump in place,
  staggered ~300ms left-to-right, the done-glow growing brighter on each as it lands. Total
  Outro length ~2s, designed to overlap with the Shell's celebration rather than precede
  it. The Toy fires `onComplete` at the moment it enters the outro phase; the Shell starts
  its celebration immediately; both play together. The Shell's celebration duration
  constant grows from 600ms to ~2200ms so the end state appears after the choreography
  settles.
- Module: **Home launcher Cards** — the existing Home, rewritten. Vertical scroll list, one
  Card per Toy, ~70% viewport-height each, peek of the next Card as scroll affordance. Card
  body is a soft palette-gradient background extracted from the Toy's signature palette
  (Counting Sheep gets the dawn wash) carrying a tiny SVG preview-scene from inside the
  Toy. Card title beneath in system serif. Tap feedback as a gentle scale-down. Generously
  rounded corners, soft shadow, no border.
- Module: **Shell chrome positioning** — the existing mute toggle and the existing in-Toy
  Home control, restyled and re-placed. Mute top-right, Home top-left (mirrored, when a Toy
  is mounted), as low-contrast soft pill icon-buttons inside the safe-area frame. No text
  labels. The `.shell-frame` safe-area CSS shipped in the parent PRD's slice #07 already
  insets them; positioning now reads as "in the corners, recessed" rather than "wherever
  flow puts them".
- Schema changes: none. No new persistence; the mute preference remains the only persisted
  state across the app.
- API contracts: none — static SPA.
- Dependencies: no new runtime libraries. Motion, the existing Web Audio path, and the
  existing vite-plugin-pwa setup are sufficient. The design-tokens module is new but local
  code, not a third-party dependency.

## Testing Decisions
- **Slice-level DoD:** tests green for the unit-testable portion + on-device visual review
  against the slice's spec. Matches the pattern established by the parent PRD's slice #07:
  visual / CSS / SVG / animation correctness is on-device, not unit-asserted; the
  structural and behavioural pieces are TDD-driven.
- **PRD-level DoD:** all 7 slices done + the child plays the polished Counting Sheep at
  least once and returns to it. The child is the ultimate user; PRD-level done isn't a
  checklist, it's their behaviour.
- **What "good tests" look like for this PRD:**
  - Design tokens module: assert the exported palette / font / timing names exist and have
    the expected shape (jsdom-friendly, the pattern used for the manifest module).
  - Shell lifecycle (layered-concurrent contract): assert that after `onComplete` fires,
    both the Toy's content and the Shell's celebration overlay are present in the DOM
    simultaneously. This is the architectural rule slice 5 (Outro choreography) depends on.
  - Sheep done-state toggle: assert that tapping a Sheep flips its done state (existing
    coverage already proves this; extend if the new structure needs it). The glow itself is
    on-device.
  - Outro stagger: assert that all 5 Sheep enter the outro phase after the Goal is met,
    with stagger timing observable via a data attribute or via Motion's exposed lifecycle.
  - Shell celebration sound restyle: assert via the AudioContext shim (the pattern from the
    parent PRD's `sound.test.ts`) that `celebrate()` plays the expected voice count with
    the pad note added.
  - Home Card → palette mapping: assert each registry entry resolves to its declared
    palette gradient (data-driven test).
- **What is NOT unit-asserted (on-device only):**
  - Any CSS that uses `env()`, gradients, SVG filters, or other features jsdom's cssstyle
    parser drops or doesn't compute (the lesson from parent slice #07).
  - Motion timing curves, spring physics, idle motion smoothness.
  - The audible quality of the restyled `celebrate()` sound.
  - The visual coherence of the Card preview-scenes against the live Toys.
- **Mocking policy reminder:** mock only at process boundaries (Web Audio via the existing
  `contextFactory` injection, `localStorage` via the existing `fakeStorage`). Never mock
  internal Shell or Toy collaborators; render through the public `createAppRouter`
  boundary as the existing Shell test suite does.

## Out of Scope
- **The other v1 Toys** (Fish Pond, Bubble Pop, Bloom). They will inherit the design
  tokens and the restyled Shell celebration when they're written, but each is its own
  future PRD.
- **Custom fonts.** System serif stack only — no `@font-face` loads, no bundled `.woff2`.
  The PWA bundle cost and FOUT/FOIT risk aren't justified by visual upside given the iOS
  system serif (New York) is already editorial.
- **Idle ambient motion** (drifting clouds, blinking Sheep, pulsing half-moon).
  Intentionally absent at v1 — the grilled composition chose stillness with one
  atmospheric detail (the half-moon) over a busier scene. Reconsider only if the polished
  meadow reads as static on-device with the child.
- **Sky shift during Outro** (dawn → sunrise warm wash during the celebration). Floated in
  the grill, not pinned. Treat as a potential v1.5 refinement; do not slice into this PRD.
- **Per-Toy celebration overlays.** Rejected in favour of a globally-restyled Shell
  celebration. Future Toys with wildly different aesthetic requirements would be a
  conscious ADR-0003 reversal, not a quiet addition.
- **Carousel home layout or compact tile grid** for the launcher. Rejected in favour of
  the vertical-scroll big-Card layout.
- **Pure silhouette Sheep / fully redrawn Sheep.** Rejected — Sheep retain their existing
  structural illustration; only fills are recoloured. 3-year-old recognition wins over
  Gris silhouette discipline.
- **Gamification, profiles, scores.** Already a project-level rejection — see
  `.work/out-of-scope/progress-and-gamification.md`. This polish PRD does not relitigate.

## Further Notes
- **Decision provenance.** Every Implementation Decision and every Out of Scope entry
  traces back to a question in the `/grill-with-context` session that produced this PRD.
  The layered-concurrent contract is recorded in the ADR-0001 amendment; the **Outro**
  term is in `CONTEXT.md`. Reading those two records is the fastest way for a future
  contributor to understand *why* this PRD is shaped as it is.
- **Slice order (informative — formalised by `/draft-issues`):** Foundation (design tokens
  + chrome positioning) → Shell lifecycle contract → Meadow backdrop → Sheep recolour +
  done-glow → Outro choreography → Shell celebration restyle → Home Card restyle.
  Dependencies: slice 5 (Outro) needs slices 2 (contract), 3 (backdrop), and 4 (Sheep);
  the others are loosely coupled and could reorder if implementation evidence suggests it.
- **On-device validation cadence.** Every slice ends with the same on-device check the
  parent PRD established. The PRD-level kid handoff happens after slice 7, when the
  polished Counting Sheep is the whole experience the child meets — not a half-polished
  one.
- **Animation primitives left for implementation time.** Spring stiffness/damping defaults,
  exact ease curves for the dawn-wash gradient and the half-moon's opacity, the precise
  Outro stagger curve (linear stagger vs. ease-in stagger). The `web-animation-design`
  skill is a useful tier-2 reference at slice 5 time.
- **Tied-off architectural records.** ADR-0001 (amended — layered-concurrent), ADR-0002
  (PWA carve-out, unrelated to this PRD), ADR-0003 (audio synthesis, inherited — sound
  stays Shell-owned, optional on the Toy contract).
- **Possible follow-up debt.** The deferred `renderApp` test-helper extraction noted in
  `.work/notes/shared-render-app-test-helper.md` becomes more attractive after slice 7 —
  the polished Toy and Card tests will likely add another `renderApp` clone. Worth tackling
  as a tiny refactor pass after this polish PRD wraps.
