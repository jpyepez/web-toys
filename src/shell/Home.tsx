import { Link } from '@tanstack/react-router';
import type { ToyEntry } from './registry';
import type { Sound } from './sound';

/**
 * The home launcher: one Card per registered Toy. Content is driven entirely by
 * the registry passed in, so adding a Toy never requires editing this component.
 *
 * The Card tap is the first user gesture, so it doubles as the mobile audio
 * unlock — `sound.unlock()` here resumes the context the mounted Toy then plays on.
 */
export function Home({ toys, sound }: { toys: ToyEntry[]; sound: Sound }) {
  return (
    <main>
      {toys.map((toy) => (
        <Link
          key={toy.id}
          to="/toy/$toyId"
          params={{ toyId: toy.id }}
          onClick={() => sound.unlock()}
        >
          {toy.title}
        </Link>
      ))}
    </main>
  );
}
