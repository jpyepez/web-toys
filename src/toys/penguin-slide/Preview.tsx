import { buildFloe, landingFor, type Frame } from './floe';
import { FLOE, FLOE_SEED } from './floe-config';
import { FOOT_FRACTION, PenguinFigure, VB_H, VB_W } from './PenguinDrawing';
import { FloePlates } from './IceBackdrop';
import { CAST, PENGUIN_COUNT } from './PenguinSlide';

/**
 * Penguin Slide's Card preview — the real scene, drawn by the real components.
 *
 * The floe comes from `buildFloe` with the shipped config and seed, evaluated
 * into the Card's 100x60 frame, and the penguins are `PenguinFigure`, the very
 * component the Toy mounts. So the Card cannot drift from the Toy, and a lab
 * harvest updates both.
 *
 * It shows the Toy MID-PLAY rather than at rest: three penguins still on the ice
 * and two already swimming, sent there by `landingFor` exactly as a Swipe would
 * send them. A Card that shows what happens is a better invitation than one that
 * shows only who is there.
 *
 * Decorative for accessibility — the Card's title and link carry the meaning.
 */

const CARD: Frame = { w: 100, h: 60 };
/** A penguin's width in Card units — about seven across, a landscape window. */
const CARD_PENGUIN = 13.5;
const ART = buildFloe(FLOE, CARD, CARD_PENGUIN, FLOE_SEED, PENGUIN_COUNT);

/** Which penguins have already been swiped, and which way. */
const SWIPED: Array<{ index: number; dir: [number, number] }> = [
  { index: 0, dir: [-1, 0.35] },
  { index: 4, dir: [0.2, 1] },
];
const SWIMMERS = (() => {
  const taken = new Set<number>();
  return SWIPED.map(({ index, dir }) => {
    const slot = landingFor(ART, ART.rests[index], dir, 0.2, taken);
    taken.add(slot);
    return { index, at: ART.slots[slot] };
  });
})();

const place = ([x, y]: [number, number]) =>
  `translate(${x - CARD_PENGUIN / 2} ${y - CARD_PENGUIN * (VB_H / VB_W) * FOOT_FRACTION}) scale(${CARD_PENGUIN / VB_W})`;

export function Preview() {
  const figures = CAST.map((kind, i) => {
    const swim = SWIMMERS.find((s) => s.index === i);
    return { kind, i, at: swim ? swim.at : ART.rests[i], pose: swim ? ('swimming' as const) : ('standing' as const) };
  }).sort((a, b) => a.at[1] - b.at[1]);

  return (
    <svg
      viewBox={`0 0 ${CARD.w} ${CARD.h}`}
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <FloePlates art={ART} idPrefix="penguin-slide-preview" />
      {figures.map((f) => (
        <g key={f.i} transform={place(f.at)}>
          <PenguinFigure kind={f.kind} pose={f.pose} />
        </g>
      ))}
    </svg>
  );
}
