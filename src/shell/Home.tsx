import type { CSSProperties } from 'react';
import { Card } from './Card';
import type { ToyEntry } from './registry';
import type { Sound } from './sound';

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
      {toys.map((toy) => (
        <Card key={toy.id} toy={toy} sound={sound} />
      ))}
    </main>
  );
}

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
