import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { createAppRouter } from './shell/createAppRouter';
import { registry } from './toys/registry';
// Shell frame styles — safe-area insets for iOS standalone (slice #07).
import './shell/shell.css';

const router = createAppRouter(registry);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
