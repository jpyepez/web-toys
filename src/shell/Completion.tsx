import { type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Confetti } from './Confetti';
import { card, completion, font, timing } from './tokens';

// The celebration-beat delay (`CELEBRATION_MS = 2200`) introduced in polish
// PRD slice #06 retired during the mobile-rethink PRD's on-device kid-handoff
// DoD. The delay's load-bearing justification was "cover the Toy-side group-
// Outro choreography (slice #05) so the replay/home offer doesn't cut it
// off". The mobile-rethink PRD explicitly retired that group-Outro
// (PRD Out of Scope: "Reusing the slice-#05 group-Outro choreography ...
// retired by this PRD in favour of the per-Sheep exit choreography"), so
// the delay no longer covers anything. The 5th-Sheep per-Sheep exit is
// short (`TIMING_DISMISS_MS = 700`) and the layered-concurrent contract
// paints the celebration overlay *over* it concurrently anyway. End-state
// controls now render from mount — same sanctioned-pivot pattern as the
// moon/stars/scenery tests and the serif → rounded reversal.

type CompletionProps = {
  /** Replay the Toy from its start. */
  onPlayAgain: () => void;
  /** Leave the Toy and return to the launcher. */
  onHome: () => void;
};

/**
 * The Shell's Completion: the celebratory end moment after a Toy's Goal is met.
 * Owned entirely by the Shell (ADR-0001) — individual toys never render it.
 *
 * A confetti-style burst plays first; after a short beat the end state appears,
 * offering Play again / Home. The end state then stays put — no auto-advance.
 *
 * Layout/surface (regression-amend for polish PRD slice #02 + on-device-tuned
 * typography polish during the mobile-rethink PRD's kid-handoff DoD):
 * - Outer container is a viewport-spanning `position: fixed; inset: 0`
 *   overlay so the Confetti's existing `inset: 0` correctly covers the
 *   viewport, and the message + end-state sit centred regardless of what
 *   flow content precedes it (the layered-concurrent ToyHost refactor turned
 *   this from "the only thing in `.shell-frame`" into "a sibling after the
 *   Toy's 100dvh `<main>`", which previously landed Completion below the
 *   visible viewport on phones).
 * - The message + end-state ride a Card-style surface (tinted from
 *   `completion.surface`, sourced from the same `card.radius` + `card.shadow`
 *   the Home Cards use) so the celebration moment reads as one coherent
 *   editorial slab — same surface family across Home and Completion. Pulls
 *   on the "use cards to display stuff like that" direction the on-device
 *   review proposed during the kid-handoff DoD.
 * - Type is `font.rounded` (replacing the polish PRD's editorial serif —
 *   see tokens.ts comment for the reversal rationale).
 *
 * Stacking: default z-index on the overlay means the Card surface paints
 * above the Toy (MeadowBackdrop's `z-index: -1` + the Sheep at default flow)
 * but below the ChromePills (explicit `z-index: 10`) — which is the exact
 * order the layered-concurrent contract calls for in the end-state comment
 * below (the chrome Home pill stays visible during the celebration).
 */
export function Completion({ onPlayAgain, onHome }: CompletionProps) {
  return (
    <div style={overlayStyle}>
      <Confetti />
      {/*
       * The celebration slab lands with a gentle ease-out entrance (a soft
       * fade + scale-up from 0.95, never from 0 — so it settles in rather than
       * popping from nowhere) the moment Completion mounts, riding alongside
       * the Confetti burst. `timing.tapCurve` keeps it in the same cushioned
       * register as the Card / chrome presses. Under `prefers-reduced-motion`
       * the app-root MotionConfig drops the scale and keeps only the fade.
       */}
      <motion.div
        style={cardSurfaceStyle}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: timing.tapCurve }}
      >
        <h2 style={titleStyle}>You did it!</h2>
        {/* Scoped container so tests can disambiguate the end-state Home
         * button from the Shell's chrome Home pill (which stays visible
         * during the celebration under the layered-concurrent contract —
         * ADR-0001 amendment). Always rendered from mount now (see the
         * delay-retirement note above the component); the Confetti burst
         * plays alongside the buttons rather than ahead of them. */}
        <div data-testid="end-state" style={endStateStyle}>
          {/* Press feedback: a gentle scale-down on tap so the big kid-facing
           * buttons feel tactile under a thumb. Same cushioned `tapCurve` the
           * Card uses; auto-disabled under reduced motion via the app-root
           * MotionConfig. */}
          <motion.button
            type="button"
            onClick={onPlayAgain}
            style={primaryButtonStyle}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12, ease: timing.tapCurve }}
          >
            Play again
          </motion.button>
          <motion.button
            type="button"
            onClick={onHome}
            style={secondaryButtonStyle}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12, ease: timing.tapCurve }}
          >
            Home
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// Viewport-spanning overlay anchor — see component-doc above for the
// regression-amend reasoning. `padding` + `box-sizing: border-box` keeps the
// card surface inside the safe area on a phone with a notch.
const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  boxSizing: 'border-box',
};

// Card-style surface for the celebration message + end-state. Same
// `card.radius` / `card.shadow` tokens the Home Cards use so the surface
// family is consistent across Home and Completion. Tinted `completion.surface`
// cream (the Shell-owned celebration surface) so the cream stays the
// editorial-slab surface family. Sized at a comfortable phone width with a
// cap so on wider viewports it doesn't stretch into a banner.
const cardSurfaceStyle: CSSProperties = {
  backgroundColor: completion.surface,
  borderRadius: card.radius,
  boxShadow: card.shadow,
  padding: '40px 32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '32px',
  maxWidth: '320px',
  width: '100%',
};

// Title typography — `font.rounded` for the kid-app warmth (Card title uses
// the same), inked in the dark `completion.ink` token so it reads with high
// contrast against the cream surface. Generous size + weight so the
// celebration moment lands as the focal beat.
const titleStyle: CSSProperties = {
  fontFamily: font.rounded,
  color: completion.ink,
  fontSize: '36px',
  fontWeight: 600,
  margin: 0,
  letterSpacing: '0.01em',
};

// Stacked end-state controls — full-width pill buttons so the kid's
// thumb can land each one cleanly without having to aim. Generous gap
// between them avoids accidental adjacent taps.
const endStateStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: '100%',
};

// Primary action — Play again. Filled-pill: dark `completion.ink` surface
// with cream `completion.surface` text reads as "do this one" against the
// cream card. Pill radius (`999px`) joins the chrome-pill visual family.
// `minHeight` ≥ 44px keeps the touch target above iOS's accessibility floor
// with margin for kids who'll mis-tap.
const primaryButtonStyle: CSSProperties = {
  fontFamily: font.rounded,
  fontSize: '20px',
  fontWeight: 600,
  color: completion.surface,
  backgroundColor: completion.ink,
  border: 'none',
  borderRadius: '999px',
  padding: '16px 24px',
  cursor: 'pointer',
  minHeight: '52px',
};

// Secondary action — Home. Outline-pill: transparent surface with an
// ink-coloured border reads as "the other option" against the cream card
// without competing with the primary fill. Same pill radius + minHeight as
// Play again so they read as a pair.
const secondaryButtonStyle: CSSProperties = {
  fontFamily: font.rounded,
  fontSize: '20px',
  fontWeight: 500,
  color: completion.ink,
  backgroundColor: 'transparent',
  border: `2px solid ${completion.ink}`,
  borderRadius: '999px',
  padding: '14px 24px',
  cursor: 'pointer',
  minHeight: '52px',
};
