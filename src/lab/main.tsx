/**
 * The lab's own entry. Deliberately separate from `src/main.tsx`: the lab is
 * scaffolding, and the production build's input list is `index.html` only, so
 * nothing here can reach a shipped bundle.
 *
 * No StrictMode, no MotionConfig, no router — the lab is one screen and the
 * double-invoke would just re-run the generator for nothing.
 */

import { createRoot } from 'react-dom/client';
import { Lab } from './Lab';

createRoot(document.getElementById('root')!).render(<Lab />);
