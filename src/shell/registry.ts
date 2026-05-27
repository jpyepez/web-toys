import type { ComponentType } from 'react';

/**
 * One entry in the Toy registry. Declaring a Toy is adding one of these — the
 * Shell renders a Card per entry and routes to it. Adding a Toy is additive;
 * nothing else in the Shell changes.
 */
export type ToyEntry = {
  /** Route slug, e.g. "counting-sheep". */
  id: string;
  /** Label shown on the Toy's Card. */
  title: string;
  /** The Toy's self-contained component, mounted inside the Shell frame. */
  component: ComponentType;
};
