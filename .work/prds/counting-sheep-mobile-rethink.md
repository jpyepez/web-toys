# Counting Sheep — Mobile-First Mechanic Rethink

## Problem Statement
The parent PRD (`counting-sheep-polish`) shipped end-to-end — 7 slices done, tests
green, the polished meadow installed on-device — but the polished Toy itself
doesn't read as mobile-first when the Parent actually opens it on the phone.
Five Sheep scattered across the foreground at viewport-relative sizing
(`min(96px, 18vw)`, slice #07's hotfix) means each Sheep is ~60–70px wide on a
390px phone viewport: cluttered, undersized as touch targets, and visually
diffuse for a 3–4-year-old's eyes. The whole "five Sheep scatter + group Outro"
composition was designed for a desktop-like aspect; the polish PRD's
slice-level mobile-first sizing was a unit-fix on a layout that didn't want to
be mobile-first in the first place.

The mobile-first rule for this project is bigger than viewport units — it's an
**interaction grammar**. A 3-yo on a phone wants one large focal target at a
time with a clear cue, not five small targets to parse spatially. The meadow
visual itself also lost richness in the polish PRD's slice-#07 minimal
revision — solid sky, solid grass, half-moon — and now reads as bare rather
than as still-and-atmospheric. The next polished pass needs to bring back
visual depth (in coloured layers, not gradients) at the same time as
rewriting the play-loop for the phone.

## Solution
A sequential, kid-paced mechanic and a layered, flat-colour scene.

The mechanic becomes one Sheep at a time. A Sheep slides into the meadow,
sits in the centre of the viewport at a generous touch-target size, and waits.
The kid taps when ready; the Sheep performs a brief celebratory jump-and-exit;
after a short beat the next Sheep arrives. Repeat five times. The 5th Sheep's
tap-and-exit fires `onComplete` and the Shell's celebration overlay layers on
top — same layered-concurrent rule as ADR-0001's amendment, no separate
group-Outro choreography (the per-Sheep exits *are* the choreography).

The scene becomes a layered flat-colour vignette: two grass hills painted in
distinct token colours (foreground warmer green, distant deeper blue-grey) for
depth, a scattering of small static stars across the upper sky for
atmospheric richness, and a mid-distance silhouette (treeline or cottage —
chosen during implementation per on-device feel) in a third token colour for a
sense of *place*. The dawn palette tokens established in the polish PRD stay
as the source of truth; new tokens are added for the layers this PRD
introduces. No gradients (carried forward from the polish PRD's slice-#07
revision). The half-moon stays as the single atmospheric *moving-feeling*
detail.

## User Stories
Actors: the **Child** (3–4 yo player) and the **Parent** (sets it up, hands over the phone).

1. As a Child, I want one big Sheep at a time waiting for me to tap it, so that
   I can see exactly what to do without scanning the screen.
2. As a Child, I want the meadow to feel like a place at dusk with hills,
   stars, and something far away, so that opening the Toy feels like arriving
   somewhere instead of looking at a page.
3. As a Child, I want each Sheep I tap to hop happily and leave, so that I can
   feel I made it happen without something else stealing my attention.
4. As a Child, I want the next Sheep to come along on its own after I tap
   one, so that I know there's more to do without anyone telling me.
5. As a Parent, I want the play-loop to take roughly 15–30 seconds end-to-end
   so that a child doesn't get bored or distracted before the Completion.

(Stories 4 from `counting-sheep-polish` — "I want the home screen to show me
beautiful big Cards" — is **complete** and inherited from the polish PRD's
slice #07; the Home launcher is not in this PRD's scope.)

(Story 5 from `counting-sheep-polish` — "I want the in-Toy controls to live
unobtrusively in the corners" — is **complete** and inherited from the polish
PRD's slice #01; chrome positioning is not in this PRD's scope.)

## Implementation Decisions
- **Module: Counting Sheep play-loop state machine.** The existing
  `CountingSheep.tsx` is rewritten around a small state machine, not five
  parallel `done` flags. States:
  - `idle` — no Sheep on stage, intermission beat between Sheep
  - `arriving` — current Sheep is sliding in from the side
  - `waiting` — current Sheep is centred, awaiting tap
  - `dismissing` — current Sheep is playing its jump-and-exit beat
  - `completed` — five Sheep have been dismissed; `onComplete` has fired
  The transitions are time-driven (arriving → waiting after a short
  animation; dismissing → idle after a short animation; idle → arriving
  after a short intermission) except `waiting → dismissing` which is
  user-driven (tap). Sheep counter is just an integer 0..5 — no per-Sheep
  identity carried across the loop. Re-tapping during `dismissing` /
  `arriving` is non-destructive and ignored (no penalty, no double-fire).
- **Module: Sheep arrival/exit choreography.** The arriving Sheep slides
  in from the left over ~400ms with a soft ease, lands centred at ~50%
  width / ~mid-foreground, settles. The dismissing Sheep does a single
  rise-fall hop (~300ms, with the done-glow blooming on the wool circles)
  then slides off-stage to the right with a fade (~400ms). Intermission
  ~200ms. Total per-Sheep cycle ~1.3s including the kid's tap delay; five
  Sheep across 15–30s allows room for the kid's actual decision tempo.
  Motion timing primitives consume `timing.tapCurve` (existing) and a new
  `timing.entrance` (added in this PRD's slice #01).
- **Module: meadow backdrop layers.** The existing `MeadowBackdrop.tsx`
  grows three new layers: a distant grass hill in a new token (`hillDistant`
  — cool blue-grey), the foreground grass hill in a new token (`hillNear`
  — warmer green) overlapping above the distant, and a mid-distance
  silhouette (treeline or cottage) in a new token (`scenery` — deep
  warm-brown) sitting between the two hills. The existing
  `grassSilhouette` token retires *in this module's consumers* (the old
  test asserting both hills use it is rewritten); the token itself stays
  on the palette for any future Toy that needs a single-tone grass.
- **Module: meadow backdrop stars.** Five to seven small static circles
  painted in `palette.sheepWool` (cream) scattered deterministically across
  the upper-sky region of the backdrop SVG. Static — per the polish PRD's
  out-of-scope rule against idle ambient motion (drifting clouds, blinking
  Sheep, pulsing half-moon). No twinkle. Positions are deterministic per
  index so the scene is stable across re-renders (no per-render jitter).
  The half-moon stays as the single non-star atmospheric detail.
- **Module: design tokens.** Three new palette entries (`hillNear`,
  `hillDistant`, `scenery`) and one new timing entry (`entrance` — the
  ease for the slide-in / slide-out beats). Token names load-bearing,
  values on-device-tuned per the slice DoD. The existing tokens stay.
- **Module: Counting Sheep preview.** The Home Card's `Preview.tsx` (slice
  #07 of the polish PRD) is updated to match the new visual direction:
  two-tone hills, a couple of stars in the upper sky, one centred Sheep
  in place of the two side-by-side miniatures. Visual coherence with the
  live Toy is on-device per the inherited Testing Decisions.
- **Module: Shell celebration overlay.** Unchanged from the polish PRD's
  slice #06. The 5th Sheep's tap fires `onComplete`; the Shell's
  celebration overlay layers on top while the Sheep plays its exit
  underneath — layered-concurrent per ADR-0001 amendment, identical to
  the existing contract.
- **Schema changes:** none. No new persistence; mute preference remains
  the only persisted state across the app.
- **API contracts:** none — static SPA.
- **Dependencies:** no new runtime libraries.

## Testing Decisions
- **Slice-level DoD:** tests green for the unit-testable portion + on-device
  visual review against the slice's spec, by *me on the phone*, before each
  slice gets `status: done`. The polish PRD's done-marker-then-eyeball-later
  pattern was the failure mode that produced this PRD; this PRD inverts it.
- **PRD-level DoD:** the child plays the redesigned Counting Sheep at least
  once and reaches Completion, on the actual phone, without confusion. The
  child is the ultimate user; PRD-level done isn't a checklist, it's their
  behaviour.
- **What "good tests" look like for this PRD:**
  - Play-loop state machine: assert state transitions through the public
    boundary — `arriving → waiting` after the entrance duration, `waiting →
    dismissing` on tap, `dismissing → idle → arriving` for the next Sheep,
    `dismissing → completed` on the 5th tap with `onComplete` fired exactly
    once. Time-driven transitions use `vi.useFakeTimers` so tests stay
    deterministic without on-device timing variance.
  - One-Sheep-at-a-time invariant: assert that at no point in the loop are
    two tappable Sheep rendered simultaneously (queries by role/name).
  - Re-tap safety: assert that tapping during `dismissing` or `arriving`
    does not advance the counter or fire `onComplete` twice.
  - Design token additions: assert the new palette/timing names exist and
    have the expected shape (jsdom-friendly, the pattern the polish PRD
    established).
  - Backdrop layer presence: assert each new layer (`hill-near`,
    `hill-distant`, `scenery`, `stars`) is queryable by `data-meadow-layer`
    and its `fill` traces to a palette token — same structural pattern the
    polish PRD's slice-#03 sky test uses.
- **What is NOT unit-asserted (on-device only):**
  - The Sheep's slide-in/slide-out animation curves and the exact entrance
    timing (Motion timing curves, per the polish PRD pattern).
  - The visual composition of the layered hills + stars + scenery (whether
    the depth reads, whether the scene reads as a *place*).
  - The visual coherence of the Card preview against the redesigned live
    Toy.
  - The audible quality of the existing Shell celebration sound.
- **Mocking policy reminder:** mock only at process boundaries (Web Audio
  via the existing `contextFactory` injection, `localStorage` via the
  existing `fakeStorage`, time via `vi.useFakeTimers`). Never mock internal
  Shell or Toy collaborators; render through the public `createAppRouter`
  boundary as the existing Shell test suite does.

## Out of Scope
- **Multi-Sheep visible state.** Rejected explicitly — the rethink's whole
  point is one-at-a-time. Any future "show all five Sheep at once" idea
  reopens this PRD.
- **Animated / twinkling stars.** Static only, per the polish PRD's
  inherited out-of-scope rule against idle ambient motion. Twinkling
  would require an explicit reversal recorded in this PRD.
- **A scoreboard or counter UI** (e.g. "3 of 5"). Project-level rejection
  — `.work/out-of-scope/progress-and-gamification.md`. The kid reads the
  count from the rhythm itself, not from a number on screen.
- **Kid-summons-the-Sheep variant.** Considered (the "tap-to-summon"
  option in the grilling) and rejected — two taps per Sheep is too
  ceremonial for a 3-yo; one tap per Sheep is the right grammar.
- **Sky-shift during play.** Same rejection as the polish PRD — solid
  skyUpper stays, no auto-shift to a warmer dawn over the play-loop.
- **Reusing the slice-#05 group-Outro choreography.** The "Sheep line up
  and jump together" Outro is *retired by this PRD* in favour of the
  per-Sheep exit choreography. The Shell's celebration overlay
  (slice-#06) stays — both are still simultaneously visible at the 5th
  Sheep's exit, satisfying the ADR-0001 amendment's layered-concurrent
  rule. No ADR change needed.
- **Carousel / paginated visual indicators** for which Sheep is current.
  No "dots at the bottom" UI. The Sheep's presence *is* the indicator.
- **New Toys.** Fish Pond, Bubble Pop, Bloom inherit the design tokens
  and the Shell contract whenever they're written; each is its own
  future PRD.

## Further Notes
- **Provenance.** This PRD exists because the polish PRD's kid-handoff DoD
  surfaced the on-device truth that the polished Toy didn't read as
  mobile-first to the Parent doing the handoff. The polish PRD's Testing
  Decisions explicitly route slice-level visual review on-device; this
  is what that loop closing looks like — the visual review reveals a
  product-level rethink, which becomes its own PRD.
- **ADR alignment.** ADR-0001 (finite, success-only) — unchanged; the
  Goal is still "five Sheep tapped". ADR-0001 amendment (layered-
  concurrent) — unchanged; the 5th Sheep's exit + Shell celebration are
  still concurrent. ADR-0002 (no binary assets, all code-drawn SVG) —
  unchanged; new layers are SVG primitives. ADR-0003 (audio synthesis,
  Shell-owned sound) — unchanged.
- **CONTEXT alignment.** Goal sized to ~15–30s — yes; five Sheep at
  ~3–5s of kid-decision-tempo each (kid sees Sheep, decides to tap,
  taps, watches exit, sees next arrive) lands inside the target. The
  per-Sheep exit choreography is the new shape of **Outro** — the term
  stays, the mechanism updates: it's no longer a group-end-beat, it's
  the loop's natural per-Sheep beat with the final iteration overlapping
  the Shell celebration.
- **Slice order (informative — formalised when `/draft-issues` slices
  this).** Tokens (new palette + timing) → Backdrop layers (hills +
  stars + scenery) → Sheep mechanic (state machine + arrival/exit) →
  Card preview update → on-device kid handoff. Backdrop and mechanic
  are independent and could ship in either order; tokens block both.
- **Possible follow-up debt.** The deferred shared `renderApp` test
  helper (`.work/notes/shared-render-app-test-helper.md`) is still
  unfiled; this PRD's mechanic-test slice will likely add another
  clone. Worth tackling as a tiny refactor pass once this PRD wraps,
  alongside or after the polish PRD's same follow-up.
- **Animation primitives left for implementation time.** Spring
  stiffness/damping defaults for the slide-in, exact ease curves for
  the dismiss-hop, the precise per-Sheep cycle timing (arrival,
  intermission). The `web-animation-design` skill is a useful tier-2
  reference at the mechanic-slice time.
