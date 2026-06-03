import type { CSSProperties } from 'react';
import { Card } from './Card';
import type { ToyEntry } from './registry';
import type { Sound } from './sound';

/**
 * The home launcher: one Card per registered Toy in a vertical-scroll list,
 * each Card carrying the registry-declared palette wash + a tiny preview-scene
 * from inside its Toy. Content is driven entirely by the registry passed in,
 * so adding a Toy never requires editing this component — Card-shape and
 * Toy-shape both flow through `ToyEntry`.
 *
 * The visual register — ~70% viewport per Card with a peek of the next as a
 * scroll affordance, scroll-snap so each Card lands cleanly under the thumb,
 * rounded corners + soft shadow + system serif — is the Card's concern, not
 * Home's. Home owns the *list*; Card owns the *tile*.
 */
export function Home({ toys, sound }: { toys: ToyEntry[]; sound: Sound }) {
  return (
    <main style={listStyle}>
      {toys.map((toy) => (
        <Card key={toy.id} toy={toy} sound={sound} />
      ))}
    </main>
  );
}

// Vertical-scroll container. `dvh` and `scroll-snap` are real-browser-only
// (jsdom won't compute the snap landing zones); the list is structurally
// correct in tests and visually correct on-device per the slice DoD.
const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  padding: '16px',
  height: '100dvh',
  overflowY: 'auto',
  scrollSnapType: 'y mandatory',
  boxSizing: 'border-box',
};
