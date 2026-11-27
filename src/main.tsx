import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { RouterProvider } from '@tanstack/react-router';
import { createAppRouter } from './shell/createAppRouter';
import { themeStore } from './shell/theme';
import { visibleToys } from './shell/registry';
import { registry } from './toys/registry';
// Shell frame styles — safe-area insets for iOS standalone (slice #07).
import './shell/shell.css';
import { installZoomBlock } from './shell/zoomBlock';

// Apply the saved theme before the first render.
themeStore.start();
installZoomBlock();

// Draft Toys show only in a Preview Deployment (issue 56).
const router = createAppRouter(visibleToys(registry, __DEPLOY_ENV__));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
     * One app-wide reduced-motion gate. `reducedMotion="user"` makes every
     * Motion element below honour the OS `prefers-reduced-motion` setting:
     * Motion drops `transform`/layout animations (the Sheep's slide-in + hop,
     * the Fish's swim-in + balloon + float-up, the Confetti drift — the
     * large positional motion that triggers vestibular discomfort) while
     * KEEPING opacity, so critters cleanly fade in/out in place instead of
     * sliding. The state-machine timers are untouched (they drive the loop,
     * not the visuals), so play still advances at the same pace. This is the
     * single load-bearing accessibility default for the whole collection —
     * individual Toys no longer each need their own reduced-motion plumbing.
     */}
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  </StrictMode>,
);
