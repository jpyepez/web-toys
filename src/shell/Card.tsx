import type { CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import type { ToyEntry } from './registry';
import type { Sound } from './sound';
import { card, font, palette, timing } from './tokens';

/**
 * One per-Toy launch tile on the Home book-of-small-worlds list. Reads as a
 * minimal editorial card: a solid surface tinted from the Toy's
 * registry-declared palette token, a small inline SVG preview-scene
 * centred above the title, and the title prominent in the system serif.
 * Every concrete colour, font, radius, shadow, and timing primitive is
 * sourced from the design-tokens module so the Card and Home never carry
 * hardcoded values (acceptance criterion #4).
 *
 * On-device review of an earlier dawn-wash-gradient variant of this Card
 * surfaced "too busy" — the gradient + preview + title competed instead of
 * the small preview being the visual focus. The PRD revision (recorded in
 * the slice-07 commit history) replaced the gradient with the solid tint
 * mechanism this Card now consumes via `palette[toy.tint]`.
 *
 * The Card tap is the first user gesture on Home, so it doubles as the
 * mobile audio unlock — `sound.unlock()` resumes the context the mounted
 * Toy then plays on.
 *
 * Layout details that aren't unit-asserted (per the PRD's Testing
 * Decisions — anything `dvh`, `env()`, or visually-tuned is on-device):
 * - Card sized ~60dvh so two Cards stack within a phone viewport once
 *   more Toys are registered; with one Toy it reads as an editorial slab
 *   with generous space around it rather than a viewport-filling page.
 * - Preview slot is intentionally constrained (~50% width, capped) so the
 *   miniature scene reads as art on a card, not as a tiled background.
 * - Title beneath in the system serif at a prominent size, inked in the
 *   sheep-silhouette palette token so it reads as dark editorial type
 *   over the cream tint.
 * - Gentle scale-down tap feedback (Motion `whileTap`, eased by
 *   `timing.tapCurve`).
 */
export function Card({ toy, sound }: { toy: ToyEntry; sound: Sound }) {
  const Preview = toy.preview;
  return (
    <motion.div
      // Motion wraps the `<Link>` so the tap-feedback scale targets the
      // whole Card surface (not just the inner anchor element). The ease
      // comes from the design-tokens module (`timing.tapCurve`) so this
      // Card moves with the same cushioned register the chrome pill uses.
      whileTap={{ scale: card.tapScale }}
      transition={{ duration: 0.12, ease: timing.tapCurve }}
      style={cardWrapperStyle}
    >
      <Link
        to="/toy/$toyId"
        params={{ toyId: toy.id }}
        onClick={() => sound.unlock()}
        style={{
          ...cardLinkStyle,
          backgroundColor: toy.tint ? palette[toy.tint] : undefined,
        }}
      >
        {Preview ? (
          <div style={previewSlotStyle}>
            <Preview />
          </div>
        ) : null}
        <span style={titleStyle}>{toy.title}</span>
      </Link>
    </motion.div>
  );
}

// The wrapper sizes each Card at ~60dvh so two Cards stack with a peek
// once more Toys land on the registry. `dvh` is real-browser-only (jsdom
// doesn't compute it), so the sizing is on-device-validated per the
// slice DoD.
const cardWrapperStyle: CSSProperties = {
  width: '100%',
  height: '60dvh',
  marginBottom: '16px',
  // Scroll-snap so each Card lands cleanly under the thumb as the child
  // flicks the list — the snap target is the Card itself.
  scrollSnapAlign: 'start',
};

// The link is the actual tappable surface. Flex column centred on the
// vertical axis so the preview + title float together in the middle of
// the Card with generous breathing room above and below — the minimal
// editorial layout the slice-07 revision pinned. `overflow: hidden`
// clips the tint to the rounded-corner mask.
const cardLinkStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '32px',
  width: '100%',
  height: '100%',
  padding: '32px',
  boxSizing: 'border-box',
  borderRadius: card.radius,
  boxShadow: card.shadow,
  textDecoration: 'none',
  color: 'inherit',
  overflow: 'hidden',
  cursor: 'pointer',
};

// Constrains the preview SVG so it reads as a small piece of art on the
// Card, not as a tiled background. ~55% of the Card width with a cap so
// the preview stays compact on wider viewports too. Aspect-ratio matches
// the Counting Sheep preview's 100:60 viewBox (5:3); future Toys with
// different viewBoxes will sit inside the same slot fine because the
// inner SVG carries `preserveAspectRatio="xMidYMid meet"`.
const previewSlotStyle: CSSProperties = {
  width: '55%',
  maxWidth: '260px',
  aspectRatio: '5 / 3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// The title sits beneath the preview in the rounded-sans token (switched
// from the polish PRD's editorial-serif choice — see tokens.ts comment for
// the reversal rationale), inked in the sheep-silhouette palette (dark
// brown) so it reads as warm type over the cream tint. Size, weight, and
// letter-spacing are visual choices tuned on-device; the *font stack* and
// *colour* are the acceptance-criterion-pinned values sourced from tokens.
const titleStyle: CSSProperties = {
  fontFamily: font.rounded,
  color: palette.sheepSilhouette,
  fontSize: '30px',
  fontWeight: 500,
  letterSpacing: '0.01em',
  textAlign: 'center',
};
