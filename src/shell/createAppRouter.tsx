import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
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
 * launcher at `/`, and (later) one route per Toy. Hands back a ready router.
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

  const routeTree = rootRoute.addChildren([homeRoute]);

  return createRouter({
    routeTree,
    history: options.history,
  });
}
