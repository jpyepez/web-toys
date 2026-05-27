import type { ToyEntry } from './registry';

/**
 * The home launcher: one Card per registered Toy. Content is driven entirely by
 * the registry passed in, so adding a Toy never requires editing this component.
 */
export function Home({ toys }: { toys: ToyEntry[] }) {
  return (
    <main>
      {toys.map((toy) => (
        <div key={toy.id}>{toy.title}</div>
      ))}
    </main>
  );
}
