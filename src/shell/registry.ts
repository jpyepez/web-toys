import type { ComponentType } from 'react';

/**
 * The entire Shell↔Toy contract: a Toy renders its own world and calls
 * `onComplete()` when its Goal is met. The Shell takes over from there.
 */
export type ToyProps = {
  onComplete: () => void;
};

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
  component: ComponentType<ToyProps>;
};
