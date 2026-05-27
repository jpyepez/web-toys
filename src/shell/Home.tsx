import { Link } from '@tanstack/react-router';
import type { ToyEntry } from './registry';

/**
 * The home launcher: one Card per registered Toy. Content is driven entirely by
 * the registry passed in, so adding a Toy never requires editing this component.
 */
export function Home({ toys }: { toys: ToyEntry[] }) {
  return (
    <main>
      {toys.map((toy) => (
        <Link key={toy.id} to="/toy/$toyId" params={{ toyId: toy.id }}>
          {toy.title}
        </Link>
      ))}
    </main>
  );
}
