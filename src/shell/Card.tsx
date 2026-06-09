import type { CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import type { ToyEntry } from './registry';
import type { Sound } from './sound';
import { card, font, ink, timing } from './tokens';

/**
 * One per-Toy launch tile on the Home collection — a *media card*: a large
 * preview cover up top carrying the Toy's miniature scene as the hero, and a
 * consistent title footer beneath it. The Card chrome (paper surface, radius,
 * shadow, footer, type) is identical for every Toy so the Home reads as one
 * coherent collection; per-Toy identity comes from the preview scene (the
 * differentiator) and the Toy's registry-declared `tint`, which backs the
 * cover as its stage colour rather than flooding the whole tile.
 *
 * Design history: an earlier revision painted the *whole* Card surface from the
 * `tint` with a small preview floating in the middle. On-device that read as
 * inconsistent (a deep-blue ocean tile next to a cream meadow tile) with the
 * preview too small to be the focus. This revision makes the preview the hero
 * (a full-width cover) and pins the Card chrome to a shared paper surface
 * (`card.surface`), so the scene — not a flat colour field — carries each
 * Toy's character. The `tint` remains a real per-Toy surface (the cover's
 * backing, ADR-0004) but no longer governs the Card's overall consistency.
 *
 * The Card tap is the first user gesture on Home, so it doubles as the mobile
 * audio unlock — `sound.unlock()` resumes the context the mounted Toy plays on.
 *
 * Layout details that aren't unit-asserted (per the PRD's Testing Decisions —
 * anything visually-tuned is on-device):
 * - The preview is a rounded inset "photo": it sits on the shared paper
 *   surface with a uniform margin (the Card's own padding) all around, and its
 *   corners are rounded *concentrically* with the Card (inner radius = Card
 *   radius − the inset) so the preview's border echoes the Card's instead of a
 *   square cover crowding the rounded corners. The margin around it is the same
 *   paper every Card shares, NOT the per-Toy tint, so the framing reads
 *   identically across the collection.
 * - Cover is a 5:3 banner (matching the previews' 100×60 viewBox) so the scene
 *   fills it edge-to-edge with no letterbox. The Toy's `tint` backs it (so a
 *   future preview with transparency degrades to the Toy's own colour rather
 *   than a hole) but is covered by the opaque scene, so it no longer forms a
 *   visible — and potentially mismatched — frame.
 * - Title beneath in the rounded-sans token, inked in the Shell-owned `ink`
 *   token over the paper footer — legible regardless of the scene's colour.
 * - Gentle scale-down tap feedback (Motion `whileTap`, eased by
 *   `timing.tapCurve`).
 */
export function Card({ toy, sound }: { toy: ToyEntry; sound: Sound }) {
  const Preview = toy.preview;
  return (
    <motion.div
      // Motion wraps the `<Link>` so the tap-feedback scale targets the whole
      // Card surface (not just the inner anchor). The ease comes from the
      // design-tokens module (`timing.tapCurve`) so the Card moves with the
      // same cushioned register the chrome pill uses.
      whileTap={{ scale: card.tapScale }}
      transition={{ duration: 0.12, ease: timing.tapCurve }}
      style={cardWrapperStyle}
    >
      <Link
        to="/toy/$toyId"
        params={{ toyId: toy.id }}
        onClick={() => sound.unlock()}
        style={cardLinkStyle}
      >
        {Preview ? (
          // The hero — the Toy's miniature scene as a rounded inset photo. The
          // `tint` backs it (`data-card-cover` so tests address the per-Toy
          // surface) but the opaque scene covers it; the visible margin around
          // the photo is the Card's shared paper surface.
          <div
            data-card-cover
            style={{ ...coverStyle, backgroundColor: toy.tint ?? undefined }}
          >
            <Preview />
          </div>
        ) : null}
        <div style={footerStyle}>
          <span style={titleStyle}>{toy.title}</span>
        </div>
      </Link>
    </motion.div>
  );
}

// The wrapper is a plain grid cell — the Home grid sizes the column, the Card
// sizes to its own content (cover + footer). No fixed `dvh` height: a media
// card is as tall as its parts, which keeps two Cards comfortably in a phone
// viewport without the old full-height scroll-snap slab.
const cardWrapperStyle: CSSProperties = {
  width: '100%',
};

// How far the preview photo is inset from the Card edge on every side. The
// Card's own padding provides this margin (in the shared paper surface), and
// the cover's corner radius is derived from it so the two rounded rectangles
// nest concentrically.
const COVER_INSET = 12;

// The link is the tappable Card surface: a paper slab with the shared radius +
// shadow. Flex column so the preview sits above the footer; the uniform padding
// is the paper margin the inset preview photo floats in. `overflow: hidden`
// keeps everything inside the rounded mask.
const cardLinkStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  padding: `${COVER_INSET}px`,
  boxSizing: 'border-box',
  borderRadius: card.radius,
  boxShadow: card.shadow,
  backgroundColor: card.surface,
  textDecoration: 'none',
  color: 'inherit',
  overflow: 'hidden',
  cursor: 'pointer',
};

// The hero — a 5:3 rounded photo holding the preview scene, backed by the
// Toy's tint. The preview SVG fills it exactly (`width/height: 100%`,
// `preserveAspectRatio meet` on a matching 5:3 viewBox → edge-to-edge, no
// letterbox), and `overflow: hidden` clips the square scene to the rounded
// corners. The radius is the Card radius minus the inset so the photo's
// corners are concentric with the Card's.
const coverStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '5 / 3',
  borderRadius: `calc(${card.radius} - ${COVER_INSET}px)`,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// The footer band on the paper surface — the title sits centred beneath the
// preview with breathing room above and below (left/right margins come from
// the Card's own padding).
const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 4px 8px',
};

// The title in the rounded-sans token, inked in the Shell-owned `ink` token (a
// neutral dark) so it reads as editorial type over the paper footer without
// borrowing a scene colour (ADR-0004). Size/weight/letter-spacing are visual
// choices tuned on-device; the font stack + colour token are the
// acceptance-criterion-pinned values sourced from tokens.
const titleStyle: CSSProperties = {
  fontFamily: font.rounded,
  color: ink,
  fontSize: '26px',
  fontWeight: 500,
  letterSpacing: '0.01em',
  textAlign: 'center',
};
