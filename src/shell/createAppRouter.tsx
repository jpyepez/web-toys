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

type AppRouterOptions = {
  /** Injectable history — tests pass a memory history; the app uses the default. */
  history?: RouterHistory;
};

/**
 * Builds the app's router from the Toy registry: a root Shell frame, the home
 * launcher at `/`, and one route per Toy at `/toy/$toyId` that mounts the Toy's
 * component inside the frame. Hands back a ready router.
 */
export function createAppRouter(toys: ToyEntry[], options: AppRouterOptions = {}) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <Home toys={toys} />,
  });

  const toyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/toy/$toyId',
    component: function ToyMount() {
      const { toyId } = useParams({ strict: false });
      const toy = toys.find((t) => t.id === toyId);
      if (!toy) return null;
      const ToyComponent = toy.component;
      return <ToyComponent />;
    },
  });

  const routeTree = rootRoute.addChildren([homeRoute, toyRoute]);

  return createRouter({
    routeTree,
    history: options.history,
  });
}
