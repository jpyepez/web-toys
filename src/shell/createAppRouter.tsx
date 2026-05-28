import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useParams,
  type RouterHistory,
} from '@tanstack/react-router';
import type { ToyEntry } from './registry';
import { Home } from './Home';
import { ToyHost } from './ToyHost';
import { createSound, type Sound } from './sound';
import { createHaptics, type Haptics } from './haptics';
import { MuteToggle } from './MuteToggle';

type AppRouterOptions = {
  /** Injectable history — tests pass a memory history; the app uses the default. */
  history?: RouterHistory;
  /** Shared sound utility — defaults to the real synthesized engine; tests inject a fake. */
  sound?: Sound;
  /** Shared haptics utility — defaults to the real one; tests inject a fake. */
  haptics?: Haptics;
};

/**
 * Builds the app's router from the Toy registry: a root Shell frame, the home
 * launcher at `/`, and one route per Toy at `/toy/$toyId` that mounts the Toy's
 * component inside the frame. Hands back a ready router.
 */
export function createAppRouter(toys: ToyEntry[], options: AppRouterOptions = {}) {
  // The Shell owns one sound + haptics instance, shared across the home launcher
  // and every Toy so the gesture-unlocked audio context survives navigation.
  const sound = options.sound ?? createSound();
  const haptics = options.haptics ?? createHaptics();

  const rootRoute = createRootRoute({
    // The mute toggle lives at the root so it's part of the Shell chrome on
    // both the launcher and a mounted Toy — a single always-visible control.
    // The root frame insets content out of iOS standalone unsafe areas so chrome
    // (mute, Home, Completion) is never clipped under the notch / home indicator.
    component: () => (
      <div data-testid="shell-root" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <MuteToggle sound={sound} />
        <Outlet />
      </div>
    ),
  });

  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <Home toys={toys} sound={sound} />,
  });

  const toyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/toy/$toyId',
    component: function ToyMount() {
      const { toyId } = useParams({ strict: false });
      const toy = toys.find((t) => t.id === toyId);
      if (!toy) return null;
      return <ToyHost toy={toy} sound={sound} haptics={haptics} />;
    },
  });

  const routeTree = rootRoute.addChildren([homeRoute, toyRoute]);

  return createRouter({
    routeTree,
    history: options.history,
  });
}
