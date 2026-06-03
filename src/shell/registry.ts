import type { ComponentType } from 'react';
import type { Sound } from './sound';
import type { Haptics } from './haptics';
import type { palette } from './tokens';

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
  /**
   * Optional solid tint painted as the Home Card surface — a key into
   * the design-tokens palette (e.g. `'sheepWool'`). The per-Toy palette
   * is registry-driven so future Toys declare their tint here rather
   * than in the Card or Home code. On-device review in slice #07 moved
   * this from a gradient mechanism to a solid tint so the small
   * preview-scene + serif title carry the visual load. Omitted on
   * synthetic test fixtures; the Card renders without a surface tint.
   */
  tint?: keyof typeof palette;
  /**
   * Optional tiny inline SVG preview-scene the Home Card carries — a small
   * window onto the Toy this Card launches. Drawn from inside each Toy
   * (Counting Sheep ships its miniature meadow, future Toys ship theirs)
   * so visual coherence with the live Toy lives next to the live Toy.
   * Optional for the same reason as `tint`: synthetic fixtures and
   * unstyled future Toys render a Card without a preview rather than
   * forcing every entry to declare one.
   */
  preview?: ComponentType;
};
