import type { CSSProperties } from 'react';
import { Card } from './Card';
import type { ToyEntry } from './registry';
import type { Sound } from './sound';
import { font, ink } from './tokens';

/**
 * The home launcher: one Card per registered Toy in a centred, responsive
 * grid. Content is driven entirely by the registry passed in, so adding a Toy
 * never requires editing this component — Card-shape and Toy-shape both flow
 * through `ToyEntry`.
 *
 * The grid uses the "RAM" pattern (`repeat(auto-fit, minmax(min(100%, …), …))`)
 * so it's responsive with no media queries: on a phone the columns collapse to
 * a single full-width column (the `min(100%, …)` guard stops a card overflowing
 * a narrow viewport); on a wider screen the cards lay out in multiple columns
 * that stay capped by `maxWidth` and centred with `margin: 0 auto`, so the
 * collection never stretches edge-to-edge on desktop. Home owns the *grid*;
 * Card owns the *tile*.
 */
export function Home({ toys, sound }: { toys: ToyEntry[]; sound: Sound }) {
  return (
    <main style={gridStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Web Toys</h1>
        <p style={subtitleStyle}>Tiny toys for tiny humans</p>
      </header>
      {toys.map((toy) => (
        <Card key={toy.id} toy={toy} sound={sound} />
      ))}
    </main>
  );
}

// The Home wordmark. `gridColumn: '1 / -1'` spans every grid column so the
// header sits as a full-width band above the Cards rather than flowing into
// the auto-fit columns as if it were a tile. Type sources the same Shell
// primitives the Cards use — `font.rounded` + `ink` — so the launcher reads as
// one coherent set. The clamp keeps the wordmark proportional on a phone
// without media queries (same no-media-query spirit as the grid).
const headerStyle: CSSProperties = {
  gridColumn: '1 / -1',
  textAlign: 'center',
  margin: '8px 0 0',
};

const titleStyle: CSSProperties = {
  fontFamily: font.rounded,
  color: ink,
  fontSize: 'clamp(2.25rem, 9vw, 3rem)',
  fontWeight: 800,
  letterSpacing: '-0.01em',
  margin: 0,
};

const subtitleStyle: CSSProperties = {
  fontFamily: font.rounded,
  color: ink,
  fontSize: 'clamp(0.95rem, 3.5vw, 1.1rem)',
  fontWeight: 500,
  opacity: 0.6,
  margin: '6px 0 0',
};

// Centred responsive grid. `align-content: start` keeps the cards at the top
// rather than stretching to fill the column height. `minHeight: 100dvh` lets
// the page own the full viewport (dvh is real-browser-only; jsdom skips it,
// which is fine — the grid is structurally correct in tests and visually
// tuned on-device per the slice DoD).
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
  gap: '24px',
  maxWidth: '820px',
  margin: '0 auto',
  padding: '24px',
  minHeight: '100dvh',
  alignContent: 'start',
  boxSizing: 'border-box',
};
