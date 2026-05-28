import type { ComponentType } from 'react';
import type { Sound } from './sound';
import type { Haptics } from './haptics';

/**
 * The entire Shell↔Toy contract: a Toy renders its own world and calls
 * `onComplete()` when its Goal is met. The Shell takes over from there.
 *
 * The Shell also provides shared `sound` and `haptics` utilities through this
 * contract — a Toy uses them rather than importing audio/vibration itself.
 * Both are optional: a Toy mounted bare (e.g. in a unit test) degrades to
 * silence, matching the utilities' own no-op-where-unsupported behaviour.
 */
export type ToyProps = {
  onComplete: () => void;
  sound?: Sound;
  haptics?: Haptics;
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
